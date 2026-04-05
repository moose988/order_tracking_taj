import { auth } from "./firebase.js";
import { PRODUCTS } from "../data/products.js";
import { QUOTE_BANK_PRESETS, QUOTE_CURRENCY, VAT_RATE, getQuoteBankPreset } from "./quote-config.js";
import { buildQuotePdfFileName, calculateQuoteTotals, generateQuotePdfBlob } from "./quote-pdf.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* PROTECT ADMIN PAGE */
onAuthStateChanged(auth, (user) => {

  if(!user){
    window.location.href = "admin-login.html";
  }

});


import { db } from "./firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tableBody = document.getElementById("ordersTableBody");
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const analyticsTotalOrders = document.getElementById("analyticsTotalOrders");
const analyticsBusiestDay = document.getElementById("analyticsBusiestDay");
const ordersPerDayCanvas = document.getElementById("ordersPerDayChart");
const ordersByStatusCanvas = document.getElementById("ordersByStatusChart");
const topProductsCanvas = document.getElementById("topProductsChart");
const opsPanel = document.getElementById("opsPanel");
const opsPanelSummary = document.getElementById("opsPanelSummary");
const driverPanel = document.getElementById("driverPanel");
const driverPanelSummary = document.getElementById("driverPanelSummary");
const editOrderModal = document.getElementById("editOrderModal");
const editOrderForm = document.getElementById("editOrderForm");
const editItemsContainer = document.getElementById("editItemsContainer");
const editOrderTitle = document.getElementById("editOrderTitle");
const editOrderStatus = document.getElementById("editOrderStatus");
const editSaveBtn = document.getElementById("editOrderSaveBtn");
const editDeleteBtn = document.getElementById("editOrderDeleteBtn");
const closeEditOrderBtn = document.getElementById("closeEditOrderBtn");
const cancelEditOrderBtn = document.getElementById("cancelEditOrderBtn");
const adminToast = document.getElementById("adminToast");
const createOrderModal = document.getElementById("createOrderModal");
const createOrderForm = document.getElementById("createOrderForm");
const createItemsContainer = document.getElementById("createItemsContainer");
const openCreateOrderBtn = document.getElementById("openCreateOrderBtn");
const closeCreateOrderBtn = document.getElementById("closeCreateOrderBtn");
const cancelCreateOrderBtn = document.getElementById("cancelCreateOrderBtn");
const createOrderSubmitBtn = document.getElementById("createOrderSubmitBtn");
const driverFilter = document.getElementById("driverFilter");
const quoteModal = document.getElementById("quoteModal");
const closeQuoteModalBtn = document.getElementById("closeQuoteModalBtn");
const quoteModalTitle = document.getElementById("quoteModalTitle");
const quoteModalSubtitle = document.getElementById("quoteModalSubtitle");
const quoteBuilderStatus = document.getElementById("quoteBuilderStatus");
const quoteNumberInput = document.getElementById("quoteNumberInput");
const quoteLanguageSelect = document.getElementById("quoteLanguageSelect");
const quoteBankPresetSelect = document.getElementById("quoteBankPresetSelect");
const quoteCustomerNameInput = document.getElementById("quoteCustomerNameInput");
const quoteCustomerPhoneInput = document.getElementById("quoteCustomerPhoneInput");
const quoteEventDateInput = document.getElementById("quoteEventDateInput");
const quoteEventTimeInput = document.getElementById("quoteEventTimeInput");
const quoteSetupTimeInput = document.getElementById("quoteSetupTimeInput");
const quoteRentalDaysInput = document.getElementById("quoteRentalDaysInput");
const quoteEventLocationInput = document.getElementById("quoteEventLocationInput");
const quoteNotesInput = document.getElementById("quoteNotesInput");
const quoteItemsContainer = document.getElementById("quoteItemsContainer");
const quoteDeliveryChargeInput = document.getElementById("quoteDeliveryChargeInput");
const quoteDiscountInput = document.getElementById("quoteDiscountInput");
const quoteItemsTotalValue = document.getElementById("quoteItemsTotalValue");
const quoteSubtotalValue = document.getElementById("quoteSubtotalValue");
const quoteVatValue = document.getElementById("quoteVatValue");
const quoteGrandTotalValue = document.getElementById("quoteGrandTotalValue");
const quoteHistoryList = document.getElementById("quoteHistoryList");
const generateQuoteBtn = document.getElementById("generateQuoteBtn");
const sendQuoteWhatsappBtn = document.getElementById("sendQuoteWhatsappBtn");
const resetQuoteDraftBtn = document.getElementById("resetQuoteDraftBtn");

let allOrders = [];
let driversList = [];
let currentCalendarDate = new Date();
let ordersPerDayChart = null;
let ordersByStatusChart = null;
let topProductsChart = null;
let selectedOrderId = null;
let currentEditingOrder = null;
let currentPage = 1;
let activeOpsFilter = "all";
const ordersPerPage = 6;
let ordersUnsubscribe = null;
let driversUnsubscribe = null;
let isSavingEditOrder = false;
let isDeletingOrder = false;
let isCreatingOrder = false;
let currentQuoteOrder = null;
let currentQuoteVersions = [];
let quoteHistoryUnsubscribe = null;
let activeQuoteVersion = null;
let lastGeneratedQuoteData = null;
let isGeneratingQuote = false;
let isHydratingQuoteForm = false;
let hasInitializedQuoteDraft = false;
const PRODUCT_CATEGORIES = getProductCategories();
const PRODUCTS_BY_CATEGORY = buildProductsByCategory();
const PRODUCTS_BY_ID = buildProductsById();

const STATUS_META = {
  "quote-requested": { label: "Quote Requested", className: "is-quote-requested" },
  "quote-sent": { label: "Quote Sent", className: "is-quote-sent" },
  confirmed: { label: "Confirmed", className: "is-confirmed" },
  preparing: { label: "Preparing", className: "is-preparing" },
  "out-for-delivery": { label: "Out For Delivery", className: "is-out-for-delivery" },
  delivered: { label: "Delivered", className: "is-delivered" },
  cancelled: { label: "Cancelled", className: "is-cancelled" }
};

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

/* LOAD ORDERS */

function subscribeToOrders(){
  ordersUnsubscribe?.();
  ordersUnsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
    allOrders = snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data()
    }));

    syncCurrentEditingOrder();
    syncCurrentQuoteOrder();
    renderOpsPanel();
    renderDriverPanel();
    applyFilters();
    updateStats(allOrders);
    generateAnalytics();
    renderCalendar();
  }, (error) => {
    console.error("Failed to subscribe to orders:", error);
  });
}

function subscribeToDrivers(){
  driversUnsubscribe?.();
  driversUnsubscribe = onSnapshot(collection(db, "drivers"), (snapshot) => {
    driversList = snapshot.docs.map((driverDoc) => ({
      id: driverDoc.id,
      ...driverDoc.data()
    }));

    populateDriverFilter();
    renderDriverPanel();
    applyFilters();
  }, (error) => {
    console.error("Failed to subscribe to drivers:", error);
  });
}

/* RENDER TABLE */

function renderOrders(orders){
  const sortedOrders = sortOrders(orders);
  const paginatedOrders = getPaginatedOrders(sortedOrders);

  if(orders.length === 0){
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:20px;">
          No orders found
        </td>
      </tr>
    `;

    updatePaginationControls(orders.length);
    return;
  }

  tableBody.innerHTML = "";

  paginatedOrders.forEach(order => {
    const priority = getPriorityValue(order.priority);

    const row = document.createElement("tr");
    row.classList.add("order-row");

    row.innerHTML = `
    <td>${order.orderId}</td>
    <td>${order.customerName}</td>
    <td>${order.eventDate}</td>
    <td>${order.eventTime || "N/A"}</td>
    <td>${order.eventLocation}</td>
  
    <td>
      <select class="status-select no-modal" data-id="${order.id}">
          ${getStatusOptions(order.status)}
        </select>
      </td>

    <td>
      <div class="priority-cell">
        <span class="priority-badge ${getPriorityBadgeClass(priority)}">${getPriorityBadgeMarkup(priority)}</span>
        <select class="priority-select no-modal" data-id="${order.id}">
          ${getPriorityOptions(priority)}
        </select>
      </div>
    </td>

      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary edit-order-btn no-modal" data-id="${order.id}" type="button">
            Edit
          </button>

          ${order.status === "quote-requested" || order.status === "quote-sent" ? `
            <button class="btn btn-secondary quote-builder-btn no-modal" data-id="${order.id}" type="button">
              ${order.status === "quote-requested" ? "Prepare Quote" : "Open Quote"}
            </button>
          ` : ""}

          <button class="btn btn-primary wa-btn no-modal" data-id="${order.id}">
            WhatsApp
          </button>

          ${order.status === "delivered"
            ? `<span class="admin-badge no-modal completed-badge">Delivered</span>`
            : order.driver
            ? `<button class="btn btn-secondary driver-btn no-modal" data-id="${order.id}" type="button">
                Driver: ${order.driver.name}
              </button>`
            : order.status === "preparing"
              ? `<button class="btn btn-secondary assign-driver-btn no-modal" data-id="${order.id}" type="button">
                  Assign Driver
                </button>`
              : ""}

          ${order.status === "delivered" ? `
            <button class="btn btn-dark review-request-btn no-modal" data-id="${order.id}">
              Send Review Request
            </button>
          ` : ""}
        </div>
      </td>
    `;

    /* CLICK → OPEN MODAL */
    row.addEventListener("click", (e) => {

      // if clicked on something marked as no-modal → ignore
      if (e.target.closest(".no-modal")) return;
    
      openOrderModal(order);
    });

    tableBody.appendChild(row);

  });

  attachEvents();
  updatePaginationControls(orders.length);
}

function getPaginatedOrders(orders){
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * ordersPerPage;
  const end = start + ordersPerPage;

  return orders.slice(start, end);
}

function updatePaginationControls(totalOrders){
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const totalPages = Math.max(1, Math.ceil(totalOrders / ordersPerPage));

  currentPage = Math.min(currentPage, totalPages);

  if(pageInfo){
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if(prevPageBtn){
    prevPageBtn.disabled = currentPage === 1 || totalOrders === 0;
  }

  if(nextPageBtn){
    nextPageBtn.disabled = currentPage === totalPages || totalOrders === 0;
  }
}

function sortOrders(orders){
  return [...orders].sort((a, b) => {
    const timeA = getCreatedAtValue(a.createdAt);
    const timeB = getCreatedAtValue(b.createdAt);
    return timeB - timeA;
  });
}

function getCreatedAtValue(createdAt){
  if(!createdAt){
    return 0;
  }

  if(typeof createdAt.toDate === "function"){
    return createdAt.toDate().getTime();
  }

  if(typeof createdAt.seconds === "number"){
    return createdAt.seconds * 1000;
  }

  return new Date(createdAt).getTime() || 0;
}

function isToday(dateStr){
  const today = new Date();
  const date = parseEventDate(dateStr);

  return Boolean(date) && date.toDateString() === today.toDateString();
}

function isTomorrow(dateStr){
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = parseEventDate(dateStr);

  return Boolean(date) && date.toDateString() === tomorrow.toDateString();
}

function isWithinNextHours(dateStr, timeStr, hours = 3){
  const now = new Date();
  const event = parseEventDateTime(dateStr, timeStr);

  if(!event){
    return false;
  }

  const diff = (event - now) / (1000 * 60 * 60);
  return diff > 0 && diff <= hours;
}

function parseEventDate(dateStr){
  if(!dateStr){
    return null;
  }

  const parts = String(dateStr).split("-");

  if(parts.length === 3){
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(dateStr);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function parseEventDateTime(dateStr, timeStr){
  const date = parseEventDate(dateStr);

  if(!date || !timeStr){
    return null;
  }

  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if(!match){
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if(meridiem === "PM" && hours !== 12){
    hours += 12;
  }

  if(meridiem === "AM" && hours === 12){
    hours = 0;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getOpsBuckets(){
  const todayOrders = allOrders.filter(order => isToday(order.eventDate));
  const upcomingOrders = allOrders.filter(order => isWithinNextHours(order.eventDate, order.eventTime));
  const tomorrowOrders = allOrders.filter(order => isTomorrow(order.eventDate));

  return { todayOrders, upcomingOrders, tomorrowOrders };
}

function renderOpsPanel(){
  if(!opsPanel){
    return;
  }

  const { todayOrders, upcomingOrders, tomorrowOrders } = getOpsBuckets();
  const cards = [
    { key: "today", eyebrow: "Today", label: "Orders happening today", count: todayOrders.length },
    { key: "upcoming", eyebrow: "Next 3h", label: "Starting within 3 hours", count: upcomingOrders.length },
    { key: "tomorrow", eyebrow: "Tomorrow", label: "Orders scheduled tomorrow", count: tomorrowOrders.length }
  ];

  opsPanel.innerHTML = cards.map(card => `
    <button
      type="button"
      class="ops-card ${activeOpsFilter === card.key ? "is-active" : ""}"
      data-filter="${card.key}"
      aria-pressed="${activeOpsFilter === card.key ? "true" : "false"}"
    >
      <span class="ops-card-label">${card.eyebrow}</span>
      <strong class="ops-card-count">${card.count}</strong>
      <span class="ops-card-meta">${card.label}</span>
    </button>
  `).join("");

  if(opsPanelSummary){
    opsPanelSummary.textContent = activeOpsFilter === "all"
      ? `${todayOrders.length} today, ${upcomingOrders.length} in the next 3 hours, ${tomorrowOrders.length} tomorrow.`
      : `${formatOpsFilterLabel(activeOpsFilter)} filter is active. Click the same card again to clear it.`;
  }

  attachOpsPanelEvents();
}

function attachOpsPanelEvents(){
  document.querySelectorAll(".ops-card").forEach(button => {
    button.addEventListener("click", () => {
      const selectedFilter = button.dataset.filter || "all";
      activeOpsFilter = activeOpsFilter === selectedFilter ? "all" : selectedFilter;
      renderOpsPanel();
      applyFilters(true);
    });
  });
}

function formatOpsFilterLabel(filter){
  const labels = {
    today: "Today",
    upcoming: "Next 3h",
    tomorrow: "Tomorrow",
    all: "All orders"
  };

  return labels[filter] || "Selected";
}

function getPriorityValue(priority){
  const normalized = String(priority || "normal").toLowerCase().trim();

  if(normalized === "urgent" || normalized === "vip"){
    return normalized;
  }

  return "normal";
}

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function normalizePhoneForSearch(phone){
  const digits = String(phone || "").replace(/\D/g, "");

  if(!digits){
    return "";
  }

  if(digits.startsWith("971")){
    return digits.slice(3);
  }

  if(digits.startsWith("0")){
    return digits.slice(1);
  }

  return digits;
}

function getDriverFilterValue(driver){
  return driver?.uid || driver?.id || normalizeEmail(driver?.email) || normalizePhoneForSearch(driver?.phone) || "";
}

function populateDriverFilter(){
  if(!driverFilter){
    return;
  }

  const options = driversList
    .map((driver) => {
      const value = getDriverFilterValue(driver);

      if(!value){
        return null;
      }

      return {
        value,
        label: driver.name ? `${driver.name}${driver.email ? ` (${driver.email})` : driver.phone ? ` (${driver.phone})` : ""}` : (driver.email || driver.phone || "Unnamed Driver")
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.label.localeCompare(second.label));

  const currentValue = driverFilter.value || "all";
  driverFilter.innerHTML = `
    <option value="all">All Drivers</option>
    ${options.map((option) => `
      <option value="${escapeAttribute(option.value)}">${escapeHtml(option.label)}</option>
    `).join("")}
  `;

  driverFilter.value = options.some((option) => option.value === currentValue) ? currentValue : "all";
}

function getProductCategories(){
  return [...new Set(PRODUCTS.map((product) => String(product.category || "").trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
}

function buildProductsByCategory(){
  return PRODUCTS.reduce((accumulator, product) => {
    const category = String(product.category || "").trim();

    if(!category){
      return accumulator;
    }

    if(!accumulator.has(category)){
      accumulator.set(category, []);
    }

    accumulator.get(category).push(product);
    return accumulator;
  }, new Map());
}

function buildProductsById(){
  return PRODUCTS.reduce((accumulator, product) => {
    accumulator.set(String(product.id), product);
    return accumulator;
  }, new Map());
}

function getProductsForCategory(category){
  return PRODUCTS_BY_CATEGORY.get(String(category || "").trim()) || [];
}

function getCategoryOptionsMarkup(selectedCategory = ""){
  return [
    '<option value="">Select category</option>',
    ...PRODUCT_CATEGORIES.map((category) => `
      <option value="${escapeAttribute(category)}" ${category === selectedCategory ? "selected" : ""}>
        ${escapeHtml(category)}
      </option>
    `)
  ].join("");
}

function getProductOptionsMarkup(category, selectedProductId = ""){
  return [
    '<option value="">Select product</option>',
    ...getProductsForCategory(category).map((product) => `
      <option value="${product.id}" ${String(product.id) === String(selectedProductId) ? "selected" : ""}>
        ${escapeHtml(product.name)}
      </option>
    `)
  ].join("");
}

function getSelectedProduct(productId){
  return PRODUCTS_BY_ID.get(String(productId)) || null;
}

function getCreateItemRowMarkup(item = {}, index = 0){
  const selectedCategory = String(item.category || "").trim();
  const selectedProductId = item.productId ? String(item.productId) : item.id ? String(item.id) : "";
  const selectedProduct = getSelectedProduct(selectedProductId);
  const detailsText = selectedProduct
    ? [selectedProduct.measurements, selectedProduct.shortDescription].filter(Boolean).join(" - ")
    : "Select a category and product";

  return `
    <div class="edit-item-row create-item-row" data-index="${index}">
      <select class="create-item-category" aria-label="Create item category ${index + 1}">
        ${getCategoryOptionsMarkup(selectedCategory)}
      </select>
      <select class="create-item-product" aria-label="Create item product ${index + 1}" ${selectedCategory ? "" : "disabled"}>
        ${getProductOptionsMarkup(selectedCategory, selectedProductId)}
      </select>
      <input
        type="number"
        min="1"
        step="1"
        class="create-item-quantity"
        value="${Number(item.quantity) > 0 ? Number(item.quantity) : 1}"
        aria-label="Create item quantity ${index + 1}"
      />
      <button type="button" class="btn btn-dark remove-create-item-btn">Remove</button>
      <div class="create-item-details">${escapeHtml(detailsText)}</div>
    </div>
  `;
}

function refreshCreateItemRow(row, nextState = {}){
  if(!row){
    return;
  }

  const categorySelect = row.querySelector(".create-item-category");
  const productSelect = row.querySelector(".create-item-product");
  const quantityInput = row.querySelector(".create-item-quantity");
  const details = row.querySelector(".create-item-details");
  const nextCategory = nextState.category ?? categorySelect?.value ?? "";
  const nextProductId = nextState.productId ?? productSelect?.value ?? "";
  const selectedProduct = getSelectedProduct(nextProductId);

  if(categorySelect){
    categorySelect.innerHTML = getCategoryOptionsMarkup(nextCategory);
    categorySelect.value = nextCategory;
  }

  if(productSelect){
    productSelect.innerHTML = getProductOptionsMarkup(nextCategory, nextProductId);
    productSelect.disabled = !nextCategory;

    if(nextCategory && selectedProduct && selectedProduct.category === nextCategory){
      productSelect.value = String(selectedProduct.id);
    }else{
      productSelect.value = "";
    }
  }

  if(quantityInput){
    const nextQuantity = Number(nextState.quantity ?? quantityInput.value) || 1;
    quantityInput.value = String(Math.max(1, nextQuantity));
  }

  if(details){
    details.textContent = selectedProduct
      ? [selectedProduct.measurements, selectedProduct.shortDescription].filter(Boolean).join(" - ")
      : "Select a category and product";
  }
}

async function generateOrderId(){
  const counterRef = doc(db, "counters", "orderCounter");
  const counterSnap = await getDoc(counterRef);

  if(!counterSnap.exists()){
    throw new Error("Counter document not found in Firestore");
  }

  const data = counterSnap.data();
  const current = data.current || 0;
  const newNumber = current + 1;

  await updateDoc(counterRef, {
    current: newNumber
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomCode =
    letters[Math.floor(Math.random() * 26)] +
    letters[Math.floor(Math.random() * 26)] +
    Math.floor(Math.random() * 10);

  return `TAJ-${newNumber}-${randomCode}`;
}

function normalizeGoogleMapsLink(link){
  if(!link){
    return "";
  }

  const query = extractGoogleMapsQuery(link);

  if(!query){
    return String(link).trim();
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
}

function extractGoogleMapsQuery(link){
  if(!link){
    return "";
  }

  try{
    const normalizedLink = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(link)
      ? link
      : `https://${link}`;
    const url = new URL(normalizedLink);
    const qParam = url.searchParams.get("q") || url.searchParams.get("query");

    if(qParam){
      return qParam;
    }

    const atMatch = normalizedLink.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if(atMatch){
      return `${atMatch[1]},${atMatch[3]}`;
    }

    const coordMatch = normalizedLink.match(/!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/);
    if(coordMatch){
      return `${coordMatch[1]},${coordMatch[3]}`;
    }

    const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
    if(placeMatch){
      return decodeURIComponent(placeMatch[1]).replaceAll("+", " ");
    }

    const searchPathMatch = url.pathname.match(/\/maps\/search\/([^/]+)/);
    if(searchPathMatch){
      return decodeURIComponent(searchPathMatch[1]).replaceAll("+", " ");
    }

    return "";
  }catch{
    const plainQMatch = String(link).match(/[?&]q=([^&]+)/);
    if(plainQMatch){
      return decodeURIComponent(plainQMatch[1]);
    }

    return "";
  }
}

function getPriorityOptions(currentPriority){
  const priorities = [
    { value: "normal", label: "Normal" },
    { value: "urgent", label: "Urgent" },
    { value: "vip", label: "VIP" }
  ];

  return priorities.map(priority => `
    <option value="${priority.value}" ${priority.value === currentPriority ? "selected" : ""}>
      ${priority.label}
    </option>
  `).join("");
}

function getPriorityBadge(priority){
  if(priority === "urgent"){
    return "!";
  }

  if(priority === "vip"){
    return "*";
  }

  return "";
}

function getPriorityBadgeMarkup(priority){
  const badge = getPriorityBadge(priority);
  const label = formatPriorityLabel(priority);

  return badge ? `${badge} ${label}` : label;
}

function getPriorityBadgeClass(priority){
  if(priority === "urgent"){
    return "is-urgent";
  }

  if(priority === "vip"){
    return "is-vip";
  }

  return "is-normal";
}

function formatPriorityLabel(priority){
  if(priority === "urgent"){
    return "Urgent";
  }

  if(priority === "vip"){
    return "VIP";
  }

  return "Normal";
}

function getDriverWorkload(){
  const activeOrders = allOrders.filter(order =>
    order.status === "preparing" || order.status === "out-for-delivery"
  );
  const driverMap = {};

  driversList.forEach(driver => {
    const name = driver.name || "Unnamed Driver";
    driverMap[name] = {
      name,
      orders: []
    };
  });

  activeOrders.forEach(order => {
    const driverName = order.driver?.name || "Unassigned";

    if(!driverMap[driverName]){
      driverMap[driverName] = {
        name: driverName,
        orders: []
      };
    }

    driverMap[driverName].orders.push(order);
  });

  return Object.values(driverMap)
    .sort((first, second) => {
      if(second.orders.length !== first.orders.length){
        return second.orders.length - first.orders.length;
      }

      return first.name.localeCompare(second.name);
    });
}

function renderDriverPanel(){
  if(!driverPanel){
    return;
  }

  const workload = getDriverWorkload();
  const activeDriverCount = workload.filter(driver => driver.orders.length > 0 && driver.name !== "Unassigned").length;
  const unassignedCount = workload.find(driver => driver.name === "Unassigned")?.orders.length || 0;

  if(driverPanelSummary){
    if(!workload.length){
      driverPanelSummary.textContent = "No drivers or active assignments yet.";
    }else if(unassignedCount > 0){
      driverPanelSummary.textContent = `${activeDriverCount} active driver${activeDriverCount === 1 ? "" : "s"} and ${unassignedCount} unassigned active order${unassignedCount === 1 ? "" : "s"}.`;
    }else{
      driverPanelSummary.textContent = `${activeDriverCount} active driver${activeDriverCount === 1 ? "" : "s"} currently handling live orders.`;
    }
  }

  if(!workload.length){
    driverPanel.innerHTML = '<article class="driver-card is-empty">No driver workload to show yet.</article>';
    return;
  }

  driverPanel.innerHTML = workload.map(driver => `
    <article class="driver-card ${driver.orders.length > 0 ? "is-busy" : "is-available"}">
      <div class="driver-card-top">
        <strong>${driver.name}</strong>
        <span class="driver-card-badge ${driver.orders.length > 0 ? "is-busy" : "is-available"}">
          ${driver.orders.length > 0 ? "Busy" : "Available"}
        </span>
      </div>
      <div class="driver-card-count">${driver.orders.length} active order${driver.orders.length === 1 ? "" : "s"}</div>
      <div class="driver-card-meta">${driver.name === "Unassigned" ? "Needs driver assignment" : "Live order status"}</div>
      ${driver.orders.length ? `
        <div class="driver-orders-list">
          ${driver.orders.map(order => `
            <div class="driver-order-item">
              <span class="driver-order-text">${order.orderId} - ${order.customerName}</span>
              <span class="order-status">${formatStatusLabel(order.status).replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </article>
  `).join("");
}

/* STATUS OPTIONS */

function getStatusOptions(current){

  const statuses = [
    "quote-requested",
    "quote-sent",
    "confirmed",
    "preparing",
    "out-for-delivery",
    "delivered",
    "cancelled"
  ];

  return statuses.map(status => `
    <option value="${status}" ${status===current?"selected":""}>
      ${formatStatusLabel(status)}
    </option>
  `).join("");
}

/* EVENTS */

function attachEvents(){
  document.querySelectorAll(".priority-select").forEach(select => {
    select.addEventListener("change", async (event) => {
      event.stopPropagation();

      const orderId = select.dataset.id;
      const nextPriority = getPriorityValue(select.value);

      await updateDoc(doc(db, "orders", orderId), {
        priority: nextPriority
      });
      showToast("Priority updated");
    });
  });

  /* STATUS CHANGE */
  document.querySelectorAll(".status-select").forEach(select => {

    select.addEventListener("change", async (e)=>{

      e.stopPropagation();

      const orderId = e.target.dataset.id;
      const newStatus = e.target.value;

      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
      showToast("Status updated");
    });

  });

  document.querySelectorAll(".edit-order-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const order = allOrders.find(item => item.id === btn.dataset.id);
      if(order){
        openEditOrderModal(order);
      }
    });
  });

  document.querySelectorAll(".quote-builder-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const order = allOrders.find(item => item.id === btn.dataset.id);
      if(order){
        openQuoteModal(order);
      }
    });
  });

  /* WHATSAPP */
document.querySelectorAll(".wa-btn").forEach(btn => {

  btn.addEventListener("click", (e)=>{

    e.stopPropagation();

    const orderId = btn.dataset.id;
    const order = allOrders.find(o => o.id === orderId);

    const itemsText = order.items
  .map(i => `• ${i.name} × ${i.quantity}`)
  .join("\n");

// 🔥 dynamic tracking link
const trackingLink = `${window.location.origin}/pages/track.html?id=${encodeURIComponent(order.id)}`;

const message = `
Hello ${order.customerName},

Update regarding your order ${order.orderId}

Status: ${formatStatusLabel(order.status)}

Event Date: ${order.eventDate}
Location: ${order.eventLocation}

Items:
${itemsText}

Track your order here:
${trackingLink}
`;

    const cleanPhone = (order.phone || "").replace(/\D/g, "");

    let formattedPhone = cleanPhone;

    if (cleanPhone.startsWith("0")) {
      formattedPhone = "971" + cleanPhone.slice(1);
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  });

});

  document.querySelectorAll(".review-request-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const orderId = btn.dataset.id;
      const order = allOrders.find(item => item.id === orderId);

      if(!order){
        return;
      }

      const cleanPhone = (order.phone || "").replace(/\D/g, "");
      let formattedPhone = cleanPhone;

      if(cleanPhone.startsWith("0")){
        formattedPhone = "971" + cleanPhone.slice(1);
      }

      const reviewLink = `${window.location.origin}/pages/track.html?id=${encodeURIComponent(order.id)}`;
      const message = `Hello ${order.customerName},

We hope everything looked perfect for your event 🙌

We'd love your feedback - it really helps us improve.

Please leave your review here:
${reviewLink}

(It only takes 30 seconds)`;

      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
    });
  });

  document.querySelectorAll(".assign-driver-btn, .driver-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      openDriverAssignmentModal(btn.dataset.id);
    });
  });

}

/* MODAL FUNCTIONS */

function openOrderModal(order){

  document.getElementById("modalOrderTitle").textContent =
    `${order.orderId} — ${order.customerName}`;

  document.getElementById("modalPhone").textContent =
    order.phone || "N/A";

  document.getElementById("modalEventTime").textContent =
    order.eventTime || "N/A";

  document.getElementById("modalSetupTime").textContent =
    order.setupTime || "N/A";

  document.getElementById("modalNotes").textContent =
    order.notes || "None";

  document.getElementById("modalItems").innerHTML =
    order.items.map(i=>`<li>${i.name} x${i.quantity}</li>`).join("");

  /* MAP */
  document.getElementById("modalMapBtn").onclick = ()=>{
    if(order.mapLink){
      window.open(order.mapLink, "_blank");
    }
  };

  /* COPY FULL DETAILS */
  document.getElementById("modalCopyBtn").onclick = ()=>{
    const text = `
Order ID: ${order.orderId}
Customer: ${order.customerName}
Phone: ${order.phone}

Event Date: ${order.eventDate}
Event Time: ${order.eventTime}
Setup Time: ${order.setupTime}

Location: ${order.eventLocation}
Map: ${order.mapLink}

Items:
${order.items.map(i=>`${i.name} x${i.quantity}`).join("\n")}

Notes:
${order.notes || "None"}
    `;

    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  document.getElementById("orderModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeOrderModal(){
  document.getElementById("orderModal").classList.remove("active");
  document.body.style.overflow = "auto";
}

function openEditOrderModal(order){
  currentEditingOrder = order;

  if(editOrderTitle){
    editOrderTitle.textContent = `Edit ${order.orderId}`;
  }

  if(editOrderStatus){
    editOrderStatus.textContent = `${order.customerName || "Unknown customer"} • ${formatStatusLabel(order.status)}`;
  }

  if(editOrderForm){
    editOrderForm.customerName.value = order.customerName || "";
    editOrderForm.phone.value = order.phone || "";
    editOrderForm.eventDate.value = order.eventDate || "";
    editOrderForm.eventTime.value = convertTimeToInputValue(order.eventTime);
    editOrderForm.setupTime.value = convertTimeToInputValue(order.setupTime);
    editOrderForm.eventLocation.value = order.eventLocation || "";
    editOrderForm.mapLink.value = order.mapLink || "";
  }

  renderEditableItems(order.items || []);
  setEditSaveState(false);
  setEditDeleteState(false);
  editOrderModal?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeEditOrderModal(force = false){
  if(isDeletingOrder && !force){
    return;
  }

  editOrderModal?.classList.remove("active");
  currentEditingOrder = null;
  editOrderForm?.reset();
  if(editItemsContainer){
    editItemsContainer.innerHTML = "";
  }
  isSavingEditOrder = false;
  isDeletingOrder = false;
  syncEditModalActionState();
  document.body.style.overflow = "auto";
}

function openCreateOrderModal(){
  if(!createOrderModal){
    return;
  }

  resetCreateOrderForm();
  createOrderModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCreateOrderModal(force = false){
  if(isCreatingOrder && !force){
    return;
  }

  createOrderModal?.classList.remove("active");
  resetCreateOrderForm();
  document.body.style.overflow = "auto";
}

function resetCreateOrderForm(){
  createOrderForm?.reset();

  if(createOrderForm){
    createOrderForm.priority.value = "normal";
    createOrderForm.status.value = "confirmed";
  }

  renderCreateItems();
  setCreateSubmitState(false);
}

function setQuoteBuilderStatus(message, type = ""){
  if(!quoteBuilderStatus){
    return;
  }

  quoteBuilderStatus.textContent = message;
  quoteBuilderStatus.className = `quote-builder-status${type ? ` is-${type}` : ""}`;
}

function formatCurrencyDisplay(value){
  return `${QUOTE_CURRENCY} ${(Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function getTimestampValue(value){
  if(!value){
    return 0;
  }

  if(typeof value.toDate === "function"){
    return value.toDate().getTime();
  }

  if(typeof value.seconds === "number"){
    return value.seconds * 1000;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatQuoteHistoryDate(value){
  const timestamp = getTimestampValue(value);

  if(!timestamp){
    return "Just now";
  }

  return new Date(timestamp).toLocaleString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getQuoteVersionLanguageLabel(language){
  return language === "ar" ? "Arabic" : "English";
}

function populateQuoteBankPresetOptions(selectedId = "", language = quoteLanguageSelect?.value || "en"){
  if(!quoteBankPresetSelect){
    return;
  }

  const nextSelectedId = selectedId || quoteBankPresetSelect.value || QUOTE_BANK_PRESETS[0]?.id || "";
  quoteBankPresetSelect.innerHTML = QUOTE_BANK_PRESETS.map((preset) => `
    <option value="${escapeAttribute(preset.id)}" ${preset.id === nextSelectedId ? "selected" : ""}>
      ${escapeHtml(preset.label[language] || preset.label.en)}
    </option>
  `).join("");

  quoteBankPresetSelect.value = QUOTE_BANK_PRESETS.some((preset) => preset.id === nextSelectedId)
    ? nextSelectedId
    : (QUOTE_BANK_PRESETS[0]?.id || "");
}

function setQuoteOrderFields(source){
  if(!source){
    return;
  }

  if(quoteNumberInput){
    quoteNumberInput.value = source.quotationNumber || source.orderId || "";
  }

  if(quoteCustomerNameInput){
    quoteCustomerNameInput.value = source.customerName || "";
  }

  if(quoteCustomerPhoneInput){
    quoteCustomerPhoneInput.value = source.customerPhone || source.phone || "";
  }

  if(quoteEventDateInput){
    quoteEventDateInput.value = source.eventDate || "";
  }

  if(quoteEventTimeInput){
    quoteEventTimeInput.value = source.eventTime || "N/A";
  }

  if(quoteSetupTimeInput){
    quoteSetupTimeInput.value = source.setupTime || "N/A";
  }

  if(quoteEventLocationInput){
    quoteEventLocationInput.value = source.eventLocation || "";
  }

  if(quoteNotesInput){
    quoteNotesInput.value = source.notes || "None";
  }

  if(quoteModalTitle && currentQuoteOrder){
    quoteModalTitle.textContent = `Prepare Quote - ${currentQuoteOrder.orderId}`;
  }

  if(quoteModalSubtitle && currentQuoteOrder){
    quoteModalSubtitle.textContent = `${currentQuoteOrder.customerName || "Unknown customer"} • ${formatStatusLabel(currentQuoteOrder.status)}`;
  }
}

function getQuoteItemRows(){
  return Array.from(quoteItemsContainer?.querySelectorAll(".quote-item-card") || []);
}

function syncQuoteModalActionState(){
  if(generateQuoteBtn){
    generateQuoteBtn.disabled = isGeneratingQuote;
    generateQuoteBtn.textContent = isGeneratingQuote ? "Generating..." : "Generate Quote PDF";
  }

  if(sendQuoteWhatsappBtn){
    sendQuoteWhatsappBtn.disabled = isGeneratingQuote || !lastGeneratedQuoteData;
  }

  if(resetQuoteDraftBtn){
    resetQuoteDraftBtn.disabled = isGeneratingQuote;
  }

  if(closeQuoteModalBtn){
    closeQuoteModalBtn.disabled = isGeneratingQuote;
  }

  [
    quoteLanguageSelect,
    quoteBankPresetSelect,
    quoteRentalDaysInput,
    quoteDeliveryChargeInput,
    quoteDiscountInput
  ].forEach((field) => {
    if(field){
      field.disabled = isGeneratingQuote;
    }
  });

  getQuoteItemRows().forEach((row) => {
    row.querySelectorAll("input, button").forEach((control) => {
      if(control.classList.contains("quote-item-amount")){
        return;
      }

      control.disabled = isGeneratingQuote;
    });
  });
}

function renderQuoteItems(items = []){
  if(!quoteItemsContainer){
    return;
  }

  if(!items.length){
    quoteItemsContainer.innerHTML = '<div class="quote-history-empty">No valid order items available for quotation.</div>';
    updateQuoteTotals();
    syncQuoteModalActionState();
    return;
  }

  quoteItemsContainer.innerHTML = items.map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const hasUnitPrice = item.unitPrice !== "" && item.unitPrice !== null && item.unitPrice !== undefined;
    const unitPrice = hasUnitPrice ? Number(item.unitPrice) : "";
    const isEditing = Boolean(item.isEdited);
    const amount = quantity * (Number(unitPrice) || 0);

    return `
      <article class="quote-item-card ${isEditing ? "is-editing" : ""}" data-index="${index}" data-editing="${isEditing ? "true" : "false"}">
        <div class="quote-item-card-head">
          <div>
            <strong>Item ${index + 1}</strong>
            <span>Inherited from the order</span>
          </div>
          <button class="btn btn-secondary btn-small quote-item-edit-btn" data-index="${index}" type="button">
            ${isEditing ? "Lock Item" : "Edit Item"}
          </button>
        </div>
        <div class="quote-item-card-grid">
          <div class="form-group">
            <label>Item Name</label>
            <input class="quote-item-name" type="text" value="${escapeAttribute(item.name || "")}" ${isEditing ? "" : "readonly"} />
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input class="quote-item-quantity" type="number" min="1" step="1" value="${quantity}" ${isEditing ? "" : "readonly"} />
          </div>
          <div class="form-group">
            <label>Unit Price</label>
            <input class="quote-item-unit-price" type="number" min="0" step="0.01" placeholder="0.00" value="${hasUnitPrice ? unitPrice : ""}" />
          </div>
          <div class="form-group">
            <label>Amount</label>
            <input class="quote-item-amount" type="text" value="${formatCurrencyDisplay(amount)}" readonly />
          </div>
        </div>
      </article>
    `;
  }).join("");

  updateQuoteTotals();
  syncQuoteModalActionState();
}

function getQuoteItemsFromForm(){
  return getQuoteItemRows().map((row) => {
    const name = row.querySelector(".quote-item-name")?.value.trim() || "";
    const quantityValue = row.querySelector(".quote-item-quantity")?.value ?? "";
    const quantity = Number(quantityValue);
    const unitPriceRaw = row.querySelector(".quote-item-unit-price")?.value.trim() || "";
    const parsedUnitPrice = unitPriceRaw === "" ? Number.NaN : Number(unitPriceRaw);

    return {
      name,
      quantity,
      unitPrice: parsedUnitPrice,
      unitPriceRaw,
      isEdited: row.dataset.editing === "true"
    };
  });
}

function updateQuoteTotals(){
  const rawItems = getQuoteItemsFromForm();
  const safeItems = rawItems.map((item) => ({
    ...item,
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Number.isFinite(item.unitPrice) && item.unitPrice >= 0 ? item.unitPrice : 0
  }));
  const deliveryCharge = Math.max(0, Number(quoteDeliveryChargeInput?.value) || 0);
  const discount = Math.max(0, Number(quoteDiscountInput?.value) || 0);
  const totals = calculateQuoteTotals(safeItems, deliveryCharge, discount);

  totals.items.forEach((item, index) => {
    const amountInput = getQuoteItemRows()[index]?.querySelector(".quote-item-amount");

    if(amountInput){
      amountInput.value = formatCurrencyDisplay(item.amount);
    }
  });

  if(quoteItemsTotalValue){
    quoteItemsTotalValue.textContent = formatCurrencyDisplay(totals.itemsTotal);
  }

  if(quoteSubtotalValue){
    quoteSubtotalValue.textContent = formatCurrencyDisplay(totals.subtotal);
  }

  if(quoteVatValue){
    quoteVatValue.textContent = formatCurrencyDisplay(totals.vatAmount);
  }

  if(quoteGrandTotalValue){
    quoteGrandTotalValue.textContent = formatCurrencyDisplay(totals.grandTotal);
  }
}

function setQuoteWhatsappState(quoteData){
  lastGeneratedQuoteData = quoteData || null;
  syncQuoteModalActionState();
}

function loadOrderDraftIntoQuoteForm(order){
  if(!order){
    return;
  }

  isHydratingQuoteForm = true;
  activeQuoteVersion = null;
  setQuoteOrderFields(order);

  if(quoteLanguageSelect){
    quoteLanguageSelect.value = "en";
  }

  populateQuoteBankPresetOptions(QUOTE_BANK_PRESETS[0]?.id || "", "en");

  if(quoteRentalDaysInput){
    quoteRentalDaysInput.value = "1";
  }

  if(quoteDeliveryChargeInput){
    quoteDeliveryChargeInput.value = "0";
  }

  if(quoteDiscountInput){
    quoteDiscountInput.value = "0";
  }

  renderQuoteItems((order.items || []).map((item) => ({
    name: item.name || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: "",
    isEdited: false
  })));

  isHydratingQuoteForm = false;
  setQuoteWhatsappState(null);
}

function loadQuoteVersionIntoForm(quoteVersion){
  if(!quoteVersion){
    return;
  }

  isHydratingQuoteForm = true;
  activeQuoteVersion = quoteVersion;
  setQuoteOrderFields(quoteVersion);

  if(quoteLanguageSelect){
    quoteLanguageSelect.value = quoteVersion.language || "en";
  }

  populateQuoteBankPresetOptions(quoteVersion.bankPresetId || quoteVersion.bankPreset?.id || "", quoteVersion.language || "en");

  if(quoteRentalDaysInput){
    quoteRentalDaysInput.value = String(Math.max(1, Number(quoteVersion.rentalDays) || 1));
  }

  if(quoteDeliveryChargeInput){
    quoteDeliveryChargeInput.value = String(Number(quoteVersion.deliveryCharge) || 0);
  }

  if(quoteDiscountInput){
    quoteDiscountInput.value = String(Number(quoteVersion.discount) || 0);
  }

  renderQuoteItems((quoteVersion.items || []).map((item) => ({
    name: item.name || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Number(item.unitPrice) || 0,
    isEdited: Boolean(item.isEdited)
  })));

  isHydratingQuoteForm = false;
  setQuoteWhatsappState(quoteVersion);
}

function renderQuoteHistory(){
  if(!quoteHistoryList){
    return;
  }

  if(!currentQuoteVersions.length){
    quoteHistoryList.innerHTML = '<div class="quote-history-empty">No saved quotations yet.</div>';
    return;
  }

  quoteHistoryList.innerHTML = currentQuoteVersions.map((quoteVersion) => `
    <article class="quote-history-card ${activeQuoteVersion?.version === quoteVersion.version ? "is-active" : ""}">
      <div class="quote-history-card-head">
        <div>
          <strong>Version ${quoteVersion.version}</strong>
          <span>${getQuoteVersionLanguageLabel(quoteVersion.language)}</span>
        </div>
        <span>${formatCurrencyDisplay(quoteVersion.grandTotal)}</span>
      </div>
      <div class="quote-history-meta">${formatQuoteHistoryDate(quoteVersion.generatedAt || quoteVersion.generatedAtMs || quoteVersion.generatedAtISO)}</div>
      <div class="quote-history-actions">
        <button class="btn btn-secondary" type="button" data-action="open" data-version="${quoteVersion.version}">Open</button>
        <button class="btn btn-secondary" type="button" data-action="pdf" data-version="${quoteVersion.version}">PDF</button>
        <button class="btn btn-dark" type="button" data-action="whatsapp" data-version="${quoteVersion.version}">WhatsApp</button>
      </div>
    </article>
  `).join("");
}

function subscribeToQuoteHistory(order){
  quoteHistoryUnsubscribe?.();
  quoteHistoryUnsubscribe = onSnapshot(
    query(collection(db, "orders", order.id, "quotes"), orderBy("version", "desc")),
    (snapshot) => {
      currentQuoteVersions = snapshot.docs.map((quoteDoc) => ({
        id: quoteDoc.id,
        ...quoteDoc.data()
      }));

      renderQuoteHistory();

      if(!hasInitializedQuoteDraft){
        if(currentQuoteVersions.length){
          loadQuoteVersionIntoForm(currentQuoteVersions[0]);
          setQuoteBuilderStatus(`Loaded version ${currentQuoteVersions[0].version}.`, "success");
        }else{
          loadOrderDraftIntoQuoteForm(currentQuoteOrder);
          setQuoteBuilderStatus("Draft ready. Add prices and generate the quotation.", "warning");
        }

        hasInitializedQuoteDraft = true;
      }else if(lastGeneratedQuoteData){
        const savedVersion = currentQuoteVersions.find((quoteVersion) => quoteVersion.version === lastGeneratedQuoteData.version);

        if(savedVersion){
          activeQuoteVersion = savedVersion;
          setQuoteWhatsappState(savedVersion);
          renderQuoteHistory();
        }
      }
    },
    (error) => {
      console.error("Failed to subscribe to quote history:", error);
      setQuoteBuilderStatus("Could not load quote history.", "warning");
    }
  );
}

function openQuoteModal(order){
  if(!quoteModal){
    return;
  }

  currentQuoteOrder = order;
  currentQuoteVersions = [];
  activeQuoteVersion = null;
  lastGeneratedQuoteData = null;
  hasInitializedQuoteDraft = false;

  loadOrderDraftIntoQuoteForm(order);
  renderQuoteHistory();
  setQuoteBuilderStatus("Loading quote history...", "loading");
  syncQuoteModalActionState();

  quoteModal.classList.add("active");
  document.body.style.overflow = "hidden";
  subscribeToQuoteHistory(order);
}

function closeQuoteModal(force = false){
  if(isGeneratingQuote && !force){
    return;
  }

  quoteHistoryUnsubscribe?.();
  quoteHistoryUnsubscribe = null;
  currentQuoteOrder = null;
  currentQuoteVersions = [];
  activeQuoteVersion = null;
  lastGeneratedQuoteData = null;
  hasInitializedQuoteDraft = false;
  isHydratingQuoteForm = false;
  quoteModal?.classList.remove("active");
  document.body.style.overflow = "auto";
}

function syncCurrentQuoteOrder(){
  if(!currentQuoteOrder){
    return;
  }

  const nextOrder = allOrders.find((order) => order.id === currentQuoteOrder.id);

  if(!nextOrder){
    closeQuoteModal(true);
    return;
  }

  currentQuoteOrder = nextOrder;

  if(!activeQuoteVersion){
    setQuoteOrderFields(nextOrder);
  }
}

function markQuoteDraftDirty(){
  if(isHydratingQuoteForm || isGeneratingQuote){
    return;
  }

  activeQuoteVersion = null;
  setQuoteWhatsappState(null);
  renderQuoteHistory();
  setQuoteBuilderStatus("Draft updated. Generate to save a new version.", "warning");
}

function getNextQuoteVersion(){
  const existingVersions = currentQuoteVersions.map((quoteVersion) => Number(quoteVersion.version) || 0);
  const currentCounter = Number(currentQuoteOrder?.quoteVersionCounter) || 0;
  return Math.max(currentCounter, ...existingVersions, 0) + 1;
}

function getFormattedWhatsAppPhone(phone){
  const digits = String(phone || "").replace(/\D/g, "");

  if(digits.startsWith("0")){
    return `971${digits.slice(1)}`;
  }

  return digits;
}

function validateQuoteDraft(){
  if(!currentQuoteOrder){
    return null;
  }

  const items = getQuoteItemsFromForm();

  if(!items.length){
    setQuoteBuilderStatus("Add at least one valid item before generating.", "warning");
    showToast("Add at least one valid item", "warning");
    return null;
  }

  for(const [index, item] of items.entries()){
    if(!item.name){
      setQuoteBuilderStatus(`Item ${index + 1} needs a name.`, "warning");
      showToast("Each item needs a name", "warning");
      return null;
    }

    if(!Number.isFinite(item.quantity) || item.quantity < 1){
      setQuoteBuilderStatus(`Item ${index + 1} must have quantity 1 or more.`, "warning");
      showToast("Quantity must be at least 1", "warning");
      return null;
    }

    if(item.unitPriceRaw === "" || !Number.isFinite(item.unitPrice) || item.unitPrice < 0){
      setQuoteBuilderStatus(`Item ${index + 1} needs a valid unit price.`, "warning");
      showToast("Add a valid unit price for each item", "warning");
      return null;
    }
  }

  const rentalDays = Number(quoteRentalDaysInput?.value);
  const deliveryCharge = Number(quoteDeliveryChargeInput?.value);
  const discount = Number(quoteDiscountInput?.value);

  if(!Number.isFinite(rentalDays) || rentalDays < 1){
    setQuoteBuilderStatus("Rental days must be 1 or more.", "warning");
    showToast("Rental days must be at least 1", "warning");
    return null;
  }

  if(!Number.isFinite(deliveryCharge) || deliveryCharge < 0){
    setQuoteBuilderStatus("Delivery charge must be 0 or more.", "warning");
    showToast("Delivery charge must be 0 or more", "warning");
    return null;
  }

  if(!Number.isFinite(discount) || discount < 0){
    setQuoteBuilderStatus("Discount must be 0 or more.", "warning");
    showToast("Discount must be 0 or more", "warning");
    return null;
  }

  const normalizedItems = items.map((item) => ({
    name: item.name,
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Number(item.unitPrice) || 0,
    isEdited: Boolean(item.isEdited)
  }));
  const totals = calculateQuoteTotals(normalizedItems, deliveryCharge, discount);

  return {
    language: quoteLanguageSelect?.value === "ar" ? "ar" : "en",
    bankPreset: getQuoteBankPreset(quoteBankPresetSelect?.value),
    rentalDays: Math.max(1, Number(rentalDays) || 1),
    deliveryCharge,
    discount,
    totals
  };
}

function buildQuoteRecord(draft, version){
  const generatedAtMs = Date.now();
  const generatedAtISO = new Date(generatedAtMs).toISOString();
  const quotationNumber = currentQuoteOrder?.orderId || currentQuoteOrder?.id || "";
  const bankPreset = draft.bankPreset || getQuoteBankPreset(QUOTE_BANK_PRESETS[0]?.id);
  const pdfFileName = buildQuotePdfFileName(quotationNumber, version, draft.language);

  return {
    orderId: quotationNumber,
    quotationNumber,
    version,
    generatedAtMs,
    generatedAtISO,
    language: draft.language,
    languageLabel: getQuoteVersionLanguageLabel(draft.language),
    customerName: currentQuoteOrder?.customerName || "",
    customerPhone: currentQuoteOrder?.phone || "",
    eventDate: currentQuoteOrder?.eventDate || "",
    eventTime: currentQuoteOrder?.eventTime || "",
    setupTime: currentQuoteOrder?.setupTime || "",
    eventLocation: currentQuoteOrder?.eventLocation || "",
    notes: currentQuoteOrder?.notes || "",
    rentalDays: draft.rentalDays,
    items: draft.totals.items,
    itemsTotal: draft.totals.itemsTotal,
    deliveryCharge: draft.deliveryCharge,
    discount: draft.discount,
    subtotal: draft.totals.subtotal,
    vat: draft.totals.vatAmount,
    vatAmount: draft.totals.vatAmount,
    vatRate: VAT_RATE,
    grandTotal: draft.totals.grandTotal,
    bankPresetId: bankPreset.id,
    bankPresetLabel: bankPreset.label[draft.language] || bankPreset.label.en,
    bankPreset,
    pdfFileName
  };
}

function downloadBlob(blob, fileName){
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

async function downloadSavedQuotePdf(quoteVersion){
  if(!quoteVersion){
    return;
  }

  setQuoteBuilderStatus(`Generating PDF for version ${quoteVersion.version}...`, "loading");

  try{
    const pdfBlob = await generateQuotePdfBlob({
      ...quoteVersion,
      pdfFileName: quoteVersion.pdf?.fileName || quoteVersion.pdfFileName || buildQuotePdfFileName(quoteVersion.orderId, quoteVersion.version, quoteVersion.language)
    });

    downloadBlob(pdfBlob, quoteVersion.pdf?.fileName || quoteVersion.pdfFileName || buildQuotePdfFileName(quoteVersion.orderId, quoteVersion.version, quoteVersion.language));
    setQuoteBuilderStatus(`Version ${quoteVersion.version} PDF downloaded.`, "success");
  }catch(error){
    console.error("Failed to download quote PDF:", error);
    setQuoteBuilderStatus("Could not generate the PDF right now.", "warning");
    showToast("Could not generate PDF", "error");
  }
}

function openQuoteWhatsApp(quoteVersion = lastGeneratedQuoteData){
  if(!quoteVersion){
    setQuoteBuilderStatus("Generate or open a saved quote before sending on WhatsApp.", "warning");
    return;
  }

  const phone = getFormattedWhatsAppPhone(quoteVersion.customerPhone);

  if(!phone){
    setQuoteBuilderStatus("Customer phone number is missing.", "warning");
    showToast("Customer phone number is missing", "warning");
    return;
  }

  const message = quoteVersion.language === "ar"
    ? `Hello ${quoteVersion.customerName || ""},\n\nYour Arabic quotation ${quoteVersion.quotationNumber} (version ${quoteVersion.version}) is ready.\nPlease see the attached PDF.\n\nGrand Total: ${formatCurrencyDisplay(quoteVersion.grandTotal)}`
    : `Hello ${quoteVersion.customerName || ""},\n\nYour quotation ${quoteVersion.quotationNumber} (version ${quoteVersion.version}) is ready.\nPlease see the attached PDF.\n\nGrand Total: ${formatCurrencyDisplay(quoteVersion.grandTotal)}`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

async function handleGenerateQuote(){
  if(!currentQuoteOrder || isGeneratingQuote){
    return;
  }

  const draft = validateQuoteDraft();

  if(!draft){
    return;
  }

  isGeneratingQuote = true;
  syncQuoteModalActionState();
  setQuoteBuilderStatus("Generating PDF and saving quote version...", "loading");

  try{
    const version = getNextQuoteVersion();
    const quoteRecord = buildQuoteRecord(draft, version);
    const pdfBlob = await generateQuotePdfBlob(quoteRecord);
    const quotePayload = {
      ...quoteRecord,
      pdf: {
        fileName: quoteRecord.pdfFileName,
        mimeType: "application/pdf",
        size: pdfBlob.size,
        generatedLocally: true
      }
    };

    await Promise.all([
      setDoc(doc(db, "orders", currentQuoteOrder.id, "quotes", `v${version}`), {
        ...quotePayload,
        generatedAt: serverTimestamp()
      }),
      updateDoc(doc(db, "orders", currentQuoteOrder.id), {
        status: "quote-sent",
        quoteVersionCounter: version,
        latestQuoteVersion: version,
        latestQuoteLanguage: quotePayload.language,
        latestQuoteGeneratedAt: serverTimestamp(),
        latestQuoteGeneratedAtMs: quotePayload.generatedAtMs,
        latestQuoteGrandTotal: quotePayload.grandTotal,
        latestQuoteBankPresetId: quotePayload.bankPresetId
      })
    ]);

    downloadBlob(pdfBlob, quotePayload.pdfFileName);
    activeQuoteVersion = quotePayload;
    setQuoteWhatsappState(quotePayload);
    renderQuoteHistory();
    setQuoteBuilderStatus(`Version ${version} saved. PDF downloaded and ready for WhatsApp.`, "success");
    showToast("Quote saved successfully");
  }catch(error){
    console.error("Failed to generate quote:", error);
    setQuoteBuilderStatus("Could not generate and save the quotation.", "warning");
    showToast("Could not generate quote", "error");
  }finally{
    isGeneratingQuote = false;
    syncQuoteModalActionState();
  }
}

function handleQuoteHistoryAction(event){
  const actionButton = event.target.closest("button[data-action]");

  if(!actionButton || isGeneratingQuote){
    return;
  }

  const version = Number(actionButton.dataset.version);
  const quoteVersion = currentQuoteVersions.find((item) => Number(item.version) === version);

  if(!quoteVersion){
    return;
  }

  if(actionButton.dataset.action === "open"){
    loadQuoteVersionIntoForm(quoteVersion);
    renderQuoteHistory();
    setQuoteBuilderStatus(`Version ${quoteVersion.version} loaded into the builder.`, "success");
  }else if(actionButton.dataset.action === "pdf"){
    downloadSavedQuotePdf(quoteVersion);
  }else if(actionButton.dataset.action === "whatsapp"){
    openQuoteWhatsApp(quoteVersion);
  }
}

function renderEditableItems(items){
  if(!editItemsContainer){
    return;
  }

  const normalizedItems = items.length
    ? items
    : [{ name: "", category: "", quantity: 1 }];

  editItemsContainer.innerHTML = normalizedItems.map((item, index) => `
    <div class="edit-item-row" data-index="${index}">
      <input
        type="text"
        class="edit-item-name"
        value="${escapeAttribute(item.name || "")}"
        placeholder="Item name"
        aria-label="Item name ${index + 1}"
      />
      <input
        type="text"
        class="edit-item-category"
        value="${escapeAttribute(item.category || "")}"
        placeholder="Category"
        aria-label="Item category ${index + 1}"
      />
      <input
        type="number"
        min="1"
        step="1"
        class="edit-item-quantity"
        value="${Number(item.quantity) > 0 ? Number(item.quantity) : 1}"
        aria-label="Item quantity ${index + 1}"
      />
      <button type="button" class="btn btn-dark remove-edit-item-btn">Remove</button>
    </div>
  `).join("");

  attachEditableItemEvents();
}

function attachEditableItemEvents(){
  document.querySelectorAll(".remove-edit-item-btn").forEach(button => {
    button.addEventListener("click", () => {
      const rows = Array.from(document.querySelectorAll(".edit-item-row"));

      if(rows.length <= 1){
        rows[0]?.querySelector(".edit-item-name")?.focus();
        showToast("At least one item is required", "warning");
        return;
      }

      button.closest(".edit-item-row")?.remove();
    });
  });
}

function addEditableItem(){
  if(!editItemsContainer){
    return;
  }

  const itemRow = document.createElement("div");
  itemRow.className = "edit-item-row";
  itemRow.innerHTML = `
    <input type="text" class="edit-item-name" value="" placeholder="Item name" aria-label="Item name" />
    <input type="text" class="edit-item-category" value="" placeholder="Category" aria-label="Item category" />
    <input type="number" min="1" step="1" class="edit-item-quantity" value="1" aria-label="Item quantity" />
    <button type="button" class="btn btn-dark remove-edit-item-btn">Remove</button>
  `;

  editItemsContainer.appendChild(itemRow);
  attachEditableItemEvents();
  itemRow.querySelector(".edit-item-name")?.focus();
}

function getUpdatedItemsFromUI(){
  return Array.from(document.querySelectorAll(".edit-item-row"))
    .map((row) => ({
      name: row.querySelector(".edit-item-name")?.value.trim() || "",
      category: row.querySelector(".edit-item-category")?.value.trim() || "",
      quantity: Number(row.querySelector(".edit-item-quantity")?.value) || 0
    }))
    .filter((item) => item.name && item.quantity > 0);
}

function renderCreateItems(items = []){
  if(!createItemsContainer){
    return;
  }

  const normalizedItems = items.length
    ? items
    : [{ productId: "", category: "", quantity: 1 }];

  createItemsContainer.innerHTML = normalizedItems
    .map((item, index) => getCreateItemRowMarkup(item, index))
    .join("");

  attachCreateItemEvents();
}

function attachCreateItemEvents(){
  document.querySelectorAll(".create-item-category").forEach((select) => {
    if(select.dataset.bound === "true"){
      return;
    }

    select.dataset.bound = "true";
    select.addEventListener("change", () => {
      const row = select.closest(".create-item-row");
      refreshCreateItemRow(row, {
        category: select.value,
        productId: ""
      });
    });
  });

  document.querySelectorAll(".create-item-product").forEach((select) => {
    if(select.dataset.bound === "true"){
      return;
    }

    select.dataset.bound = "true";
    select.addEventListener("change", () => {
      const row = select.closest(".create-item-row");
      refreshCreateItemRow(row, {
        category: row?.querySelector(".create-item-category")?.value || "",
        productId: select.value
      });
    });
  });

  document.querySelectorAll(".remove-create-item-btn").forEach((button) => {
    if(button.dataset.bound === "true"){
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const rows = Array.from(document.querySelectorAll(".create-item-row"));

      if(rows.length <= 1){
        rows[0]?.querySelector(".create-item-category")?.focus();
        showToast("At least one item is required", "warning");
        return;
      }

      button.closest(".create-item-row")?.remove();
    });
  });
}

function addCreateItem(){
  if(!createItemsContainer){
    return;
  }

  const itemRow = document.createElement("div");
  itemRow.className = "edit-item-row create-item-row";
  itemRow.innerHTML = getCreateItemRowMarkup({
    productId: "",
    category: "",
    quantity: 1
  }, createItemsContainer.querySelectorAll(".create-item-row").length);

  createItemsContainer.appendChild(itemRow);
  attachCreateItemEvents();
  itemRow.querySelector(".create-item-category")?.focus();
}

function getCreateItemsFromUI(){
  return Array.from(document.querySelectorAll(".create-item-row"))
    .map((row) => {
      const category = row.querySelector(".create-item-category")?.value.trim() || "";
      const productId = row.querySelector(".create-item-product")?.value || "";
      const quantity = Number(row.querySelector(".create-item-quantity")?.value) || 0;
      const product = getSelectedProduct(productId);

      if(!category || !product || product.category !== category || quantity < 1){
        return null;
      }

      return {
        id: product.id,
        productId: product.id,
        name: product.name,
        category: product.category,
        measurements: product.measurements,
        shortDescription: product.shortDescription,
        images: Array.isArray(product.images) ? [...product.images] : [],
        quantity
      };
    })
    .filter(Boolean);
}

function convertTimeToInputValue(timeString){
  if(!timeString){
    return "";
  }

  const trimmed = String(timeString).trim();

  if(/^\d{2}:\d{2}$/.test(trimmed)){
    return trimmed;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if(!match){
    return "";
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if(meridiem === "PM" && hours !== 12){
    hours += 12;
  }

  if(meridiem === "AM" && hours === 12){
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function formatTimeTo12Hour(timeString){
  if(!timeString){
    return "";
  }

  const match = String(timeString).trim().match(/^(\d{1,2}):(\d{2})$/);
  if(!match){
    return String(timeString).trim();
  }

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${meridiem}`;
}

function escapeAttribute(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncCurrentEditingOrder(){
  if(!currentEditingOrder){
    return;
  }

  const nextOrder = allOrders.find((order) => order.id === currentEditingOrder.id);

  if(!nextOrder){
    closeEditOrderModal();
    return;
  }

  currentEditingOrder = nextOrder;
}

function setEditSaveState(isSaving){
  isSavingEditOrder = isSaving;
  syncEditModalActionState();
}

function setEditDeleteState(isDeleting){
  isDeletingOrder = isDeleting;
  syncEditModalActionState();
}

function syncEditModalActionState(){
  if(editSaveBtn){
    editSaveBtn.disabled = isSavingEditOrder || isDeletingOrder;
    editSaveBtn.textContent = isSavingEditOrder ? "Saving..." : "Save Changes";
  }

  if(editDeleteBtn){
    editDeleteBtn.disabled = isSavingEditOrder || isDeletingOrder;
    editDeleteBtn.textContent = isDeletingOrder ? "Deleting..." : "Delete Order";
  }

  if(closeEditOrderBtn){
    closeEditOrderBtn.disabled = isDeletingOrder;
  }

  if(cancelEditOrderBtn){
    cancelEditOrderBtn.disabled = isDeletingOrder;
  }
}

function setCreateSubmitState(isSubmitting){
  isCreatingOrder = isSubmitting;

  if(createOrderSubmitBtn){
    createOrderSubmitBtn.disabled = isSubmitting;
    createOrderSubmitBtn.textContent = isSubmitting ? "Creating..." : "Create Order";
  }

  if(closeCreateOrderBtn){
    closeCreateOrderBtn.disabled = isSubmitting;
  }

  if(cancelCreateOrderBtn){
    cancelCreateOrderBtn.disabled = isSubmitting;
  }
}

function showToast(message, type = "success"){
  if(!adminToast){
    return;
  }

  adminToast.textContent = message;
  adminToast.className = `admin-toast is-visible is-${type}`;

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    adminToast.className = "admin-toast";
  }, 2600);
}

async function handleEditOrderSubmit(event){
  event.preventDefault();

  if(!currentEditingOrder || !editOrderForm || isDeletingOrder){
    return;
  }

  const items = getUpdatedItemsFromUI();

  if(!items.length){
    showToast("Add at least one valid item", "warning");
    return;
  }

  const updatedData = {
    customerName: editOrderForm.customerName.value.trim(),
    phone: editOrderForm.phone.value.trim(),
    eventDate: editOrderForm.eventDate.value,
    eventTime: formatTimeTo12Hour(editOrderForm.eventTime.value),
    setupTime: formatTimeTo12Hour(editOrderForm.setupTime.value),
    eventLocation: editOrderForm.eventLocation.value.trim(),
    mapLink: editOrderForm.mapLink.value.trim(),
    items
  };

  setEditSaveState(true);

  try{
    await updateDoc(doc(db, "orders", currentEditingOrder.id), updatedData);
    closeEditOrderModal();
    showToast("Order updated successfully");
  }catch(error){
    console.error("Failed to update order:", error);
    showToast("Could not save changes", "error");
  }finally{
    setEditSaveState(false);
  }
}

async function handleCreateOrderSubmit(event){
  event.preventDefault();

  if(!createOrderForm || isCreatingOrder){
    return;
  }

  const customerName = createOrderForm.customerName.value.trim();
  const phone = createOrderForm.phone.value.trim();
  const eventDate = createOrderForm.eventDate.value;
  const eventLocation = createOrderForm.eventLocation.value.trim();
  const eventTime = formatTimeTo12Hour(createOrderForm.eventTime.value);
  const setupTime = formatTimeTo12Hour(createOrderForm.setupTime.value);
  const priority = getPriorityValue(createOrderForm.priority.value);
  const status = createOrderForm.status.value || "confirmed";
  const mapLink = normalizeGoogleMapsLink(createOrderForm.mapLink.value.trim());
  const notes = createOrderForm.notes.value.trim();
  const items = getCreateItemsFromUI();

  if(!customerName){
    createOrderForm.customerName.focus();
    showToast("Customer name is required", "warning");
    return;
  }

  if(!phone){
    createOrderForm.phone.focus();
    showToast("Phone is required", "warning");
    return;
  }

  if(!eventDate){
    createOrderForm.eventDate.focus();
    showToast("Event date is required", "warning");
    return;
  }

  if(!eventLocation){
    createOrderForm.eventLocation.focus();
    showToast("Event location is required", "warning");
    return;
  }

  if(!items.length){
    createItemsContainer?.querySelector(".create-item-category")?.focus();
    showToast("Add at least one valid item", "warning");
    return;
  }

  setCreateSubmitState(true);

  try{
    const orderId = await generateOrderId();
    const orderPayload = {
      orderId,
      customerName,
      phone,
      eventDate,
      eventTime,
      setupTime,
      eventLocation,
      mapLink: mapLink || "",
      notes: notes || "",
      items,
      priority,
      status,
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "orders", orderId), orderPayload);
    closeCreateOrderModal(true);
    showToast("Order created successfully");
  }catch(error){
    console.error("Failed to create order:", error);
    showToast("Could not create order", "error");
    setCreateSubmitState(false);
  }
}

async function handleDeleteOrder(){
  if(!currentEditingOrder || isDeletingOrder){
    return;
  }

  const orderIdLabel = currentEditingOrder.orderId || "this order";
  const shouldDelete = window.confirm(
    `Are you sure you want to permanently delete ${orderIdLabel}? This action cannot be undone.`
  );

  if(!shouldDelete){
    return;
  }

  setEditDeleteState(true);

  try{
    await deleteDoc(doc(db, "orders", currentEditingOrder.id));
    closeEditOrderModal(true);
    showToast("Order deleted successfully");
  }catch(error){
    console.error("Failed to delete order:", error);
    showToast("Could not delete order", "error");
    setEditDeleteState(false);
  }
}

function closeDriverModal(){
  document.getElementById("driverModal").classList.remove("active");
  selectedOrderId = null;
  document.body.style.overflow = "auto";
}

function openDriverAssignmentModal(orderId){
  selectedOrderId = orderId;

  const select = document.getElementById("driverSelect");
  const order = allOrders.find((item) => item.id === selectedOrderId);

  if(!select){
    return;
  }

  if(!driversList.length){
    select.innerHTML = '<option value="">No drivers available</option>';
    document.getElementById("confirmAssignDriver").disabled = true;
  }else{
    select.innerHTML = driversList.map((driver) => `
      <option value="${driver.id}" ${order?.driver?.uid === driver.uid || order?.driver?.phone === driver.phone ? "selected" : ""}>
        ${driver.name} (${driver.email || driver.phone})
      </option>
    `).join("");
    document.getElementById("confirmAssignDriver").disabled = false;
  }

  document.getElementById("driverModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

async function assignDriverToOrder(){
  const select = document.getElementById("driverSelect");

  if(!select || !selectedOrderId){
    return;
  }

  const selectedDriverId = select.value;
  const driver = driversList.find((item) => item.id === selectedDriverId);

  if(!driver){
    alert("Please select a driver.");
    return;
  }

  await updateDoc(doc(db, "orders", selectedOrderId), {
    driver: {
      name: driver.name,
      phone: driver.phone,
      email: normalizeEmail(driver.email),
      uid: driver.uid || ""
    }
  });

  closeDriverModal();
  showToast("Driver assigned");
}

function generateAnalytics(){
  const ordersPerDay = getOrdersPerDay();
  const ordersByStatus = getOrdersByStatus();
  const topProducts = getTopProducts();
  const busiestDayEntry = Object.entries(ordersPerDay)
    .sort((first, second) => second[1] - first[1])[0];

  if(analyticsTotalOrders){
    analyticsTotalOrders.textContent = String(allOrders.length);
  }

  if(analyticsBusiestDay){
    analyticsBusiestDay.textContent = busiestDayEntry
      ? `${busiestDayEntry[0]} (${busiestDayEntry[1]})`
      : "N/A";
  }

  renderCharts({
    ordersPerDay,
    ordersByStatus,
    topProducts
  });
}

function getOrdersPerDay(){
  return allOrders.reduce((accumulator, order) => {
    if(!order.eventDate){
      return accumulator;
    }

    accumulator[order.eventDate] = (accumulator[order.eventDate] || 0) + 1;
    return accumulator;
  }, {});
}

function getOrdersByStatus(){
  return allOrders.reduce((accumulator, order) => {
    const status = order.status || "unknown";
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});
}

function getTopProducts(){
  const products = allOrders.reduce((accumulator, order) => {
    (order.items || []).forEach(item => {
      const itemName = item.name || "Unknown Product";
      const quantity = Number(item.quantity) || 0;
      accumulator[itemName] = (accumulator[itemName] || 0) + quantity;
    });

    return accumulator;
  }, {});

  return Object.entries(products)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .reduce((accumulator, [name, quantity]) => {
      accumulator[name] = quantity;
      return accumulator;
    }, {});
}

function renderCharts(analytics){
  if(typeof Chart === "undefined"){
    return;
  }

  const perDayLabels = Object.keys(analytics.ordersPerDay).sort();
  const perDayValues = perDayLabels.map(label => analytics.ordersPerDay[label]);

  const statusLabels = Object.keys(analytics.ordersByStatus);
  const statusValues = statusLabels.map(label => analytics.ordersByStatus[label]);

  const productLabels = Object.keys(analytics.topProducts);
  const productValues = productLabels.map(label => analytics.topProducts[label]);

  ordersPerDayChart?.destroy();
  ordersByStatusChart?.destroy();
  topProductsChart?.destroy();

  if(ordersPerDayCanvas){
    ordersPerDayChart = new Chart(ordersPerDayCanvas, {
      type: "line",
      data: {
        labels: perDayLabels,
        datasets: [{
          label: "Orders",
          data: perDayValues,
          borderColor: "#a78648",
          backgroundColor: "rgba(201, 169, 106, 0.16)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  if(ordersByStatusCanvas){
    ordersByStatusChart = new Chart(ordersByStatusCanvas, {
      type: "doughnut",
      data: {
        labels: statusLabels.map(formatStatusLabel),
        datasets: [{
          data: statusValues,
          backgroundColor: statusLabels.map(getStatusColor)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }

  if(topProductsCanvas){
    topProductsChart = new Chart(topProductsCanvas, {
      type: "bar",
      data: {
        labels: productLabels,
        datasets: [{
          label: "Quantity",
          data: productValues,
          backgroundColor: "#c9a96a",
          borderRadius: 10
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }
}

function getOrdersByDate(dateString){
  return allOrders.filter(order => order.eventDate === dateString);
}

function renderCalendar(){
  if(!calendarGrid || !calendarMonthLabel){
    return;
  }

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayString = formatLocalDate(new Date());
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  calendarMonthLabel.textContent = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  calendarGrid.innerHTML = "";

  for(let index = 0; index < totalCells; index += 1){
    const dayNumber = index - startDay + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const cell = document.createElement("article");
    cell.className = "calendar-day";

    if(!isCurrentMonth){
      cell.classList.add("is-empty");
      calendarGrid.appendChild(cell);
      continue;
    }

    const dateString = formatDateParts(year, month, dayNumber);
    const dayOrders = getOrdersByDate(dateString);

    if(dateString === todayString){
      cell.classList.add("is-today");
    }

    if(dayOrders.length > 0){
      cell.classList.add("has-events");
    }

    const eventMarkup = dayOrders.map(order => {
      const statusMeta = STATUS_META[order.status] || {
        label: order.status || "unknown",
        className: ""
      };

      return `
        <button
          type="button"
          class="calendar-event ${statusMeta.className}"
          data-order-id="${order.id}"
          title="${order.customerName} | ${statusMeta.label}"
        >
          <span class="calendar-event-name">${order.customerName || "Unknown"}</span>
          <span class="calendar-event-status">${statusMeta.label}</span>
        </button>
      `;
    }).join("");

    cell.innerHTML = `
      <div class="calendar-day-header">
        <span class="calendar-day-number">${dayNumber}</span>
        <span class="calendar-day-count">${dayOrders.length ? `${dayOrders.length} event${dayOrders.length > 1 ? "s" : ""}` : ""}</span>
      </div>
      <div class="calendar-day-events">
        ${eventMarkup || '<p class="calendar-empty-text">No events</p>'}
      </div>
    `;

    calendarGrid.appendChild(cell);
  }

  attachCalendarEvents();
}

function attachCalendarEvents(){
  document.querySelectorAll(".calendar-event").forEach(button => {
    button.addEventListener("click", () => {
      const order = allOrders.find(item => item.id === button.dataset.orderId);
      if(order){
        openOrderModal(order);
      }
    });
  });
}

function changeMonth(offset){
  currentCalendarDate = new Date(
    currentCalendarDate.getFullYear(),
    currentCalendarDate.getMonth() + offset,
    1
  );

  renderCalendar();
}

function formatDateParts(year, monthIndex, day){
  const month = String(monthIndex + 1).padStart(2, "0");
  const dayValue = String(day).padStart(2, "0");
  return `${year}-${month}-${dayValue}`;
}

function formatLocalDate(date){
  return formatDateParts(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatStatusLabel(status){
  return (status || "unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusColor(status){
  const colorMap = {
    "quote-requested": "#9da1a8",
    "quote-sent": "#0f766e",
    confirmed: "#2f6ecf",
    preparing: "#d17f14",
    "out-for-delivery": "#7b4dd2",
    delivered: "#2f8b57",
    cancelled: "#c04343",
    unknown: "#8a8173"
  };

  return colorMap[status] || colorMap.unknown;
}

/* SEARCH + FILTER */

function applyFilters(resetPage = false){
  if(resetPage){
    currentPage = 1;
  }

  renderOrders(getFilteredOrders());
}

function handlePageChange(direction){
  const totalPages = Math.max(1, Math.ceil(getFilteredOrders().length / ordersPerPage));
  const nextPage = currentPage + direction;

  if(nextPage < 1 || nextPage > totalPages){
    return;
  }

  currentPage = nextPage;
  renderOrders(getFilteredOrders());
}

function getFilteredOrders(){
  const rawSearch = document.getElementById("searchInput")?.value || "";
  const search = rawSearch.toLowerCase().trim();
  const normalizedSearchPhone = normalizePhoneForSearch(rawSearch);
  const status = document.getElementById("statusFilter")?.value || "all";
  const priority = document.getElementById("priorityFilter")?.value || "all";
  const selectedDriver = driverFilter?.value || "all";

  let filtered = allOrders;

  if(activeOpsFilter === "today"){
    filtered = filtered.filter(o => isToday(o.eventDate));
  }else if(activeOpsFilter === "upcoming"){
    filtered = filtered.filter(o => isWithinNextHours(o.eventDate, o.eventTime));
  }else if(activeOpsFilter === "tomorrow"){
    filtered = filtered.filter(o => isTomorrow(o.eventDate));
  }

  if(search){
    filtered = filtered.filter((order) => {
      const orderId = String(order.orderId || "").toLowerCase();
      const customerName = String(order.customerName || "").toLowerCase();
      const normalizedPhone = normalizePhoneForSearch(order.phone);

      return (
        orderId.includes(search) ||
        customerName.includes(search) ||
        (normalizedSearchPhone ? normalizedPhone.includes(normalizedSearchPhone) : false)
      );
    });
  }

  if(status !== "all"){
    filtered = filtered.filter(o => o.status === status);
  }

  if(priority !== "all"){
    filtered = filtered.filter(o => getPriorityValue(o.priority) === priority);
  }

  if(selectedDriver !== "all"){
    filtered = filtered.filter((order) => getDriverFilterValue(order.driver) === selectedDriver);
  }

  return filtered;
}

/* STATS */

function updateStats(orders){

  const pending = orders.filter(o=>o.status==="quote-requested").length;
  const preparing = orders.filter(o=>o.status==="preparing").length;
  const delivered = orders.filter(o=>o.status==="delivered").length;

  document.querySelectorAll(".admin-card")[0].querySelector("p").textContent =
    `${pending} incoming quote requests`;

  document.querySelectorAll(".admin-card")[1].querySelector("p").textContent =
    `${preparing} orders in preparation`;

  document.querySelectorAll(".admin-card")[2].querySelector("p").textContent =
    `${delivered} delivered orders`;
}

/* INIT */

document.addEventListener("DOMContentLoaded", async ()=>{
  initMobileMenu();
  document.getElementById("closeModalBtn").addEventListener("click", closeOrderModal);
  closeEditOrderBtn?.addEventListener("click", () => closeEditOrderModal());
  cancelEditOrderBtn?.addEventListener("click", () => closeEditOrderModal());
  openCreateOrderBtn?.addEventListener("click", openCreateOrderModal);
  closeCreateOrderBtn?.addEventListener("click", () => closeCreateOrderModal());
  cancelCreateOrderBtn?.addEventListener("click", () => closeCreateOrderModal());
  closeQuoteModalBtn?.addEventListener("click", () => closeQuoteModal());
  document.getElementById("addEditItemBtn")?.addEventListener("click", addEditableItem);
  document.getElementById("addCreateItemBtn")?.addEventListener("click", addCreateItem);
  editOrderForm?.addEventListener("submit", handleEditOrderSubmit);
  createOrderForm?.addEventListener("submit", handleCreateOrderSubmit);
  editDeleteBtn?.addEventListener("click", handleDeleteOrder);
  generateQuoteBtn?.addEventListener("click", handleGenerateQuote);
  sendQuoteWhatsappBtn?.addEventListener("click", () => openQuoteWhatsApp());
  resetQuoteDraftBtn?.addEventListener("click", () => {
    if(currentQuoteOrder){
      loadOrderDraftIntoQuoteForm(currentQuoteOrder);
      renderQuoteHistory();
      setQuoteBuilderStatus("Draft reset to the latest order items.", "warning");
    }
  });
  document.getElementById("confirmAssignDriver")?.addEventListener("click", assignDriverToOrder);
  document.getElementById("prevPage")?.addEventListener("click", () => handlePageChange(-1));
  document.getElementById("nextPage")?.addEventListener("click", () => handlePageChange(1));
  prevMonthBtn?.addEventListener("click", ()=> changeMonth(-1));
  nextMonthBtn?.addEventListener("click", ()=> changeMonth(1));
  subscribeToDrivers();
  subscribeToOrders();

  document.getElementById("searchInput").addEventListener("input", () => applyFilters(true));
  document.getElementById("statusFilter").addEventListener("change", () => applyFilters(true));
  document.getElementById("priorityFilter").addEventListener("change", () => applyFilters(true));
  driverFilter?.addEventListener("change", () => applyFilters(true));
  editOrderModal?.addEventListener("click", (event) => {
    if(event.target === editOrderModal){
      closeEditOrderModal();
    }
  });
  createOrderModal?.addEventListener("click", (event) => {
    if(event.target === createOrderModal){
      closeCreateOrderModal();
    }
  });
  quoteModal?.addEventListener("click", (event) => {
    if(event.target === quoteModal){
      closeQuoteModal();
    }
  });
  quoteLanguageSelect?.addEventListener("change", () => {
    if(isHydratingQuoteForm){
      return;
    }

    populateQuoteBankPresetOptions(quoteBankPresetSelect?.value || "", quoteLanguageSelect.value);
    markQuoteDraftDirty();
  });
  quoteBankPresetSelect?.addEventListener("change", markQuoteDraftDirty);
  quoteRentalDaysInput?.addEventListener("input", markQuoteDraftDirty);
  quoteDeliveryChargeInput?.addEventListener("input", () => {
    updateQuoteTotals();
    markQuoteDraftDirty();
  });
  quoteDiscountInput?.addEventListener("input", () => {
    updateQuoteTotals();
    markQuoteDraftDirty();
  });
  quoteItemsContainer?.addEventListener("click", (event) => {
    const editButton = event.target.closest(".quote-item-edit-btn");

    if(!editButton || isGeneratingQuote){
      return;
    }

    const row = editButton.closest(".quote-item-card");

    if(!row){
      return;
    }

    const isEditing = row.dataset.editing === "true";
    const nextEditing = !isEditing;
    row.dataset.editing = nextEditing ? "true" : "false";
    row.classList.toggle("is-editing", nextEditing);

    const nameInput = row.querySelector(".quote-item-name");
    const quantityInput = row.querySelector(".quote-item-quantity");

    if(nameInput){
      nameInput.readOnly = !nextEditing;
    }

    if(quantityInput){
      quantityInput.readOnly = !nextEditing;
    }

    editButton.textContent = nextEditing ? "Lock Item" : "Edit Item";
    markQuoteDraftDirty();
  });
  quoteItemsContainer?.addEventListener("input", (event) => {
    if(!event.target.closest(".quote-item-card") || isHydratingQuoteForm){
      return;
    }

    updateQuoteTotals();
    markQuoteDraftDirty();
  });
  quoteHistoryList?.addEventListener("click", handleQuoteHistoryAction);
  renderCreateItems();
  populateQuoteBankPresetOptions();
  syncQuoteModalActionState();
});


document.getElementById("orderModal").addEventListener("click", (e)=>{
  if(e.target.id === "orderModal"){
    closeOrderModal();
  }
});

document.getElementById("driverModal")?.addEventListener("click", (e)=>{
  if(e.target.id === "driverModal"){
    closeDriverModal();
  }
});

import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.logout = function(){
  signOut(auth);
};

window.closeOrderModal = closeOrderModal;
window.closeDriverModal = closeDriverModal;
