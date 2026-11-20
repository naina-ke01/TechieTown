var API_BASE = window.location.origin;

document.addEventListener('DOMContentLoaded', async () => {
    const main = document.getElementById('product-container');

    // 1. Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        main.innerHTML = '<div style="text-align:center; padding:100px; color:#ff6b6b;"><h2>Product ID is missing</h2><a href="products.html" style="color:#d4af37;">Back to Products</a></div>';
        return;
    }

    // 2. Fetch Product Data
    try {
        const response = await fetch(`${API_BASE}/api/products/${productId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Product not found');
        }

        renderProductDetail(data.product);
        loadRelatedProducts(data.product.category, productId);
    } catch (error) {
        console.error('Error fetching product:', error);
        main.innerHTML = `<div style="text-align:center; padding:100px; color:#ff6b6b;"><h2>${error.message}</h2><a href="products.html" style="color:#d4af37;">Back to Products</a></div>`;
    }
});

async function loadRelatedProducts(category, currentId) {
    const grid = document.getElementById('related-grid');
    try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data = await response.json();

        if (!data.success) return;

        // Filter: same category, not current product, limit 4
        const related = data.products
            .filter(p => p._id !== currentId)
            .sort(() => 0.5 - Math.random()) // Shuffle
            .slice(0, 4);

        if (related.length === 0) {
            document.querySelector('.related-products').style.display = 'none';
            return;
        }

        grid.innerHTML = related.map(product => {
            const imageUrl = product.image ? `${API_BASE}${product.image}` : 'myImg/placeholder.jpg';
            return `
                <div class="product-card">
                    <a href="product-view.html?id=${product._id}">
                        <img src="${imageUrl}" alt="${product.name}">
                    </a>
                    <a href="product-view.html?id=${product._id}">
                        <h3>${product.name}</h3>
                    </a>
                    <p>KES ${product.price.toLocaleString()}</p>
                    <button class="btn add-to-cart" 
                        data-id="${product._id}" 
                        data-name="${product.name}" 
                        data-price="${product.price}"
                        data-image="${imageUrl}">
                        Add to Cart
                    </button>
                </div>
            `;
        }).join('');

        // Attach listeners to new "Add to Cart" buttons
        grid.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof addToCart === 'function') {
                    addToCart(btn);
                }
            });
        });

    } catch (err) {
        console.error('Failed to load related products:', err);
    }
}

function renderProductDetail(product) {
    const main = document.getElementById('product-container');
    const imageUrl = product.image ? `${API_BASE}${product.image}` : 'myImg/placeholder.jpg';

    main.innerHTML = `
        <div class="product-detail-container">
            <div class="product-image-section">
                <div class="main-image-wrapper">
                    <img src="${imageUrl}" alt="${product.name}" id="main-product-image">
                </div>
            </div>

            <div class="product-info-section">
                <div>
                    <span class="product-brand">${product.brand || 'TechieTown Exclusive'}</span>
                    <h1 class="product-title">${product.name}</h1>
                </div>

                <div class="product-price">KES ${product.price.toLocaleString()}</div>

                <div class="product-meta">
                    <div class="meta-item">
                        <span>Category:</span>
                        <span>${product.category || 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <span>Availability:</span>
                        <span style="color: ${product.stock > 0 ? '#90ee90' : '#ff6b6b'}">
                            ${product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                        </span>
                    </div>
                </div>

                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description || 'No description available for this product.'}</p>
                </div>

                <div class="action-buttons">
                    <button class="btn-add-cart" id="addToCartBtn" 
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> 
                        ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Attach Add to Cart listener
    const cartBtn = document.getElementById('addToCartBtn');
    if (cartBtn && product.stock > 0) {
        cartBtn.addEventListener('click', () => {
            // This relies on js/cart.js global functions/variables
            if (typeof addToCart === 'function') {
                const mockBtn = document.createElement('button');
                mockBtn.dataset.id = product._id;
                mockBtn.dataset.name = product.name;
                mockBtn.dataset.price = product.price;
                mockBtn.dataset.image = imageUrl;
                addToCart(mockBtn);
            } else {
                alert('Cart functionality not loaded');
            }
        });
    }
}
