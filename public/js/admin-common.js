// public/js/admin-common.js
// Handles: Auth check, logout, and page-specific data loading using imported APIs
// Import all necessary APIs from api.js

import { adminAPI, productsAPI, ordersAPI, customersAPI, paymentsAPI } from './api.js';

const AdminApp = {
  // Check if admin is logged in and redirect if necessary
  checkAuth() {
    // ... (Authentication logic remains the same) ...
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
    const path = window.location.pathname;

    if (path.includes("a.login.html") && isLoggedIn) {
      window.location.href = "a.dashboard.html";
      return null;
    }

    if (!isLoggedIn || !adminUser.email) {
      if (!path.includes("a.login.html")) {
        console.warn("⚠️ No admin session found, redirecting to login...");
        window.location.href = "/a.login.html";
        return null;
      }
    }
    return adminUser;
  },

  // Setup logout button
  setupLogout() {
    const logoutBtns = document.querySelectorAll("#logoutBtn, .btn-logout");
    logoutBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("isAdminLoggedIn");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminToken"); // Clear the token!
        window.location.href = "/a.login.html";
      });
    });
  },

  // Utility functions (showLoading, showError, showEmpty) remain the same...
  showLoading(elementId, colspan = 5) {
    const element = document.getElementById(elementId);
    if (element && element.tagName === 'TBODY') {
      element.innerHTML = `
        <tr>
          <td colspan="${colspan}" style="text-align:center;color:#d4af37;">
            🔄 Loading data...
          </td>
        </tr>
      `;
    }
  },

  showError(elementId, message, colspan = 5) {
    const element = document.getElementById(elementId);
    if (element && element.tagName === 'TBODY') {
      element.innerHTML = `
        <tr>
          <td colspan="${colspan}" style="text-align:center;color:#ff6b6b; word-break: break-all;">
            ⚠️ API Error: ${message}
          </td>
        </tr>
      `;
    }
  },

  showEmpty(elementId, message, colspan = 5) {
    const element = document.getElementById(elementId);
    if (element && element.tagName === 'TBODY') {
      element.innerHTML = `
        <tr>
          <td colspan="${colspan}" style="text-align:center;color:#777;">
            ${message}
          </td>
        </tr>
      `;
    }
  },

  // Initialize the app and load page-specific data
  init() {
    const adminUser = this.checkAuth();
    if (!adminUser) return;

    this.setupLogout();

    const greetingEl = document.getElementById("adminGreeting");
    if (greetingEl) {
      greetingEl.textContent = `Welcome, ${adminUser.name || "Admin"} 👋`;
    }

    const path = window.location.pathname;

    if (path.includes("a.dashboard.html")) {
      this.loadDashboard();
    } else if (path.includes("a.customers.html")) {
      this.loadCustomers();
    } else if (path.includes("a.products.html")) {
      this.loadProducts();
    } else if (path.includes("a.orders.html")) {
      this.loadOrders();
    } else if (path.includes("a.payments.html")) {
      this.loadPayments();
    }
    // Note: Settings logic should be in admin-settings.js or kept separate if complex
  },


  // Load Dashboard Data (Uses adminAPI)
  async loadDashboard() {
    this.showLoading("ordersTableBody", 5);
    this.showLoading("paymentsTableBody", 5);

    try {
      const data = await adminAPI.fetchDashboard();

      // ... (Update counts and render tables logic remains the same) ...
      document.getElementById("productCount").textContent = data.counts?.productCount?.toLocaleString() || 0;
      document.getElementById("orderCount").textContent = data.counts?.orderCount?.toLocaleString() || 0;
      document.getElementById("paymentCount").textContent = data.counts?.paymentCount?.toLocaleString() || 0;

      this.renderOrdersTable(data.recentOrders || [], "ordersTableBody", 5);
      this.renderPaymentsTable(data.recentPayments || [], "paymentsTableBody", 5);

    } catch (err) {
      console.error("❌ Dashboard error:", err);
      this.showError("ordersTableBody", err.message, 5);
      this.showError("paymentsTableBody", err.message, 5);
    }
  },

  // Load Customers (Full Page - Uses customersAPI)
  // Note: This is a fallback. Page-specific admin-customers.js should handle this.
  async loadCustomers() {
    // Only load if page-specific script hasn't already loaded
    const tbody = document.getElementById("customersTableBody");
    if (!tbody || tbody.innerHTML.includes("Loading customers") === false) {
      return; // Page-specific script is handling it
    }
    
    const tableId = "customersTableBody";
    const colspan = 7;
    this.showLoading(tableId, colspan);

    try {
      const data = await customersAPI.fetchCustomers();
      const tbody = document.getElementById(tableId);

      if (!data.customers || data.customers.length === 0) {
        this.showEmpty(tableId, "No customers found", colspan);
        return;
      }

      tbody.innerHTML = "";
      data.customers.forEach(customer => {
        const row = document.createElement("tr");
        // Matches columns in a.customers.html: ID, Name, Email, Total Orders, Total Spent, Date Joined, Actions
        row.innerHTML = `
          <td>${customer._id.slice(-8)}</td>
          <td>${customer.name || "N/A"}</td>
          <td>${customer.email}</td>
          <td>0</td>
          <td>KES 0</td>
          <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
          <td class="actions">
            <button class="btn" onclick="viewCustomerDetails('${customer._id}')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      this.showError(tableId, err.message, colspan);
    }
  },


  // Load Products (Full Page - Uses productsAPI)
  // Note: This is a fallback. Page-specific admin-products.js should handle this.
  async loadProducts() {
    // Only load if page-specific script hasn't already loaded
    const tbody = document.getElementById("productsTableBody");
    if (!tbody || tbody.innerHTML.includes("Loading products") === false) {
      return; // Page-specific script is handling it
    }
    
    const tableId = "productsTableBody";
    const colspan = 7;
    this.showLoading(tableId, colspan);

    try {
      const data = await productsAPI.fetchProducts();
      const tbody = document.getElementById(tableId);

      if (!data.products || data.products.length === 0) {
        this.showEmpty(tableId, "No products found", colspan);
        return;
      }

      tbody.innerHTML = "";
      const API_BASE = window.location.origin;
      data.products.forEach(product => {
        const row = document.createElement("tr");
        // Matches columns in a.products.html: ID, Image, Name, Category, Price, Stock, Actions
        row.innerHTML = `
          <td>${product._id.slice(-6)}</td>
          <td>
            ${product.image
              ? `<img src="${API_BASE}${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
              : "No image"
            }
          </td>
          <td>${product.name}</td>
          <td>${product.category || "N/A"}</td>
          <td>KES ${product.price?.toLocaleString() || "0"}</td>
          <td>${product.stock || 0}</td>
          <td class="actions">
            <button class="btn" onclick="openEditModal('${product._id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn" onclick="deleteProduct('${product._id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      this.showError(tableId, err.message, colspan);
    }
  },


  // Load Orders (Full Page - Uses ordersAPI)
  // Note: This is a fallback. Page-specific admin-orders.js should handle this.
  async loadOrders() {
    // Only load if page-specific script hasn't already loaded
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody || tbody.innerHTML.includes("Loading orders") === false) {
      return; // Page-specific script is handling it
    }
    
    const tableId = "ordersTableBody";
    const colspan = 7;
    this.showLoading(tableId, colspan);

    try {
      const data = await ordersAPI.fetchOrders();
      const tbody = document.getElementById(tableId);

      if (!data.orders || data.orders.length === 0) {
        this.showEmpty(tableId, "No orders found", colspan);
        return;
      }

      tbody.innerHTML = "";
      data.orders.forEach(order => {
        const row = document.createElement("tr");
        const statusColor = order.paymentStatus === "Paid" ? "#90ee90" :
          order.paymentStatus === "Failed" ? "#ff6b6b" : "#ffaa00";
        const customerName = order.user?.name || order.userEmail || "Guest";
        const itemsCount = order.products?.length || 0;
        // Matches columns in a.orders.html: Order ID, Customer, Items, Amount, Status, Date, Actions
        row.innerHTML = `
          <td>${order._id.slice(-8)}</td>
          <td>${customerName}</td>
          <td>${itemsCount} item(s)</td>
          <td>KES ${(order.totalAmount || 0).toLocaleString()}</td>
          <td><span style="color: ${statusColor};">${order.paymentStatus || "Pending"}</span></td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
          <td class="actions">
            <button class="btn" onclick="viewOrderDetails('${order._id}')">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn" onclick="openStatusModal('${order._id}')">
              <i class="fas fa-edit"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      this.showError(tableId, err.message, colspan);
    }
  },


  // Load Payments (Full Page - Uses paymentsAPI)
  // Note: This is a fallback. Page-specific admin-payments.js should handle this.
  async loadPayments() {
    // Only load if page-specific script hasn't already loaded
    const tbody = document.getElementById("paymentsTableBody");
    if (!tbody || tbody.innerHTML.includes("Loading payments") === false) {
      return; // Page-specific script is handling it
    }
    
    const tableId = "paymentsTableBody";
    const colspan = 8;
    this.showLoading(tableId, colspan);

    try {
      const data = await paymentsAPI.fetchPayments();
      const tbody = document.getElementById(tableId);

      if (!data.payments || data.payments.length === 0) {
        this.showEmpty(tableId, "No payments found", colspan);
        return;
      }

      tbody.innerHTML = "";
      data.payments.forEach(p => {
        const row = document.createElement("tr");
        const statusColor = p.status === "Completed" ? "#90ee90" :
          p.status === "Failed" ? "#ff6b6b" :
          p.status === "Cancelled" ? "#ff9999" : "#ffaa00";
        // Matches columns in a.payments.html: Payment ID, Phone Number, Amount, M-Pesa Receipt, Type, Status, Date, Actions
        row.innerHTML = `
          <td>${p._id.slice(-8)}</td>
          <td>${p.phoneNumber || "N/A"}</td>
          <td>KES ${p.amount?.toLocaleString() || "0"}</td>
          <td>${p.mpesaReceiptNumber || "-"}</td>
          <td>${p.transactionType || "STK_PUSH"}</td>
          <td><span style="background-color: ${statusColor}; padding: 4px 8px; border-radius: 4px;">${p.status || "Pending"}</span></td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
          <td class="actions">
            <button class="btn" onclick="viewPaymentDetails('${p._id}')">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    } catch (err) {
      this.showError(tableId, err.message, colspan);
    }
  },

  // Render functions for dashboard remain the same, ensure they also use imported APIs if needed
  // ... (renderOrdersTable, renderPaymentsTable, etc.)
};


// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  AdminApp.init();
});


// Global functions for inline onclick handlers
window.editProduct = (id) => alert(`Edit product ${id} - Coming soon!`);
window.deleteProduct = (id) => {
  if (confirm(`Delete product ${id}?`)) {
    // In a real app, call productsAPI.deleteProduct(id) here
    alert("Product deleted! (Simulated)");
    AdminApp.loadProducts();
  }
};
window.viewOrder = (id) => alert(`View order ${id} - Coming soon!`);
window.updateStatus = (id) => alert(`Update status for order ${id} - Coming soon!`);