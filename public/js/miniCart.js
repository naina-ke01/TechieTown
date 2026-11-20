// ========== CART STORAGE ==========
let cart = JSON.parse(localStorage.getItem("cart")) || [];



// ========== Save Cart ==========
function saveCart() {
    try {
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        renderMiniCart();

        const { subtotal } = getCartTotals();
        localStorage.setItem("cartTotal", subtotal.toFixed(2));
    } catch (error) {
        handleCartError(error);
    }
}



// ===== Debounced save helper =====
let _saveCartTimeout = null;
function scheduleSaveCart(immediate = false, delay = 120) {
    if (immediate) {
        if (_saveCartTimeout) {
            clearTimeout(_saveCartTimeout);
            _saveCartTimeout = null;
        }
        saveCart();
        return;
    }

    if (_saveCartTimeout) clearTimeout(_saveCartTimeout);
    _saveCartTimeout = setTimeout(() => {
        saveCart();
        _saveCartTimeout = null;
    }, delay);
}




// ========== Cart UI States ==========
function setCartLoading(loading) {
    const miniCart = document.getElementById("mini-cart");
    if (miniCart) {
        const footer = miniCart.querySelector(".mini-cart-footer");
        const items = miniCart.querySelector("#mini-cart-items");

        if (loading) {
            miniCart.classList.add("loading");
            if (footer) footer.style.opacity = '0.5';
            if (items) items.style.opacity = '0.5';
        } else {
            miniCart.classList.remove("loading");
            if (footer) footer.style.opacity = '1';
            if (items) items.style.opacity = '1';

            // Smooth transition back
            if (footer) footer.style.transition = 'opacity 0.3s ease';
            if (items) items.style.transition = 'opacity 0.3s ease';
        }
    }
}


function handleCartError(error) {
    console.error('Cart error:', error);
    showToast('Something went wrong. Please try again.', 'error');
}




// ========== Cart Visibility ==========
function showCart() {
    // Prevent mini-cart from opening while on the full cart page
    if (window.location.pathname.includes('cart.html')) {
        return;
    }

    const miniCart = document.getElementById("mini-cart");
    const overlay = document.querySelector(".overlay");
    if (miniCart && overlay) {
        // Prevent re-triggering animations if already open
        if (document.body.classList.contains('overlay-active')) return;

        // Show overlay first for a smooth transition
        overlay.style.display = 'block';
        // Use rAF to ensure the display change is applied before adding class
        requestAnimationFrame(() => overlay.classList.add("show"));

        // Then show the cart by toggling the show class (CSS handles the transition)
        setTimeout(() => {
            miniCart.classList.add('show');
            document.body.classList.add('overlay-active');

            // Accessibility: mark cart toggle as expanded
            const cartToggle = document.getElementById('cart-toggle');
            if (cartToggle) cartToggle.setAttribute('aria-expanded', 'true');

            // Header animation
            const header = document.querySelector('.site-header');
            if (header) header.classList.add('cart-open');

            // On wide screens, push the main content
            if (window.innerWidth >= 900) {
                document.body.classList.add('push-cart');
            }
        }, 50);
    }
}

function hideCart() {
    const miniCart = document.getElementById("mini-cart");
    const overlay = document.querySelector(".overlay");
    if (miniCart && overlay) {
        // Remove cart show class to trigger CSS transition
        miniCart.classList.remove('show');

        // Then hide overlay with a slight delay so transitions look smooth
        setTimeout(() => {
            overlay.classList.remove("show");
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.classList.remove('overlay-active');

                // Accessibility: mark cart toggle as collapsed
                const cartToggle = document.getElementById('cart-toggle');
                if (cartToggle) cartToggle.setAttribute('aria-expanded', 'false');

                // Remove header animation
                const header = document.querySelector('.site-header');
                if (header) header.classList.remove('cart-open');

                // Remove push class
                document.body.classList.remove('push-cart');
            }, 300); // Match the overlay transition duration
        }, 50);
    }
}

function toggleCart() {
    // Use the overlay-active body class as the source of truth for open state
    const isOpen = document.body.classList.contains('overlay-active');
    if (isOpen) {
        hideCart();
    } else {
        showCart();
    }
}




// ========== Helpers ==========
function formatPrice(price) {
    return `KSh ${Number(price).toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}




// ========== Cart Item Management ==========
function addToCart(button) {
    try {
        setCartLoading(true);
        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = parseFloat(button.dataset.price);
        // Prefer an explicit data-image attribute, otherwise try to read the product card <img>
        let image = button.dataset.image || '';
        if (!image) {
            const card = button.closest('.product-card');
            const imgEl = card ? card.querySelector('img') : null;
            if (imgEl) {
                image = imgEl.getAttribute('src') || imgEl.src || '';
            }
        }

        if (!id || !name || isNaN(price)) {
            throw new Error('Invalid product data');
        }

        // Ensure image is an absolute URL if it starts with /uploads
        if (image && image.startsWith('/uploads')) {
            image = window.location.origin + image;
        }

        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
            // If the existing entry is missing an image, fill it from the button/card
            if (!existing.image && image) existing.image = image;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }

        // For add-to-cart we persist immediately so user sees the change right away
        saveCart();
        showToast(`${name} added to cart`, 'success');
    } catch (error) {
        handleCartError(error);
    } finally {
        setCartLoading(false);
    }
}

function updateItemQuantity(id, delta) {
    try {
        setCartLoading(true);
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity = Math.max(0, item.quantity + delta);
            if (item.quantity === 0) {
                removeFromCart(id, true); // Pass true to keep cart open
            } else {
                // Debounce frequent quantity updates to avoid many writes
                scheduleSaveCart(false);
                showToast(`Updated ${item.name} quantity`, 'info');
                showCart(); // Ensure cart stays open
            }
        }
    } catch (error) {
        handleCartError(error);
    } finally {
        setCartLoading(false);
    }
}




// ========== Clear Cart ==========
function clearCart() {
    cart = [];
    saveCart();
    showToast("Cart cleared");
}

// ✅ NEW: Clear cart after successful payment
function clearCartAfterPayment() {
    cart = [];
    localStorage.removeItem("cart");
    localStorage.removeItem("cartTotal");
    updateCartCount();
    console.log("✅ Cart cleared after successful payment");
}




// ========== Totals ==========
function getCartTotals() {
    let subtotal = 0, itemCount = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
    });
    return { subtotal, itemCount };
}




// ========== Cart Count ==========
function updateCartCount() {
    const countElement = document.getElementById("cart-count");
    if (!countElement) return;
    const { itemCount } = getCartTotals();
    countElement.textContent = itemCount;
}




// ========== Mini Cart Rendering ==========
function renderMiniCart() {
    const miniCart = document.getElementById("mini-cart");
    if (!miniCart) return;

    const itemsContainer = miniCart.querySelector("#mini-cart-items");
    const totalContainer = miniCart.querySelector("#mini-cart-total");
    const clearCartBtn = miniCart.querySelector("#clear-cart");
    const checkoutBtn = miniCart.querySelector(".checkout-btn");

    itemsContainer.innerHTML = "";
    const { subtotal, itemCount } = getCartTotals();

    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <li class="empty-cart">
                <div style="text-align: center; padding: 2rem 1rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
                    <p style="margin: 0; color: #666;">Your cart is empty</p>
                    <p style="margin: 0.5rem 0; color: #888; font-size: 0.9rem;">
                        Add items from our products page
                    </p>
                </div>
            </li>`;
        totalContainer.textContent = formatPrice(0);

        // Disable checkout and clear buttons
        if (checkoutBtn) checkoutBtn.style.opacity = '0.5';
        if (clearCartBtn) clearCartBtn.style.opacity = '0.5';
        return;
    }




    // Enable buttons
    if (checkoutBtn) checkoutBtn.style.opacity = '1';
    if (clearCartBtn) clearCartBtn.style.opacity = '1';



    // Preserve scroll position so re-render doesn't jump to top
    const previousScroll = itemsContainer.scrollTop || 0;



    // Render items with fade-in animation and thumbnail layout (thumb | details | controls)
    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "mini-cart-item";
        li.style.opacity = '0';
        li.style.transform = 'translateX(20px)';
        li.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        li.innerHTML = `
            <img src="${item.image || 'myImg/placeholder.jpg'}" alt="${item.name}" class="item-thumb" />
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
            <div class="item-controls">
                <button class="quantity-btn minus" data-id="${item.id}" data-action="decrease" ${item.quantity === 1 ? 'disabled aria-disabled="true" style="opacity:0.5;"' : ''}>-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}" data-action="increase">+</button>
                <button class="remove-btn" data-id="${item.id}" data-action="remove" title="Remove item">🗑️</button>
            </div>
        `;
        itemsContainer.appendChild(li);

        // Fade in items sequentially using CSS transition-delay (avoids many timers)
        li.style.transitionDelay = `${50 * index}ms`;
        // Ensure styles are applied in the next frame then start the transition
        requestAnimationFrame(() => {
            li.style.opacity = '1';
            li.style.transform = 'translateX(0)';
        });
    });



    // Restore scroll position (clamped to container height)
    const maxScroll = itemsContainer.scrollHeight - itemsContainer.clientHeight;
    itemsContainer.scrollTop = Math.min(previousScroll, Math.max(0, maxScroll));

    totalContainer.textContent = formatPrice(subtotal);

    if (clearCartBtn) {
        clearCartBtn.onclick = clearCart;
    }
}

function showToast(message, type = 'info') {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }



    // Remove any existing classes and add base class
    toast.className = 'toast';



    // Add type-specific class
    if (type === 'error') {
        toast.classList.add('error');
        toast.innerHTML = `❌ ${message}`;
    } else if (type === 'success') {
        toast.classList.add('success');
        toast.innerHTML = `✅ ${message}`;
    } else {
        toast.innerHTML = `ℹ️ ${message}`;
    }




    // Show toast
    toast.classList.remove('hidden');



    // Hide after delay
    setTimeout(() => {
        toast.classList.add('hidden');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
// (consolidated toast above)


// ========== Remove from Cart ==========
function removeFromCart(id, keepOpen = true) {
    const index = cart.findIndex(item => item.id === id || item.id == id);
    if (index !== -1) {
        cart.splice(index, 1);
        saveCart();
        showToast("Item removed");
        if (typeof updateCartPage === "function") updateCartPage();
        if (keepOpen) {
            showCart(); // Keep cart open after removal
        }
    }
}



// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
    try {
        // Update CSS variables for header height and mini-cart width
        function updateLayoutVars() {
            const header = document.querySelector('.site-header');
            const miniCart = document.getElementById('mini-cart');
            const root = document.documentElement;
            if (header) {
                root.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
            }
            if (miniCart) {
                const w = miniCart.offsetWidth || 350;
                root.style.setProperty('--mini-cart-width', `${w}px`);
            }
        }


        // Run initially and on resize so the cart aligns under header at all sizes
        updateLayoutVars();
        window.addEventListener('resize', updateLayoutVars);
        const cartToggle = document.getElementById("cart-toggle");
        const miniCart = document.getElementById("mini-cart");
        const overlay = document.querySelector(".overlay");
        const clearCartBtn = document.getElementById("clear-cart");
        const closeCartBtn = document.querySelector(".close-cart");


        // Initialize cart
        updateCartCount();
        renderMiniCart();


        // Cart toggle functionality
        if (cartToggle && miniCart && overlay) {
            // Open cart when clicking cart icon
            cartToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleCart();
            });


            // Hover-to-open was removed to prefer click-only behavior


            // Close cart when clicking close button
            if (closeCartBtn) {
                closeCartBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    hideCart();
                });
            }



            // Close cart when clicking overlay
            overlay.addEventListener("click", hideCart);


            // Close cart when clicking outside
            document.addEventListener("click", (e) => {
                if (!miniCart.contains(e.target) && !cartToggle.contains(e.target)) {
                    hideCart();
                }
            });


            // ESC key support
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    hideCart();
                }
            });
        }


        // Add to cart buttons
        document.querySelectorAll(".add-to-cart").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const button = e.currentTarget;
                button.disabled = true;
                button.style.opacity = '0.7';
                addToCart(button);
                setTimeout(() => {
                    button.disabled = false;
                    button.style.opacity = '1';
                }, 500);
            });
        });


        // Delegated handlers for mini-cart item controls (plus/minus/remove)
        if (miniCart) {
            miniCart.addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.target.closest('button');
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                if (!action || !id) return;
                e.preventDefault();
                if (action === 'decrease') {
                    updateItemQuantity(id, -1);
                } else if (action === 'increase') {
                    updateItemQuantity(id, 1);
                } else if (action === 'remove') {
                    removeFromCart(id, true);
                }
            });
        }


        // Clear cart button
        if (clearCartBtn) {
            clearCartBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (cart.length === 0) {
                    showToast("Cart is already empty");
                    return;
                }
                setCartLoading(true);
                setTimeout(() => {
                    clearCart();
                    setCartLoading(false);
                }, 300);
            });
        }


        // Store initial cart total
        const { subtotal } = getCartTotals();
        localStorage.setItem("cartTotal", subtotal.toFixed(2));

    } catch (error) {
        handleCartError(error);
    }
});
