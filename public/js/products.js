document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.querySelector('.product-grid');
  const filterInput = document.getElementById('product-filter');

  const products = [
    { id: 1, name: "Noise Cancelling Headphones", price: 199 * 140, image: "myImg/Noise Cancelling Headphones.jpg" },
    { id: 2, name: "Smart Speaker", price: 99 * 140, image: "myImg/Smart Speaker.jpg" },
    { id: 3, name: "4K Action Camera", price: 249 * 140, image: "myImg/4K Action Camera.jpg" },
    { id: 4, name: "Fitness Tracker", price: 159 * 140, image: "myImg/fitness-tracker.jpg" },
    { id: 5, name: "Drone Pro X", price: 499 * 140, image: "myImg/Drone Pro X.jpg" },
    { id: 6, name: "Gaming Mouse", price: 89 * 140, image: "myImg/gaming-Mouse.jpg" },
    { id: 7, name: "Bluetooth Keyboard", price: 109 * 140, image: "myImg/bluetooth-keyboard.jpg" },
    { id: 8, name: "Smartwatch Pro", price: 299 * 140, image: "myImg/smartwatch-pro.jpg" },
    { id: 9, name: "VR Headset", price: 349 * 140, image: "myImg/vr-headset.jpg" },
    { id: 10, name: "Wireless Charger", price: 79 * 140, image: "myImg/wireless-charger.jpg" },
    { id: 11, name: "Fold Phones", price: 59 * 140, image: "myImg/fold phones.jpg" },
    { id: 12, name: "Portable SSD", price: 399 * 140, image: "myImg/portable-ssd.jpg" },
    { id: 13, name: "LED Desk Lamp", price: 129 * 140, image: "myImg/led-desk-lamp.jpg" },
    { id: 14, name: "USB-C Hub", price: 149 * 140, image: "myImg/usb-c-hub.jpg" },
    { id: 15, name: "Noise Cancelling Earbuds", price: 189 * 140, image: "myImg/earbuds.jpg" },
    { id: 16, name: "Smart Home Plug", price: 69 * 140, image: "myImg/smart-plug.jpg" },
    { id: 17, name: "Portable Projector", price: 559 * 140, image: "myImg/projector.jpg" },
    { id: 18, name: "Wireless Earphones", price: 139 * 140, image: "myImg/earphones.jpg" },
    { id: 19, name: "Laptop Stand", price: 119 * 140, image: "myImg/laptop-stand.jpg" },
    { id: 20, name: "Ergonomic Mousepad", price: 49 * 140, image: "myImg/mousepad.jpg" },
    { id: 21, name: "Mini Bluetooth Speaker", price: 89 * 140, image: "myImg/mini-speaker.jpg" },
    { id: 22, name: "Gaming PC", price: 2, image: "myImg/gaming pc.jpg" },
  ];






  function renderProducts(filter = "") {
    productGrid.innerHTML = "";
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>KES ${product.price.toLocaleString()}</p>
        <button class="btn add-to-cart" 
          data-id="${product.id}" 
          data-name="${product.name}" 
          data-price="${product.price}">
          Add to Cart
        </button>
      `;
      productGrid.appendChild(card);
    });

    // Attach event listeners for cart
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', () => addToCart(button));
    });
  }

  filterInput.addEventListener("input", () => {
    renderProducts(filterInput.value);
  });

  renderProducts();
});
