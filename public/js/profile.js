document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        redirectToLogin();
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const status = document.getElementById("profile-message");

    try {
        const [profileResponse, ordersResponse] = await Promise.all([
            fetch("/api/users/profile", { headers }),
            fetch("/api/orders/mine", { headers }),
        ]);
        if (profileResponse.status === 401 || ordersResponse.status === 401) {
            localStorage.removeItem("userToken");
            localStorage.removeItem("user");
            redirectToLogin();
            return;
        }

        const profileData = await profileResponse.json();
        const ordersData = await ordersResponse.json();
        if (!profileResponse.ok) throw new Error(profileData.message || "Unable to load your profile.");
        if (!ordersResponse.ok) throw new Error(ordersData.message || "Unable to load your order history.");

        const user = profileData.user;
        document.getElementById("profile-name").value = user.name || "";
        document.getElementById("profile-email").value = user.email || "";
        document.getElementById("profile-phone").value = user.phoneNumber || "";
        renderAddresses(user.addresses || []);
        renderProfileOrders(ordersData.orders || []);
    } catch (error) {
        showMessage(status, error.message, "error");
    }

    document.getElementById("profile-form").addEventListener("submit", async event => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button[type=submit]");
        button.disabled = true;
        try {
            const response = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: document.getElementById("profile-name").value.trim(),
                    email: document.getElementById("profile-email").value.trim(),
                    phoneNumber: document.getElementById("profile-phone").value.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not save your settings.");
            localStorage.setItem("user", JSON.stringify(data.user));
            showMessage(status, "Your account settings have been saved.", "success");
        } catch (error) {
            showMessage(status, error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById("address-form").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = form.querySelector("button[type=submit]");
        button.disabled = true;
        try {
            const response = await fetch("/api/users/profile/addresses", {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: document.getElementById("address-label").value.trim(),
                    street: document.getElementById("address-street").value.trim(),
                    city: document.getElementById("address-city").value.trim(),
                    postalCode: document.getElementById("address-postal").value.trim(),
                    country: document.getElementById("address-country").value.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not save this address.");
            renderAddresses(data.addresses || []);
            form.reset();
            showMessage(status, "Address saved.", "success");
        } catch (error) {
            showMessage(status, error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    document.getElementById("saved-addresses").addEventListener("click", async event => {
        const button = event.target.closest("[data-remove-address]");
        if (!button) return;
        button.disabled = true;
        try {
            const response = await fetch(`/api/users/profile/addresses/${encodeURIComponent(button.dataset.removeAddress)}`, {
                method: "DELETE",
                headers,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not remove this address.");
            renderAddresses(data.addresses || []);
            showMessage(status, "Address removed.", "success");
        } catch (error) {
            showMessage(status, error.message, "error");
            button.disabled = false;
        }
    });

    function redirectToLogin() {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
    }
});

function renderAddresses(addresses) {
    const list = document.getElementById("saved-addresses");
    list.replaceChildren();
    if (addresses.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No saved addresses yet.";
        list.append(empty);
        return;
    }

    addresses.forEach(address => {
        const card = document.createElement("article");
        card.className = "address-card";
        const title = document.createElement("h3");
        title.textContent = address.label;
        const details = document.createElement("p");
        details.textContent = `${address.street}, ${address.city}, ${address.postalCode}, ${address.country}`;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "text-button";
        remove.dataset.removeAddress = address._id;
        remove.textContent = "Remove";
        card.append(title, details, remove);
        list.append(card);
    });
}

function renderProfileOrders(orders) {
    const list = document.getElementById("profile-orders");
    list.replaceChildren();
    if (orders.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "Your order history will appear here after your first checkout.";
        list.append(empty);
        return;
    }

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "order-card";
        const title = document.createElement("h3");
        title.textContent = `Order #${order._id.slice(-8).toUpperCase()}`;
        const summary = document.createElement("p");
        summary.textContent = `${new Date(order.createdAt).toLocaleDateString()} · ${order.paymentStatus || "Pending"} · KES ${Number(order.totalAmount || 0).toLocaleString()}`;
        const track = document.createElement("a");
        track.className = "button-link";
        track.href = `tracking.html?id=${encodeURIComponent(order._id)}`;
        track.textContent = "Track order";
        card.append(title, summary, track);
        list.append(card);
    });
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `notice ${type}`;
    element.hidden = false;
}
