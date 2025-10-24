// admin/js/admin-dashboard.js
let API_BASE_URL = null;

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const adminGreeting = document.getElementById("adminGreeting");

  const productCountEl = document.getElementById("productCount");
  const orderCountEl = document.getElementById("orderCount");
  const paymentCountEl = document.getElementById("paymentCount");

  const ordersTableBody = document.getElementById("ordersTableBody");
  const paymentsTableBody = document.getElementById("paymentsTableBody");

  // === STEP 1: Determine API base URL ===
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    API_BASE_URL = data.baseUrl || window.location.origin;
  } catch {
    console.warn("⚠️ Using localhost fallback");
    API_BASE_URL = "http://localhost:3000";
  }

  // === STEP 2: Get token and user ===
  const token = localStorage.getItem("adminToken");
  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (!token || !user || user.role !== "admin") {
    console.warn("⚠️ No valid admin session found, redirecting...");
    window.location.href = "/a.login.html";
    return;
  }

  // === STEP 3: Verify token ===
  try {
    const verifyRes = await fetch(`${API_BASE_URL}/api/users/verify-token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!verifyRes.ok) {
      throw new Error("Token verification failed");
    }

    const verifyData = await verifyRes.json();
    adminGreeting.textContent = `Welcome, ${verifyData.user?.name || "Admin"} 👋`;

  } catch (err) {
    console.error("❌ Token verification error:", err);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/a.login.html";
    return;
  }

  // === STEP 4: Fetch dashboard data ===
  async function fetchDashboardData() {
    try {
      // Fetch counts
      const [productsRes, ordersRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/orders/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/payments/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const paymentsData = await paymentsRes.json();

      productCountEl.textContent = productsData.count || 0;
      orderCountEl.textContent = ordersData.count || 0;
      paymentCountEl.textContent = paymentsData.count || 0;

      // Fetch recent orders and payments
      const recentOrdersRes = await fetch(`${API_BASE_URL}/api/orders/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recentPaymentsRes = await fetch(`${API_BASE_URL}/api/payments/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const recentOrders = await recentOrdersRes.json();
      const recentPayments = await recentPaymentsRes.json();

      renderOrders(recentOrders);
      renderPayments(recentPayments);

    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
    }
  }

  // === STEP 5: Render functions ===
  function renderOrders(orders) {
    ordersTableBody.innerHTML = "";

    if (!orders || orders.length === 0) {
      ordersTableBody.innerHTML =
        `<tr><td colspan="5" style="text-align:center; color:#777;">No recent orders</td></tr>`;
      return;
    }

    orders.forEach((order) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order._id || "-"}</td>
        <td>${order.userEmail || "N/A"}</td>
        <td>$${order.totalAmount?.toFixed(2) || "0.00"}</td>
        <td>${order.paymentStatus || "Pending"}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      `;
      ordersTableBody.appendChild(row);
    });
  }

  function renderPayments(payments) {
    paymentsTableBody.innerHTML = "";

    if (!payments || payments.length === 0) {
      paymentsTableBody.innerHTML =
        `<tr><td colspan="5" style="text-align:center; color:#777;">No recent payments</td></tr>`;
      return;
    }

    payments.forEach((p) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p._id || "-"}</td>
        <td>${p.transactionId || "N/A"}</td>
        <td>$${p.amount?.toFixed(2) || "0.00"}</td>
        <td>${p.status || "Pending"}</td>
        <td>${new Date(p.createdAt).toLocaleDateString()}</td>
      `;
      paymentsTableBody.appendChild(row);
    });
  }

  // === STEP 6: Logout handler ===
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/a.login.html";
  });

  // === STEP 7: Initialize dashboard ===
  fetchDashboardData();
});
