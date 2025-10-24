// public/js/adminLogout.js

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  // 🔒 Redirect to login if no token found (user not logged in)
  const token = localStorage.getItem("adminToken");
  if (!token && window.location.pathname.includes("a.dashboard.html")) {
    window.location.href = "/admin/a.login.html";
    return;
  }

  // 🧭 Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Clear stored login data
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      console.log("👋 Admin logged out");

      // Optional: small delay for animation / message
      setTimeout(() => {
        window.location.href = "/admin/a.login.html";
      }, 500);
    });
  } else {
    console.warn("⚠️ Logout button not found — add id='logoutBtn' to your logout element.");
  }
});
