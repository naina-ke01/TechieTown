// ========================================
// Admin Products Management JavaScript
// ========================================

const API_BASE = window.location.origin;
let currentEditingProductId = null;

// ========================================
// 1. FETCH & DISPLAY PRODUCTS
// ========================================
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/products`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to load products");
        }

        renderProductsTable(data.products);
    } catch (error) {
        console.error("Error loading products:", error);
        showError("Failed to load products. Please refresh the page.");
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById("productsTableBody");

    if (!products || products.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#d4af37;">
          No products found. Click "Add New Product" to create one.
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = products
        .map(
            (product) => `
    <tr>
      <td>${product._id.slice(-6)}</td>
      <td>
        ${product.image
                    ? `<img src="${API_BASE}${product.image}" alt="${product.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
                    : "No image"
                }
      </td>
      <td>${product.name}</td>
      <td>${product.category || "N/A"}</td>
      <td>KES ${product.price.toLocaleString()}</td>
      <td>${product.stock || 0}</td>
      <td class="actions">
        <button class="btn btn-edit" onclick="openEditModal('${product._id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-delete" onclick="deleteProduct('${product._id
                }')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
        )
        .join("");
}

// ========================================
// 2. OPEN ADD/EDIT MODAL
// ========================================
function openAddModal() {
    currentEditingProductId = null;
    document.getElementById("modalTitle").textContent = "Add New Product";
    document.getElementById("productForm").reset();
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("productModal").style.display = "flex";
}

async function openEditModal(productId) {
    try {
        const response = await fetch(`${API_BASE}/api/admin/products`);
        const data = await response.json();
        const product = data.products.find((p) => p._id === productId);

        if (!product) {
            showError("Product not found");
            return;
        }

        currentEditingProductId = productId;
        document.getElementById("modalTitle").textContent = "Edit Product";
        document.getElementById("productName").value = product.name;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productCategory").value = product.category || "";
        document.getElementById("productBrand").value = product.brand || "";
        document.getElementById("productStock").value = product.stock || 0;
        document.getElementById("productDescription").value =
            product.description || "";

        // Show existing image preview
        if (product.image) {
            const preview = document.getElementById("imagePreview");
            preview.src = `${API_BASE}${product.image}`;
            preview.style.display = "block";
        }

        document.getElementById("productModal").style.display = "flex";
    } catch (error) {
        console.error("Error loading product:", error);
        showError("Failed to load product details");
    }
}

function closeModal() {
    document.getElementById("productModal").style.display = "none";
    currentEditingProductId = null;
}

// ========================================
// 3. IMAGE UPLOAD PREVIEW
// ========================================
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById("imagePreview");
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

// ========================================
// 4. SAVE PRODUCT (ADD OR UPDATE)
// ========================================
async function saveProduct(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("productName").value);
    formData.append("price", document.getElementById("productPrice").value);
    formData.append("category", document.getElementById("productCategory").value);
    formData.append("brand", document.getElementById("productBrand").value);
    formData.append("stock", document.getElementById("productStock").value);
    formData.append(
        "description",
        document.getElementById("productDescription").value
    );

    const imageFile = document.getElementById("productImage").files[0];
    if (imageFile) {
        formData.append("image", imageFile);
    }

    try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Please login first");
            window.location.href = "/a.login.html";
            return;
        }

        const url = currentEditingProductId
            ? `${API_BASE}/api/products/${currentEditingProductId}`
            : `${API_BASE}/api/products`;

        const method = currentEditingProductId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || "Failed to save product");
        }

        showSuccess(
            currentEditingProductId
                ? "Product updated successfully!"
                : "Product added successfully!"
        );
        closeModal();
        loadProducts();
    } catch (error) {
        console.error("Error saving product:", error);
        showError(error.message || "Failed to save product");
    }
}

// ========================================
// 5. DELETE PRODUCT
// ========================================
async function deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            showError("Please login first");
            window.location.href = "/a.login.html";
            return;
        }

        const response = await fetch(`${API_BASE}/api/products/${productId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete product");
        }

        showSuccess("Product deleted successfully!");
        loadProducts();
    } catch (error) {
        console.error("Error deleting product:", error);
        showError(error.message || "Failed to delete product");
    }
}

// ========================================
// 6. UTILITY FUNCTIONS
// ========================================
function showError(message) {
    alert("❌ " + message);
}

function showSuccess(message) {
    alert("✅ " + message);
}

// ========================================
// 7. INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById("productModal");
        if (event.target === modal) {
            closeModal();
        }
    };
});

// Make functions globally accessible
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.previewImage = previewImage;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
