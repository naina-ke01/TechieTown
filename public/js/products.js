var API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.querySelector('.product-grid');
  const filterInput = document.getElementById('product-filter');

  let allProducts = [];

  // ========================================
  // FETCH PRODUCTS FROM API
  // ========================================
  async function loadProducts() {
    try {
      // Show loading state
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#d4af37;">
          <i class="fas fa-spinner fa-spin fa-3x"></i>
          <p style="margin-top:20px;">Loading products...</p>
        </div>
      `;

      const response = await fetch(`${API_BASE}/api/products`);

      if (!response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      allProducts = data.products || [];

      if (allProducts.length === 0) {
        productGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#999;">
            <i class="fas fa-box-open fa-3x"></i>
            <p style="margin-top:20px;">No products available at the moment.</p>
          </div>
        `;
        return;
      }

      renderProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ff6b6b;">
          <i class="fas fa-exclamation-triangle fa-3x"></i>
          <p style="margin-top:20px;">Failed to load products. Please try again later.</p>
          <button onclick="location.reload()" style="margin-top:15px; padding:10px 20px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">
            Retry
          </button>
        </div>
      `;
    }
  }

  // ========================================
  // RENDER PRODUCTS
  // ========================================
  function renderProducts(filter = "") {
    productGrid.innerHTML = "";

    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0 && filter) {
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#999;">
          <i class="fas fa-search fa-3x"></i>
          <p style="margin-top:20px;">No products found matching "${filter}"</p>
        </div>
      `;
      return;
    }

    filtered.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card glass-card";

      const imageUrl = product.image
        ? `${API_BASE}${product.image}`
        : 'myImg/placeholder.jpg';

      card.innerHTML = `
        <div class="card-image-wrapper" style="overflow: hidden; border-radius: 12px; margin-bottom: 20px;">
          <a href="product-view.html?id=${product._id}">
            <img src="${imageUrl}" alt="${product.name}" style="width: 100%; aspect-ratio: 1; object-fit: cover; transition: transform 0.5s ease;">
          </a>
        </div>
        <div class="card-content">
          <a href="product-view.html?id=${product._id}" style="text-decoration: none;">
            <h3 style="margin-bottom: 8px; font-size: 1.25rem;">${product.name}</h3>
          </a>
          <div class="price" style="color: var(--accent-gold); font-weight: 700; font-size: 1.2rem; margin-bottom: 20px;">
            KES ${product.price.toLocaleString()}
          </div>
          ${product.stock > 0
          ? `<button class="btn add-to-cart" 
                style="width: 100%;"
                data-id="${product._id}" 
                data-name="${product.name}" 
                data-price="${product.price}"
                data-image="${imageUrl}">
                Add to Cart
              </button>`
          : `<button class="btn" disabled style="width: 100%; background: #222; color: #666; cursor: not-allowed; border: 1px solid #333;">
                Out of Stock
              </button>`
        }
        </div>
      `;
      productGrid.appendChild(card);
    });

    // Attach event listeners for cart
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', () => addToCart(button));
    });
  }

  // ========================================
  // SEARCH/FILTER FUNCTIONALITY
  // ========================================
  filterInput.addEventListener("input", () => {
    renderProducts(filterInput.value);
  });

  // ========================================
  // INITIALIZE
  // ========================================
  loadProducts();
});
