// public/js/adminCheck.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("adminToken");
  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");
  const messageArea = document.getElementById("adminMessage");

  if (!token || !user || user.role !== "admin") {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/a.login.html";
    return;
  }

  let API_BASE_URL = null;
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    API_BASE_URL = data.baseUrl || window.location.origin || "http://localhost:3000";
  } catch (err) {
    API_BASE_URL = "http://localhost:3000";
  }

  try {
    const verifyRes = await fetch(`${API_BASE_URL}/api/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await verifyRes.json();
    if (!verifyRes.ok || !data.valid) throw new Error(data.message || "Invalid token");

    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl && user?.name) adminNameEl.textContent = user.name;
  } catch (err) {
    console.warn("Admin verification failed:", err);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    if (messageArea) {
      messageArea.textContent = "Session expired. Login again.";
      messageArea.className = "error";
    }
    setTimeout(() => (window.location.href = "/a.login.html"), 700);
  }
});
