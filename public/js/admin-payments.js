// ========================================
// Admin Payments Management JavaScript
// ========================================

const API_BASE = window.location.origin;
let allPayments = [];

// ========================================
// 1. FETCH & DISPLAY PAYMENTS
// ========================================
async function loadPayments() {
    try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`${API_BASE}/api/admin/payments`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to load payments");
        }

        allPayments = data.payments || [];
        renderPaymentsTable(allPayments);
        updateStatistics(allPayments);
    } catch (error) {
        console.error("Error loading payments:", error);
        showError("Failed to load payments. Please refresh the page.");
    }
}

function renderPaymentsTable(payments) {
    const tbody = document.getElementById("paymentsTableBody");

    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;color:#d4af37;">
          No payments found.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = payments
        .map(
            (payment) => {
                const statusColor =
                    payment.status === "Completed" ? "#90ee90" :
                        payment.status === "Failed" ? "#ff6b6b" :
                            payment.status === "Cancelled" ? "#ff9999" : "#ffaa00";

                return `
    <tr>
      <td>${payment._id.slice(-8)}</td>
      <td>${payment.phoneNumber || "N/A"}</td>
      <td>KES ${payment.amount.toLocaleString()}</td>
      <td>${payment.mpesaReceiptNumber || "-"}</td>
      <td>${payment.transactionType || "STK_PUSH"}</td>
      <td>
        <span class="status-badge" style="background-color: ${statusColor};">
          ${payment.status}
        </span>
      </td>
      <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
      <td class="actions">
        <button class="btn btn-view" onclick="viewPaymentDetails('${payment._id}')">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `;
            }
        )
        .join("");
}

// ========================================
// 2. UPDATE STATISTICS
// ========================================
function updateStatistics(payments) {
    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.status === "Completed").length;
    const totalRevenue = payments
        .filter(p => p.status === "Completed")
        .reduce((sum, p) => sum + p.amount, 0);

    document.getElementById("totalPayments").textContent = totalPayments;
    document.getElementById("completedPayments").textContent = completedPayments;
    document.getElementById("totalRevenue").textContent = `KES ${totalRevenue.toLocaleString()}`;
}

// ========================================
// 3. VIEW PAYMENT DETAILS
// ========================================
function viewPaymentDetails(paymentId) {
    const payment = allPayments.find(p => p._id === paymentId);

    if (!payment) {
        showError("Payment not found");
        return;
    }

    displayPaymentModal(payment);
}

function displayPaymentModal(payment) {
    const modal = document.getElementById("paymentDetailsModal");

    // Payment Info
    document.getElementById("modalPaymentId").textContent = payment._id;
    document.getElementById("modalPhoneNumber").textContent = payment.phoneNumber || "N/A";
    document.getElementById("modalAmount").textContent = `KES ${payment.amount.toLocaleString()}`;
    document.getElementById("modalStatus").textContent = payment.status;
    document.getElementById("modalTransactionType").textContent = payment.transactionType || "STK_PUSH";

    // M-Pesa Details
    document.getElementById("modalMpesaReceipt").textContent = payment.mpesaReceiptNumber || "N/A";
    document.getElementById("modalCheckoutRequestId").textContent = payment.checkoutRequestId || "N/A";
    document.getElementById("modalMerchantRequestId").textContent = payment.merchantRequestId || "N/A";
    document.getElementById("modalTransactionDate").textContent = payment.transactionDate || new Date(payment.createdAt).toLocaleString();

    // Result Info
    document.getElementById("modalResultCode").textContent = payment.resultCode !== undefined ? payment.resultCode : "N/A";
    document.getElementById("modalResultDesc").textContent = payment.resultDesc || "N/A";
    document.getElementById("modalCreatedAt").textContent = new Date(payment.createdAt).toLocaleString();

    modal.style.display = "flex";
}

function closePaymentDetailsModal() {
    document.getElementById("paymentDetailsModal").style.display = "none";
}

// ========================================
// 4. FILTER PAYMENTS
// ========================================
function filterPayments() {
    const statusFilter = document.getElementById("filterStatus").value;
    const methodFilter = document.getElementById("filterMethod").value;
    const searchQuery = document.getElementById("searchPayments").value.toLowerCase();

    let filtered = allPayments;

    // Filter by status
    if (statusFilter !== "all") {
        filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filter by method
    if (methodFilter !== "all") {
        filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    // Filter by search query (phone number, receipt number, or payment ID)
    if (searchQuery) {
        filtered = filtered.filter(payment => {
            const phone = payment.phoneNumber?.toLowerCase() || "";
            const receipt = payment.mpesaReceiptNumber?.toLowerCase() || "";
            const paymentId = payment._id.toLowerCase();
            return phone.includes(searchQuery) || receipt.includes(searchQuery) || paymentId.includes(searchQuery);
        });
    }

    renderPaymentsTable(filtered);
    updateStatistics(filtered);
}

// ========================================
// 5. UTILITY FUNCTIONS
// ========================================
function showError(message) {
    alert("❌ " + message);
}

// ========================================
// 6. INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadPayments();

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById("paymentDetailsModal");
        if (event.target === modal) {
            closePaymentDetailsModal();
        }
    };

    // Setup filter listeners
    const filterStatus = document.getElementById("filterStatus");
    const filterMethod = document.getElementById("filterMethod");
    const searchPayments = document.getElementById("searchPayments");

    if (filterStatus) {
        filterStatus.addEventListener("change", filterPayments);
    }

    if (filterMethod) {
        filterMethod.addEventListener("change", filterPayments);
    }

    if (searchPayments) {
        searchPayments.addEventListener("input", filterPayments);
    }

    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadPayments);
    }
});

// Make functions globally accessible
window.viewPaymentDetails = viewPaymentDetails;
window.closePaymentDetailsModal = closePaymentDetailsModal;
