const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : "https://annelle-climatic-antwan.ngrok-free.dev/api";

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Handle fetch responses
async function handleResponse(res) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || data?.message || "Unexpected error";
    throw new Error(message);
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

// Products API (Admin Protected)
export const productsAPI = {
  fetchProducts: async () => {
    const res = await fetch(`${API_BASE}/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  createProduct: async (payload) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
  updateProduct: async (id, payload) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// Orders API (Admin Protected)
export const ordersAPI = {
  fetchOrders: async () => {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  fetchOrderById: async (id) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// Payments API (Admin Protected)
export const paymentsAPI = {
  fetchPayments: async () => {
    const res = await fetch(`${API_BASE}/payments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  startStkPush: async (phone, amount, orderId) => {
    const res = await fetch(`${API_BASE}/payments/stkpush`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, amount, orderId }),
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
    return data;
  } else {
    throw new Error("Access denied: Admins only.");
  }
}

export function adminLogout() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem("adminToken");
}
