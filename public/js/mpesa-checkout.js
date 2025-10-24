// public/js/mpesa-checkout.js

async function initiatePayment(phone, amount) {
  try {
    // Normalize Safaricom phone number format
    phone = phone.replace(/\s+/g, "").replace("+", "");
    if (phone.startsWith("07")) phone = "254" + phone.substring(1);
    else if (phone.startsWith("7")) phone = "254" + phone;
    else if (!phone.startsWith("254")) phone = "254" + phone;

    console.log("📲 Initiating STK Push for:", phone, "Amount:", amount);

    const response = await fetch("/api/payments/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, amount }),
    });

    let data = {};
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        data = {};
      }
    }

    console.log("✅ Payment response:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `HTTP ${response.status} - ${response.statusText}`
      );
    }

    // Handle successful response
    if (data.success || response.status === 200) {
      alert("✅ STK Push sent! Check your phone and complete the payment.");

      // Save a payment flag (for thank-you redirect validation)
      sessionStorage.setItem("mpesa_payment_success", "true");

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "thankyou.html";
      }, 4000);
    } else {
      throw new Error(data.message || "Payment request failed");
    }
  } catch (error) {
    console.error("❌ Payment initiation failed:", error);
    alert("⚠️ Error initiating payment. Check console for details.");
  }
}

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const payButton = document.getElementById("payButton");

  if (!payButton) {
    console.warn("⚠️ No #payButton found in HTML.");
    return;
  }

  payButton.addEventListener("click", (e) => {
    e.preventDefault();

    const phoneInput = document.getElementById("phone");
    const amountInput = document.getElementById("amount");

    if (!phoneInput || !amountInput) {
      alert("⚠️ Missing phone or amount fields in HTML.");
      return;
    }

    const phone = phoneInput.value.trim();
    const amount = amountInput.value.trim();

    if (!phone || !amount) {
      alert("Please enter both phone number and amount.");
      return;
    }

    // Basic Safaricom number validation
    if (!/^(\+?254|0)?7\d{8}$/.test(phone)) {
      alert("⚠️ Enter a valid Safaricom number (e.g. 07XXXXXXXX).");
      return;
    }

    initiatePayment(phone, amount);
  });
});
