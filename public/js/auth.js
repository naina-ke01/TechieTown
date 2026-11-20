// ========================================
// Customer Authentication JavaScript
// ========================================

var API_BASE = window.location.origin;

function getPostAuthDestination() {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (!requested) return "/products.html";

    try {
        const destination = new URL(requested, window.location.origin);
        if (destination.origin !== window.location.origin) return "/products.html";
        return `${destination.pathname}${destination.search}${destination.hash}`;
    } catch (error) {
        return "/products.html";
    }
}

// ========================================
// 1. LOGIN FUNCTIONALITY
// ========================================
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe")?.checked || false;

    const errorDiv = document.getElementById("loginError");
    const submitBtn = event.target.querySelector('button[type="submit"]');

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = "Logging in...";
        errorDiv.style.display = "none";

        const response = await fetch(`${API_BASE}/api/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Store user data and token
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
        }

        // Show success message
        showMessage(errorDiv, "✅ Login successful! Redirecting...", "success");

        // Return customers to the page that required authentication.
        setTimeout(() => {
            window.location.href = getPostAuthDestination();
        }, 1000);

    } catch (error) {
        console.error("Login error:", error);
        showMessage(errorDiv, error.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign In";
    }
}

// ========================================
// 2. SIGNUP FUNCTIONALITY
// ========================================
async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const errorDiv = document.getElementById("signupError");
    const submitBtn = event.target.querySelector('button[type="submit"]');

    try {
        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
        }

        // Validate password length
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating account...";
        errorDiv.style.display = "none";

        const response = await fetch(`${API_BASE}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        // Store user data and token
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Show success message
        showMessage(errorDiv, "✅ Account created successfully! Redirecting...", "success");

        // Return customers to the page that required authentication.
        setTimeout(() => {
            window.location.href = getPostAuthDestination();
        }, 1000);

    } catch (error) {
        console.error("Signup error:", error);
        showMessage(errorDiv, error.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
    }
}

// ========================================
// 3. LOGOUT FUNCTIONALITY
// ========================================
function logout() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    window.location.href = "/login.html";
}

// ========================================
// 4. CHECK AUTHENTICATION STATUS
// ========================================
function isAuthenticated() {
    const token = localStorage.getItem("userToken");
    const user = localStorage.getItem("user");
    return !!(token && user);
}

function getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
}

// ========================================
// 5. UPDATE NAVIGATION
// ========================================
function updateNavigation() {
    const authLinks = document.getElementById("authLinks");
    if (!authLinks) return;

    if (isAuthenticated()) {
        const user = getUser();
        authLinks.innerHTML = `
            <a href="/profile.html" class="user-profile" aria-label="Open your profile">
                <i class="fas fa-user-circle"></i>
                <span id="user-name">${(user.name || "Account").split(' ')[0]}</span>
            </a>
            <a href="#" onclick="logout()" class="nav-link" style="margin-left: 10px; font-size: 0.8rem; opacity: 0.7;">Logout</a>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="/login.html" class="nav-link">Sign In</a>
            <a href="/signup.html" class="nav-link btn-signup" id="signupNavLink">Sign Up</a>
        `;
        const signupLink = document.getElementById("signupNavLink");
        const next = new URLSearchParams(window.location.search).get("next");
        if (signupLink && next) signupLink.href += `?next=${encodeURIComponent(next)}`;
    }
}

// ========================================
// 6. UTILITY FUNCTIONS
// ========================================
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message message-${type}`;
    element.style.display = "block";
}

// ========================================
// 7. INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    // Update navigation on all pages
    updateNavigation();

    // Setup login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    // Setup signup form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }

    const switchAuthLink = document.querySelector(".auth-footer a");
    const next = new URLSearchParams(window.location.search).get("next");
    if (switchAuthLink && next) {
        const target = new URL(switchAuthLink.href, window.location.origin);
        target.searchParams.set("next", next);
        switchAuthLink.href = target.pathname + target.search;
    }

    // Auto-redirect if already logged in (for login/signup pages)
    if ((window.location.pathname.includes("login.html") || window.location.pathname.includes("signup.html")) && isAuthenticated()) {
        window.location.href = getPostAuthDestination();
    }
});

// Make functions globally accessible
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getUser = getUser;
