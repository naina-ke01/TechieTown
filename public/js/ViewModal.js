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

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}
