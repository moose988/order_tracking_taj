import { db } from "./firebase.js";
console.log("Firebase connected:", db);
const PRODUCTS = [
  {
  id: 1,
  name: "Round Table",
  category: "Tables",
  shortDescription: "Elegant round table suitable for weddings, parties, and formal setups.",
  measurements: "Approx. 150 cm diameter",
  images: [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
  ]
  },
  {
  id: 2,
  name: "Rectangular Table",
  category: "Tables",
  shortDescription: "A versatile table option for buffet setups, family events, and large gatherings.",
  measurements: "Approx. 180 x 75 cm",
  images: [
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80"
  ]
  },
  {
    id: 3,
    name: "White Chair",
    category: "Chairs",
    shortDescription: "Classic clean chair design that matches most event themes and setups.",
    measurements: "Standard event seating dimensions",
    images: [
    "../images/IN9A9418.JPG",
    "../images/IN9A9423.jpg"
    ]
    },
  {
  id: 4,
  name: "Gold Chair",
  category: "Chairs",
  shortDescription: "Luxury gold seating option for high-end weddings and special occasions.",
  measurements: "Standard event seating dimensions",
  images: [
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464890100898-a385f744067f?auto=format&fit=crop&w=1200&q=80"
  ]
  }
  ];
  
  let order = JSON.parse(localStorage.getItem("tajOrder")) || [];
  let selectedProduct = null;
  let selectedQuantity = 1;
  let currentImageIndex = 0;
  
  /* FILTER SYSTEM */
  
  function renderProducts(filter = "All") {
  
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  
  let filteredProducts = PRODUCTS;
  
  if (filter !== "All") {
  filteredProducts = PRODUCTS.filter(
  product => product.category === filter
  );
  }
  
  grid.innerHTML = filteredProducts.map(product => `
  <article class="product-card" onclick="openProductModal(${product.id})">
  
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
  
  function filterProducts(category, button) {
  
  renderProducts(category);
  
  document.querySelectorAll(".filter-btn").forEach(btn=>{
  btn.classList.remove("active");
  });
  
  button.classList.add("active");
  
  }
  
  /* ORDER STORAGE */
  
  function saveOrder() {
  localStorage.setItem("tajOrder", JSON.stringify(order));
  }
  
  function getOrderCount() {
  return order.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  /* ORDER SUMMARY */
  
  function renderOrderSummary() {
  
  const list = document.getElementById("orderItemsList");
  if (!list) return;
  
  if(order.length===0){
  list.innerHTML="";
  return;
  }
  
  list.innerHTML = order.map(item=>`
  <div class="order-item-row">
  
  <div>
  <strong>${item.name}</strong>
  <div style="color:#888;font-size:13px">${item.category}</div>
  </div>
  
  <div>x${item.quantity}</div>
  
  </div>
  `).join("");
  
  }
  
  /* MODAL */
  
  function openProductModal(productId){
  
  selectedProduct = PRODUCTS.find(p=>p.id===productId);
  selectedQuantity = 1;
  currentImageIndex = 0;
  
  document.getElementById("modalProductTitle").textContent = selectedProduct.name;
  document.getElementById("modalProductDescription").textContent = selectedProduct.shortDescription;
  document.getElementById("modalMeasurements").textContent = selectedProduct.measurements;
  
  document.getElementById("modalImage").src = selectedProduct.images[0];
  
  document.getElementById("modalQuantity").value = 1;
  
  document.getElementById("productModal").classList.add("active");
  document.body.style.overflow="hidden";
  
  }
  
  function closeProductModal(){
  document.getElementById("productModal").classList.remove("active");
  document.body.style.overflow="auto";
  }
  
  /* IMAGE SLIDER */
  
  function nextImage(){
  
  currentImageIndex =
  (currentImageIndex + 1) % selectedProduct.images.length;
  
  document.getElementById("modalImage").src =
  selectedProduct.images[currentImageIndex];
  
  }
  
  function prevImage(){
  
  currentImageIndex =
  (currentImageIndex - 1 + selectedProduct.images.length) %
  selectedProduct.images.length;
  
  document.getElementById("modalImage").src =
  selectedProduct.images[currentImageIndex];
  
  }
  
  /* QUANTITY */
  
  function increaseQty(){
  
  selectedQuantity++;
  
  document.getElementById("modalQuantity").value = selectedQuantity;
  
  }
  
  function decreaseQty(){
  
  if(selectedQuantity>1){
  
  selectedQuantity--;
  
  document.getElementById("modalQuantity").value = selectedQuantity;
  
  }
  
  }
  
  function handleManualQtyInput(){
  
  const input = document.getElementById("modalQuantity");
  
  let value = parseInt(input.value);
  
  if(isNaN(value) || value<1) value=1;
  
  selectedQuantity=value;
  
  input.value=selectedQuantity;
  
  }
  
  /* ADD TO ORDER */
  
  function addToOrder(){
  
  const existing = order.find(i=>i.id===selectedProduct.id);
  
  if(existing){
  
  existing.quantity += selectedQuantity;
  
  }else{
  
  order.push({
  id:selectedProduct.id,
  name:selectedProduct.name,
  category:selectedProduct.category,
  quantity:selectedQuantity
  });
  
  }
  
  saveOrder();
  renderOrderSummary();
  closeProductModal();
  
  }
  
  /* GO TO QUOTE */
  
  function goToQuotePage(){
  
  if(order.length===0){
  alert("Please add items first.");
  return;
  }
  
  window.location.href="quote.html";
  
  }
  
  /* INIT */
  
  document.addEventListener("DOMContentLoaded",()=>{
  
  renderProducts();
  renderOrderSummary();
  
  const modal = document.getElementById("productModal");
  
  if(modal){
  modal.addEventListener("click",e=>{
  if(e.target===modal) closeProductModal();
  });
  }
  
  });
