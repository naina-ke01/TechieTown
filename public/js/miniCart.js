// ========== CART STORAGE ==========
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ========== Save Cart ==========
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderMiniCart();

  // Save cart total dynamically for checkout page
  const { subtotal } = getCartTotals();
  localStorage.setItem("cartTotal", subtotal.toFixed(2));
}

// ========== Add to Cart ==========
function addToCart(button) {
  const id = button.dataset.id;
  const name = button.dataset.name;
  const price = parseFloat(button.dataset.price);

  if (!id || !name || isNaN(price)) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }

  saveCart();
  showToast(`${name} added to cart`);
}

// ========== Clear Cart ==========
function clearCart() {
  cart = [];
  saveCart();
  showToast("Cart cleared");
}

// ========== Totals ==========
function getCartTotals() {
  let subtotal = 0,
    itemCount = 0;
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

// ========== Mini Cart ==========
function renderMiniCart() {
  const miniCart = document.getElementById("mini-cart");
  if (!miniCart) return;

  const itemsContainer = miniCart.querySelector("#mini-cart-items");
  const totalContainer = miniCart.querySelector("#mini-cart-total");
  const clearCartBtn = miniCart.querySelector("#clear-cart");

  itemsContainer.innerHTML = "";
  const { subtotal } = getCartTotals();

  if (cart.length === 0) {
    itemsContainer.innerHTML = "<li>Your cart is empty.</li>";
    totalContainer.textContent = "Total: KES 0";
    return;
  }

  cart.forEach(item => {
    const li = document.createElement("li");
    li.className = "mini-cart-item";
    li.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>KES ${(item.price * item.quantity).toLocaleString()}</span>
    `;
    itemsContainer.appendChild(li);
  });

  totalContainer.textContent = `Total: KES ${subtotal.toLocaleString()}`;
  clearCartBtn.onclick = clearCart;
}

// ========== Toast ==========
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast hidden";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  const cartToggle = document.getElementById("cart-toggle");
  const miniCart = document.getElementById("mini-cart");
  const overlay = document.getElementById("overlay");
  const clearCartBtn = document.getElementById("clear-cart");

  updateCartCount();
  renderMiniCart();

  if (cartToggle && miniCart && overlay) {
    // Toggle mini cart visibility
    cartToggle.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent bubbling to document click
      const isVisible = miniCart.classList.contains("show");

      if (isVisible) {
        miniCart.classList.remove("show");
        overlay.classList.remove("active");
      } else {
        miniCart.classList.add("show");
        overlay.classList.add("active");
      }
    });

    // Close mini cart when clicking outside
    document.addEventListener("click", (e) => {
      if (!miniCart.contains(e.target) && !cartToggle.contains(e.target)) {
        miniCart.classList.remove("show");
        overlay.classList.remove("active");
      }
    });
  }

  // Add to cart buttons
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn));
  });

  // Clear cart button
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      clearCart();
    });
  }

  // Save initial total to localStorage
  const { subtotal } = getCartTotals();
  localStorage.setItem("cartTotal", subtotal.toFixed(2));
});

// ========== Remove from Cart ==========
function removeFromCart(id) {
  const index = cart.findIndex(item => item.id === id || item.id == id);
  if (index !== -1) {
    cart.splice(index, 1);
    saveCart();
    showToast("Item removed");
    if (typeof updateCartPage === "function") updateCartPage();
  }
}
