// frontend/js/payment-success.js
// Function to check if payment was completed


async function checkPaymentStatus() {
  try {
    const res = await fetch("/api/payments/callbacks");
    const data = await res.json();

    if (data && data.data && data.data.length > 0) {
      const latest = data.data[data.data.length - 1];
      const resultCode = latest?.Body?.stkCallback?.ResultCode;

      if (resultCode === 0) {
        console.log("✅ Payment confirmed, redirecting...");
        sessionStorage.setItem("mpesa_payment_success", "true");
        window.location.href = "thank-you.html";
        return;
      }
    }
    console.log("⏳ Payment not yet confirmed, retrying...");
  } catch (err) {
    console.error("Error checking payment:", err);
  }

  // Retry after 3 seconds
  setTimeout(checkPaymentStatus, 3000);
}

// Start polling
checkPaymentStatus();
