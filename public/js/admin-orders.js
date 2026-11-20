// ========================================
// Admin Orders Management JavaScript
// ========================================

const API_BASE = window.location.origin;
let allOrders = [];
let allPayments = [];

// ========================================
// 1. FETCH & DISPLAY ORDERS
// ========================================

async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");

    // Show loading state

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;color:#d4af37; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                    Loading orders...
                </td>
            </tr>
        `;
    }

    try {
        const token = localStorage.getItem("adminToken");
        const headers = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to load orders");
        }

        allOrders = data.orders || [];

        // Fetch payments data
        await loadPayments();

        renderOrdersTable(allOrders);
        updateOrderStatistics(allOrders);

        // Update order count if element exists
        const orderCountEl = document.getElementById("orderCount");
        if (orderCountEl) {
            orderCountEl.textContent = allOrders.length;
        }
    } catch (error) {
        console.error("Error loading orders:", error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;color:#ff6b6b; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                        <strong>Error loading orders</strong><br>
                        <small>${error.message}</small><br>
                        <button class="btn" onclick="loadOrders()" style="margin-top: 10px;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
        showError("Failed to load orders: " + error.message);
    }
}

// Fetch all payments
async function loadPayments() {
    try {
        const token = localStorage.getItem("adminToken");
        const headers = {
            "Content-Type": "application/json",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/admin/payments`, {
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                allPayments = data.payments || [];
            }
        }
    } catch (error) {
        console.error("Error loading payments:", error);
        // Continue without payment data
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById("ordersTableBody");

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#d4af37; padding: 40px;">
          <i class="fas fa-inbox" style="font-size: 3rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
          No orders found.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = orders
        .map(
            (order) => {
                const statusColor =
                    order.paymentStatus === "Paid" ? "#90ee90" :
                        order.paymentStatus === "Failed" ? "#ff6b6b" : "#ffaa00";

                const customerName = order.user?.name || order.userEmail || "Guest";
                const customerEmail = order.user?.email || order.userEmail || "";
                const itemsCount = order.products?.length || 0;
                const totalAmount = order.totalAmount || 0;
                const orderDate = new Date(order.createdAt);

                return `
    <tr>
      <td><strong style="color: #d4af37;">#${order._id.slice(-8)}</strong></td>
      <td>
        <div>
          <strong>${customerName}</strong>
          ${customerEmail ? `<br><small style="color: #999;">${customerEmail}</small>` : ''}
        </div>
      </td>
      <td>
        <span style="color: #d4af37; font-weight: 600;">${itemsCount}</span> item${itemsCount !== 1 ? 's' : ''}
      </td>
      <td><strong style="color: #d4af37;">KES ${totalAmount.toLocaleString()}</strong></td>
      <td>
        <span class="status-badge" style="background-color: ${statusColor}; padding: 6px 12px; border-radius: 4px; font-weight: 600; color: #111;">
          ${order.paymentStatus || "Pending"}
        </span>
      </td>
      <td>
        <div>${orderDate.toLocaleDateString()}</div>
        <small style="color: #999;">${orderDate.toLocaleTimeString()}</small>
      </td>
      <td class="actions">
        <button class="btn btn-view" onclick="viewOrderDetails('${order._id}')" title="View Details">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn btn-edit" onclick="openStatusModal('${order._id}')" title="Update Status">
          <i class="fas fa-edit"></i> Update
        </button>
      </td>
    </tr>
  `;
            }
        )
        .join("");
}

// ========================================
// 2. VIEW ORDER DETAILS
// ========================================
async function viewOrderDetails(orderId) {
    try {
        const order = allOrders.find(o => o._id === orderId);

        if (!order) {
            showError("Order not found");
            return;
        }

        displayOrderModal(order);
    } catch (error) {
        console.error("Error loading order details:", error);
        showError("Failed to load order details");
    }
}

function displayOrderModal(order) {
    const modal = document.getElementById("orderDetailsModal");

    // Order Info
    document.getElementById("modalOrderId").textContent = order._id;
    document.getElementById("modalOrderDate").textContent = new Date(order.createdAt).toLocaleString();

    const statusColor = order.paymentStatus === "Paid" ? "#90ee90" :
        order.paymentStatus === "Failed" ? "#ff6b6b" : "#ffaa00";
    const statusBadge = document.getElementById("modalPaymentStatus");
    statusBadge.textContent = order.paymentStatus || "Pending";
    statusBadge.style.backgroundColor = statusColor;
    statusBadge.style.padding = "4px 8px";
    statusBadge.style.borderRadius = "4px";
    statusBadge.style.display = "inline-block";

    document.getElementById("modalFulfillmentStatus").textContent = order.fulfillmentStatus || "Pending";
    document.getElementById("modalTrackingNumber").textContent = order.trackingNumber || "Not assigned";
    document.getElementById("modalEstimatedDelivery").textContent = order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toLocaleDateString()
        : "Not set";
    document.getElementById("modalTotalAmount").textContent = `KES ${(order.totalAmount || 0).toLocaleString()}`;

    // Customer Info
    const user = order.user || {};
    document.getElementById("modalCustomerName").textContent = user.name || order.userEmail || "N/A";
    document.getElementById("modalCustomerEmail").textContent = user.email || order.userEmail || "N/A";
    document.getElementById("modalCustomerPhone").textContent = user.phone || order.userPhone || "N/A";

    // Payment Information
    const payment = allPayments.find(p => p.orderId && p.orderId.toString() === order._id.toString());

    // Products List
    const productsList = document.getElementById("modalProductsList");
    if (!order.products || order.products.length === 0) {
        productsList.innerHTML = '<p style="color:#999; text-align:center;">No products in this order</p>';
    } else {
        const API_BASE = window.location.origin;
        productsList.innerHTML = order.products.map(item => {
            const product = item.product || {};
            const quantity = item.quantity || 1;
            const price = product.price || item.price || 0;
            const productImage = product.image ? `${API_BASE}${product.image}` : '';
            return `
        <div class="order-product-item">
          <div class="product-info">
            ${productImage ? `<img src="${productImage}" alt="${product.name}" class="product-thumb">` : ''}
            <div>
              <strong>${product.name || "Unknown Product"}</strong>
              <p>Quantity: ${quantity} × KES ${price.toLocaleString()} = KES ${(price * quantity).toLocaleString()}</p>
              ${product.category ? `<p style="color:#999; font-size:0.85rem;">Category: ${product.category}</p>` : ''}
            </div>
          </div>
          <div class="product-subtotal">
            KES ${(price * quantity).toLocaleString()}
          </div>
        </div>
      `;
        }).join('');
    }

    // Payment Details Section
    const shippingSection = document.getElementById("shippingSection");
    if (payment && payment.status === "Completed") {
        shippingSection.style.display = "block";
        const shippingInfo = document.getElementById("shippingInfo");
        const transactionDate = payment.transactionDate ? new Date(parseInt(payment.transactionDate)).toLocaleString() : "N/A";
        shippingInfo.innerHTML = `
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
                <h4 style="color: #d4af37; margin-bottom: 15px;"><i class="fas fa-money-bill-wave"></i> Payment Details</h4>
                <div style="display: grid; gap: 10px;">
                    <p><strong>M-Pesa Receipt:</strong> <span style="color: #90ee90;">${payment.mpesaReceiptNumber || "N/A"}</span></p>
                    <p><strong>Phone Number:</strong> ${payment.phoneNumber || "N/A"}</p>
                    <p><strong>Amount Paid:</strong> <span style="color: #d4af37;">KES ${(payment.amount || 0).toLocaleString()}</span></p>
                    <p><strong>Transaction Date:</strong> ${transactionDate}</p>
                    <p><strong>Payment Method:</strong> M-Pesa STK Push</p>
                    <p><strong>Status:</strong> <span style="background: #90ee90; padding: 4px 8px; border-radius: 4px; color: #111; font-weight: 600;">${payment.status}</span></p>
                </div>
            </div>
        `;
    } else if (payment && payment.status === "Pending") {
        shippingSection.style.display = "block";
        const shippingInfo = document.getElementById("shippingInfo");
        shippingInfo.innerHTML = `
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
                <h4 style="color: #ffaa00; margin-bottom: 15px;"><i class="fas fa-clock"></i> Payment Pending</h4>
                <p style="color: #999;">Payment is still being processed. M-Pesa receipt will appear once payment is confirmed.</p>
                <p><strong>Phone Number:</strong> ${payment.phoneNumber || "N/A"}</p>
                <p><strong>Amount:</strong> <span style="color: #d4af37;">KES ${(payment.amount || 0).toLocaleString()}</span></p>
            </div>
        `;
    } else if (payment && payment.status === "Failed") {
        shippingSection.style.display = "block";
        const shippingInfo = document.getElementById("shippingInfo");
        shippingInfo.innerHTML = `
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333;">
                <h4 style="color: #ff6b6b; margin-bottom: 15px;"><i class="fas fa-times-circle"></i> Payment Failed</h4>
                <p style="color: #999;">${payment.resultDesc || "Payment was not completed."}</p>
                <p><strong>Phone Number:</strong> ${payment.phoneNumber || "N/A"}</p>
                <p><strong>Amount:</strong> <span style="color: #d4af37;">KES ${(payment.amount || 0).toLocaleString()}</span></p>
            </div>
        `;
    } else {
        shippingSection.style.display = "none";
    }

    modal.style.display = "flex";
}

function closeOrderDetailsModal() {
    document.getElementById("orderDetailsModal").style.display = "none";
}

// ========================================
// 3. UPDATE ORDER STATUS
// ========================================
let currentOrderIdForStatus = null;

function openStatusModal(orderId) {
    currentOrderIdForStatus = orderId;
    const order = allOrders.find(o => o._id === orderId);

    if (order) {
        document.getElementById("statusOrderId").textContent = order._id.slice(-8);
        document.getElementById("statusSelect").value = order.paymentStatus || "Pending";
        document.getElementById("fulfillmentStatusSelect").value = order.fulfillmentStatus || "Pending";
        document.getElementById("trackingNumberInput").value = order.trackingNumber || "";
        document.getElementById("estimatedDeliveryInput").value = order.estimatedDelivery
            ? new Date(order.estimatedDelivery).toISOString().slice(0, 10)
            : "";
    }

    document.getElementById("statusModal").style.display = "flex";
}

function closeStatusModal() {
    document.getElementById("statusModal").style.display = "none";
    currentOrderIdForStatus = null;
}

async function updateOrderStatus() {
    if (!currentOrderIdForStatus) {
        showError("No order selected");
        return;
    }

    const newStatus = document.getElementById("statusSelect").value;
    const fulfillmentStatus = document.getElementById("fulfillmentStatusSelect").value;
    const trackingNumber = document.getElementById("trackingNumberInput").value.trim();
    const estimatedDelivery = document.getElementById("estimatedDeliveryInput").value;

    try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Please login first");
            window.location.href = "/a.login.html";
            return;
        }

        const response = await fetch(`${API_BASE}/api/orders/${currentOrderIdForStatus}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentStatus: newStatus, fulfillmentStatus, trackingNumber, estimatedDelivery }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update order status");
        }

        showSuccess("Order status updated successfully!");
        closeStatusModal();
        loadOrders();
    } catch (error) {
        console.error("Error updating order status:", error);
        showError(error.message || "Failed to update order status");
    }
}

// ========================================
// 4. UPDATE ORDER STATISTICS
// ========================================
function updateOrderStatistics(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => (o.paymentStatus || "Pending") === "Pending").length;
    const paidOrders = orders.filter(o => o.paymentStatus === "Paid").length;
    const totalRevenue = orders
        .filter(o => o.paymentStatus === "Paid")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalEl = document.getElementById("totalOrders");
    const pendingEl = document.getElementById("pendingOrders");
    const paidEl = document.getElementById("paidOrders");
    const revenueEl = document.getElementById("totalRevenue");

    if (totalEl) totalEl.textContent = totalOrders;
    if (pendingEl) pendingEl.textContent = pendingOrders;
    if (paidEl) paidEl.textContent = paidOrders;
    if (revenueEl) revenueEl.textContent = `KES ${totalRevenue.toLocaleString()}`;
}

// ========================================
// 5. FILTER & SEARCH ORDERS
// ========================================
function filterOrders() {
    const statusFilter = document.getElementById("filterStatus").value;
    const searchQuery = document.getElementById("searchOrders").value.toLowerCase();

    let filtered = allOrders;

    // Filter by status
    if (statusFilter !== "all") {
        filtered = filtered.filter(order => (order.paymentStatus || "Pending") === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(order => {
            const customerName = (order.user?.name || order.userEmail || "").toLowerCase();
            const orderId = order._id.toLowerCase();
            const email = (order.user?.email || order.userEmail || "").toLowerCase();
            return customerName.includes(searchQuery) || orderId.includes(searchQuery) || email.includes(searchQuery);
        });
    }

    renderOrdersTable(filtered);
    updateOrderStatistics(filtered);
}

// ========================================
// 6. UTILITY FUNCTIONS
// ========================================
function showError(message) {
    // Try to use a better notification if available, otherwise use alert
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.3s";
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #90ee90;
        color: #111;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.3s";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// 7. INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadOrders();

    // Close modals when clicking outside
    window.onclick = function (event) {
        const orderModal = document.getElementById("orderDetailsModal");
        const statusModal = document.getElementById("statusModal");

        if (event.target === orderModal) {
            closeOrderDetailsModal();
        }
        if (event.target === statusModal) {
            closeStatusModal();
        }
    };

    // Setup filter listeners
    const filterStatus = document.getElementById("filterStatus");
    const searchOrders = document.getElementById("searchOrders");

    if (filterStatus) {
        filterStatus.addEventListener("change", filterOrders);
    }

    if (searchOrders) {
        searchOrders.addEventListener("input", filterOrders);
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loadOrders().finally(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            });
        });
    }
});

// Make functions globally accessible
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.updateOrderStatus = updateOrderStatus;
window.loadOrders = loadOrders; // Make loadOrders accessible for retry button

