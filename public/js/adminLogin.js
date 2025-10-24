// public/js/adminLogin.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const messageBox = document.getElementById("message");
  const loadingBox = document.getElementById("loading");

  if (!loginForm) {
    console.error("❌ Admin login form not found");
    return;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      messageBox.textContent = "Please enter both email and password.";
      messageBox.className = "error-message";
      return;
    }

    // Reset messages
    messageBox.textContent = "";
    loadingBox.style.display = "block";
    loadingBox.textContent = "Logging in…";

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ Store token and user
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      console.log("✅ Admin login successful");

      loadingBox.textContent = "Login successful! Redirecting…";
      loadingBox.style.backgroundColor = "#1a2a1a";

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/admin/a.dashboard.html";
      }, 1200);

    } catch (error) {
      console.error("❌ Login error:", error);
      messageBox.textContent = `Login failed: ${error.message}`;
      messageBox.className = "error-message";
    } finally {
      loadingBox.style.display = "none";
    }
  });
});

// Optional auto-redirect if already logged in
const token = localStorage.getItem("adminToken");
if (token && window.location.pathname.includes("a.login.html")) {
  window.location.href = "/admin/a.dashboard.html";
}
