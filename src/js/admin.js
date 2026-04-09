import { auth } from "./firebase.js";
import { PRODUCTS } from "../data/products.js";
import { QUOTE_BANK_PRESETS, QUOTE_CURRENCY, VAT_RATE, getQuoteBankPreset } from "./quote-config.js";
import { buildQuotePdfFileName, calculateQuoteTotals, generateQuotePdfBlob } from "./quote-pdf.js";
import { createLocationFieldBinding } from "./location-picker.js";
import {
  buildGoogleMapsCoordinateLink,
  formatCoordinatePair,
  getLocationCoordinates,
  getValidatedUaeCoordinates,
  normalizeGoogleMapsLink
} from "./location-utils.js";
import { initScrollTopButton } from "./scroll-top.js";
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
const operationsMapSummary = document.getElementById("operationsMapSummary");
const operationsMapContainer = document.getElementById("operationsMap");
const operationsMapEmptyState = document.getElementById("operationsMapEmptyState");
const operationsMapDriverList = document.getElementById("operationsMapDriverList");
const operationsMapActiveDrivers = document.getElementById("operationsMapActiveDrivers");
const operationsMapLiveDrivers = document.getElementById("operationsMapLiveDrivers");
const operationsMapDriversWithoutLocation = document.getElementById("operationsMapDriversWithoutLocation");
const operationsMapActiveDeliveries = document.getElementById("operationsMapActiveDeliveries");
const collectionPanelSummary = document.getElementById("collectionPanelSummary");
const collectionOrderSelect = document.getElementById("collectionOrderSelect");
const collectionDriverSelect = document.getElementById("collectionDriverSelect");
const collectionRequestNote = document.getElementById("collectionRequestNote");
const collectionRequestPreview = document.getElementById("collectionRequestPreview");
const sendCollectionRequestBtn = document.getElementById("sendCollectionRequestBtn");
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
const editPickLocationBtn = document.getElementById("editPickLocationBtn");
const createPickLocationBtn = document.getElementById("createPickLocationBtn");
const editLocationSummary = document.getElementById("editLocationSummary");
const createLocationSummary = document.getElementById("createLocationSummary");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
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
const quoteDeliveryChargeValue = document.getElementById("quoteDeliveryChargeValue");
const quoteDiscountSummaryLabel = document.getElementById("quoteDiscountSummaryLabel");
const quoteDiscountValue = document.getElementById("quoteDiscountValue");
const quoteSubtotalValue = document.getElementById("quoteSubtotalValue");
const quoteVatValue = document.getElementById("quoteVatValue");
const quoteGrandTotalValue = document.getElementById("quoteGrandTotalValue");
const quoteHistoryList = document.getElementById("quoteHistoryList");
const generateQuoteBtn = document.getElementById("generateQuoteBtn");
const sendQuoteWhatsappBtn = document.getElementById("sendQuoteWhatsappBtn");
const resetQuoteDraftBtn = document.getElementById("resetQuoteDraftBtn");
const inventoryTotalSkus = document.getElementById("inventoryTotalSkus");
const inventoryAvailableUnits = document.getElementById("inventoryAvailableUnits");
const inventoryReservedUnits = document.getElementById("inventoryReservedUnits");
const inventoryDamagedUnits = document.getElementById("inventoryDamagedUnits");
const inventoryLowStockItems = document.getElementById("inventoryLowStockItems");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const inventorySearchInput = document.getElementById("inventorySearchInput");
const inventorySourceFilter = document.getElementById("inventorySourceFilter");
const inventoryStatusFilter = document.getElementById("inventoryStatusFilter");
const addInventoryItemBtn = document.getElementById("addInventoryItemBtn");
const reservationDateFilter = document.getElementById("reservationDateFilter");
const upcomingReservationsBody = document.getElementById("upcomingReservationsBody");
const inventoryReservationsSummary = document.getElementById("inventoryReservationsSummary");
const inventoryModal = document.getElementById("inventoryModal");
const inventoryForm = document.getElementById("inventoryForm");
const inventoryModalTitle = document.getElementById("inventoryModalTitle");
const inventoryModalSubtitle = document.getElementById("inventoryModalSubtitle");
const closeInventoryModalBtn = document.getElementById("closeInventoryModalBtn");
const cancelInventoryBtn = document.getElementById("cancelInventoryBtn");
const saveInventoryBtn = document.getElementById("saveInventoryBtn");
const deleteInventoryBtn = document.getElementById("deleteInventoryBtn");
const inventoryProductSelect = document.getElementById("inventoryProductSelect");
const inventorySourceTypeSelect = document.getElementById("inventorySourceType");
const inventoryDamagedAdjustInput = document.getElementById("inventoryDamagedAdjust");
const inventoryMarkDamagedBtn = document.getElementById("inventoryMarkDamagedBtn");
const inventoryRestoreDamagedBtn = document.getElementById("inventoryRestoreDamagedBtn");
const createInventoryWarnings = document.getElementById("createInventoryWarnings");
const editInventoryWarnings = document.getElementById("editInventoryWarnings");

let allOrders = [];
let driversList = [];
let allInventoryItems = [];
let hasLoadedInventorySnapshot = false;
let currentCalendarDate = new Date();
let ordersPerDayChart = null;
let ordersByStatusChart = null;
let topProductsChart = null;
let selectedOrderId = null;
let currentEditingOrder = null;
let currentPage = 1;
let activeOpsFilter = "all";
let selectedCollectionOrderId = "";
let selectedCollectionDriverId = "";
let isSendingCollectionRequest = false;
let liveOperationsMap = null;
let liveOperationsMapLayer = null;
let operationsMapDriverMarkers = new Map();
let operationsMapHasUserMoved = false;
let operationsMapLastBoundsSignature = "";

function syncSearchClearButton(){
  if(!clearSearchBtn){
    return;
  }

  clearSearchBtn.hidden = !(searchInput?.value || "").trim();
}
const ordersPerPage = 6;
let ordersUnsubscribe = null;
let driversUnsubscribe = null;
let isSavingEditOrder = false;
let isDeletingOrder = false;
let isCreatingOrder = false;
let editLocationBinding = null;
let createLocationBinding = null;
let currentQuoteOrder = null;
let currentQuoteVersions = [];
let quoteHistoryUnsubscribe = null;
let activeQuoteVersion = null;
let lastGeneratedQuoteData = null;
let isGeneratingQuote = false;
let isHydratingQuoteForm = false;
let hasInitializedQuoteDraft = false;
let isQuoteDraftDirty = false;
let inventoryUnsubscribe = null;
let currentInventoryItemId = null;
let isSavingInventory = false;
let hasAttemptedCatalogInventorySeed = false;
let inventoryClockIntervalId = null;
let currentOpenOrderId = null;
let currentInventorySort = {
  key: "name",
  direction: "asc"
};
const PRODUCT_CATEGORIES = getProductCategories();
const PRODUCTS_BY_CATEGORY = buildProductsByCategory();
const PRODUCTS_BY_ID = buildProductsById();
// Rental inventory stays reserved until items are physically collected back.
const INVENTORY_RESERVATION_STATUSES = new Set(["confirmed", "preparing", "out-for-delivery", "delivered"]);
// Keep the warehouse location centralized so operations can update it in one place later.
const OPERATIONS_WAREHOUSE = {
  name: "Al Taj Al Malaky Warehouse",
  label: "Main Store / Warehouse",
  coordinates: {
    lat: 25.2048,
    lng: 55.2708
  }
};
const DRIVER_LOCATION_LIVE_THRESHOLD_MS = 5 * 60 * 1000;
const DEFAULT_RENTAL_DAYS = 1;
const DEFAULT_LOW_STOCK_THRESHOLD = 1;
const CATALOG_INVENTORY_DEMO_STOCK = {
  "Round Table": { totalStock: 18, damagedStock: 1, lowStockThreshold: 4 },
  "Rectangular Table": { totalStock: 5, damagedStock: 1, lowStockThreshold: 4 },
  "White Chair": { totalStock: 72, damagedStock: 6, lowStockThreshold: 14 },
  "Gold Chair": { totalStock: 12, damagedStock: 3, lowStockThreshold: 9 }
};

const STATUS_META = {
  "quote-requested": { label: "Quote Requested", className: "is-quote-requested" },
  "quote-sent": { label: "Quote Sent", className: "is-quote-sent" },
  confirmed: { label: "Confirmed", className: "is-confirmed" },
  preparing: { label: "Preparing", className: "is-preparing" },
  "out-for-delivery": { label: "Out For Delivery", className: "is-out-for-delivery" },
  delivered: { label: "Delivered", className: "is-delivered" },
  collected: { label: "Collected", className: "is-collected" },
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
  ordersUnsubscribe = onSnapshot(collection(db, "orders"), async (snapshot) => {
    allOrders = snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data()
    }));

    syncCurrentEditingOrder();
    syncCurrentQuoteOrder();
    syncOpenOrderModal();
    try{
      await syncMissingInventoryForReservableOrderItems();
    }catch(error){
      console.error("Failed to sync order inventory items:", error);
    }
    renderOpsPanel();
    renderDriverPanel();
    renderOperationsMapSection();
    renderCollectionAssignmentSection();
    renderInventoryDashboard();
    applyFilters();
    updateStats(allOrders);
    generateAnalytics();
    renderCalendar();
  }, (error) => {
    console.error("Failed to subscribe to orders:", error);
  });
}

function subscribeToInventory(){
  inventoryUnsubscribe?.();
  inventoryUnsubscribe = onSnapshot(collection(db, "inventory"), async (snapshot) => {
    allInventoryItems = snapshot.docs.map((inventoryDoc) => ({
      id: inventoryDoc.id,
      ...inventoryDoc.data()
    }));
    hasLoadedInventorySnapshot = true;

    try{
      await seedCatalogInventoryIfNeeded();
      await syncMissingInventoryForReservableOrderItems();
    }catch(error){
      console.error("Failed to prepare inventory data:", error);
    }
    renderInventoryDashboard();
    updateOrderInventoryWarnings("create");
    updateOrderInventoryWarnings("edit");
  }, (error) => {
    console.error("Failed to subscribe to inventory:", error);
    if(inventoryTableBody){
      inventoryTableBody.innerHTML = `
        <tr>
          <td colspan="11" class="inventory-empty-cell">Could not load inventory.</td>
        </tr>
      `;
    }
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
    renderOperationsMapSection();
    renderCollectionAssignmentSection();
    applyFilters();
  }, (error) => {
    console.error("Failed to subscribe to drivers:", error);
  });
}

function startInventoryClockRefresh(){
  if(inventoryClockIntervalId){
    return;
  }

  inventoryClockIntervalId = window.setInterval(() => {
    renderInventoryDashboard();
    updateOrderInventoryWarnings("create");
    updateOrderInventoryWarnings("edit");
  }, 60000);
}

/* RENDER TABLE */

function renderOrders(orders){
  const sortedOrders = sortOrders(orders);
  const paginatedOrders = getPaginatedOrders(sortedOrders);

  if(orders.length === 0){
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:20px;">
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
    <td>${getOrderRentalDays(order)}</td>
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

          ${order.status === "delivered" || order.status === "collected"
            ? `<span class="admin-badge no-modal completed-badge">${formatStatusLabel(order.status)}</span>`
            : order.driver
            ? `<button class="btn btn-secondary driver-btn no-modal" data-id="${order.id}" type="button">
                Driver: ${order.driver.name}
              </button>`
            : order.status === "preparing"
              ? `<button class="btn btn-secondary assign-driver-btn no-modal" data-id="${order.id}" type="button">
                  Assign Driver
                </button>`
              : ""}

          ${order.status === "delivered" || order.status === "collected" ? `
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

function isInCurrentWeek(dateStr){
  const date = parseEventDate(dateStr);

  if(!date){
    return false;
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
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
  const weekOrders = allOrders.filter(order => isInCurrentWeek(order.eventDate));
  const tomorrowOrders = allOrders.filter(order => isTomorrow(order.eventDate));

  return { todayOrders, weekOrders, tomorrowOrders };
}

function renderOpsPanel(){
  if(!opsPanel){
    return;
  }

  const { todayOrders, weekOrders, tomorrowOrders } = getOpsBuckets();
  const cards = [
    { key: "today", eyebrow: "Today", label: "Orders happening today", count: todayOrders.length },
    { key: "tomorrow", eyebrow: "Tomorrow", label: "Orders scheduled tomorrow", count: tomorrowOrders.length },
    { key: "week", eyebrow: "This Week", label: "Orders in the current week", count: weekOrders.length }
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
      ? `${todayOrders.length} today, ${tomorrowOrders.length} tomorrow, ${weekOrders.length} in this week.`
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
    week: "This Week",
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
  const normalizedSelectedCategory = String(selectedCategory || "").trim();
  const baseCategories = PRODUCT_CATEGORIES.includes("Custom")
    ? PRODUCT_CATEGORIES
    : [...PRODUCT_CATEGORIES, "Custom"];
  const categories = normalizedSelectedCategory && !baseCategories.includes(normalizedSelectedCategory)
    ? [normalizedSelectedCategory, ...baseCategories]
    : baseCategories;

  return [
    '<option value="">Select category</option>',
    ...categories.map((category) => `
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

function getCatalogInventoryDocId(product){
  return `catalog-${String(product.id).replace(/[^\w-]/g, "-")}`;
}

function getCatalogInventoryDemoStock(product){
  const explicitStock = CATALOG_INVENTORY_DEMO_STOCK[product.name];

  if(explicitStock){
    return explicitStock;
  }

  const isChair = normalizeInventoryText(product.category).includes("chair");
  return {
    totalStock: isChair ? 40 : 10,
    damagedStock: isChair ? 2 : 0,
    lowStockThreshold: isChair ? 8 : 2
  };
}

function hasInventoryForCatalogProduct(product){
  const productId = String(product.id);
  const productNameKey = getInventoryItemKey(product.name, "");

  return allInventoryItems.some((inventoryItem) => {
    if(inventoryItem.isArchived === true || inventoryItem.active === false){
      return false;
    }

    if(inventoryItem.productId && String(inventoryItem.productId) === productId){
      return true;
    }

    return getInventoryItemKey(inventoryItem.name, inventoryItem.variant) === productNameKey;
  });
}

async function seedCatalogInventoryIfNeeded(){
  if(hasAttemptedCatalogInventorySeed || !PRODUCTS.length){
    return;
  }

  hasAttemptedCatalogInventorySeed = true;

  const missingProducts = PRODUCTS.filter((product) => product?.name && !hasInventoryForCatalogProduct(product));

  if(!missingProducts.length){
    return;
  }

  try{
    await Promise.all(missingProducts.map(async (product) => {
      const stock = getCatalogInventoryDemoStock(product);
      const inventoryRef = doc(db, "inventory", getCatalogInventoryDocId(product));
      const inventorySnapshot = await getDoc(inventoryRef);

      if(inventorySnapshot.exists()){
        return;
      }

      await setDoc(inventoryRef, {
        id: inventoryRef.id,
        name: product.name,
        category: product.category || "Catalog",
        variant: "",
        productId: product.id,
        sourceType: "catalog",
        totalStock: stock.totalStock,
        damagedStock: stock.damagedStock,
        lowStockThreshold: stock.lowStockThreshold,
        isArchived: false,
        active: true,
        demoSeeded: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }));
  }catch(error){
    console.error("Failed to seed catalog inventory:", error);
  }
}

function getCatalogProductByName(name){
  const normalizedName = normalizeInventoryText(name);
  return PRODUCTS.find((product) => normalizeInventoryText(product.name) === normalizedName) || null;
}

function getInventoryProductOptionsMarkup(selectedProductId = ""){
  return [
    '<option value="">No catalog link</option>',
    ...PRODUCTS.map((product) => `
      <option value="${escapeAttribute(product.id)}" ${String(product.id) === String(selectedProductId || "") ? "selected" : ""}>
        ${escapeHtml(product.name)}
      </option>
    `)
  ].join("");
}

function getCreateItemProductOptionsMarkup(category, selectedProductId = "", isCustom = false){
  return [
    '<option value="">Select product</option>',
    ...getProductsForCategory(category).map((product) => `
      <option value="${escapeAttribute(product.id)}" ${String(product.id) === String(selectedProductId) ? "selected" : ""}>
        ${escapeHtml(product.name)}
      </option>
    `),
    `<option value="__custom" ${isCustom ? "selected" : ""}>Custom / internal item</option>`
  ].join("");
}

function getCreateItemRowMarkup(item = {}, index = 0){
  const selectedCategory = String(item.category || "").trim();
  const isCustom = item.sourceType === "custom" || item.isCustom || (!item.productId && item.name);
  const selectedProductId = isCustom ? "__custom" : item.productId ? String(item.productId) : item.id ? String(item.id) : "";
  const selectedProduct = getSelectedProduct(selectedProductId);
  const detailsText = selectedProduct
    ? [selectedProduct.measurements, selectedProduct.shortDescription].filter(Boolean).join(" - ")
    : isCustom
      ? "Custom inventory item will be matched or created automatically."
      : "Select a category and product";

  return `
    <div class="edit-item-row create-item-row" data-index="${index}">
      <select class="create-item-category" aria-label="Create item category ${index + 1}">
        ${getCategoryOptionsMarkup(selectedCategory)}
      </select>
      <select class="create-item-product" aria-label="Create item product ${index + 1}" ${selectedCategory ? "" : "disabled"}>
        ${getCreateItemProductOptionsMarkup(selectedCategory, selectedProductId, isCustom)}
      </select>
      <input
        type="text"
        class="create-item-custom-name"
        value="${escapeAttribute(isCustom ? item.name || "" : "")}"
        placeholder="Custom item name"
        aria-label="Create custom item name ${index + 1}"
        ${isCustom ? "" : "hidden disabled"}
      />
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
  const customNameInput = row.querySelector(".create-item-custom-name");
  const quantityInput = row.querySelector(".create-item-quantity");
  const details = row.querySelector(".create-item-details");
  const nextCategory = nextState.category ?? categorySelect?.value ?? "";
  const nextProductId = nextState.productId ?? productSelect?.value ?? "";
  const isCustom = nextProductId === "__custom";
  const selectedProduct = getSelectedProduct(nextProductId);

  if(categorySelect){
    categorySelect.innerHTML = getCategoryOptionsMarkup(nextCategory);
    categorySelect.value = nextCategory;
  }

  if(productSelect){
    productSelect.innerHTML = getCreateItemProductOptionsMarkup(nextCategory, nextProductId, isCustom);
    productSelect.disabled = !nextCategory;

    if(isCustom){
      productSelect.value = "__custom";
    }else if(nextCategory && selectedProduct && selectedProduct.category === nextCategory){
      productSelect.value = String(selectedProduct.id);
    }else{
      productSelect.value = "";
    }
  }

  if(customNameInput){
    customNameInput.hidden = !isCustom;
    customNameInput.disabled = !isCustom;
    if(isCustom && nextState.name !== undefined){
      customNameInput.value = nextState.name;
    }
  }

  if(quantityInput){
    const nextQuantity = Number(nextState.quantity ?? quantityInput.value) || 1;
    quantityInput.value = String(Math.max(1, nextQuantity));
  }

  if(details){
    details.textContent = selectedProduct
      ? [selectedProduct.measurements, selectedProduct.shortDescription].filter(Boolean).join(" - ")
      : isCustom
        ? "Custom inventory item will be matched or created automatically."
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

function getDriverOperationIdentityKeys(entity = {}){
  const keys = [];
  const uid = String(entity?.uid || "").trim().toLowerCase();
  const id = String(entity?.id || "").trim().toLowerCase();
  const email = normalizeEmail(entity?.email);
  const phone = normalizePhoneForSearch(entity?.phone);
  const name = normalizeInventoryText(entity?.name);

  if(uid){
    keys.push(`uid:${uid}`);
  }

  if(id){
    keys.push(`id:${id}`);
  }

  if(email){
    keys.push(`email:${email}`);
  }

  if(phone){
    keys.push(`phone:${phone}`);
  }

  if(name){
    keys.push(`name:${name}`);
  }

  return [...new Set(keys)];
}

function createDriverOperationEntry(source = {}, fallbackKey = "driver:unknown"){
  return {
    key: fallbackKey,
    id: String(source?.id || "").trim(),
    uid: String(source?.uid || "").trim(),
    name: String(source?.name || "").trim() || "Unnamed Driver",
    email: normalizeEmail(source?.email),
    phone: String(source?.phone || "").trim(),
    activeOrders: [],
    activeDeliveryCount: 0,
    latestLocation: null,
    lastUpdatedAtMs: 0,
    hasLocation: false,
    isLive: false,
    isStale: false,
    isOperationallyActive: false,
    state: "idle",
    modeLabel: "Idle"
  };
}

function mergeDriverOperationMeta(entry, source = {}){
  if(!entry){
    return;
  }

  const nextName = String(source?.name || "").trim();
  const nextEmail = normalizeEmail(source?.email);
  const nextPhone = String(source?.phone || "").trim();
  const nextId = String(source?.id || "").trim();
  const nextUid = String(source?.uid || "").trim();

  if(nextId && !entry.id){
    entry.id = nextId;
  }

  if(nextUid && !entry.uid){
    entry.uid = nextUid;
  }

  if(nextEmail && !entry.email){
    entry.email = nextEmail;
  }

  if(nextPhone && !entry.phone){
    entry.phone = nextPhone;
  }

  if(nextName && (!entry.name || entry.name === "Unnamed Driver" || entry.name === "Driver")){
    entry.name = nextName;
  }
}

function ensureDriverOperationEntry(registry, aliases, source = {}, fallbackKey = "driver:unknown"){
  const identityKeys = getDriverOperationIdentityKeys(source);
  const matchedKey = identityKeys.find((identityKey) => aliases.has(identityKey));
  const operationKey = matchedKey ? aliases.get(matchedKey) : (identityKeys[0] || fallbackKey);
  let entry = registry.get(operationKey);

  if(!entry){
    entry = createDriverOperationEntry(source, operationKey);
    registry.set(operationKey, entry);
  }else{
    mergeDriverOperationMeta(entry, source);
  }

  getDriverOperationIdentityKeys({
    ...entry,
    ...source
  }).forEach((identityKey) => {
    aliases.set(identityKey, operationKey);
  });

  return entry;
}

function getDriverDocumentLocationCandidate(driver = {}){
  const locationSources = [
    driver?.liveLocation,
    driver?.currentLocation,
    driver?.driverLocation,
    driver?.location,
    driver?.lastLocation
  ];

  for(const source of locationSources){
    const coordinates = getValidatedUaeCoordinates(getLocationCoordinates(source) || source);

    if(coordinates){
      return {
        coordinates,
        updatedAtMs: getTimestampValue(
          source?.updatedAt ||
          source?.lastUpdatedAt ||
          source?.timestamp ||
          driver?.locationUpdatedAt ||
          driver?.updatedAt
        )
      };
    }
  }

  return null;
}

function getOrderDriverLocationCandidate(order = {}){
  const coordinates = getValidatedUaeCoordinates(getLocationCoordinates(order?.driverLocation) || order?.driverLocation);

  if(!coordinates){
    return null;
  }

  return {
    coordinates,
    updatedAtMs: getTimestampValue(
      order?.driverLocation?.updatedAt ||
      order?.driverLocation?.lastUpdatedAt ||
      order?.driverLocation?.timestamp ||
      order?.updatedAt
    )
  };
}

function upsertDriverOperationLocation(entry, locationCandidate){
  if(!entry || !locationCandidate?.coordinates){
    return;
  }

  if(!entry.latestLocation || locationCandidate.updatedAtMs >= entry.lastUpdatedAtMs){
    entry.latestLocation = {
      lat: Number(locationCandidate.coordinates.lat),
      lng: Number(locationCandidate.coordinates.lng)
    };
    entry.lastUpdatedAtMs = locationCandidate.updatedAtMs || entry.lastUpdatedAtMs || 0;
  }
}

function getOperationsDriverState(entry){
  if(entry.activeDeliveryCount > 0){
    if(entry.hasLocation){
      return entry.isLive ? "live" : "stale";
    }

    return "no-location";
  }

  if(entry.hasLocation){
    return entry.isLive ? "live" : "stale";
  }

  return "idle";
}

function finalizeDriverOperationEntry(entry){
  const hasLocation = Boolean(entry.latestLocation);
  const locationAgeMs = hasLocation && entry.lastUpdatedAtMs
    ? Math.max(0, Date.now() - entry.lastUpdatedAtMs)
    : Number.POSITIVE_INFINITY;
  const isLive = hasLocation && locationAgeMs <= DRIVER_LOCATION_LIVE_THRESHOLD_MS;
  const isStale = hasLocation && !isLive;
  const activeOrders = [...entry.activeOrders].sort((first, second) => {
    const firstDate = String(first.eventDate || "");
    const secondDate = String(second.eventDate || "");

    if(firstDate !== secondDate){
      return firstDate.localeCompare(secondDate);
    }

    return String(first.orderId || first.id || "").localeCompare(String(second.orderId || second.id || ""));
  });
  const finalized = {
    ...entry,
    activeOrders,
    activeDeliveryCount: activeOrders.length,
    hasLocation,
    isLive,
    isStale,
    isOperationallyActive: activeOrders.length > 0 || hasLocation,
    modeLabel: activeOrders.length > 0 ? "On delivery" : hasLocation ? "Location active" : "Idle"
  };

  finalized.state = getOperationsDriverState(finalized);
  return finalized;
}

function getOperationsDriverStatusLabel(entry){
  if(entry.state === "live"){
    return entry.activeDeliveryCount > 0 ? "Live" : "Location Active";
  }

  if(entry.state === "stale"){
    return "Stale";
  }

  if(entry.state === "no-location"){
    return "No Location";
  }

  return "Idle";
}

function formatOperationsLocationAge(timestampMs){
  if(!timestampMs){
    return "No recent update";
  }

  const differenceMs = Math.max(0, Date.now() - timestampMs);
  const differenceMinutes = Math.round(differenceMs / 60000);

  if(differenceMinutes <= 1){
    return "Updated just now";
  }

  if(differenceMinutes < 60){
    return `Updated ${differenceMinutes} min ago`;
  }

  const differenceHours = Math.round(differenceMinutes / 60);

  if(differenceHours < 24){
    return `Updated ${differenceHours} hr ago`;
  }

  const differenceDays = Math.round(differenceHours / 24);
  return `Updated ${differenceDays} day${differenceDays === 1 ? "" : "s"} ago`;
}

function getOperationsMapData(){
  const registry = new Map();
  const aliases = new Map();

  driversList.forEach((driver, index) => {
    const entry = ensureDriverOperationEntry(
      registry,
      aliases,
      driver,
      `driver:${driver?.id || driver?.uid || index + 1}`
    );

    upsertDriverOperationLocation(entry, getDriverDocumentLocationCandidate(driver));
  });

  const activeOrders = allOrders.filter((order) => normalizeOrderStatusValue(order.status) === "out-for-delivery");

  activeOrders.forEach((order, index) => {
    const orderDriver = order.driver || {};
    const entry = ensureDriverOperationEntry(
      registry,
      aliases,
      orderDriver,
      `active-order-driver:${order.id || index + 1}`
    );

    mergeDriverOperationMeta(entry, orderDriver);

    if(!entry.activeOrders.some((activeOrder) => activeOrder.id === order.id)){
      entry.activeOrders.push({
        id: order.id,
        orderId: order.orderId || order.id || "N/A",
        customerName: order.customerName || "Unknown customer",
        eventDate: order.eventDate || "",
        eventLocation: order.eventLocation || "",
        status: order.status || ""
      });
    }

    upsertDriverOperationLocation(entry, getOrderDriverLocationCandidate(order));
  });

  const statePriority = {
    live: 0,
    stale: 1,
    "no-location": 2,
    idle: 3
  };
  const entries = [...registry.values()]
    .map(finalizeDriverOperationEntry)
    .sort((first, second) => {
      if(statePriority[first.state] !== statePriority[second.state]){
        return statePriority[first.state] - statePriority[second.state];
      }

      if(second.activeDeliveryCount !== first.activeDeliveryCount){
        return second.activeDeliveryCount - first.activeDeliveryCount;
      }

      return String(first.name || "").localeCompare(String(second.name || ""));
    });
  const activeEntries = entries.filter((entry) => entry.isOperationallyActive);
  const driversWithVisibleLocation = activeEntries.filter((entry) => entry.hasLocation);
  const liveEntries = activeEntries.filter((entry) => entry.isLive);
  const staleEntries = activeEntries.filter((entry) => entry.isStale);
  const noLocationEntries = activeEntries.filter((entry) => entry.activeDeliveryCount > 0 && !entry.hasLocation);

  return {
    entries,
    activeEntries,
    activeDriversCount: activeEntries.length,
    liveDriversCount: liveEntries.length,
    staleDriversCount: staleEntries.length,
    driversWithoutLocationCount: noLocationEntries.length,
    activeDeliveriesCount: activeOrders.length,
    visibleDriverEntries: driversWithVisibleLocation
  };
}

function renderOperationsMapMetrics(data){
  if(operationsMapActiveDrivers){
    operationsMapActiveDrivers.textContent = String(data.activeDriversCount);
  }

  if(operationsMapLiveDrivers){
    operationsMapLiveDrivers.textContent = String(data.liveDriversCount);
  }

  if(operationsMapDriversWithoutLocation){
    operationsMapDriversWithoutLocation.textContent = String(data.driversWithoutLocationCount);
  }

  if(operationsMapActiveDeliveries){
    operationsMapActiveDeliveries.textContent = String(data.activeDeliveriesCount);
  }

  if(!operationsMapSummary){
    return;
  }

  if(!data.activeDriversCount){
    operationsMapSummary.textContent = "No active deliveries or live driver locations right now. The map stays centered on the warehouse.";
    return;
  }

  operationsMapSummary.textContent = `${data.activeDriversCount} active driver${data.activeDriversCount === 1 ? "" : "s"}, ${data.activeDeliveriesCount} active deliver${data.activeDeliveriesCount === 1 ? "y" : "ies"}, ${data.liveDriversCount} live, ${data.staleDriversCount} stale, ${data.driversWithoutLocationCount} without location.`;
}

function getOperationsDriverListMarkup(entry){
  const orderIds = entry.activeOrders.map((order) => order.orderId || order.id).filter(Boolean);
  const stateLabel = getOperationsDriverStatusLabel(entry);
  const canFocusMap = entry.hasLocation;

  return `
    <button
      type="button"
      class="operations-driver-item is-${entry.state} ${canFocusMap ? "is-focusable" : "is-static"}"
      data-driver-key="${escapeAttribute(entry.key)}"
      aria-label="${escapeAttribute(`${entry.name || "Driver"} - ${stateLabel}`)}"
    >
      <div class="operations-driver-item-head">
        <div>
          <strong>${escapeHtml(entry.name || "Unnamed Driver")}</strong>
          <p>${escapeHtml(entry.phone || entry.email || entry.modeLabel)}</p>
        </div>
        <span class="operations-driver-state is-${entry.state}">${escapeHtml(stateLabel)}</span>
      </div>

      <div class="operations-driver-item-meta">
        <span>${entry.activeDeliveryCount} active order${entry.activeDeliveryCount === 1 ? "" : "s"}</span>
        <span>${escapeHtml(entry.hasLocation ? formatOperationsLocationAge(entry.lastUpdatedAtMs) : "Location unavailable")}</span>
      </div>

      ${orderIds.length ? `
        <div class="operations-driver-orders">
          ${orderIds.map((orderId) => `<span>${escapeHtml(orderId)}</span>`).join("")}
        </div>
      ` : `
        <div class="operations-driver-orders is-empty">
          <span>No active order assigned</span>
        </div>
      `}
    </button>
  `;
}

function renderOperationsMapDriverList(data){
  if(!operationsMapDriverList){
    return;
  }

  if(!data.entries.length){
    operationsMapDriverList.innerHTML = `
      <article class="operations-driver-empty">
        <strong>No drivers available yet</strong>
        <p>Add or load drivers to start monitoring live delivery activity here.</p>
      </article>
    `;
    return;
  }

  operationsMapDriverList.innerHTML = data.entries.map(getOperationsDriverListMarkup).join("");
}

function attachOperationsMapDriverEvents(){
  if(!operationsMapDriverList){
    return;
  }

  operationsMapDriverList.querySelectorAll(".operations-driver-item").forEach((button) => {
    button.addEventListener("click", () => {
      focusOperationsMapDriver(button.dataset.driverKey || "");
    });
  });
}

function createOperationsMapIcon(type, state = "live"){
  if(typeof window === "undefined" || !window.L){
    return null;
  }

  const markerClass = type === "warehouse"
    ? "operations-map-marker is-warehouse"
    : `operations-map-marker is-driver is-${state}`;
  const markerLabel = type === "warehouse" ? "W" : "D";

  return window.L.divIcon({
    className: "operations-map-marker-wrapper",
    html: `<div class="${markerClass}"><span>${markerLabel}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18]
  });
}

function ensureOperationsMap(){
  if(!operationsMapContainer || typeof window === "undefined" || !window.L){
    return null;
  }

  if(liveOperationsMap){
    window.setTimeout(() => {
      liveOperationsMap?.invalidateSize();
    }, 0);
    return liveOperationsMap;
  }

  operationsMapContainer.innerHTML = "";
  liveOperationsMap = window.L.map(operationsMapContainer, {
    zoomControl: true,
    scrollWheelZoom: true
  });

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(liveOperationsMap);

  liveOperationsMapLayer = window.L.layerGroup().addTo(liveOperationsMap);
  liveOperationsMap.setView(
    [OPERATIONS_WAREHOUSE.coordinates.lat, OPERATIONS_WAREHOUSE.coordinates.lng],
    11
  );

  liveOperationsMap.on("dragstart zoomstart", () => {
    operationsMapHasUserMoved = true;
  });

  window.setTimeout(() => {
    liveOperationsMap?.invalidateSize();
  }, 0);

  return liveOperationsMap;
}

function getWarehousePopupMarkup(data){
  return `
    <div class="operations-map-popup is-warehouse">
      <div class="operations-map-popup-head">
        <strong>${escapeHtml(OPERATIONS_WAREHOUSE.name)}</strong>
        <span class="operations-driver-state is-live">Warehouse</span>
      </div>
      <p>${escapeHtml(OPERATIONS_WAREHOUSE.label)}</p>
      <div class="operations-map-popup-grid">
        <div>
          <span>Active Drivers</span>
          <strong>${data.activeDriversCount}</strong>
        </div>
        <div>
          <span>Active Deliveries</span>
          <strong>${data.activeDeliveriesCount}</strong>
        </div>
      </div>
      <p>${escapeHtml(formatCoordinatePair(OPERATIONS_WAREHOUSE.coordinates))}</p>
    </div>
  `;
}

function getOperationsDriverPopupMarkup(entry){
  const orderIds = entry.activeOrders.map((order) => order.orderId || order.id).filter(Boolean);
  const lastUpdatedLabel = entry.hasLocation
    ? `${formatOperationsLocationAge(entry.lastUpdatedAtMs)} (${formatQuoteHistoryDate(entry.lastUpdatedAtMs)})`
    : "No live location shared yet";
  const modeLabel = entry.activeDeliveryCount > 0 ? "On delivery" : "Location active";
  const coordinateLink = entry.hasLocation ? buildGoogleMapsCoordinateLink(entry.latestLocation) : "";

  return `
    <div class="operations-map-popup">
      <div class="operations-map-popup-head">
        <strong>${escapeHtml(entry.name || "Unnamed Driver")}</strong>
        <span class="operations-driver-state is-${entry.state}">${escapeHtml(getOperationsDriverStatusLabel(entry))}</span>
      </div>
      <p>${escapeHtml(entry.phone || entry.email || "No direct contact saved")}</p>
      <div class="operations-map-popup-grid">
        <div>
          <span>Mode</span>
          <strong>${escapeHtml(modeLabel)}</strong>
        </div>
        <div>
          <span>Active Orders</span>
          <strong>${entry.activeDeliveryCount}</strong>
        </div>
      </div>
      <p>${escapeHtml(`Order IDs: ${orderIds.length ? orderIds.join(", ") : "None"}`)}</p>
      <p>${escapeHtml(`Last location update: ${lastUpdatedLabel}`)}</p>
      ${coordinateLink ? `
        <a class="operations-map-popup-link" href="${coordinateLink}" target="_blank" rel="noreferrer">
          Open latest location
        </a>
      ` : ""}
    </div>
  `;
}

function getOperationsMapEmptyState(data){
  if(!data.activeDriversCount){
    return {
      title: "No active drivers right now",
      copy: "The warehouse remains visible until the next delivery or collection run starts."
    };
  }

  if(!data.liveDriversCount && data.visibleDriverEntries.length){
    return {
      title: "No fresh live locations right now",
      copy: "Showing the latest known driver positions while live sharing is stale."
    };
  }

  if(!data.liveDriversCount){
    return {
      title: "No live driver locations available yet",
      copy: "Drivers have active orders, but no valid live coordinates have been shared yet."
    };
  }

  return null;
}

function renderOperationsMapCanvas(data){
  if(!operationsMapContainer){
    return;
  }

  const emptyState = getOperationsMapEmptyState(data);

  if(operationsMapEmptyState){
    operationsMapEmptyState.hidden = !emptyState;

    if(emptyState){
      operationsMapEmptyState.innerHTML = `
        <strong>${escapeHtml(emptyState.title)}</strong>
        <p>${escapeHtml(emptyState.copy)}</p>
      `;
    }
  }

  const map = ensureOperationsMap();

  if(!map || !liveOperationsMapLayer){
    return;
  }

  liveOperationsMapLayer.clearLayers();
  operationsMapDriverMarkers = new Map();

  const visibleLatLngs = [];
  const warehouseLatLng = [OPERATIONS_WAREHOUSE.coordinates.lat, OPERATIONS_WAREHOUSE.coordinates.lng];
  const warehouseMarker = window.L.marker(warehouseLatLng, {
    icon: createOperationsMapIcon("warehouse")
  }).bindPopup(getWarehousePopupMarkup(data));

  liveOperationsMapLayer.addLayer(warehouseMarker);
  visibleLatLngs.push(warehouseLatLng);

  data.visibleDriverEntries.forEach((entry) => {
    const marker = window.L.marker([entry.latestLocation.lat, entry.latestLocation.lng], {
      icon: createOperationsMapIcon("driver", entry.isLive ? "live" : "stale")
    })
      .bindPopup(getOperationsDriverPopupMarkup(entry))
      .bindTooltip(entry.name || "Driver", {
        direction: "top",
        offset: [0, -18]
      });

    liveOperationsMapLayer.addLayer(marker);
    operationsMapDriverMarkers.set(entry.key, marker);
    visibleLatLngs.push([entry.latestLocation.lat, entry.latestLocation.lng]);
  });

  const boundsSignature = [
    "warehouse",
    ...data.visibleDriverEntries.map((entry) => entry.key).sort()
  ].join("|");
  const shouldAutoFrame = !operationsMapHasUserMoved || boundsSignature !== operationsMapLastBoundsSignature;

  if(shouldAutoFrame){
    if(visibleLatLngs.length > 1){
      map.fitBounds(visibleLatLngs, {
        padding: [40, 40],
        maxZoom: 13
      });
    }else{
      map.setView(warehouseLatLng, 11);
    }
  }

  operationsMapLastBoundsSignature = boundsSignature;

  window.setTimeout(() => {
    map.invalidateSize();
  }, 0);
}

function focusOperationsMapDriver(driverKey){
  if(!driverKey || !liveOperationsMap){
    return;
  }

  const marker = operationsMapDriverMarkers.get(driverKey);

  if(!marker){
    return;
  }

  operationsMapHasUserMoved = true;
  liveOperationsMap.flyTo(marker.getLatLng(), 14, {
    duration: 0.45
  });
  marker.openPopup();
}

function renderOperationsMapSection(){
  if(!operationsMapContainer && !operationsMapDriverList){
    return;
  }

  const operationsData = getOperationsMapData();
  renderOperationsMapMetrics(operationsData);
  renderOperationsMapDriverList(operationsData);
  renderOperationsMapCanvas(operationsData);
  attachOperationsMapDriverEvents();
}

function getOrdersAwaitingCollection(){
  return [...allOrders]
    .filter((order) => normalizeOrderStatusValue(order.status) === "delivered")
    .sort((first, second) => {
      const secondDeliveredTime = getTimestampValue(second.deliveredAt);
      const firstDeliveredTime = getTimestampValue(first.deliveredAt);

      if(secondDeliveredTime !== firstDeliveredTime){
        return secondDeliveredTime - firstDeliveredTime;
      }

      return String(second.eventDate || "").localeCompare(String(first.eventDate || ""));
    });
}

function getDriverAssignmentOptionValue(driver){
  return driver?.id || driver?.uid || normalizeEmail(driver?.email) || normalizePhoneForSearch(driver?.phone) || "";
}

function getDriverAssignmentMeta(driver){
  return {
    id: driver?.id || "",
    uid: driver?.uid || "",
    name: driver?.name || "Driver",
    phone: driver?.phone || "",
    email: driver?.email || ""
  };
}

function getCurrentAdminMeta(){
  const currentUser = auth.currentUser;
  const fallbackName = currentUser?.email ? String(currentUser.email).split("@")[0] : "Admin";

  return {
    uid: currentUser?.uid || "",
    name: currentUser?.displayName || fallbackName || "Admin",
    email: currentUser?.email || "",
    phone: currentUser?.phoneNumber || ""
  };
}

function getSelectedCollectionOrder(){
  return allOrders.find((order) => order.id === selectedCollectionOrderId) || null;
}

function getSelectedCollectionDriver(){
  return driversList.find((driver) => getDriverAssignmentOptionValue(driver) === selectedCollectionDriverId) || null;
}

function syncCollectionRequestActionState(){
  if(!sendCollectionRequestBtn){
    return;
  }

  const hasValidOrder = Boolean(getSelectedCollectionOrder());
  const hasValidDriver = Boolean(getSelectedCollectionDriver());
  sendCollectionRequestBtn.disabled = isSendingCollectionRequest || !hasValidOrder || !hasValidDriver;
  sendCollectionRequestBtn.textContent = isSendingCollectionRequest ? "Sending Collection Request..." : "Send Collection Request";
}

function renderCollectionRequestPreview(){
  if(!collectionRequestPreview){
    return;
  }

  const selectedOrder = getSelectedCollectionOrder();
  const selectedDriver = getSelectedCollectionDriver();
  const pendingNote = collectionRequestNote?.value.trim() || "";

  if(!selectedOrder){
    collectionRequestPreview.innerHTML = `
      <article class="collection-preview-state is-empty">
        <strong>No delivered order selected yet</strong>
        <p>Select a delivered order and driver to preview the collection request before sending it on WhatsApp.</p>
      </article>
    `;
    syncCollectionRequestActionState();
    return;
  }

  const assignedDriver = selectedOrder.collectionRequest?.assignedDriver || null;
  const assignedAt = formatQuoteHistoryDate(selectedOrder.collectionRequest?.assignedAt);
  const note = selectedOrder.collectionRequest?.note || "";

  collectionRequestPreview.innerHTML = `
    <article class="collection-preview-state is-ready">
      <div class="collection-preview-head">
        <div>
          <span class="section-kicker">Collection Preview</span>
          <h3>${escapeHtml(selectedOrder.orderId || selectedOrder.id || "Order")}</h3>
          <p>${escapeHtml(selectedOrder.customerName || "Unknown customer")}</p>
        </div>
        <span class="inventory-status-pill is-warning">Delivered</span>
      </div>

      <div class="collection-preview-grid">
        <div>
          <span>Order ID</span>
          <strong>${escapeHtml(selectedOrder.orderId || selectedOrder.id || "N/A")}</strong>
        </div>
        <div>
          <span>Customer</span>
          <strong>${escapeHtml(selectedOrder.customerName || "Unknown customer")}</strong>
        </div>
        <div class="is-wide">
          <span>Location</span>
          <strong>${escapeHtml(selectedOrder.eventLocation || "No location recorded")}</strong>
        </div>
        <div>
          <span>Rental Days</span>
          <strong>${getOrderRentalDays(selectedOrder)}</strong>
        </div>
        <div>
          <span>Driver</span>
          <strong>${escapeHtml(selectedDriver?.name || "Select a driver")}</strong>
        </div>
      </div>

      ${assignedDriver ? `
        <div class="collection-preview-note">
          <strong>Current request</strong>
          <p>${escapeHtml(assignedDriver.name || "Driver")}${assignedDriver.phone ? ` | ${escapeHtml(assignedDriver.phone)}` : ""} assigned ${escapeHtml(assignedAt)}.</p>
          <p>${escapeHtml(note || "No note saved yet.")}</p>
        </div>
      ` : ""}
      <div class="collection-preview-note">
        <strong>WhatsApp preview</strong>
        <p>${escapeHtml(`Collection Request - Al Taj Al Malaky`)}</p>
        <p>${escapeHtml(`Order ID: ${selectedOrder.orderId || selectedOrder.id || "N/A"}`)}</p>
        <p>${escapeHtml(`Customer: ${selectedOrder.customerName || "Unknown customer"}`)}</p>
        <p>${escapeHtml(`Location: ${selectedOrder.eventLocation || "No location recorded"}`)}</p>
        <p>${escapeHtml(`Rental Days: ${getOrderRentalDays(selectedOrder)}`)}</p>
        <p>${escapeHtml(`Optional note: ${pendingNote || "None"}`)}</p>
      </div>
    </article>
  `;

  syncCollectionRequestActionState();
}

function renderCollectionAssignmentSection(){
  if(!collectionOrderSelect || !collectionDriverSelect || !collectionRequestPreview){
    return;
  }

  const awaitingOrders = getOrdersAwaitingCollection();
  const currentOrderExists = awaitingOrders.some((order) => order.id === selectedCollectionOrderId);

  if(!currentOrderExists){
    selectedCollectionOrderId = awaitingOrders[0]?.id || "";
  }

  collectionOrderSelect.innerHTML = awaitingOrders.length
    ? awaitingOrders.map((order) => `
      <option value="${escapeAttribute(order.id)}" ${order.id === selectedCollectionOrderId ? "selected" : ""}>
        ${escapeHtml(`${order.orderId || order.id} - ${order.customerName || "Unknown customer"}`)}
      </option>
    `).join("")
    : '<option value="">No delivered orders awaiting collection</option>';
  collectionOrderSelect.disabled = !awaitingOrders.length || isSendingCollectionRequest;

  const driverOptions = driversList
    .map((driver) => {
      const value = getDriverAssignmentOptionValue(driver);

      if(!value){
        return null;
      }

      return {
        value,
        label: driver.name ? `${driver.name}${driver.phone ? ` (${driver.phone})` : driver.email ? ` (${driver.email})` : ""}` : (driver.email || driver.phone || "Unnamed Driver")
      };
    })
    .filter(Boolean)
    .sort((first, second) => first.label.localeCompare(second.label));
  const currentDriverExists = driverOptions.some((driver) => driver.value === selectedCollectionDriverId);

  if(!currentDriverExists){
    selectedCollectionDriverId = "";
  }

  collectionDriverSelect.innerHTML = driverOptions.length
    ? `
      <option value="">Select a driver</option>
      ${driverOptions.map((driver) => `
        <option value="${escapeAttribute(driver.value)}" ${driver.value === selectedCollectionDriverId ? "selected" : ""}>
          ${escapeHtml(driver.label)}
        </option>
      `).join("")}
    `
    : '<option value="">No drivers available</option>';
  collectionDriverSelect.disabled = !driverOptions.length || isSendingCollectionRequest;

  if(collectionPanelSummary){
    collectionPanelSummary.textContent = awaitingOrders.length
      ? `${awaitingOrders.length} delivered order${awaitingOrders.length === 1 ? "" : "s"} awaiting collection assignment.`
      : "No delivered orders are currently awaiting collection.";
  }

  renderCollectionRequestPreview();
}

function buildCollectionRequestMessage(order, driver, note = ""){
  const cleanNote = note.trim();

  return `Collection Request - Al Taj Al Malaky

Order ID: ${order.orderId || order.id || "N/A"}
Customer: ${order.customerName || "Unknown customer"}
Location: ${order.eventLocation || "No location recorded"}
Rental Days: ${getOrderRentalDays(order)}

Use this Order ID in the driver dashboard under:
Collect an Order

Optional note: ${cleanNote || "None"}`;
}

async function handleSendCollectionRequest(){
  if(isSendingCollectionRequest){
    return;
  }

  const selectedOrder = getSelectedCollectionOrder();
  const selectedDriver = getSelectedCollectionDriver();

  if(!selectedOrder){
    showToast("Select a delivered order first", "warning");
    renderCollectionRequestPreview();
    return;
  }

  if(normalizeOrderStatusValue(selectedOrder.status) !== "delivered"){
    showToast("Only delivered orders can be assigned for collection", "warning");
    renderCollectionAssignmentSection();
    return;
  }

  if(!selectedDriver){
    showToast("Select a driver first", "warning");
    renderCollectionRequestPreview();
    return;
  }

  const whatsappPhone = getFormattedWhatsAppPhone(selectedDriver.phone);

  if(!whatsappPhone){
    showToast("Selected driver does not have a WhatsApp phone number", "warning");
    return;
  }

  isSendingCollectionRequest = true;
  syncCollectionRequestActionState();

  let whatsappWindow = null;

  try{
    whatsappWindow = window.open("about:blank", "_blank");
  }catch{
    whatsappWindow = null;
  }

  try{
    const latestOrderSnapshot = await getDoc(doc(db, "orders", selectedOrder.id));

    if(!latestOrderSnapshot.exists()){
      showToast("This order no longer exists", "error");
      renderCollectionAssignmentSection();
      if(whatsappWindow && !whatsappWindow.closed){
        whatsappWindow.close();
      }
      return;
    }

    const latestOrder = {
      id: latestOrderSnapshot.id,
      ...latestOrderSnapshot.data()
    };

    if(normalizeOrderStatusValue(latestOrder.status) !== "delivered"){
      showToast("This order is no longer eligible for collection assignment", "warning");
      renderCollectionAssignmentSection();
      if(whatsappWindow && !whatsappWindow.closed){
        whatsappWindow.close();
      }
      return;
    }

    const requestNote = collectionRequestNote?.value.trim() || "";
    const assignedBy = getCurrentAdminMeta();
    const assignedDriver = getDriverAssignmentMeta(selectedDriver);
    const message = buildCollectionRequestMessage(latestOrder, selectedDriver, requestNote);
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;

    await updateDoc(doc(db, "orders", latestOrder.id), {
      collectionRequest: {
        assigned: true,
        assignedAt: serverTimestamp(),
        assignedBy,
        assignedDriver,
        note: requestNote
      }
    });

    const localOrderIndex = allOrders.findIndex((order) => order.id === latestOrder.id);

    if(localOrderIndex >= 0){
      allOrders[localOrderIndex] = {
        ...allOrders[localOrderIndex],
        collectionRequest: {
          assigned: true,
          assignedAt: new Date(),
          assignedBy,
          assignedDriver,
          note: requestNote
        }
      };
    }

    if(whatsappWindow && !whatsappWindow.closed){
      whatsappWindow.location.href = whatsappUrl;
    }else{
      window.open(whatsappUrl, "_blank");
    }

    renderCollectionAssignmentSection();
    showToast("Collection request sent to driver", "success");
  }catch(error){
    console.error("Failed to send collection request:", error);
    if(whatsappWindow && !whatsappWindow.closed){
      whatsappWindow.close();
    }
    showToast("Could not send collection request", "error");
  }finally{
    isSendingCollectionRequest = false;
    syncCollectionRequestActionState();
  }
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
    "collected",
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
      const order = allOrders.find((item) => item.id === orderId);

      if(order){
        const draft = {
          ...order,
          status: newStatus
        };

        if(!confirmInventoryWarningsIfNeeded(draft)){
          e.target.value = order.status || "quote-requested";
          return;
        }
      }

      if(isOrderReservableForInventory({
        ...order,
        status: newStatus
      })){
        await ensureInventoryItemsForOrderItems(order?.items || []);
      }

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
Rental Days: ${getOrderRentalDays(order)}
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

function openOrderModal(order, options = {}){
  const orderModal = document.getElementById("orderModal");

  if(!orderModal || !order){
    return;
  }

  const mapUrl = getOrderMapUrl(order);
  const modalOrderTitle = document.getElementById("modalOrderTitle");
  const modalOrderSubtitle = document.getElementById("modalOrderSubtitle");
  const modalOrderIdValue = document.getElementById("modalOrderIdValue");
  const modalCopyOrderIdBtn = document.getElementById("modalCopyOrderIdBtn");
  const modalPhone = document.getElementById("modalPhone");
  const modalEventDate = document.getElementById("modalEventDate");
  const modalRentalDays = document.getElementById("modalRentalDays");
  const modalEventTime = document.getElementById("modalEventTime");
  const modalSetupTime = document.getElementById("modalSetupTime");
  const modalEventLocation = document.getElementById("modalEventLocation");
  const modalMapLink = document.getElementById("modalMapLink");
  const modalNotes = document.getElementById("modalNotes");
  const modalItems = document.getElementById("modalItems");
  const modalMapBtn = document.getElementById("modalMapBtn");
  const modalCopyBtn = document.getElementById("modalCopyBtn");

  currentOpenOrderId = order.id;
  orderModal.dataset.orderId = order.id;

  if(modalOrderTitle){
    modalOrderTitle.textContent = order.customerName || "Unknown customer";
  }

  if(modalOrderSubtitle){
    const statusLabel = formatStatusLabel(order.status);
    const eventDateLabel = order.eventDate || "date pending";
    modalOrderSubtitle.textContent = `${statusLabel} order scheduled for ${eventDateLabel}.`;
  }

  if(modalOrderIdValue){
    modalOrderIdValue.textContent = order.orderId || order.id || "";
  }

  if(modalPhone){
    modalPhone.textContent = order.phone || "N/A";
  }

  if(modalEventDate){
    modalEventDate.textContent = order.eventDate || "N/A";
  }

  if(modalRentalDays){
    modalRentalDays.textContent = String(getOrderRentalDays(order));
  }

  if(modalEventTime){
    modalEventTime.textContent = order.eventTime || "N/A";
  }

  if(modalSetupTime){
    modalSetupTime.textContent = order.setupTime || "N/A";
  }

  if(modalEventLocation){
    modalEventLocation.textContent = order.eventLocation || "N/A";
  }

  if(modalMapLink){
    if(mapUrl){
      modalMapLink.href = mapUrl;
      modalMapLink.textContent = order.mapLink ? "Open saved map pin" : "Open event location";
      modalMapLink.removeAttribute("aria-disabled");
    }else{
      modalMapLink.href = "#";
      modalMapLink.textContent = "No map link available";
      modalMapLink.setAttribute("aria-disabled", "true");
    }
  }

  if(modalNotes){
    modalNotes.textContent = order.notes || "None";
  }

  if(modalItems){
    modalItems.innerHTML = getOrderItemsListMarkup(order.items || []);
  }

  if(modalMapBtn){
    modalMapBtn.disabled = !mapUrl;
    modalMapBtn.onclick = () => {
      if(mapUrl){
        window.open(mapUrl, "_blank");
      }
    };
  }

  if(modalCopyOrderIdBtn){
    modalCopyOrderIdBtn.onclick = async () => {
      try{
        await navigator.clipboard.writeText(order.orderId || "");
        showToast("Order ID copied");
      }catch(error){
        console.error("Failed to copy order ID:", error);
        showToast("Could not copy order ID", "error");
      }
    };
  }

  if(modalCopyBtn){
    modalCopyBtn.onclick = async () => {
      const text = `
Order ID: ${order.orderId}
Customer: ${order.customerName}
Phone: ${order.phone}

Event Date: ${order.eventDate}
Rental Days: ${getOrderRentalDays(order)}
Event Time: ${order.eventTime || "N/A"}
Setup Time: ${order.setupTime || "N/A"}

Location: ${order.eventLocation}
Map: ${mapUrl || "N/A"}

Items:
${getOrderItemsText(order.items || [])}

Notes:
${order.notes || "None"}
      `;

      try{
        await navigator.clipboard.writeText(text.trim());
        showToast("Order details copied");
      }catch(error){
        console.error("Failed to copy order details:", error);
        showToast("Could not copy order details", "error");
      }
    };
  }

  orderModal.classList.add("active");

  if(!options.preserveOpenState){
    document.body.style.overflow = "hidden";
  }
}

function closeOrderModal(){
  const orderModal = document.getElementById("orderModal");
  currentOpenOrderId = null;

  if(orderModal){
    orderModal.classList.remove("active");
    delete orderModal.dataset.orderId;
  }

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
    if(editOrderForm.rentalDays){
      editOrderForm.rentalDays.value = String(getOrderRentalDays(order));
    }
    editOrderForm.eventLocation.value = order.eventLocation || "";
    editOrderForm.mapLink.value = order.mapLink || "";
  }

  editLocationBinding?.preloadFromOrder(order);

  renderEditableItems(order.items || []);
  updateOrderInventoryWarnings("edit");
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
  renderInventoryWarnings(editInventoryWarnings, []);
  editLocationBinding?.clear();
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
  renderInventoryWarnings(createInventoryWarnings, []);
  document.body.style.overflow = "auto";
}

function resetCreateOrderForm(){
  createOrderForm?.reset();

  if(createOrderForm){
    createOrderForm.priority.value = "normal";
    createOrderForm.status.value = "confirmed";
    if(createOrderForm.rentalDays){
      createOrderForm.rentalDays.value = String(DEFAULT_RENTAL_DAYS);
    }
  }

  createLocationBinding?.clear();
  renderCreateItems();
  updateOrderInventoryWarnings("create");
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

function formatPercentageDisplay(value){
  const percentage = Number(value) || 0;
  return `${percentage.toLocaleString("en-US", {
    minimumFractionDigits: percentage % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}%`;
}

function clampDiscountPercentage(value){
  const percentage = Number(value);

  if(!Number.isFinite(percentage)){
    return 0;
  }

  return Math.min(100, Math.max(0, percentage));
}

function getQuoteDiscountPercentage(source = {}){
  const explicitDiscountPercentage = Number(source.discountPercentage);

  if(Number.isFinite(explicitDiscountPercentage)){
    return clampDiscountPercentage(explicitDiscountPercentage);
  }

  if(source.discountType === "percentage"){
    return clampDiscountPercentage(source.discount);
  }

  const itemsTotal = Number(source.itemsTotal) || 0;
  const deliveryCharge = Number(source.deliveryCharge) || 0;
  const preDiscountSubtotal = Math.max(
    0,
    Number(source.preDiscountSubtotal) || (itemsTotal + deliveryCharge)
  );
  const explicitDiscountAmount = Number(source.discountAmount);
  const legacyDiscountAmount = Number(source.discount);
  const discountAmount = Number.isFinite(explicitDiscountAmount)
    ? explicitDiscountAmount
    : legacyDiscountAmount;

  if(!Number.isFinite(discountAmount) || discountAmount <= 0 || preDiscountSubtotal <= 0){
    return 0;
  }

  return clampDiscountPercentage((discountAmount / preDiscountSubtotal) * 100);
}

function getOrderMapUrl(order){
  const normalizedMapLink = normalizeGoogleMapsLink(order?.mapLink || "");

  if(normalizedMapLink){
    return normalizedMapLink;
  }

  const eventLocation = String(order?.eventLocation || "").trim();

  return eventLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(eventLocation)}`
    : "";
}

function getOrderItemsListMarkup(items = []){
  return items.length
    ? items.map((item) => `
      <li class="admin-order-item">
        <span class="admin-order-item-name">${escapeHtml(item.name || "Unnamed item")}</span>
        <span class="admin-order-item-qty">x${Math.max(1, Number(item.quantity) || 1)}</span>
      </li>
    `).join("")
    : `
      <li class="admin-order-item is-empty">
        <span class="admin-order-item-name">No items added</span>
      </li>
    `;
}

function getOrderItemsText(items = []){
  return items.length
    ? items.map((item) => `- ${item.name || "Unnamed item"} x${Math.max(1, Number(item.quantity) || 1)}`).join("\n")
    : "- No items added";
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

async function getLatestOrderData(orderOrId){
  const orderId = typeof orderOrId === "string" ? orderOrId : orderOrId?.id;

  if(!orderId){
    return null;
  }

  const fallbackOrder = allOrders.find((order) => order.id === orderId) || (typeof orderOrId === "object" ? orderOrId : null);

  try{
    const orderSnapshot = await getDoc(doc(db, "orders", orderId));

    if(orderSnapshot.exists()){
      const latestOrder = {
        id: orderSnapshot.id,
        ...orderSnapshot.data()
      };
      upsertOrderInAdminState(latestOrder);
      return latestOrder;
    }
  }catch(error){
    console.error("Failed to load the latest order data:", error);
  }

  return fallbackOrder;
}

function wrapInputWithSuffix(input, suffixText, wrapperClass = "currency-input-wrap", suffixClass = "currency-input-suffix"){
  if(!input || input.closest(".currency-input-wrap")){
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = wrapperClass;
  input.parentNode?.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const suffix = document.createElement("span");
  suffix.className = suffixClass;
  suffix.textContent = suffixText;
  wrapper.appendChild(suffix);
}

function wrapInputWithCurrency(input, currency = QUOTE_CURRENCY){
  wrapInputWithSuffix(input, currency);
}

function upsertOrderInAdminState(order){
  if(!order?.id){
    return;
  }

  const nextOrder = {
    ...order
  };
  const existingIndex = allOrders.findIndex((item) => item.id === nextOrder.id);

  if(existingIndex >= 0){
    allOrders = [
      ...allOrders.slice(0, existingIndex),
      {
        ...allOrders[existingIndex],
        ...nextOrder
      },
      ...allOrders.slice(existingIndex + 1)
    ];
  }else{
    allOrders = [...allOrders, nextOrder];
  }
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

function autoResizeQuoteItemName(field){
  if(!field){
    return;
  }

  field.style.height = "54px";
  field.style.height = `${Math.max(54, field.scrollHeight)}px`;
}

function syncQuoteItemNameHeights(){
  getQuoteItemRows().forEach((row) => {
    autoResizeQuoteItemName(row.querySelector(".quote-item-name"));
  });
}

function initAdminLocationBindings(){
  if(!editLocationBinding && editOrderForm?.eventLocation && editOrderForm?.mapLink && editPickLocationBtn && editLocationSummary){
    editLocationBinding = createLocationFieldBinding({
      triggerButton: editPickLocationBtn,
      summaryContainer: editLocationSummary,
      eventLocationInput: editOrderForm.eventLocation,
      mapLinkInput: editOrderForm.mapLink,
      pickerTitle: "Update Event Location",
      pickerSubtitle: "Search for the venue in the UAE or tap directly on the map to place the exact delivery destination.",
      summaryTitle: "Selected Tracking Location"
    });
  }

  if(!createLocationBinding && createOrderForm?.eventLocation && createOrderForm?.mapLink && createPickLocationBtn && createLocationSummary){
    createLocationBinding = createLocationFieldBinding({
      triggerButton: createPickLocationBtn,
      summaryContainer: createLocationSummary,
      eventLocationInput: createOrderForm.eventLocation,
      mapLinkInput: createOrderForm.mapLink,
      pickerTitle: "Pick Event Location",
      pickerSubtitle: "Search for the venue in the UAE or tap directly on the map to place the exact delivery destination.",
      summaryTitle: "Selected Tracking Location"
    });
  }
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
    row.querySelectorAll("input, textarea, button").forEach((control) => {
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
            <span>${isEditing ? "Edited in the quote draft" : "Inherited from the latest saved order"}</span>
          </div>
          <button class="btn btn-secondary btn-small quote-item-edit-btn" data-index="${index}" type="button">
            ${isEditing ? "Lock Item" : "Edit Item"}
          </button>
        </div>
        <div class="quote-item-card-grid">
          <div class="form-group quote-item-name-group">
            <label>Item Name</label>
            <textarea class="quote-item-name" rows="1" ${isEditing ? "" : "readonly"}>${escapeHtml(item.name || "")}</textarea>
          </div>
          <div class="form-group quote-item-quantity-group">
            <label>Quantity</label>
            <input class="quote-item-quantity" type="number" min="1" step="1" value="${quantity}" ${isEditing ? "" : "readonly"} />
          </div>
          <div class="form-group quote-item-unit-price-group">
            <label>Unit Price</label>
            <div class="currency-input-wrap">
              <input class="quote-item-unit-price" type="number" min="0" step="0.01" placeholder="0.00" value="${hasUnitPrice ? unitPrice : ""}" />
              <span class="currency-input-suffix">${QUOTE_CURRENCY}</span>
            </div>
          </div>
          <div class="form-group quote-item-amount-group">
            <label>Amount</label>
            <input class="quote-item-amount" type="text" value="${formatCurrencyDisplay(amount)}" readonly />
          </div>
        </div>
      </article>
    `;
  }).join("");

  updateQuoteTotals();
  syncQuoteItemNameHeights();
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
  const discountPercentage = clampDiscountPercentage(quoteDiscountInput?.value);
  const totals = calculateQuoteTotals(safeItems, deliveryCharge, discountPercentage);

  totals.items.forEach((item, index) => {
    const amountInput = getQuoteItemRows()[index]?.querySelector(".quote-item-amount");

    if(amountInput){
      amountInput.value = formatCurrencyDisplay(item.amount);
    }
  });

  if(quoteItemsTotalValue){
    quoteItemsTotalValue.textContent = formatCurrencyDisplay(totals.itemsTotal);
  }

  if(quoteDeliveryChargeValue){
    quoteDeliveryChargeValue.textContent = formatCurrencyDisplay(totals.deliveryCharge);
  }

  if(quoteDiscountSummaryLabel){
    quoteDiscountSummaryLabel.textContent = `Discount (${formatPercentageDisplay(totals.discountPercentage)})`;
  }

  if(quoteDiscountValue){
    quoteDiscountValue.textContent = `- ${formatCurrencyDisplay(totals.discountAmount)}`;
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
  isQuoteDraftDirty = false;
  activeQuoteVersion = null;
  setQuoteOrderFields(order);

  if(quoteLanguageSelect){
    quoteLanguageSelect.value = "en";
  }

  populateQuoteBankPresetOptions(QUOTE_BANK_PRESETS[0]?.id || "", "en");

  if(quoteRentalDaysInput){
    quoteRentalDaysInput.value = String(getOrderRentalDays(order));
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
  isQuoteDraftDirty = false;
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
    quoteDiscountInput.value = String(getQuoteDiscountPercentage(quoteVersion));
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
        loadOrderDraftIntoQuoteForm(currentQuoteOrder);
        setQuoteBuilderStatus(
          currentQuoteVersions.length
            ? "Draft ready from the latest saved order. Open history to reuse an older version."
            : "Draft ready. Add prices and generate the quotation.",
          "warning"
        );

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

async function openQuoteModal(order){
  if(!quoteModal){
    return;
  }

  const latestOrder = await getLatestOrderData(order);

  if(!latestOrder){
    showToast("Could not load the latest order", "error");
    return;
  }

  currentQuoteOrder = latestOrder;
  currentQuoteVersions = [];
  activeQuoteVersion = null;
  lastGeneratedQuoteData = null;
  hasInitializedQuoteDraft = false;

  loadOrderDraftIntoQuoteForm(latestOrder);
  renderQuoteHistory();
  setQuoteBuilderStatus("Loading quote history...", "loading");
  syncQuoteModalActionState();

  quoteModal.classList.add("active");
  document.body.style.overflow = "hidden";
  subscribeToQuoteHistory(latestOrder);
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
  isQuoteDraftDirty = false;
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

    if(quoteRentalDaysInput && !isGeneratingQuote && !isHydratingQuoteForm && !isQuoteDraftDirty){
      quoteRentalDaysInput.value = String(getOrderRentalDays(nextOrder));
    }
  }
}

function syncOpenOrderModal(){
  const orderModal = document.getElementById("orderModal");

  if(!orderModal?.classList.contains("active") || !currentOpenOrderId){
    return;
  }

  const latestOrder = allOrders.find((order) => order.id === currentOpenOrderId);

  if(!latestOrder){
    closeOrderModal();
    return;
  }

  openOrderModal(latestOrder, { preserveOpenState: true });
}

function markQuoteDraftDirty(){
  if(isHydratingQuoteForm || isGeneratingQuote){
    return;
  }

  activeQuoteVersion = null;
  isQuoteDraftDirty = true;
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
  const discountPercentage = Number(quoteDiscountInput?.value);

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

  if(!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100){
    setQuoteBuilderStatus("Discount percentage must be between 0 and 100.", "warning");
    showToast("Discount percentage must be between 0 and 100", "warning");
    return null;
  }

  const normalizedItems = items.map((item) => ({
    name: item.name,
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Number(item.unitPrice) || 0,
    isEdited: Boolean(item.isEdited)
  }));
  const totals = calculateQuoteTotals(normalizedItems, deliveryCharge, discountPercentage);

  return {
    language: quoteLanguageSelect?.value === "ar" ? "ar" : "en",
    bankPreset: getQuoteBankPreset(quoteBankPresetSelect?.value),
    rentalDays: Math.max(1, Number(rentalDays) || 1),
    deliveryCharge,
    discountPercentage: clampDiscountPercentage(discountPercentage),
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
    preDiscountSubtotal: draft.totals.preDiscountSubtotal,
    discountType: "percentage",
    discount: draft.discountPercentage,
    discountPercentage: draft.discountPercentage,
    discountAmount: draft.totals.discountAmount,
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
        rentalDays: quotePayload.rentalDays,
        quoteVersionCounter: version,
        latestQuoteVersion: version,
        latestQuoteLanguage: quotePayload.language,
        latestQuoteRentalDays: quotePayload.rentalDays,
        latestQuoteGeneratedAt: serverTimestamp(),
        latestQuoteGeneratedAtMs: quotePayload.generatedAtMs,
        latestQuoteGrandTotal: quotePayload.grandTotal,
        latestQuoteBankPresetId: quotePayload.bankPresetId,
        latestQuoteDiscountPercentage: quotePayload.discountPercentage,
        latestQuoteDiscountAmount: quotePayload.discountAmount
      })
    ]);

    downloadBlob(pdfBlob, quotePayload.pdfFileName);
    activeQuoteVersion = quotePayload;
    isQuoteDraftDirty = false;
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
      <select
        class="edit-item-category"
        aria-label="Item category ${index + 1}"
      >
        ${getCategoryOptionsMarkup(item.category || "")}
      </select>
      <input
        type="text"
        class="edit-item-name"
        value="${escapeAttribute(item.name || "")}"
        placeholder="Item name"
        aria-label="Item name ${index + 1}"
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
      updateOrderInventoryWarnings("edit");
    });
  });

  document.querySelectorAll(".edit-item-name, .edit-item-category, .edit-item-quantity").forEach((input) => {
    if(input.dataset.bound === "true"){
      return;
    }

    input.dataset.bound = "true";
    input.addEventListener("input", () => updateOrderInventoryWarnings("edit"));
    input.addEventListener("change", () => updateOrderInventoryWarnings("edit"));
  });
}

function addEditableItem(){
  if(!editItemsContainer){
    return;
  }

  const itemRow = document.createElement("div");
  itemRow.className = "edit-item-row";
  itemRow.innerHTML = `
    <select class="edit-item-category" aria-label="Item category">
      ${getCategoryOptionsMarkup("")}
    </select>
    <input type="text" class="edit-item-name" value="" placeholder="Item name" aria-label="Item name" />
    <input type="number" min="1" step="1" class="edit-item-quantity" value="1" aria-label="Item quantity" />
    <button type="button" class="btn btn-dark remove-edit-item-btn">Remove</button>
  `;

  editItemsContainer.appendChild(itemRow);
  attachEditableItemEvents();
  itemRow.querySelector(".edit-item-category")?.focus();
  updateOrderInventoryWarnings("edit");
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
      updateOrderInventoryWarnings("create");
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
      updateOrderInventoryWarnings("create");
    });
  });

  document.querySelectorAll(".create-item-custom-name, .create-item-quantity").forEach((input) => {
    if(input.dataset.bound === "true"){
      return;
    }

    input.dataset.bound = "true";
    input.addEventListener("input", () => updateOrderInventoryWarnings("create"));
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
      updateOrderInventoryWarnings("create");
    });
  });
}

function addCreateItem(){
  if(!createItemsContainer){
    return;
  }

  createItemsContainer.insertAdjacentHTML("beforeend", getCreateItemRowMarkup({
    productId: "",
    category: "",
    quantity: 1
  }, createItemsContainer.querySelectorAll(".create-item-row").length));
  const itemRow = createItemsContainer.querySelector(".create-item-row:last-child");
  attachCreateItemEvents();
  itemRow?.querySelector(".create-item-category")?.focus();
  updateOrderInventoryWarnings("create");
}

function getCreateItemsFromUI(){
  return Array.from(document.querySelectorAll(".create-item-row"))
    .map((row) => {
      const category = row.querySelector(".create-item-category")?.value.trim() || "";
      const productId = row.querySelector(".create-item-product")?.value || "";
      const customName = row.querySelector(".create-item-custom-name")?.value.trim() || "";
      const quantity = Number(row.querySelector(".create-item-quantity")?.value) || 0;
      const product = getSelectedProduct(productId);

      if(!category || quantity < 1){
        return null;
      }

      if(productId === "__custom"){
        if(!customName){
          return null;
        }

        return {
          name: customName,
          category,
          variant: "",
          sourceType: "custom",
          quantity
        };
      }

      if(!product || product.category !== category){
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

function normalizeInventoryText(value){
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeOrderStatusValue(value){
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function getInventoryItemKey(name, variant = ""){
  return `${normalizeInventoryText(name)}::${normalizeInventoryText(variant)}`;
}

function normalizeStockNumber(value){
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function getOrderRentalDays(order){
  const rentalDays = Number(order?.rentalDays ?? order?.latestQuoteRentalDays ?? order?.quoteRentalDays ?? DEFAULT_RENTAL_DAYS);
  return Number.isFinite(rentalDays) && rentalDays >= 1 ? Math.floor(rentalDays) : DEFAULT_RENTAL_DAYS;
}

function getRentalWindow(eventDate, rentalDays = DEFAULT_RENTAL_DAYS){
  const start = parseEventDate(eventDate);

  if(!start){
    return null;
  }

  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, Number(rentalDays) || DEFAULT_RENTAL_DAYS));

  return { start, end };
}

function getTodayWindow(){
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function doDateRangesOverlap(firstWindow, secondWindow){
  return Boolean(firstWindow && secondWindow && firstWindow.start < secondWindow.end && firstWindow.end > secondWindow.start);
}

function isOrderActivelyReservingInventory(order){
  return Boolean(order && INVENTORY_RESERVATION_STATUSES.has(normalizeOrderStatusValue(order.status)));
}

function isOrderReservableForInventory(order, targetWindow = null){
  if(!isOrderActivelyReservingInventory(order)){
    return false;
  }

  if(!targetWindow){
    return true;
  }

  const rentalWindow = getRentalWindow(order.eventDate, getOrderRentalDays(order));
  return doDateRangesOverlap(rentalWindow, targetWindow);
}

function getInventoryItemUsableStock(item){
  return Math.max(0, normalizeStockNumber(item?.totalStock) - normalizeStockNumber(item?.damagedStock));
}

function doesInventoryItemMatchOrderItem(inventoryItem, orderItem){
  if(!inventoryItem || !orderItem || inventoryItem.isArchived === true || inventoryItem.active === false){
    return false;
  }

  const orderProductId = orderItem.productId ?? orderItem.id ?? "";
  const normalizedInventoryProductId = String(inventoryItem.productId || "").trim().toLowerCase();
  const normalizedOrderProductId = String(orderProductId || "").trim().toLowerCase();

  if(normalizedOrderProductId && normalizedInventoryProductId && normalizedInventoryProductId === normalizedOrderProductId){
    const inventoryVariant = normalizeInventoryText(inventoryItem.variant);
    const orderVariant = normalizeInventoryText(orderItem.variant);
    return !inventoryVariant || inventoryVariant === orderVariant;
  }

  const inventoryName = normalizeInventoryText(inventoryItem.name);
  const orderName = normalizeInventoryText(orderItem.name);

  if(!inventoryName || inventoryName !== orderName){
    return false;
  }

  const inventoryCategory = normalizeInventoryText(inventoryItem.category);
  const orderCategory = normalizeInventoryText(orderItem.category);

  if(inventoryCategory && orderCategory && inventoryCategory !== orderCategory){
    return false;
  }

  const inventoryVariant = normalizeInventoryText(inventoryItem.variant);
  const orderVariant = normalizeInventoryText(orderItem.variant);

  return !inventoryVariant || !orderVariant || inventoryVariant === orderVariant;
}

function findInventoryItemForOrderItem(orderItem){
  return allInventoryItems.find((inventoryItem) => doesInventoryItemMatchOrderItem(inventoryItem, orderItem)) || null;
}

function getReservedQuantityForInventoryItem(inventoryItem, options = {}){
  const excludeOrderId = options.excludeOrderId || "";

  if(!inventoryItem){
    return 0;
  }

  return allOrders.reduce((reservedTotal, order) => {
    if(excludeOrderId && order.id === excludeOrderId){
      return reservedTotal;
    }

    if(!isOrderActivelyReservingInventory(order)){
      return reservedTotal;
    }

    const orderReservedQuantity = (order.items || []).reduce((itemTotal, orderItem) => {
      if(!doesInventoryItemMatchOrderItem(inventoryItem, orderItem)){
        return itemTotal;
      }

      return itemTotal + normalizeStockNumber(orderItem.quantity);
    }, 0);

    return reservedTotal + orderReservedQuantity;
  }, 0);
}

function getReservationsForInventoryItem(inventoryItem, options = {}){
  const reservations = [];
  const excludeOrderId = options.excludeOrderId || "";
  const targetWindow = options.targetWindow || null;

  allOrders.forEach((order) => {
    if(excludeOrderId && order.id === excludeOrderId){
      return;
    }

    if(!isOrderReservableForInventory(order, targetWindow)){
      return;
    }

    const rentalWindow = getRentalWindow(order.eventDate, getOrderRentalDays(order));

    if(!rentalWindow || (!targetWindow && rentalWindow.end <= getTodayWindow().start)){
      return;
    }

    if(targetWindow && !doDateRangesOverlap(rentalWindow, targetWindow)){
      return;
    }

    const quantity = (order.items || []).reduce((sum, orderItem) => {
      if(!doesInventoryItemMatchOrderItem(inventoryItem, orderItem)){
        return sum;
      }

      return sum + normalizeStockNumber(orderItem.quantity);
    }, 0);

    if(quantity > 0){
      reservations.push({
        order,
        item: inventoryItem,
        quantity,
        start: rentalWindow.start,
        end: rentalWindow.end
      });
    }
  });

  return reservations;
}

function getReservedQuantityForWindow(inventoryItem, rentalWindow, options = {}){
  return getReservationsForInventoryItem(inventoryItem, {
    ...options,
    targetWindow: rentalWindow
  }).reduce((sum, reservation) => sum + reservation.quantity, 0);
}

function getPeakReservedQuantity(inventoryItem, options = {}){
  const reservations = getReservationsForInventoryItem(inventoryItem, options);

  if(!reservations.length){
    return 0;
  }

  const todayWindow = getTodayWindow();
  const checkpoints = [
    todayWindow.start.getTime(),
    ...reservations.map((reservation) => reservation.start.getTime()),
    ...reservations.map((reservation) => reservation.end.getTime() - 1)
  ];

  return checkpoints.reduce((peak, checkpointMs) => {
    const quantity = reservations.reduce((sum, reservation) => {
      return checkpointMs >= reservation.start.getTime() && checkpointMs < reservation.end.getTime()
        ? sum + reservation.quantity
        : sum;
    }, 0);

    return Math.max(peak, quantity);
  }, 0);
}

function getInventoryComputedState(item){
  const totalStock = normalizeStockNumber(item.totalStock);
  const damagedStock = normalizeStockNumber(item.damagedStock);
  const usableStock = Math.max(0, totalStock - damagedStock);
  const reservedStock = getReservedQuantityForInventoryItem(item);
  const rawAvailable = usableStock - reservedStock;
  const lowStockThreshold = normalizeStockNumber(item.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
  const isOverbooked = rawAvailable < 0;
  const isLowStock = !isOverbooked && rawAvailable <= lowStockThreshold;

  return {
    totalStock,
    damagedStock,
    usableStock,
    reservedStock,
    availableStock: rawAvailable,
    rawAvailable,
    lowStockThreshold,
    isOverbooked,
    isLowStock
  };
}

function getInventoryStatusCopy(item, state = getInventoryComputedState(item)){
  if(item.isArchived === true || item.active === false){
    return { label: "Archived", className: "is-muted" };
  }

  if(state.isOverbooked){
    return { label: `Overbooked by ${Math.abs(state.rawAvailable)}`, className: "is-danger" };
  }

  if(state.isLowStock){
    return { label: "Low stock", className: "is-warning" };
  }

  return { label: "Healthy", className: "is-success" };
}

function getFilteredInventoryItems(){
  const search = normalizeInventoryText(inventorySearchInput?.value || "");
  const source = inventorySourceFilter?.value || "all";
  const status = inventoryStatusFilter?.value || "all";

  return allInventoryItems
    .filter((item) => {
      if(search){
        const haystack = normalizeInventoryText([item.name, item.variant, item.category, item.productId].filter(Boolean).join(" "));
        if(!haystack.includes(search)){
          return false;
        }
      }

      if(source !== "all" && (item.sourceType || "custom") !== source){
        return false;
      }

      if(status !== "all"){
        const state = getInventoryComputedState(item);
        if(status === "low" && !state.isLowStock){
          return false;
        }
        if(status === "overbooked" && !state.isOverbooked){
          return false;
        }
        if(status === "damaged" && state.damagedStock <= 0){
          return false;
        }
        if(status === "archived" && !(item.isArchived === true || item.active === false)){
          return false;
        }
        if(status === "healthy" && (state.isLowStock || state.isOverbooked || item.isArchived === true || item.active === false)){
          return false;
        }
      }

      return true;
    })
    .sort((first, second) => {
      const direction = currentInventorySort.direction === "desc" ? -1 : 1;
      const getValue = (item) => {
        const state = getInventoryComputedState(item);
        const values = {
          name: item.name || "",
          category: item.category || "",
          sourceType: item.sourceType || "",
          totalStock: state.totalStock,
          availableStock: state.availableStock,
          reservedStock: state.reservedStock,
          damagedStock: state.damagedStock,
          lowStockThreshold: state.lowStockThreshold
        };
        return values[currentInventorySort.key] ?? "";
      };
      const firstValue = getValue(first);
      const secondValue = getValue(second);

      if(typeof firstValue === "number" || typeof secondValue === "number"){
        return (Number(firstValue) - Number(secondValue)) * direction;
      }

      return String(firstValue).localeCompare(String(secondValue)) * direction;
    });
}

function renderInventoryDashboard(){
  renderInventorySummary();
  renderInventoryTable();
  renderUpcomingReservations();
}

function renderInventorySummary(){
  const activeItems = allInventoryItems.filter((item) => item.isArchived !== true && item.active !== false);
  const states = activeItems.map((item) => getInventoryComputedState(item));

  if(inventoryTotalSkus){
    inventoryTotalSkus.textContent = String(activeItems.length);
  }

  if(inventoryAvailableUnits){
    inventoryAvailableUnits.textContent = String(states.reduce((sum, state) => sum + state.availableStock, 0));
  }

  if(inventoryReservedUnits){
    inventoryReservedUnits.textContent = String(states.reduce((sum, state) => sum + state.reservedStock, 0));
  }

  if(inventoryDamagedUnits){
    inventoryDamagedUnits.textContent = String(states.reduce((sum, state) => sum + state.damagedStock, 0));
  }

  if(inventoryLowStockItems){
    inventoryLowStockItems.textContent = String(states.filter((state) => state.isLowStock || state.isOverbooked).length);
  }
}

function renderInventoryTable(){
  if(!inventoryTableBody){
    return;
  }

  const items = getFilteredInventoryItems();

  if(!items.length){
    inventoryTableBody.innerHTML = `
      <tr>
        <td colspan="11" class="inventory-empty-cell">No inventory items found.</td>
      </tr>
    `;
    return;
  }

  inventoryTableBody.innerHTML = items.map((item) => {
    const state = getInventoryComputedState(item);
    const status = getInventoryStatusCopy(item, state);

    return `
      <tr>
        <td>
          <strong>${escapeHtml(item.name || "Unnamed item")}</strong>
          ${item.productId ? `<span class="inventory-subtext">Product ID: ${escapeHtml(item.productId)}</span>` : ""}
        </td>
        <td>${escapeHtml(item.variant || "-")}</td>
        <td>${escapeHtml(item.category || "Uncategorized")}</td>
        <td><span class="inventory-source-pill">${escapeHtml(item.sourceType || "custom")}</span></td>
        <td>${state.totalStock}</td>
        <td>${state.availableStock}</td>
        <td>${state.reservedStock}</td>
        <td>${state.damagedStock}</td>
        <td>${state.lowStockThreshold}</td>
        <td><span class="inventory-status-pill ${status.className}">${escapeHtml(status.label)}</span></td>
        <td>
          <div class="inventory-row-actions">
            <button class="btn btn-secondary btn-small inventory-edit-btn" type="button" data-id="${escapeAttribute(item.id)}">Edit</button>
            <button class="btn btn-dark btn-small inventory-delete-btn" type="button" data-id="${escapeAttribute(item.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attachInventoryTableEvents();
}

function attachInventoryTableEvents(){
  document.querySelectorAll(".inventory-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const item = allInventoryItems.find((inventoryItem) => inventoryItem.id === button.dataset.id);
      if(item){
        openInventoryModal(item);
      }
    });
  });

  document.querySelectorAll(".inventory-delete-btn").forEach((button) => {
    button.addEventListener("click", () => handleDeleteInventoryItem(button.dataset.id));
  });
}

function getUpcomingReservationsForDate(dateString){
  const windowForDate = getRentalWindow(dateString, 1) || getTodayWindow();
  const rows = [];

  allOrders.forEach((order) => {
    if(!isOrderReservableForInventory(order, windowForDate)){
      return;
    }

    const orderWindow = getRentalWindow(order.eventDate, getOrderRentalDays(order));

    if(!doDateRangesOverlap(orderWindow, windowForDate)){
      return;
    }

    (order.items || []).forEach((orderItem) => {
      const quantity = normalizeStockNumber(orderItem.quantity);

      if(quantity <= 0){
        return;
      }

      const inventoryItem = findInventoryItemForOrderItem(orderItem);

      rows.push({
        order,
        inventoryItem,
        orderItem,
        quantity,
        start: orderWindow.start,
        end: orderWindow.end
      });
    });
  });

  return rows.sort((first, second) => {
    const dateCompare = String(first.order.eventDate || "").localeCompare(String(second.order.eventDate || ""));
    return dateCompare || String(first.order.orderId || "").localeCompare(String(second.order.orderId || ""));
  });
}

function getInventoryReservedQuantityForSelectedDate(inventoryItem){
  const selectedDate = reservationDateFilter?.value || formatLocalDate(new Date());
  const selectedWindow = getRentalWindow(selectedDate, 1);

  if(!selectedWindow){
    return getPeakReservedQuantity(inventoryItem);
  }

  return getReservedQuantityForWindow(inventoryItem, selectedWindow);
}

function renderUpcomingReservations(){
  if(!upcomingReservationsBody){
    return;
  }

  if(reservationDateFilter && !reservationDateFilter.value){
    reservationDateFilter.value = formatLocalDate(new Date());
  }

  const selectedDate = reservationDateFilter?.value || formatLocalDate(new Date());
  const rows = getUpcomingReservationsForDate(selectedDate);

  if(inventoryReservationsSummary){
    const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    inventoryReservationsSummary.textContent = rows.length
      ? `${rows.length} reservation line${rows.length === 1 ? "" : "s"} and ${totalQuantity} unit${totalQuantity === 1 ? "" : "s"} reserved for ${selectedDate}.`
      : `No active reservations found for ${selectedDate}.`;
  }

  if(!rows.length){
    upcomingReservationsBody.innerHTML = `
      <tr>
        <td colspan="6" class="inventory-empty-cell">No reservations for this date.</td>
      </tr>
    `;
    return;
  }

  upcomingReservationsBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.order.eventDate || "-")}</td>
      <td>${escapeHtml(row.order.orderId || row.order.id || "-")}</td>
      <td>${escapeHtml(row.order.customerName || "Unknown customer")}</td>
      <td>${escapeHtml(row.inventoryItem?.name || row.orderItem.name || "Unlinked item")}</td>
      <td>${row.quantity}</td>
      <td>${escapeHtml(formatStatusLabel(row.order.status))}</td>
    </tr>
  `).join("");
}

function openInventoryModal(item = null){
  currentInventoryItemId = item?.id || null;

  if(inventoryModalTitle){
    inventoryModalTitle.textContent = item ? "Edit Inventory Item" : "Add Inventory Item";
  }

  if(inventoryModalSubtitle){
    inventoryModalSubtitle.textContent = item
      ? "Update stock, damaged units, and catalog linking."
      : "Create a catalog-linked or internal inventory row.";
  }

  if(inventoryProductSelect){
    inventoryProductSelect.innerHTML = getInventoryProductOptionsMarkup(item?.productId || "");
  }

  if(inventoryForm){
    inventoryForm.name.value = item?.name || "";
    inventoryForm.category.value = item?.category || "";
    inventoryForm.variant.value = item?.variant || "";
    inventoryForm.productId.value = item?.productId || "";
    inventoryForm.sourceType.value = item?.sourceType || (item?.productId ? "catalog" : "custom");
    inventoryForm.totalStock.value = String(normalizeStockNumber(item?.totalStock));
    inventoryForm.damagedStock.value = String(normalizeStockNumber(item?.damagedStock));
    inventoryForm.lowStockThreshold.value = String(normalizeStockNumber(item?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD));
    inventoryForm.isArchived.checked = item?.isArchived === true || item?.active === false;
  }

  if(deleteInventoryBtn){
    deleteInventoryBtn.hidden = !item;
  }

  if(inventoryDamagedAdjustInput){
    inventoryDamagedAdjustInput.value = "1";
  }

  syncInventoryModalState(false);
  inventoryModal?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeInventoryModal(){
  inventoryModal?.classList.remove("active");
  currentInventoryItemId = null;
  inventoryForm?.reset();
  syncInventoryModalState(false);
  document.body.style.overflow = "auto";
}

function syncInventoryModalState(isSaving){
  isSavingInventory = isSaving;

  if(saveInventoryBtn){
    saveInventoryBtn.disabled = isSaving;
    saveInventoryBtn.textContent = isSaving ? "Saving..." : "Save Inventory Item";
  }

  if(deleteInventoryBtn){
    deleteInventoryBtn.disabled = isSaving;
  }

  if(closeInventoryModalBtn){
    closeInventoryModalBtn.disabled = isSaving;
  }

  if(cancelInventoryBtn){
    cancelInventoryBtn.disabled = isSaving;
  }
}

function getInventoryPayloadFromForm(){
  if(!inventoryForm){
    return null;
  }

  const name = inventoryForm.name.value.trim();
  const category = inventoryForm.category.value.trim() || "Custom";
  const productId = inventoryForm.productId.value || "";
  const sourceType = inventoryForm.sourceType.value === "catalog" ? "catalog" : "custom";

  if(!name){
    inventoryForm.name.focus();
    showToast("Inventory name is required", "warning");
    return null;
  }

  return {
    name,
    category,
    variant: inventoryForm.variant.value.trim(),
    productId,
    sourceType: productId ? "catalog" : sourceType,
    totalStock: normalizeStockNumber(inventoryForm.totalStock.value),
    damagedStock: normalizeStockNumber(inventoryForm.damagedStock.value),
    lowStockThreshold: normalizeStockNumber(inventoryForm.lowStockThreshold.value || DEFAULT_LOW_STOCK_THRESHOLD),
    isArchived: Boolean(inventoryForm.isArchived.checked)
  };
}

async function handleInventoryFormSubmit(event){
  event.preventDefault();

  if(isSavingInventory){
    return;
  }

  const payload = getInventoryPayloadFromForm();

  if(!payload){
    return;
  }

  syncInventoryModalState(true);

  try{
    if(currentInventoryItemId){
      await updateDoc(doc(db, "inventory", currentInventoryItemId), {
        ...payload,
        active: !payload.isArchived,
        updatedAt: serverTimestamp()
      });
    }else{
      const inventoryRef = doc(collection(db, "inventory"));
      await setDoc(inventoryRef, {
        id: inventoryRef.id,
        ...payload,
        active: !payload.isArchived,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    closeInventoryModal();
    showToast("Inventory item saved");
  }catch(error){
    console.error("Failed to save inventory item:", error);
    showToast("Could not save inventory item", "error");
    syncInventoryModalState(false);
  }
}

async function handleDeleteInventoryItem(itemId = currentInventoryItemId){
  const item = allInventoryItems.find((inventoryItem) => inventoryItem.id === itemId);

  if(!item){
    return;
  }

  const activeReservations = getReservationsForInventoryItem(item);

  if(activeReservations.length > 0){
    showToast("Cannot delete inventory with active or future reservations", "warning");
    return;
  }

  const shouldDelete = window.confirm(`Delete inventory item "${item.name}"? This cannot be undone.`);

  if(!shouldDelete){
    return;
  }

  try{
    await deleteDoc(doc(db, "inventory", item.id));
    closeInventoryModal();
    showToast("Inventory item deleted");
  }catch(error){
    console.error("Failed to delete inventory item:", error);
    showToast("Could not delete inventory item", "error");
  }
}

async function adjustInventoryDamage(direction){
  if(!currentInventoryItemId || !inventoryForm || isSavingInventory){
    return;
  }

  const item = allInventoryItems.find((inventoryItem) => inventoryItem.id === currentInventoryItemId);
  const adjustment = normalizeStockNumber(inventoryDamagedAdjustInput?.value || 0);

  if(!item || adjustment <= 0){
    showToast("Enter a damaged quantity to adjust", "warning");
    return;
  }

  const currentDamaged = normalizeStockNumber(item.damagedStock);
  const totalStock = normalizeStockNumber(item.totalStock);
  const nextDamaged = direction === "restore"
    ? Math.max(0, currentDamaged - adjustment)
    : Math.min(totalStock, currentDamaged + adjustment);

  try{
    await updateDoc(doc(db, "inventory", currentInventoryItemId), {
      damagedStock: nextDamaged,
      updatedAt: serverTimestamp()
    });
    inventoryForm.damagedStock.value = String(nextDamaged);
    showToast(direction === "restore" ? "Damaged stock restored" : "Damaged stock updated");
  }catch(error){
    console.error("Failed to adjust damaged stock:", error);
    showToast("Could not adjust damaged stock", "error");
  }
}

async function ensureInventoryItemsForOrderItems(items){
  const createdItems = [];

  for(const item of items){
    if(findInventoryItemForOrderItem(item)){
      continue;
    }

    const catalogProduct = item.productId ? getSelectedProduct(item.productId) : getCatalogProductByName(item.name);
    const inventoryRef = catalogProduct
      ? doc(db, "inventory", getCatalogInventoryDocId(catalogProduct))
      : doc(collection(db, "inventory"));
    const sourceType = catalogProduct ? "catalog" : "custom";
    const inventorySnapshot = await getDoc(inventoryRef);

    if(inventorySnapshot.exists()){
      const existingInventoryItem = {
        id: inventorySnapshot.id,
        ...inventorySnapshot.data()
      };

      if(!allInventoryItems.some((inventoryItem) => inventoryItem.id === existingInventoryItem.id)){
        allInventoryItems.push(existingInventoryItem);
      }

      continue;
    }

    const payload = {
      id: inventoryRef.id,
      name: item.name || catalogProduct?.name || "Custom item",
      category: item.category || catalogProduct?.category || "Custom",
      variant: item.variant || "",
      productId: catalogProduct?.id || item.productId || "",
      sourceType,
      totalStock: Math.max(1, normalizeStockNumber(item.quantity)),
      damagedStock: 0,
      lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      isArchived: false,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(inventoryRef, payload);
    allInventoryItems.push({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    createdItems.push(payload);
  }

  return createdItems;
}

async function syncMissingInventoryForReservableOrderItems(){
  if(!hasLoadedInventorySnapshot || !allOrders.length){
    return;
  }

  const itemsToSync = allOrders
    .filter((order) => isOrderReservableForInventory(order))
    .flatMap((order) => order.items || [])
    .filter((item) => item?.name && normalizeStockNumber(item.quantity) > 0);

  if(itemsToSync.length){
    await ensureInventoryItemsForOrderItems(itemsToSync);
  }
}

function getOrderInventoryWarnings(orderDraft){
  if(!orderDraft?.items?.length || !orderDraft.eventDate || !isOrderReservableForInventory(orderDraft)){
    return [];
  }

  const rentalWindow = getRentalWindow(orderDraft.eventDate, getOrderRentalDays(orderDraft));

  if(!rentalWindow){
    return [];
  }

  return orderDraft.items.flatMap((orderItem) => {
    const inventoryItem = findInventoryItemForOrderItem(orderItem);
    const quantity = normalizeStockNumber(orderItem.quantity);

    if(!inventoryItem){
      return [`${orderItem.name} is not in inventory yet. An inventory row will be created when saved.`];
    }

    const existingReserved = getReservedQuantityForWindow(inventoryItem, rentalWindow, {
      excludeOrderId: orderDraft.id
    });
    const usableStock = getInventoryItemUsableStock(inventoryItem);
    const availableBefore = usableStock - existingReserved;
    const availableAfter = availableBefore - quantity;
    const lowStockThreshold = normalizeStockNumber(inventoryItem.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD);
    const warnings = [];

    if(availableAfter < 0){
      warnings.push(`${inventoryItem.name} may be overbooked by ${Math.abs(availableAfter)} unit${Math.abs(availableAfter) === 1 ? "" : "s"} for this rental period.`);
    }else if(availableAfter <= lowStockThreshold){
      warnings.push(`${inventoryItem.name} will be low after this order: ${Math.max(0, availableAfter)} unit${availableAfter === 1 ? "" : "s"} remaining.`);
    }

    return warnings;
  });
}

function renderInventoryWarnings(container, warnings){
  if(!container){
    return;
  }

  if(!warnings.length){
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <strong>Inventory warning</strong>
    <ul>
      ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
    </ul>
  `;
}

function getCreateOrderInventoryDraft(){
  if(!createOrderForm){
    return null;
  }

  return {
    id: "",
    status: createOrderForm.status.value || "confirmed",
    eventDate: createOrderForm.eventDate.value,
    rentalDays: normalizeStockNumber(createOrderForm.rentalDays?.value || DEFAULT_RENTAL_DAYS) || DEFAULT_RENTAL_DAYS,
    items: getCreateItemsFromUI()
  };
}

function getEditOrderInventoryDraft(){
  if(!currentEditingOrder || !editOrderForm){
    return null;
  }

  return {
    ...currentEditingOrder,
    eventDate: editOrderForm.eventDate.value,
    rentalDays: normalizeStockNumber(editOrderForm.rentalDays?.value || currentEditingOrder.rentalDays || DEFAULT_RENTAL_DAYS) || DEFAULT_RENTAL_DAYS,
    items: getUpdatedItemsFromUI()
  };
}

function updateOrderInventoryWarnings(scope){
  if(scope === "create"){
    renderInventoryWarnings(createInventoryWarnings, getOrderInventoryWarnings(getCreateOrderInventoryDraft()));
  }else if(scope === "edit"){
    renderInventoryWarnings(editInventoryWarnings, getOrderInventoryWarnings(getEditOrderInventoryDraft()));
  }
}

function confirmInventoryWarningsIfNeeded(orderDraft){
  const warnings = getOrderInventoryWarnings(orderDraft);

  if(!warnings.length){
    return true;
  }

  return window.confirm(`${warnings.join("\n")}\n\nContinue anyway?`);
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

function resolveEditedDestinationLocation(order, nextEventLocation, nextMapLink){
  const normalizedPreviousLocation = String(order?.eventLocation || "").trim();
  const normalizedPreviousMapLink = normalizeGoogleMapsLink(order?.mapLink || "");
  const locationFieldsChanged =
    normalizedPreviousLocation !== nextEventLocation ||
    normalizedPreviousMapLink !== nextMapLink;

  if(locationFieldsChanged){
    return editLocationBinding?.getDestinationLocation() || null;
  }

  return editLocationBinding?.getDestinationLocation(order?.destinationLocation) || null;
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
    rentalDays: normalizeStockNumber(editOrderForm.rentalDays?.value || DEFAULT_RENTAL_DAYS) || DEFAULT_RENTAL_DAYS,
    eventTime: formatTimeTo12Hour(editOrderForm.eventTime.value),
    setupTime: formatTimeTo12Hour(editOrderForm.setupTime.value),
    eventLocation: editOrderForm.eventLocation.value.trim(),
    mapLink: normalizeGoogleMapsLink(editOrderForm.mapLink.value.trim()),
    items
  };
  updatedData.destinationLocation = resolveEditedDestinationLocation(
    currentEditingOrder,
    updatedData.eventLocation,
    updatedData.mapLink
  );

  if(!confirmInventoryWarningsIfNeeded({
    ...currentEditingOrder,
    ...updatedData,
    id: currentEditingOrder.id
  })){
    updateOrderInventoryWarnings("edit");
    return;
  }

  setEditSaveState(true);

  try{
    await ensureInventoryItemsForOrderItems(items);
    await updateDoc(doc(db, "orders", currentEditingOrder.id), updatedData);
    upsertOrderInAdminState({
      ...currentEditingOrder,
      ...updatedData
    });
    syncCurrentEditingOrder();
    syncCurrentQuoteOrder();
    syncOpenOrderModal();
    renderOpsPanel();
    renderDriverPanel();
    renderInventoryDashboard();
    applyFilters();
    updateStats(allOrders);
    generateAnalytics();
    renderCalendar();
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
  const rentalDays = normalizeStockNumber(createOrderForm.rentalDays?.value || DEFAULT_RENTAL_DAYS) || DEFAULT_RENTAL_DAYS;
  const eventTime = formatTimeTo12Hour(createOrderForm.eventTime.value);
  const setupTime = formatTimeTo12Hour(createOrderForm.setupTime.value);
  const priority = getPriorityValue(createOrderForm.priority.value);
  const status = createOrderForm.status.value || "confirmed";
  const mapLink = normalizeGoogleMapsLink(createOrderForm.mapLink.value.trim());
  const notes = createOrderForm.notes.value.trim();
  const destinationLocation = createLocationBinding?.getDestinationLocation() || null;
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

  if(!confirmInventoryWarningsIfNeeded({
    id: "",
    status,
    eventDate,
    rentalDays,
    items
  })){
    updateOrderInventoryWarnings("create");
    return;
  }

  setCreateSubmitState(true);

  try{
    await ensureInventoryItemsForOrderItems(items);
    const orderId = await generateOrderId();
    const orderPayload = {
      orderId,
      customerName,
      phone,
      eventDate,
      rentalDays,
      eventTime,
      setupTime,
      eventLocation,
      mapLink: mapLink || "",
      ...(destinationLocation ? { destinationLocation } : {}),
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
    collected: "#1e7a6d",
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
  }else if(activeOpsFilter === "week"){
    filtered = filtered.filter(o => isInCurrentWeek(o.eventDate));
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

function syncAdminSummaryCardState(){
  const currentStatusFilter = document.getElementById("statusFilter")?.value || "all";

  document.querySelectorAll(".admin-summary-card").forEach((card) => {
    const isActive = card.dataset.statusFilter === currentStatusFilter;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function attachAdminSummaryCardEvents(){
  document.querySelectorAll(".admin-summary-card").forEach((card) => {
    if(card.dataset.bound === "true"){
      return;
    }

    const handleActivate = () => {
      const statusFilterElement = document.getElementById("statusFilter");

      if(!statusFilterElement){
        return;
      }

      const nextValue = statusFilterElement.value === card.dataset.statusFilter
        ? "all"
        : card.dataset.statusFilter;

      statusFilterElement.value = nextValue;
      syncAdminSummaryCardState();
      applyFilters(true);
    };

    card.dataset.bound = "true";
    card.addEventListener("click", handleActivate);
    card.addEventListener("keydown", (event) => {
      if(event.key === "Enter" || event.key === " "){
        event.preventDefault();
        handleActivate();
      }
    });
  });

  syncAdminSummaryCardState();
}

/* INIT */

document.addEventListener("DOMContentLoaded", async ()=>{
  initMobileMenu();
  initScrollTopButton();
  initAdminLocationBindings();
  document.getElementById("closeModalBtn").addEventListener("click", closeOrderModal);
  closeEditOrderBtn?.addEventListener("click", () => closeEditOrderModal());
  cancelEditOrderBtn?.addEventListener("click", () => closeEditOrderModal());
  openCreateOrderBtn?.addEventListener("click", openCreateOrderModal);
  closeCreateOrderBtn?.addEventListener("click", () => closeCreateOrderModal());
  cancelCreateOrderBtn?.addEventListener("click", () => closeCreateOrderModal());
  closeQuoteModalBtn?.addEventListener("click", () => closeQuoteModal());
  addInventoryItemBtn?.addEventListener("click", () => openInventoryModal());
  closeInventoryModalBtn?.addEventListener("click", () => closeInventoryModal());
  cancelInventoryBtn?.addEventListener("click", () => closeInventoryModal());
  inventoryForm?.addEventListener("submit", handleInventoryFormSubmit);
  deleteInventoryBtn?.addEventListener("click", () => handleDeleteInventoryItem());
  inventoryMarkDamagedBtn?.addEventListener("click", () => adjustInventoryDamage("damage"));
  inventoryRestoreDamagedBtn?.addEventListener("click", () => adjustInventoryDamage("restore"));
  document.getElementById("addEditItemBtn")?.addEventListener("click", addEditableItem);
  document.getElementById("addCreateItemBtn")?.addEventListener("click", addCreateItem);
  editOrderForm?.addEventListener("submit", handleEditOrderSubmit);
  createOrderForm?.addEventListener("submit", handleCreateOrderSubmit);
  editDeleteBtn?.addEventListener("click", handleDeleteOrder);
  generateQuoteBtn?.addEventListener("click", handleGenerateQuote);
  sendQuoteWhatsappBtn?.addEventListener("click", () => openQuoteWhatsApp());
  resetQuoteDraftBtn?.addEventListener("click", async () => {
    if(currentQuoteOrder){
      const latestOrder = await getLatestOrderData(currentQuoteOrder);

      if(!latestOrder){
        setQuoteBuilderStatus("Could not reload the latest order items.", "warning");
        showToast("Could not reload the latest order", "error");
        return;
      }

      currentQuoteOrder = latestOrder;
      loadOrderDraftIntoQuoteForm(latestOrder);
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
  subscribeToInventory();
  subscribeToOrders();
  startInventoryClockRefresh();
  attachAdminSummaryCardEvents();

  searchInput?.addEventListener("input", () => {
    syncSearchClearButton();
    applyFilters(true);
  });
  clearSearchBtn?.addEventListener("click", () => {
    if(!searchInput){
      return;
    }

    searchInput.value = "";
    syncSearchClearButton();
    applyFilters(true);
    searchInput.focus();
  });
  document.getElementById("statusFilter").addEventListener("change", () => {
    syncAdminSummaryCardState();
    applyFilters(true);
  });
  document.getElementById("priorityFilter").addEventListener("change", () => applyFilters(true));
  driverFilter?.addEventListener("change", () => applyFilters(true));
  collectionOrderSelect?.addEventListener("change", () => {
    selectedCollectionOrderId = collectionOrderSelect.value || "";
    renderCollectionRequestPreview();
  });
  collectionDriverSelect?.addEventListener("change", () => {
    selectedCollectionDriverId = collectionDriverSelect.value || "";
    renderCollectionRequestPreview();
  });
  collectionRequestNote?.addEventListener("input", renderCollectionRequestPreview);
  sendCollectionRequestBtn?.addEventListener("click", handleSendCollectionRequest);
  inventorySearchInput?.addEventListener("input", renderInventoryTable);
  inventorySourceFilter?.addEventListener("change", renderInventoryTable);
  inventoryStatusFilter?.addEventListener("change", renderInventoryTable);
  reservationDateFilter?.addEventListener("change", renderInventoryDashboard);
  syncSearchClearButton();
  renderOperationsMapSection();
  renderCollectionAssignmentSection();
  document.querySelectorAll(".inventory-sort-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sortKey || "name";
      currentInventorySort = {
        key,
        direction: currentInventorySort.key === key && currentInventorySort.direction === "asc" ? "desc" : "asc"
      };
      renderInventoryTable();
    });
  });
  inventoryProductSelect?.addEventListener("change", () => {
    const product = getSelectedProduct(inventoryProductSelect.value);

    if(product && inventoryForm){
      inventoryForm.name.value = product.name || inventoryForm.name.value;
      inventoryForm.category.value = product.category || inventoryForm.category.value;
      inventoryForm.sourceType.value = "catalog";
    }
  });
  inventorySourceTypeSelect?.addEventListener("change", () => {
    if(inventoryForm && inventorySourceTypeSelect.value === "custom"){
      inventoryForm.productId.value = "";
    }
  });
  [createOrderForm?.eventDate, createOrderForm?.rentalDays, createOrderForm?.status].forEach((field) => {
    field?.addEventListener("input", () => updateOrderInventoryWarnings("create"));
    field?.addEventListener("change", () => updateOrderInventoryWarnings("create"));
  });
  [editOrderForm?.eventDate, editOrderForm?.rentalDays].forEach((field) => {
    field?.addEventListener("input", () => updateOrderInventoryWarnings("edit"));
    field?.addEventListener("change", () => updateOrderInventoryWarnings("edit"));
  });
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
  inventoryModal?.addEventListener("click", (event) => {
    if(event.target === inventoryModal){
      closeInventoryModal();
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
    const nextValue = clampDiscountPercentage(quoteDiscountInput.value);
    if(String(nextValue) !== quoteDiscountInput.value){
      quoteDiscountInput.value = String(nextValue);
    }
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

    if(event.target.classList.contains("quote-item-name")){
      autoResizeQuoteItemName(event.target);
    }

    updateQuoteTotals();
    markQuoteDraftDirty();
  });
  quoteHistoryList?.addEventListener("click", handleQuoteHistoryAction);
  renderCreateItems();
  populateQuoteBankPresetOptions();
  wrapInputWithCurrency(quoteDeliveryChargeInput);
  wrapInputWithSuffix(quoteDiscountInput, "%");
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
