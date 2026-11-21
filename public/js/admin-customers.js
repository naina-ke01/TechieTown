// ========================================
// Admin Customers Management JavaScript
// ========================================

const API_BASE = window.location.origin;
let allCustomers = [];
let allPayments = [];

// ========================================
// 1. FETCH & DISPLAY CUSTOMERS
// ========================================
async function loadCustomers() {
    const tbody = document.getElementById("customersTableBody");

    // Show loading state
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;color:#d4af37; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                    Loading customers...
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

        const response = await fetch(`${API_BASE}/api/admin/customers`, {
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to load customers");
        }

        allCustomers = data.customers || [];

        // Fetch order statistics for each customer
        await enrichCustomersWithStats();

        // Fetch payments data
        await loadPayments();

        renderCustomersTable(allCustomers);
        updateCustomerStatistics(allCustomers);
    } catch (error) {
        console.error("Error loading customers:", error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;color:#ff6b6b; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                        <strong>Error loading customers</strong><br>
                        <small>${error.message}</small><br>
                        <button class="btn" onclick="loadCustomers()" style="margin-top: 10px;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
        showError("Failed to load customers: " + error.message);
    }
}

// Enrich customers with order statistics
async function enrichCustomersWithStats() {
    try {
        const token = localStorage.getItem("adminToken");
        const ordersResponse = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const ordersData = await ordersResponse.json();

        if (ordersData.success && ordersData.orders) {
            // Calculate stats for each customer
            allCustomers = allCustomers.map(customer => {
                const customerOrders = ordersData.orders.filter(
                    order => order.user && order.user._id === customer._id
                );

                const totalOrders = customerOrders.length;
                const totalSpent = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

                return {
                    ...customer,
                    totalOrders,
                    totalSpent
                };
            });
        }
    } catch (error) {
        console.error("Error fetching order stats:", error);
        // Continue without stats
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

function renderCustomersTable(customers) {
    const tbody = document.getElementById("customersTableBody");

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#d4af37; padding: 40px;">
          <i class="fas fa-inbox" style="font-size: 3rem; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
          No customers found.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = customers
        .map(
            (customer) => {
                const joinDate = new Date(customer.createdAt);
                const hasOrders = (customer.totalOrders || 0) > 0;
                const orderBadge = hasOrders
                    ? `<span style="color: #90ee90; font-weight: 600;">${customer.totalOrders}</span>`
                    : `<span style="color: #999;">0</span>`;

                return `
    <tr>
      <td><strong style="color: #d4af37;">#${customer._id.slice(-8)}</strong></td>
      <td>
        <div>
          <strong>${customer.name || "N/A"}</strong>
          ${customer.role === "admin" ? '<br><small style="color: #d4af37;">👑 Admin</small>' : ''}
        </div>
      </td>
      <td>
        <div>${customer.email}</div>
        ${customer.phone ? `<small style="color: #999;">📞 ${customer.phone}</small>` : ''}
      </td>
      <td>${orderBadge}</td>
      <td>
        <strong style="color: ${hasOrders ? '#d4af37' : '#999'};">
          KES ${(customer.totalSpent || 0).toLocaleString()}
        </strong>
      </td>
      <td>
        <div>${joinDate.toLocaleDateString()}</div>
        <small style="color: #999;">${joinDate.toLocaleTimeString()}</small>
      </td>
      <td class="actions">
        <button class="btn btn-view" onclick="viewCustomerDetails('${customer._id}')" title="View Details">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `;
            }
        )
        .join("");
}

// ========================================
// 2. VIEW CUSTOMER DETAILS
// ========================================
async function viewCustomerDetails(customerId) {
    try {
        const customer = allCustomers.find(c => c._id === customerId);

        if (!customer) {
            throw new Error("Customer not found");
        }

        // Fetch customer's orders
        const token = localStorage.getItem("adminToken");
        const ordersResponse = await fetch(`${API_BASE}/api/admin/orders`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const ordersData = await ordersResponse.json();

        let customerOrders = [];
        if (ordersData.success) {
            customerOrders = ordersData.orders.filter(
                order => order.user && order.user._id === customerId
            );
        }

        displayCustomerModal(customer, customerOrders);
    } catch (error) {
        console.error("Error loading customer details:", error);
        showError("Failed to load customer details");
    }
}

function displayCustomerModal(customer, orders) {
    const modal = document.getElementById("customerDetailsModal");

    // Customer Info
    document.getElementById("modalCustomerId").textContent = customer._id;
    document.getElementById("modalCustomerName").textContent = customer.name || "N/A";
    document.getElementById("modalCustomerEmail").textContent = customer.email || "N/A";
    document.getElementById("modalCustomerPhone").textContent = customer.phone || "Not provided";
    const roleEl = document.getElementById("modalCustomerRole");
    roleEl.textContent = customer.role || "customer";
    if (customer.role === "admin") {
        roleEl.style.color = "#d4af37";
        roleEl.innerHTML = `<i class="fas fa-crown"></i> ${customer.role}`;
    }
    document.getElementById("modalJoinDate").textContent = new Date(customer.createdAt).toLocaleString();

    // Statistics
    const customerPayments = allPayments.filter(p => p.user && p.user._id === customer._id);
    const completedPayments = customerPayments.filter(p => p.status === "Completed");
    const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = customerPayments.filter(p => p.status === "Pending");
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paymentSuccessRate = customerPayments.length > 0
        ? Math.round((completedPayments.length / customerPayments.length) * 100)
        : 0;

    document.getElementById("modalTotalOrders").textContent = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById("modalTotalSpent").innerHTML = `
        <div>KES ${totalSpent.toLocaleString()}</div>
        <small style="color: #999; font-size: 0.85rem;">
            Paid: KES ${totalPaid.toLocaleString()} | 
            Pending: KES ${totalPending.toLocaleString()}
        </small>
        ${customerPayments.length > 0 ? `<small style="color: #999; font-size: 0.85rem; display: block; margin-top: 5px;">
            Payment Success Rate: <span style="color: ${paymentSuccessRate >= 80 ? '#90ee90' : paymentSuccessRate >= 50 ? '#ffaa00' : '#ff6b6b'};">${paymentSuccessRate}%</span>
        </small>` : ''}
    `;

    // Recent Orders
    const ordersList = document.getElementById("modalOrdersList");
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #999;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>No orders yet</p>
            </div>
        `;
    } else {
        ordersList.innerHTML = orders.slice(0, 10).map(order => {
            const statusColor =
                order.paymentStatus === "Paid" ? "#90ee90" :
                    order.paymentStatus === "Failed" ? "#ff6b6b" : "#ffaa00";
            const orderDate = new Date(order.createdAt);
            const itemsCount = order.products?.length || 0;

            return `
        <div class="order-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; margin-bottom: 10px;">
          <div class="order-info" style="flex: 1;">
            <strong style="color: #d4af37;">Order #${order._id.slice(-8)}</strong>
            <p style="color: #999; margin: 5px 0; font-size: 0.9rem;">
              ${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString()}
            </p>
            <p style="color: #999; margin: 5px 0; font-size: 0.85rem;">
              ${itemsCount} item${itemsCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div class="order-details" style="text-align: right;">
            <span class="status-badge" style="background-color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-weight: 600; color: #111; display: inline-block; margin-bottom: 5px;">
              ${order.paymentStatus || "Pending"}
            </span>
            <p style="color: #d4af37; font-weight: 600; font-size: 1.1rem; margin: 0;">
              KES ${(order.totalAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      `;
        }).join('');

        if (orders.length > 10) {
            ordersList.innerHTML += `
                <p style="text-align: center; color: #999; margin-top: 15px;">
                    Showing 10 of ${orders.length} orders
                </p>
            `;
        }
    }

    // Payment History
    const paymentsList = document.getElementById("modalPaymentsList");
    if (customerPayments.length === 0) {
        paymentsList.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #999;">
                <i class="fas fa-money-bill-wave" style="font-size: 3rem; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                <p>No payment history</p>
            </div>
        `;
    } else {
        paymentsList.innerHTML = customerPayments.slice(0, 10).map(payment => {
            const statusColor =
                payment.status === "Completed" ? "#90ee90" :
                    payment.status === "Failed" ? "#ff6b6b" : "#ffaa00";
            const paymentDate = new Date(payment.createdAt);
            const transactionDate = payment.transactionDate ? new Date(parseInt(payment.transactionDate)) : null;

            return `
        <div class="payment-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333; margin-bottom: 10px;">
          <div class="payment-info" style="flex: 1;">
            <strong style="color: #d4af37;">${payment.mpesaReceiptNumber || 'Payment #' + payment._id.slice(-8)}</strong>
            <p style="color: #999; margin: 5px 0; font-size: 0.9rem;">
              ${paymentDate.toLocaleDateString()} at ${paymentDate.toLocaleTimeString()}
            </p>
            ${payment.phoneNumber ? `<p style="color: #999; margin: 5px 0; font-size: 0.85rem;">📱 ${payment.phoneNumber}</p>` : ''}
            ${transactionDate ? `<p style="color: #999; margin: 5px 0; font-size: 0.85rem;">✅ Confirmed: ${transactionDate.toLocaleString()}</p>` : ''}
          </div>
          <div class="payment-details" style="text-align: right;">
            <span class="status-badge" style="background-color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-weight: 600; color: #111; display: inline-block; margin-bottom: 5px;">
              ${payment.status}
            </span>
            <p style="color: #d4af37; font-weight: 600; font-size: 1.1rem; margin: 0;">
              KES ${(payment.amount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      `;
        }).join('');

        if (customerPayments.length > 10) {
            paymentsList.innerHTML += `
                <p style="text-align: center; color: #999; margin-top: 15px;">
                    Showing 10 of ${customerPayments.length} payments
                </p>
            `;
        }
    }

    modal.style.display = "flex";
}

function closeCustomerDetailsModal() {
    document.getElementById("customerDetailsModal").style.display = "none";
}

// ========================================
// 3. UPDATE CUSTOMER STATISTICS
// ========================================
function updateCustomerStatistics(customers) {
    const totalCustomers = customers.length;
    const customersWithOrders = customers.filter(c => (c.totalOrders || 0) > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    // Calculate new customers this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = customers.filter(c => new Date(c.createdAt) >= startOfMonth).length;

    const totalEl = document.getElementById("totalCustomers");
    const withOrdersEl = document.getElementById("customersWithOrders");
    const revenueEl = document.getElementById("totalCustomerRevenue");
    const newMonthEl = document.getElementById("newCustomersThisMonth");

    if (totalEl) totalEl.textContent = totalCustomers;
    if (withOrdersEl) withOrdersEl.textContent = customersWithOrders;
    if (revenueEl) revenueEl.textContent = `KES ${totalRevenue.toLocaleString()}`;
    if (newMonthEl) newMonthEl.textContent = newThisMonth;
}

// ========================================
// 4. SEARCH CUSTOMERS
// ========================================
function searchCustomers() {
    const searchQuery = document.getElementById("searchCustomers").value.toLowerCase();

    if (!searchQuery) {
        renderCustomersTable(allCustomers);
        updateCustomerStatistics(allCustomers);
        return;
    }

    const filtered = allCustomers.filter(customer => {
        const name = customer.name?.toLowerCase() || "";
        const email = customer.email?.toLowerCase() || "";
        const phone = customer.phone?.toLowerCase() || "";
        const id = customer._id.toLowerCase();

        return name.includes(searchQuery) ||
            email.includes(searchQuery) ||
            phone.includes(searchQuery) ||
            id.includes(searchQuery);
    });

    renderCustomersTable(filtered);
    updateCustomerStatistics(filtered);
}

// ========================================
// 5. UTILITY FUNCTIONS
// ========================================
function showError(message) {
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
// 6. INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadCustomers();

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById("customerDetailsModal");
        if (event.target === modal) {
            closeCustomerDetailsModal();
        }
    };

    // Setup search listener
    const searchInput = document.getElementById("searchCustomers");
    if (searchInput) {
        searchInput.addEventListener("input", searchCustomers);
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loadCustomers().finally(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            });
        });
    }
});

// Make functions globally accessible
window.viewCustomerDetails = viewCustomerDetails;
window.closeCustomerDetailsModal = closeCustomerDetailsModal;
window.loadCustomers = loadCustomers; // Make loadCustomers accessible for retry button
