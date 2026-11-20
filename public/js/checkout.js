let API_BASE_URL = null;
let authHeaders = null;
let currentPaymentMethod = 'M-Pesa';

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
        return;
    }

    // 1. Get Config
    try {
        const res = await fetch("/api/config");
        const config = await res.json();
        const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
        API_BASE_URL = isLocalHost ? window.location.origin : (config.baseUrl || window.location.origin);
    } catch (err) {
        API_BASE_URL = window.location.origin;
    }

    authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, {
            headers: authHeaders,
        });
        const profileData = await profileResponse.json();
        if (profileResponse.status === 401) {
            localStorage.removeItem("userToken");
            localStorage.removeItem("user");
            window.location.replace(`/login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        }
        if (!profileResponse.ok) {
            throw new Error(profileData.message || "Please sign in again to continue.");
        }
        const user = profileData.user;
        document.getElementById("name").value = user.name || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phoneNumber || "";
    } catch (error) {
        showMessage(`Unable to load your account details: ${error.message}`, "error");
        document.getElementById("payButton").disabled = true;
        return;
    }

    // 2. Load Order Summary
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const orderItemsDiv = document.getElementById("order-items");
    const totalAmountSpan = document.getElementById("total-amount");

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        const itemDiv = document.createElement("div");
        itemDiv.className = "order-summary-item";
        itemDiv.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>KES ${(item.price * item.quantity).toLocaleString()}</span>
        `;
        orderItemsDiv.appendChild(itemDiv);
    });
    totalAmountSpan.textContent = `KES ${total.toLocaleString()}`;

    // 3. Setup Pay Button
    const payButton = document.getElementById("payButton");
    payButton.addEventListener("click", handlePayment);
});

function selectPaymentMethod(method) {
    currentPaymentMethod = method;

    // Update UI
    document.getElementById("method-mpesa").classList.toggle("active", method === 'M-Pesa');
    document.getElementById("method-visa").classList.toggle("active", method === 'Visa');

    document.getElementById("visa-details").classList.toggle("show", method === 'Visa');
    document.getElementById("phone-group").style.display = method === 'M-Pesa' ? 'block' : 'none';

    const payButton = document.getElementById("payButton");
    payButton.textContent = method === 'M-Pesa' ? 'Pay with M-Pesa' : 'Pay with Visa Card';
}

async function handlePayment() {
    const messageDiv = document.getElementById("checkout-message");
    const payButton = document.getElementById("payButton");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (!name || !email || !address) {
        showMessage("Please fill in all contact and delivery details.", "error");
        return;
    }

    if (cart.length === 0) {
        showMessage("Your cart is empty.", "error");
        return;
    }

    payButton.disabled = true;
    payButton.textContent = "Processing...";
    showMessage("Processing your request...", "info");

    try {
        // Save the checkout contact details to the signed-in account.
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify({ name, email, phoneNumber: document.getElementById("phone").value.trim() }),
        });
        const profileData = await profileRes.json();
        if (!profileRes.ok) throw new Error(profileData.message || "Failed to save customer details");
        localStorage.setItem("user", JSON.stringify(profileData.user));

        // 2. Create Order
        const orderRes = await fetch(`${API_BASE_URL}/api/orders`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
                products: cart.map(item => ({ productId: item.id || item._id, quantity: item.quantity })),
                shippingAddress: address,
                paymentMethod: currentPaymentMethod
            }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || "Failed to create order");
        const orderId = orderData.order.id;

        // 3. Process Payment
        if (currentPaymentMethod === 'M-Pesa') {
            await handleMpesaPayment(orderId, total, authHeaders);
        } else {
            await handleVisaPayment(orderId, total, email, authHeaders);
        }

    } catch (error) {
        showMessage(error.message, "error");
        payButton.disabled = false;
        payButton.textContent = currentPaymentMethod === 'M-Pesa' ? 'Pay with M-Pesa' : 'Pay with Visa Card';
    }
}

async function handleMpesaPayment(orderId, amount, authHeaders) {
    const phone = document.getElementById("phone").value.trim();
    if (!/^(07|01)\d{8}$/.test(phone)) {
        throw new Error("Invalid M-Pesa number. Use 07XXXXXXXX.");
    }

    const res = await fetch(`${API_BASE_URL}/api/payments/stkpush`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ phone, amount, orderId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "M-Pesa initiation failed");

    showMessage("Check your phone for the M-Pesa prompt!", "success");
    finishCheckout(orderId, "pending");
}

async function handleVisaPayment(orderId, amount, email, authHeaders) {
    const cardNumber = document.getElementById("card-number").value.replace(/\s/g, '');
    const expiry = document.getElementById("expiry").value.trim();
    const cvc = document.getElementById("cvc").value.trim();

    if (!cardNumber || !expiry || !cvc) {
        throw new Error("Please enter all card details.");
    }

    const res = await fetch(`${API_BASE_URL}/api/visa/pay`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ cardNumber, expiry, cvc, amount, orderId, email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Visa payment failed");

    showMessage("Visa payment successful!", "success");
    finishCheckout(orderId, "success");
}

function showMessage(text, type) {
    const div = document.getElementById("checkout-message");
    div.textContent = text;
    div.className = `message ${type}`;
    div.style.display = "block";
}

function finishCheckout(orderId, paymentStatus) {
    localStorage.removeItem("cart");
    sessionStorage.setItem("lastOrderId", orderId);
    sessionStorage.setItem("lastPaymentStatus", paymentStatus);
    sessionStorage.setItem("mpesa_payment_success", "true");
    setTimeout(() => {
        window.location.href = "/thank-you.html";
    }, 2000);
}
