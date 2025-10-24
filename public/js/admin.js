import { productsAPI, ordersAPI, paymentsAPI } from "./api.js";

const NGROK_URL = "https://annelle-climatic-antwan.ngrok-free.dev";
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
  alert("Session expired or unauthorized. Redirecting to login...");
  window.location.href = "/admin/a.login.html";
}

// Fetch raw dashboard data from server
async function fetchDashboardSummary() {
  const res = await fetch(`${NGROK_URL}/api/admin/a.dashboard`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Dashboard fetch failed:", errorData);
    throw new Error(errorData.message || "Unauthorized");
  }

  return res.json();
}

async function loadDashboard() {
  try {
    const summary = await fetchDashboardSummary();

    // Update counts
    document.getElementById("productsCount").textContent = summary.products || 0;
    document.getElementById("ordersCount").textContent = summary.orders || 0;
    document.getElementById("paymentsCount").textContent = summary.payments || 0;

    renderOrdersTable(summary.recentOrders);
    // You could renderPaymentsTable(summary.paymentsList) here if needed
  } catch (error) {
    console.error("❌ Error loading dashboard:", error.message || error);
    alert("⚠️ Failed to load dashboard. You might be logged out.");
    window.location.href = "/admin/a.login.html";
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody || !orders) return;

  tbody.innerHTML = "";
  orders.forEach(order => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order._id}</td>
      <td>${order.customer || "Guest"}</td>
      <td>KES ${order.amount?.toLocaleString() || 0}</td>
      <td>${order.status || "Pending"}</td>
      <td>${new Date(order.date).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", loadDashboard);
