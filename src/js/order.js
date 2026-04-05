import { PRODUCTS } from "../data/products.js";

let order = JSON.parse(localStorage.getItem("tajOrder")) || [];
let selectedProduct = null;
let selectedQuantity = 1;
let currentImageIndex = 0;

function initMobileMenu(){
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if(!menuBtn || !navLinks){
    return;
  }

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });

  window.addEventListener("resize", () => {
    if(window.innerWidth > 760){
      navLinks.classList.remove("active");
    }
  });
}

function saveOrder(){
  localStorage.setItem("tajOrder", JSON.stringify(order));
}

function getFilterCategories(){
  return [...new Set(PRODUCTS.map((product) => product.category).filter(Boolean))];
}

function renderFilterButtons(activeCategory = "All"){
  const filtersContainer = document.getElementById("productFilters");

  if(!filtersContainer){
    return;
  }

  const categories = ["All", ...getFilterCategories()];
  filtersContainer.innerHTML = categories.map((category) => `
    <button
      class="filter-btn ${category === activeCategory ? "active" : ""}"
      type="button"
      data-category="${category}"
    >
      ${category}
    </button>
  `).join("");
}

function renderProducts(filter = "All"){
  const grid = document.getElementById("productsGrid");

  if(!grid){
    return;
  }

  const filteredProducts = filter === "All"
    ? PRODUCTS
    : PRODUCTS.filter((product) => product.category === filter);

  grid.innerHTML = filteredProducts.map((product) => `
    <article class="product-card" data-product-id="${product.id}">
      <img class="product-thumb" src="${product.images[0]}" alt="${product.name}">

      <div class="product-copy">
        <span class="badge">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.shortDescription}</p>

        <div class="product-meta">
          <span>${product.measurements}</span>
          <span>View Details</span>
        </div>
      </div>
    </article>
  `).join("");
}

function filterProducts(category, button = null){
  renderProducts(category);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn === button || btn.dataset.category === category);
  });
}

function syncOrderFromStorage(){
  order = JSON.parse(localStorage.getItem("tajOrder")) || [];
  renderOrderSummary();
}

function increaseOrderItemQuantity(id){
  const item = order.find((entry) => String(entry.id) === String(id));

  if(!item){
    return;
  }

  item.quantity += 1;
  saveOrder();
  renderOrderSummary();
}

function decreaseOrderItemQuantity(id){
  const itemIndex = order.findIndex((entry) => String(entry.id) === String(id));

  if(itemIndex === -1){
    return;
  }

  if(order[itemIndex].quantity <= 1){
    order.splice(itemIndex, 1);
  }else{
    order[itemIndex].quantity -= 1;
  }

  saveOrder();
  renderOrderSummary();
}

function updateQuantityDisplay(){
  const quantityInput = document.getElementById("modalQuantity");

  if(quantityInput){
    quantityInput.value = selectedQuantity;
  }
}

function increaseQty(){
  selectedQuantity += 1;
  updateQuantityDisplay();
}

function decreaseQty(){
  if(selectedQuantity > 1){
    selectedQuantity -= 1;
    updateQuantityDisplay();
  }
}

function handleManualQtyInput(){
  const input = document.getElementById("modalQuantity");

  if(!input){
    return;
  }

  let value = parseInt(input.value, 10);

  if(!input.value || Number.isNaN(value) || value < 1){
    value = 1;
  }

  selectedQuantity = value;
  updateQuantityDisplay();
}

function clearOrder(){
  if(window.confirm("Are you sure you want to clear your entire order?")){
    order = [];
    saveOrder();
    renderOrderSummary();
  }
}

function renderOrderSummary(){
  const list = document.getElementById("orderItemsList");
  const totalText = document.getElementById("orderTotalText");

  if(!list || !totalText){
    return;
  }

  if(order.length === 0){
    list.innerHTML = '<p style="color:#888;text-align:center;padding:10px;">Empty</p>';
    totalText.textContent = "0 items selected";
    return;
  }

  list.innerHTML = order.map((item) => `
    <div class="order-item-row">
      <div>
        <strong>${item.name}</strong><br>
        <small class="item-category">${item.category}</small>
      </div>

      <div class="qty-controls">
        <button type="button" class="qty-minus" data-id="${item.id}">-</button>
        <span>${item.quantity}</span>
        <button type="button" class="qty-plus" data-id="${item.id}">+</button>
      </div>
    </div>
  `).join("");

  const count = order.reduce((sum, item) => sum + item.quantity, 0);
  totalText.textContent = `${count} item${count !== 1 ? "s" : ""} selected`;
}

function openProductModal(id){
  selectedProduct = PRODUCTS.find((product) => product.id === id) || null;

  if(!selectedProduct){
    return;
  }

  selectedQuantity = 1;
  currentImageIndex = 0;

  document.getElementById("modalProductTitle").textContent = selectedProduct.name;
  document.getElementById("modalProductDescription").textContent = selectedProduct.shortDescription;
  document.getElementById("modalMeasurements").textContent = selectedProduct.measurements;
  document.getElementById("modalImage").src = selectedProduct.images[0];

  updateQuantityDisplay();

  document.getElementById("productModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProductModal(){
  document.getElementById("productModal").classList.remove("active");
  document.body.style.overflow = "auto";
}

function nextImage(){
  if(!selectedProduct){
    return;
  }

  currentImageIndex = (currentImageIndex + 1) % selectedProduct.images.length;
  document.getElementById("modalImage").src = selectedProduct.images[currentImageIndex];
}

function prevImage(){
  if(!selectedProduct){
    return;
  }

  currentImageIndex = (currentImageIndex - 1 + selectedProduct.images.length) % selectedProduct.images.length;
  document.getElementById("modalImage").src = selectedProduct.images[currentImageIndex];
}

function addToOrder(){
  if(!selectedProduct){
    return;
  }

  const existing = order.find((item) => item.id === selectedProduct.id);

  if(existing){
    existing.quantity += selectedQuantity;
  }else{
    order.push({
      ...selectedProduct,
      quantity: selectedQuantity
    });
  }

  saveOrder();
  renderOrderSummary();
  closeProductModal();
}

function goToQuotePage(){
  if(order.length === 0){
    alert("Add items first.");
    return;
  }

  window.location.href = "quote.html";
}

function attachOrderEvents(){
  const filtersContainer = document.getElementById("productFilters");
  const productsGrid = document.getElementById("productsGrid");
  const orderItemsList = document.getElementById("orderItemsList");
  const modal = document.getElementById("productModal");

  filtersContainer?.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");

    if(!button){
      return;
    }

    filterProducts(button.dataset.category || "All", button);
  });

  productsGrid?.addEventListener("click", (event) => {
    const card = event.target.closest(".product-card");

    if(!card){
      return;
    }

    openProductModal(Number(card.dataset.productId));
  });

  orderItemsList?.addEventListener("click", (event) => {
    const plusButton = event.target.closest(".qty-plus");
    const minusButton = event.target.closest(".qty-minus");

    if(plusButton){
      increaseOrderItemQuantity(plusButton.dataset.id);
    }

    if(minusButton){
      decreaseOrderItemQuantity(minusButton.dataset.id);
    }
  });

  modal?.addEventListener("click", (event) => {
    if(event.target === modal){
      closeProductModal();
    }
  });
}

function setCurrentYear(){
  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  initMobileMenu();
  renderFilterButtons();
  renderProducts();
  syncOrderFromStorage();
  attachOrderEvents();
});

window.addEventListener("pageshow", () => {
  syncOrderFromStorage();
});

window.addEventListener("focus", () => {
  syncOrderFromStorage();
});

window.filterProducts = filterProducts;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.decreaseQty = decreaseQty;
window.increaseQty = increaseQty;
window.handleManualQtyInput = handleManualQtyInput;
window.addToOrder = addToOrder;
window.goToQuotePage = goToQuotePage;
window.clearOrder = clearOrder;
