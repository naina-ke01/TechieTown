// public/js/admin-dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
  // ===== CHECK AUTHENTICATION =====
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (!isLoggedIn || !adminUser.email) {
    console.warn("⚠️ No admin session found, redirecting...");
    // Login page is at root
    window.location.href = "/a.login.html";
    return;
  }



  // ===== GET DOM ELEMENTS =====
  const logoutBtn = document.getElementById("logoutBtn");
  const adminGreeting = document.getElementById("adminGreeting");
  const productCountEl = document.getElementById("productCount");
  const orderCountEl = document.getElementById("orderCount");
  const paymentCountEl = document.getElementById("paymentCount");
  const ordersTableBody = document.getElementById("ordersTableBody");
  const paymentsTableBody = document.getElementById("paymentsTableBody");



  // ===== GREET ADMIN =====
  if (adminGreeting) {
    adminGreeting.textContent = `Welcome, ${adminUser.name || "Admin"} 👋`;
  }




  // ===== FETCH DASHBOARD DATA =====
  async function fetchDashboardData() {
    try {
      console.log("📊 Fetching dashboard data...");

      const response = await fetch("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Dashboard data received:", data);

      // Update counts
      if (productCountEl) productCountEl.textContent = data.counts?.productCount || 0;
      if (orderCountEl) orderCountEl.textContent = data.counts?.orderCount || 0;
      if (paymentCountEl) paymentCountEl.textContent = data.counts?.paymentCount || 0;

      // Fetch and display customer count
      await fetchCustomerCount();

      // Display revenue
      const revenue = data.revenue?.total || 0;
      const revenueEl = document.getElementById("totalRevenue");
      if (revenueEl) {
        revenueEl.textContent = `KES ${revenue.toLocaleString()}`;
      }

      // Render tables
      if (ordersTableBody) renderOrders(data.recentOrders || []);
      if (paymentsTableBody) renderPayments(data.recentPayments || []);

      // Show backend message if exists
      if (data.message) {
        console.log("📝 Backend:", data.message);
      }

    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      showError(ordersTableBody, err.message);
      showError(paymentsTableBody, err.message);
    }
  }

  // ===== FETCH CUSTOMER COUNT =====
  async function fetchCustomerCount() {
    try {
      const response = await fetch("/api/admin/customers");
      const data = await response.json();

      const customerCountEl = document.getElementById("customerCount");
      if (customerCountEl && data.success) {
        customerCountEl.textContent = data.count || 0;
      }
    } catch (err) {
      console.error("❌ Customer count fetch error:", err);
    }
  }




  // ===== RENDER ORDERS TABLE =====
  function renderOrders(orders) {
    if (!ordersTableBody) return;

    ordersTableBody.innerHTML = "";

    if (!orders || orders.length === 0) {
      ordersTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;color:#777;">
              No recent orders found
            </td>
          </tr>
        `;
      return;
    }

    orders.forEach(order => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${order._id}</td>
          <td>${order.userEmail || order.userName || "Guest"}</td>
          <td>KES ${order.totalAmount?.toLocaleString() || "0"}</td>
          <td><span style="color: ${order.paymentStatus === 'Paid' ? '#90ee90' : '#ffaa00'}">${order.paymentStatus || "Pending"}</span></td>
          <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        `;
      ordersTableBody.appendChild(row);
    });
  }





  // ===== RENDER PAYMENTS TABLE =====
  function renderPayments(payments) {
    if (!paymentsTableBody) return;

    paymentsTableBody.innerHTML = "";

    if (!payments || payments.length === 0) {
      paymentsTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;color:#777;">
              No recent payments found
            </td>
          </tr>
        `;
      return;
    }

    payments.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${p._id}</td>
          <td>${p.transactionId || "N/A"}</td>
          <td>KES ${p.amount?.toLocaleString() || "0"}</td>
          <td><span style="color: #90ee90">${p.status}</span></td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
        `;
      paymentsTableBody.appendChild(row);
    });
  }




  // ===== ERROR DISPLAY =====
  function showError(tableBody, message) {
    if (!tableBody) return;
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#ff6b6b;">
          ⚠️ Error: ${message}
        </td>
      </tr>
    `;
  }




  // ===== LOGOUT HANDLER =====
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("👋 Admin logging out...");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("adminUser");
      window.location.href = "/a.login.html";
    });
  }





  // Also handle any logout buttons in other pages
  const allLogoutBtns = document.querySelectorAll(".btn-logout, #logoutBtn");
  allLogoutBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("👋 Admin logging out...");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("adminUser");
      window.location.href = "/a.login.html";
    });
  });




  // ===== INITIALIZE DASHBOARD =====
  fetchDashboardData();
});