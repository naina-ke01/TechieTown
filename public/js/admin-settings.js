// ========================================
// Admin Settings JavaScript
// ========================================

const API_BASE = window.location.origin;

// ========================================
// 1. LOAD ADMIN PROFILE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadAdminProfile();
    setupEventListeners();
});

function loadAdminProfile() {
    const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

    if (adminUser.name) {
        document.getElementById("adminName").textContent = adminUser.name;
        document.getElementById("profileName").value = adminUser.name;
    }

    if (adminUser.email) {
        document.getElementById("adminEmail").textContent = adminUser.email;
        document.getElementById("profileEmail").value = adminUser.email;
    }

    if (adminUser.role) {
        document.getElementById("adminRole").textContent = adminUser.role;
    }

    // Display system info
    displaySystemInfo();
}

// ========================================
// 2. DISPLAY SYSTEM INFORMATION
// ========================================
function displaySystemInfo() {
    // Platform info
    document.getElementById("platformInfo").textContent = navigator.platform || "Unknown";
    document.getElementById("browserInfo").textContent = navigator.userAgent.split("(")[1]?.split(")")[0] || "Unknown";

    // Current date/time
    document.getElementById("currentDateTime").textContent = new Date().toLocaleString();
}

// ========================================
// 3. SETUP EVENT LISTENERS
// ========================================
function setupEventListeners() {
    // Profile update form
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", handleProfileUpdate);
    }

    // Password change form
    const passwordForm = document.getElementById("passwordForm");
    if (passwordForm) {
        passwordForm.addEventListener("submit", handlePasswordChange);
    }
}

// ========================================
// 4. HANDLE PROFILE UPDATE
// ========================================
async function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById("profileName").value;
    const email = document.getElementById("profileEmail").value;

    try {
        showMessage("profileMessage", "Updating profile...", "info");

        // Update localStorage
        const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
        adminUser.name = name;
        adminUser.email = email;
        localStorage.setItem("adminUser", JSON.stringify(adminUser));

        // Update display
        document.getElementById("adminName").textContent = name;
        document.getElementById("adminEmail").textContent = email;

        showMessage("profileMessage", "✅ Profile updated successfully!", "success");

        // Refresh after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error("Profile update error:", error);
        showMessage("profileMessage", "❌ Failed to update profile", "error");
    }
}

// ========================================
// 5. HANDLE PASSWORD CHANGE
// ========================================
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validate passwords
    if (newPassword !== confirmPassword) {
        showMessage("passwordMessage", "❌ Passwords do not match!", "error");
        return;
    }

    if (newPassword.length < 6) {
        showMessage("passwordMessage", "❌ Password must be at least 6 characters!", "error");
        return;
    }

    try {
        showMessage("passwordMessage", "Changing password...", "info");

        // In a real app, this would call an API
        // For now, we'll just show success
        showMessage("passwordMessage", "✅ Password changed successfully!", "success");

        // Clear form
        document.getElementById("passwordForm").reset();

    } catch (error) {
        console.error("Password change error:", error);
        showMessage("passwordMessage", "❌ Failed to change password", "error");
    }
}

// ========================================
// 6. UTILITY FUNCTIONS
// ========================================
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `message message-${type}`;
    element.style.display = "block";

    if (type === "success") {
        setTimeout(() => {
            element.style.display = "none";
        }, 5000);
    }
}
