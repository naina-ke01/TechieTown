function openModal(productIndex) {
  const modal = document.getElementById("productModal");
  const modalTitle = document.getElementById("modalTitle");
  const mainImage = document.getElementById("mainImage");
  const thumbnailGroup = document.getElementById("thumbnailGroup");

  const products = [
    { title: "Noise Cancelling Headphones", img: "myImg/Noise Cancelling Headphones.jpg" },
    { title: "Fold Phones", img: "myImg/mobileacces.jpg" },
    { title: "4K Action Camera", img: "myImg/4K Action Camera.jpg" },
    { title: "Drone Pro X", img: "myImg/Drone Pro X.jpg" }
  ];

  const selected = products[productIndex];
  modalTitle.textContent = selected.title;
  mainImage.src = selected.img;
  thumbnailGroup.innerHTML = `
    <img src="${selected.img}" alt="${selected.title}" onclick="document.getElementById('mainImage').src='${selected.img}'">
  `;

  // class to trigger CSS centering and visibility
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById("productModal");
  if (modal) modal.classList.remove('show');
}

// close buttons also remove .show
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  
  // close button inside modal
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-btn') || e.target.id === 'productModal') {
      modal.classList.remove('show');
    }
  });
});
