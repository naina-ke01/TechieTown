let API_BASE_URL = null;

document.addEventListener("DOMContentLoaded", async () => {
  const payButton = document.getElementById("payButton");
  const mpesaForm = document.getElementById("mpesa-form");
  const messageDiv = document.createElement("div");
  mpesaForm.appendChild(messageDiv);
  const token = localStorage.getItem("userToken");
  if (!token) {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
    return;
  }
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };


  // ---Get Backend URL ---
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Failed to fetch API config");
    const config = await res.json();
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    API_BASE_URL = isLocalHost ? window.location.origin : (config.baseUrl || window.location.origin);
    console.log("✅ API Base URL:", API_BASE_URL);
  } catch (err) {
    console.error("❌ Could not get API config:", err);
    messageDiv.textContent = "Error: Could not connect to the server.";
    messageDiv.className = "error-message";
    API_BASE_URL = window.location.origin;
  }

  try {
    const profileResponse = await fetch(`${API_BASE_URL}/api/users/profile`, { headers: authHeaders });
    const profileData = await profileResponse.json();
    if (!profileResponse.ok) throw new Error(profileData.message || "Please sign in again.");
    document.getElementById("name").value = profileData.user.name || "";
    document.getElementById("email").value = profileData.user.email || "";
    document.getElementById("phone").value = profileData.user.phoneNumber || "";
  } catch (error) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login.html?next=${encodeURIComponent(next)}`);
    return;
  }

  // --- Payment Initiation Logic ---
  const initiatePayment = async () => {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const amountInput = document.getElementById("amount");
    const addressInput = document.getElementById("address");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const amount = amountInput.value;
    const address = addressInput.value.trim();

    if (!name || !email || !phone || !address) {
      messageDiv.textContent = "Please fill in all required fields.";
      messageDiv.className = "error-message";
      return;
    }

    if (!/^(07|01)\d{8}$/.test(phone)) {
      messageDiv.textContent = "Please enter a valid phone number (e.g., 0712345678).";
      messageDiv.className = "error-message";
      return;
    }

    payButton.disabled = true;
    payButton.textContent = "Processing...";
    messageDiv.textContent = "Creating order...";
    messageDiv.className = "info-message";

    try {
      // 1. Save account details
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ name, email, phoneNumber: phone }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || "Failed to save customer details");
      localStorage.setItem("user", JSON.stringify(profileData.user));

      // 2. Create order for the signed-in customer
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      if (cart.length === 0) throw new Error("Your cart is empty");

      const orderProducts = cart.map(item => ({
        productId: item.id || item._id, // Handle both id formats
        quantity: item.quantity
      }));

      const orderRes = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          products: orderProducts,
          shippingAddress: address,
          paymentMethod: "M-Pesa"
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || "Failed to create order");

      const orderId = orderData.order.id;

      // 3. Initiate STK Push
      messageDiv.textContent = "Check your phone to complete the payment...";
      const paymentRes = await fetch(`${API_BASE_URL}/api/payments/stkpush`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          phone,
          amount: Number(amount),
          orderId,
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.message || "Payment request failed.");
      }

      // On success, redirect to a thank you page
      messageDiv.textContent = "✅ Payment initiated successfully! Redirecting...";
      messageDiv.className = "success-message";

      // Clear cart after successful initiation
      localStorage.removeItem("cart");
      sessionStorage.setItem("lastOrderId", orderId);
      sessionStorage.setItem("lastPaymentStatus", "pending");
      sessionStorage.setItem("mpesa_payment_success", "true");

      setTimeout(() => {
        window.location.href = "/thank-you.html";
      }, 2000);

    } catch (error) {
      console.error("❌ Process failed:", error);
      messageDiv.textContent = `⚠️ Error: ${error.message}`;
      messageDiv.className = "error-message";
      payButton.disabled = false;
      payButton.textContent = "Pay with M-Pesa";
    }
  };

  if (payButton) {
    payButton.addEventListener("click", initiatePayment);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  total = Math.round(Number(total));

  const amountInput = document.getElementById("amount");
  if (amountInput) {
    // Set a minimum amount of 1 for testing purposes if cart is empty
    amountInput.value = total > 0 ? total : 1;
  }
});