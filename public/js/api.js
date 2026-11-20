// public/js/api.js

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : "https://annelle-climatic-antwan.ngrok-free.dev/api";


// Get auth headers
function getAuthHeaders() {
  // Use 'adminToken' for admin endpoints
  const token = localStorage.getItem("adminToken"); 
  return {
    "Content-Type": "application/json",
    // ONLY include Authorization header if a token exists
    ...(token && { Authorization: `Bearer ${token}` }), 
  };
}


// Handle fetch responses
async function handleResponse(res) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.message || "Unexpected error";
    // Throw error with HTTP status for better debugging in admin-common.js
    throw new Error(`[HTTP ${res.status}] ${message}`); 
  }

  return data;
}


// Auth API ----------------
export const authAPI = {
  verifyToken: async () => {
    const res = await fetch(`${API_BASE}/users/verify-token`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};


// Admin Products API
export const productsAPI = {
  fetchProducts: async () => {
    // Assuming backend endpoint is /api/products for all products
    const res = await fetch(`${API_BASE}/products`, { 
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  // Add other product methods here (addProduct, deleteProduct, etc.)
};

// Admin Orders API (NEW)
export const ordersAPI = {
  fetchOrders: async () => {
    // Assuming backend endpoint is /api/admin/orders
    const res = await fetch(`${API_BASE}/admin/orders`, { 
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// Admin Customers API (NEW)
export const customersAPI = {
  fetchCustomers: async () => {
    // Assuming backend endpoint is /api/admin/customers
    const res = await fetch(`${API_BASE}/admin/customers`, { 
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// Admin Payments API (NEW)
export const paymentsAPI = {
  fetchPayments: async () => {
    // Assuming backend endpoint is /api/admin/payments
    const res = await fetch(`${API_BASE}/admin/payments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// Admin Dashboard API
export const adminAPI = {
  fetchDashboard: async () => {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};


// Admin Authentication
export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);

  if (data.token && data.user?.role === "admin") {
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminUser", JSON.stringify(data.user));
  } else if (data.user?.role !== "admin") {
    throw new Error("User is not authorized as an admin.");
  }

  return data;
}