document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const messageDiv = document.getElementById("message");
  const loadingDiv = document.getElementById("loading");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageDiv.textContent = "";
    loadingDiv.style.display = "block";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      messageDiv.textContent = "Please enter email and password.";
      loadingDiv.style.display = "none";
      return;
    }

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📥 Login Response Data:", data);
      loadingDiv.style.display = "none";

      if (!res.ok) {
        console.error("❌ Login Failed:", data.message);
        messageDiv.textContent = data.message || "Login failed";
        return;
      }

      if (!data.token) {
        console.warn("⚠️ Token missing in login response!");
      }

      // Save user in localStorage (or session) for dashboard access
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      localStorage.setItem("isAdminLoggedIn", "true");
      localStorage.setItem("adminToken", data.token); // Save the token for API requests
      // Redirect to dashboard
      window.location.href = '/admin/a.dashboard.html';
    } catch (err) {
      console.error("❌ Login error:", err);
      messageDiv.textContent = "Login failed. Please try again.";
      loadingDiv.style.display = "none";
    }
  });
});
