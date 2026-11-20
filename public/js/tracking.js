document.addEventListener("DOMContentLoaded", async () => {
    const message = document.getElementById("tracking-message");
    const orderList = document.getElementById("order-history");
    const selectedOrder = document.getElementById("selected-order");
    const token = localStorage.getItem("userToken");

    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const response = await fetch("/api/orders/mine", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("userToken");
                localStorage.removeItem("user");
                redirectToLogin();
                return;
            }
            throw new Error(data.message || "Unable to load your orders.");
        }

        const orders = data.orders || [];
        const requestedId = new URLSearchParams(window.location.search).get("id");
        renderOrderHistory(orders, orderList);
        selectedOrder.replaceChildren();

        if (requestedId) {
            const order = orders.find(item => item._id === requestedId);
            if (order) {
                renderSelectedOrder(order, selectedOrder);
            } else {
                selectedOrder.textContent = "";
                selectedOrder.append(createNotice("That order was not found in your account.", "error"));
            }
        } else if (orders.length > 0) {
            renderSelectedOrder(orders[0], selectedOrder);
        } else {
            selectedOrder.append(createNotice("Orders you place will appear here.", "info"));
        }
    } catch (error) {
        message.textContent = error.message;
        message.hidden = false;
        message.className = "notice error";
    }

    function redirectToLogin() {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
    }
});

function renderOrderHistory(orders, container) {
    container.replaceChildren();
    if (orders.length === 0) {
        container.append(createNotice("No orders yet. Visit the products page to place your first order.", "info"));
        return;
    }

    orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "order-card";
        const title = document.createElement("h3");
        title.textContent = `Order #${order._id.slice(-8).toUpperCase()}`;
        const date = document.createElement("p");
        date.textContent = `Placed ${formatOrderDate(order.createdAt)}`;
        const status = document.createElement("p");
        status.textContent = `Payment: ${order.paymentStatus || "Pending"} · Fulfillment: ${order.fulfillmentStatus || "Pending"}`;
        const link = document.createElement("a");
        link.className = "button-link";
        link.href = `tracking.html?id=${encodeURIComponent(order._id)}`;
        link.textContent = "View tracking";
        card.append(title, date, status, link);
        container.append(card);
    });
}

function renderSelectedOrder(order, container) {
    container.replaceChildren();
    const card = document.createElement("article");
    card.className = "tracking-card";

    const title = document.createElement("h2");
    title.textContent = `Order #${order._id.slice(-8).toUpperCase()}`;
    const date = document.createElement("p");
    date.textContent = `Placed ${formatOrderDate(order.createdAt)}`;
    card.append(title, date);

    const summary = document.createElement("div");
    summary.className = "tracking-summary";
    appendDetail(summary, "Payment status", order.paymentStatus || "Pending");
    appendDetail(summary, "Order status", order.fulfillmentStatus || "Pending");
    appendDetail(summary, "Total", `KES ${Number(order.totalAmount || 0).toLocaleString()}`);
    if (order.trackingNumber) appendDetail(summary, "Tracking number", order.trackingNumber);
    if (order.estimatedDelivery) {
        appendDetail(summary, "Estimated delivery", new Date(order.estimatedDelivery).toLocaleDateString());
    }
    card.append(summary);

    const itemsTitle = document.createElement("h3");
    itemsTitle.textContent = "Items";
    const items = document.createElement("ul");
    items.className = "tracking-items";
    (order.products || []).forEach(item => {
        const row = document.createElement("li");
        const product = item.product;
        row.textContent = `${product?.name || "Product"} × ${item.quantity}`;
        items.append(row);
    });
    card.append(itemsTitle, items);
    container.append(card);
}

function appendDetail(container, label, value) {
    const row = document.createElement("p");
    const key = document.createElement("strong");
    key.textContent = `${label}: `;
    row.append(key, document.createTextNode(value));
    container.append(row);
}

function createNotice(text, type) {
    const notice = document.createElement("p");
    notice.className = `notice ${type}`;
    notice.textContent = text;
    return notice;
}

function formatOrderDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "date unavailable" : date.toLocaleString();
}
