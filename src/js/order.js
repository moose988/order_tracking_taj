import { CATALOG_PLACEHOLDER_IMAGE, PRODUCTS } from "../data/products.js";
import { initScrollTopButton } from "./scroll-top.js";

let order = JSON.parse(localStorage.getItem("tajOrder")) || [];
let selectedProduct = null;
let selectedQuantity = 1;
let currentImageIndex = 0;
let modalZoomLevel = 1;
let modalZoomOriginX = 50;
let modalZoomOriginY = 50;
let currentCategory = "All";
let currentSearchQuery = "";
let searchDebounceTimer = null;
let visibleProductsLimit = 12;
const MODAL_ZOOM_MIN = 1;
const MODAL_ZOOM_MAX = 3;
const MODAL_ZOOM_STEP = 0.25;
const INITIAL_VISIBLE_PRODUCTS = 12;
const LOAD_MORE_STEP = 12;
const PRODUCT_ID_MAP = new Map(PRODUCTS.map((product) => [String(product.id), product]));
const PRODUCT_SEARCH_INDEX = PRODUCTS.map((product) => ({
  product,
  category: String(product.category || ""),
  haystack: `${product.name} ${product.category} ${product.shortDescription}`.toLowerCase()
}));

function initMobileMenu(){
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if(!menuBtn || !navLinks || menuBtn.dataset.menuBound === "true"){
    return;
  }

  menuBtn.dataset.menuBound = "true";
  menuBtn.setAttribute("type", "button");
  menuBtn.setAttribute("aria-expanded", "false");

  if(!navLinks.id){
    navLinks.id = "primary-navigation";
  }

  menuBtn.setAttribute("aria-controls", navLinks.id);

  const syncMenuState = (isOpen) => {
    navLinks.classList.toggle("active", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("mobile-nav-open", isOpen && window.innerWidth <= 760);
  };

  menuBtn.addEventListener("click", () => {
    syncMenuState(!navLinks.classList.contains("active"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      syncMenuState(false);
    });
  });

  window.addEventListener("resize", () => {
    if(window.innerWidth > 760){
      syncMenuState(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if(event.key === "Escape"){
      syncMenuState(false);
    }
  });

  document.addEventListener("click", (event) => {
    if(!navLinks.classList.contains("active")){
      return;
    }

    if(menuBtn.contains(event.target) || navLinks.contains(event.target)){
      return;
    }

    syncMenuState(false);
  });
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeCatalogImageUrl(imagePath){
  const rawValue = String(imagePath || "").trim();

  if(!rawValue){
    return "";
  }

  if(/^(https?:|data:|blob:)/i.test(rawValue)){
    return rawValue;
  }

  let normalizedPath = rawValue.replaceAll("\\", "/");

  while(normalizedPath.startsWith("../")){
    normalizedPath = normalizedPath.slice(3);
  }

  if(normalizedPath.startsWith("./")){
    normalizedPath = normalizedPath.slice(2);
  }

  if(!normalizedPath.startsWith("/")){
    normalizedPath = `/${normalizedPath}`;
  }

  return encodeURI(normalizedPath);
}

function saveOrder(){
  localStorage.setItem("tajOrder", JSON.stringify(order));
}

function getFilterCategories(){
  const preferredOrder = [
    "Chairs",
    "Dining Tables",
    "Coffee Table",
    "Majlis Sofa",
    "Bridal Sofa",
    "Cocktail Table"
  ];
  const availableCategories = [...new Set(PRODUCTS.map((product) => product.category).filter(Boolean))];
  const orderedCategories = preferredOrder.filter((category) => availableCategories.includes(category));
  const remainingCategories = availableCategories.filter((category) => !preferredOrder.includes(category));

  return [...orderedCategories, ...remainingCategories];
}

function getNormalizedSearchValue(value){
  return String(value || "").trim().toLowerCase();
}

function applyInitialCategoryFromUrl(){
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = String(params.get("category") || "").trim();

  if(!requestedCategory){
    return;
  }

  const matchingCategory = getFilterCategories().find((category) => category === requestedCategory);

  if(!matchingCategory){
    return;
  }

  currentCategory = matchingCategory;
}

function getProductImages(product){
  const images = Array.isArray(product?.images)
    ? product.images
      .map((image) => normalizeCatalogImageUrl(image))
      .filter((image) => String(image || "").trim())
    : [];

  return images.length ? images : [CATALOG_PLACEHOLDER_IMAGE];
}

function getPrimaryProductImage(product){
  return getProductImages(product)[0];
}

function getProductThumbClasses(product){
  const classes = ["product-thumb"];
  const category = String(product?.category || "").trim();

  if(category === "Dining Tables"){
    classes.push("product-thumb-dining");
  }

  if(category === "Dining Tables" || category === "Coffee Table" || category === "Cocktail Table"){
    classes.push("product-thumb-table");
  }

  if(category === "Chairs"){
    classes.push("product-thumb-chair");
  }

  if(category === "Bridal Sofa" || category === "Majlis Sofa"){
    classes.push("product-thumb-sofa");
  }

  return classes.join(" ");
}

function getImageFallbackAttribute(){
  return `this.onerror=null;this.src='${CATALOG_PLACEHOLDER_IMAGE.replaceAll("'", "\\'")}';`;
}

function clampModalZoom(value){
  return Math.min(MODAL_ZOOM_MAX, Math.max(MODAL_ZOOM_MIN, value));
}

function applyModalZoom(){
  const modalImage = document.getElementById("modalImage");
  const zoomLabel = document.getElementById("modalZoomLevel");
  const zoomInButton = document.getElementById("modalZoomInBtn");
  const zoomOutButton = document.getElementById("modalZoomOutBtn");
  const zoomResetButton = document.getElementById("modalZoomResetBtn");
  const imageFrame = document.querySelector(".order-modal-main-image-frame");

  if(modalImage){
    modalImage.style.transformOrigin = `${modalZoomOriginX.toFixed(2)}% ${modalZoomOriginY.toFixed(2)}%`;
    modalImage.style.transform = `scale(${modalZoomLevel.toFixed(2)})`;
    modalImage.classList.toggle("is-zoomed", modalZoomLevel > MODAL_ZOOM_MIN);
  }

  if(imageFrame){
    imageFrame.classList.toggle("is-zoomed", modalZoomLevel > MODAL_ZOOM_MIN);
  }

  if(zoomLabel){
    zoomLabel.textContent = `${Math.round(modalZoomLevel * 100)}%`;
  }

  if(zoomInButton){
    zoomInButton.disabled = modalZoomLevel >= MODAL_ZOOM_MAX;
  }

  if(zoomOutButton){
    zoomOutButton.disabled = modalZoomLevel <= MODAL_ZOOM_MIN;
  }

  if(zoomResetButton){
    zoomResetButton.disabled = modalZoomLevel === MODAL_ZOOM_MIN;
  }
}

function setModalZoom(nextZoomLevel){
  modalZoomLevel = clampModalZoom(nextZoomLevel);
  applyModalZoom();
}

function zoomModalIn(){
  setModalZoom(modalZoomLevel + MODAL_ZOOM_STEP);
}

function zoomModalOut(){
  setModalZoom(modalZoomLevel - MODAL_ZOOM_STEP);
}

function resetModalZoom(){
  modalZoomOriginX = 50;
  modalZoomOriginY = 50;
  setModalZoom(MODAL_ZOOM_MIN);
}

function updateZoomOriginFromPointer(event){
  const modalImage = document.getElementById("modalImage");

  if(!modalImage){
    return;
  }

  const rect = modalImage.getBoundingClientRect();

  if(!rect.width || !rect.height){
    return;
  }

  const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
  const relativeY = ((event.clientY - rect.top) / rect.height) * 100;

  modalZoomOriginX = Math.min(100, Math.max(0, relativeX));
  modalZoomOriginY = Math.min(100, Math.max(0, relativeY));
}

function getVisibleProducts(){
  const searchValue = getNormalizedSearchValue(currentSearchQuery);
  let indexedProducts = [...PRODUCT_SEARCH_INDEX];

  if(currentCategory !== "All"){
    indexedProducts = indexedProducts.filter((entry) => entry.category === currentCategory);
  }

  if(searchValue){
    indexedProducts = indexedProducts.filter((entry) => entry.haystack.includes(searchValue));
  }

  return indexedProducts.map((entry) => entry.product);
}

function resetVisibleProductsLimit(){
  visibleProductsLimit = INITIAL_VISIBLE_PRODUCTS;
}

function renderCatalogMeta(shownCount, totalCount){
  const productsCountText = document.getElementById("productsCountText");
  const loadMoreWrap = document.getElementById("orderLoadMoreWrap");
  const loadMoreButton = document.getElementById("loadMoreProductsBtn");

  if(productsCountText){
    if(totalCount > 0){
      productsCountText.textContent = `Showing ${shownCount} of ${totalCount} piece${totalCount === 1 ? "" : "s"}`;
      productsCountText.hidden = false;
    }else{
      productsCountText.textContent = "";
      productsCountText.hidden = true;
    }
  }

  if(loadMoreWrap){
    const canLoadMore = totalCount > shownCount;
    loadMoreWrap.hidden = !canLoadMore;
  }

  if(loadMoreButton){
    const canLoadMore = totalCount > shownCount;
    loadMoreButton.disabled = !canLoadMore;
  }
}

function syncSearchClearButton(){
  const clearSearchButton = document.getElementById("clearProductSearchBtn");

  if(!clearSearchButton){
    return;
  }

  clearSearchButton.hidden = !getNormalizedSearchValue(currentSearchQuery);
}

function renderFilterButtons(){
  const filtersContainer = document.getElementById("productFilters");

  if(!filtersContainer){
    return;
  }

  const categories = ["All", ...getFilterCategories()];
  filtersContainer.innerHTML = categories.map((category) => `
    <button
      class="filter-btn ${category === currentCategory ? "active" : ""}"
      type="button"
      data-category="${escapeHtml(category)}"
    >
      ${escapeHtml(category)}
    </button>
  `).join("");
}

function renderProducts(){
  const grid = document.getElementById("productsGrid");

  if(!grid){
    return;
  }

  const visibleProducts = getVisibleProducts();
  const totalProducts = visibleProducts.length;
  const productsToRender = visibleProducts.slice(0, visibleProductsLimit);
  const shownCount = productsToRender.length;

  if(!totalProducts){
    grid.innerHTML = `
      <article class="order-products-empty">
        <span class="section-kicker">No Matches</span>
        <h3>No products found</h3>
        <p>Try a different search or switch categories to continue browsing the collection.</p>
      </article>
    `;
    renderCatalogMeta(0, 0);
    return;
  }

  grid.innerHTML = productsToRender.map((product, index) => `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-media">
        <img
          class="${getProductThumbClasses(product)}"
          src="${escapeHtml(getPrimaryProductImage(product))}"
          alt="${escapeHtml(product.name)}"
          loading="${index < 2 ? "eager" : "lazy"}"
          decoding="async"
          fetchpriority="${index === 0 ? "high" : "low"}"
          sizes="(max-width: 760px) 100vw, (max-width: 1280px) 33vw, 24vw"
          onerror="${getImageFallbackAttribute()}"
        >
        <span class="badge product-badge">${escapeHtml(product.category)}</span>
      </div>

      <div class="product-copy">
        <div class="product-copy-head">
          <h3>${escapeHtml(product.name)}</h3>
          <span class="product-card-link">Tap to view details</span>
        </div>
      </div>
    </article>
  `).join("");

  renderCatalogMeta(shownCount, totalProducts);
}

function applyCatalogView(options = {}){
  if(options.resetVisible){
    resetVisibleProductsLimit();
  }

  updateActiveFilterButton();
  renderProducts();
  syncSearchClearButton();
}

function filterProducts(category){
  currentCategory = category || "All";
  applyCatalogView({ resetVisible: true });
}

function updateActiveFilterButton(){
  const buttons = document.querySelectorAll("#productFilters .filter-btn");

  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === currentCategory);
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
    quantityInput.value = String(selectedQuantity);
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

function updateOrderActionState(totalItems){
  const summaryQuoteBtn = document.getElementById("summaryQuoteBtn");
  const summaryClearBtn = document.getElementById("summaryClearBtn");
  const mobileCartBtn = document.getElementById("mobileCartBtn");

  [summaryQuoteBtn, summaryClearBtn, mobileCartBtn].forEach((button) => {
    if(button){
      button.disabled = totalItems === 0;
    }
  });
}

function renderOrderSummary(){
  const list = document.getElementById("orderItemsList");
  const totalText = document.getElementById("orderTotalText");
  const summaryCaption = document.getElementById("orderSummaryCaption");
  const mobileCartCount = document.getElementById("mobileCartCount");

  if(!list || !totalText || !summaryCaption || !mobileCartCount){
    return;
  }

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const selectionCount = order.length;

  if(!order.length){
    list.innerHTML = `
      <article class="order-empty-state">
        <span class="order-empty-icon" aria-hidden="true">+</span>
        <strong>Your basket is ready</strong>
        <p>Select products from the collection to build a polished quote request.</p>
      </article>
    `;
    totalText.textContent = "0 items selected";
    summaryCaption.textContent = "Select pieces from the collection to start building your quote.";
    mobileCartCount.textContent = "0 items selected";
    updateOrderActionState(0);
    return;
  }

  list.innerHTML = order.map((item) => `
    <article class="order-item-row">
      <div class="order-item-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <small class="item-category">${escapeHtml(item.category)}</small>
      </div>

      <div class="qty-controls">
        <button type="button" class="qty-minus" data-id="${item.id}" aria-label="Decrease ${escapeHtml(item.name)} quantity">-</button>
        <span>${item.quantity}</span>
        <button type="button" class="qty-plus" data-id="${item.id}" aria-label="Increase ${escapeHtml(item.name)} quantity">+</button>
      </div>
    </article>
  `).join("");

  totalText.textContent = `${totalItems} item${totalItems !== 1 ? "s" : ""} selected`;
  summaryCaption.textContent = `${selectionCount} selection${selectionCount !== 1 ? "s" : ""} prepared for your quote request.`;
  mobileCartCount.textContent = `${totalItems} item${totalItems !== 1 ? "s" : ""} selected`;
  updateOrderActionState(totalItems);
}

function renderModalGallery(){
  if(!selectedProduct){
    return;
  }

  const modalImage = document.getElementById("modalImage");
  const modalThumbs = document.getElementById("modalThumbs");
  const modalImageCount = document.getElementById("modalImageCount");
  const galleryButtons = document.querySelectorAll("#productModal .gallery-nav button");
  const productImages = getProductImages(selectedProduct);

  if(modalImage){
    modalImage.src = productImages[currentImageIndex];
    modalImage.alt = selectedProduct.name;
    modalImage.decoding = "async";
    modalImage.setAttribute("onerror", getImageFallbackAttribute());
  }

  if(modalImageCount){
    modalImageCount.textContent = `${currentImageIndex + 1} / ${productImages.length}`;
  }

  if(modalThumbs){
    modalThumbs.innerHTML = productImages.map((image, index) => `
      <button
        type="button"
        class="order-modal-thumb ${index === currentImageIndex ? "is-active" : ""}"
        data-index="${index}"
        aria-label="View image ${index + 1}"
      >
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(`${selectedProduct.name} thumbnail ${index + 1}`)}"
          loading="lazy"
          decoding="async"
          onerror="${getImageFallbackAttribute()}"
        >
      </button>
    `).join("");
  }

  galleryButtons.forEach((button) => {
    button.disabled = productImages.length <= 1;
  });

  resetModalZoom();
}

function openProductModal(id){
  selectedProduct = PRODUCT_ID_MAP.get(String(id)) || null;

  if(!selectedProduct){
    return;
  }

  const modalTitle = document.getElementById("modalProductTitle");
  const modalDescription = document.getElementById("modalProductDescription");
  const modalMeasurements = document.getElementById("modalMeasurements");
  const modalCategoryBadge = document.getElementById("modalCategoryBadge");

  selectedQuantity = 1;
  currentImageIndex = 0;

  if(modalTitle){
    modalTitle.textContent = selectedProduct.name;
  }

  if(modalDescription){
    modalDescription.textContent = selectedProduct.shortDescription;
  }

  if(modalMeasurements){
    modalMeasurements.textContent = selectedProduct.measurements;
  }

  if(modalCategoryBadge){
    modalCategoryBadge.textContent = selectedProduct.category || "Collection";
  }

  updateQuantityDisplay();
  renderModalGallery();

  document.getElementById("productModal")?.classList.add("active");
  document.body.classList.add("product-modal-open");
  document.body.dataset.previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

function closeProductModal(){
  document.getElementById("productModal")?.classList.remove("active");
  document.body.classList.remove("product-modal-open");
  document.body.style.overflow = document.body.dataset.previousOverflow || "";
  delete document.body.dataset.previousOverflow;
  resetModalZoom();
}

function nextImage(){
  if(!selectedProduct){
    return;
  }

  currentImageIndex = (currentImageIndex + 1) % getProductImages(selectedProduct).length;
  renderModalGallery();
}

function prevImage(){
  if(!selectedProduct){
    return;
  }

  const productImages = getProductImages(selectedProduct);
  currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
  renderModalGallery();
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

  window.location.href = "/quote";
}

function attachOrderEvents(){
  const filtersContainer = document.getElementById("productFilters");
  const productsGrid = document.getElementById("productsGrid");
  const orderItemsList = document.getElementById("orderItemsList");
  const modal = document.getElementById("productModal");
  const productSearchInput = document.getElementById("productSearchInput");
  const clearProductSearchBtn = document.getElementById("clearProductSearchBtn");
  const modalThumbs = document.getElementById("modalThumbs");
  const modalImageFrame = document.querySelector(".order-modal-main-image-frame");
  const loadMoreProductsBtn = document.getElementById("loadMoreProductsBtn");

  filtersContainer?.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");

    if(!button){
      return;
    }

    filterProducts(button.dataset.category || "All");
  });

  productSearchInput?.addEventListener("input", () => {
    currentSearchQuery = productSearchInput.value || "";

    if(searchDebounceTimer){
      window.clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = window.setTimeout(() => {
      applyCatalogView({ resetVisible: true });
    }, 120);
  });

  clearProductSearchBtn?.addEventListener("click", () => {
    currentSearchQuery = "";

    if(productSearchInput){
      productSearchInput.value = "";
      productSearchInput.focus();
    }

    applyCatalogView({ resetVisible: true });
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

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && modal?.classList.contains("active")){
      closeProductModal();
    }
  });

  modalThumbs?.addEventListener("click", (event) => {
    const thumb = event.target.closest(".order-modal-thumb");

    if(!thumb || !selectedProduct){
      return;
    }

    currentImageIndex = Number(thumb.dataset.index) || 0;
    renderModalGallery();
  });

  modalImageFrame?.addEventListener("wheel", (event) => {
    if(!modal?.classList.contains("active")){
      return;
    }

    event.preventDefault();
    updateZoomOriginFromPointer(event);

    if(event.deltaY < 0){
      zoomModalIn();
    }else{
      zoomModalOut();
    }
  }, { passive: false });

  modalImageFrame?.addEventListener("mousemove", (event) => {
    if(!modal?.classList.contains("active") || modalZoomLevel <= MODAL_ZOOM_MIN){
      return;
    }

    updateZoomOriginFromPointer(event);
    applyModalZoom();
  });

  loadMoreProductsBtn?.addEventListener("click", () => {
    visibleProductsLimit += LOAD_MORE_STEP;
    renderProducts();
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
  initScrollTopButton();
  applyInitialCategoryFromUrl();
  resetVisibleProductsLimit();
  renderFilterButtons();
  updateActiveFilterButton();
  renderProducts();
  syncOrderFromStorage();
  attachOrderEvents();
  syncSearchClearButton();
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
window.zoomModalIn = zoomModalIn;
window.zoomModalOut = zoomModalOut;
window.resetModalZoom = resetModalZoom;
window.decreaseQty = decreaseQty;
window.increaseQty = increaseQty;
window.handleManualQtyInput = handleManualQtyInput;
window.addToOrder = addToOrder;
window.goToQuotePage = goToQuotePage;
window.clearOrder = clearOrder;
