import { auth, db } from "./firebase.js";
import {
  buildGoogleMapsCoordinateLink,
  extractCoordinatesFromMapLink,
  getLocationCoordinates,
  getValidatedUaeCoordinates,
  normalizeMapUrl
} from "./location-utils.js";
import { initScrollTopButton } from "./scroll-top.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const driverWelcomeName = document.getElementById("driverWelcomeName");
const driverSummaryText = document.getElementById("driverSummaryText");
const driverDashboardStatus = document.getElementById("driverDashboardStatus");
const driverOrdersGrid = document.getElementById("driverOrders") || document.getElementById("driverOrdersGrid");
const driverCompletedOrdersGrid = document.getElementById("driverCompletedOrders");
const driverActiveOrdersSummary = document.getElementById("driverActiveOrdersSummary");
const driverCompletedOrdersSummary = document.getElementById("driverCompletedOrdersSummary");
const activeDeliveryPill = document.getElementById("activeDeliveryPill");
const locationSharingPill = document.getElementById("locationSharingPill");
const driverLogoutBtn = document.getElementById("driverLogoutBtn");
const completedRangeFilter = document.getElementById("completedRangeFilter");
const completedSortFilter = document.getElementById("completedSortFilter");
const completedSearchInput = document.getElementById("completedSearchInput");
const driverCompletedPagination = document.getElementById("driverCompletedPagination");
const driverCompletedPrevBtn = document.getElementById("driverCompletedPrevBtn");
const driverCompletedNextBtn = document.getElementById("driverCompletedNextBtn");
const driverCompletedPageInfo = document.getElementById("driverCompletedPageInfo");
const driverCollectionForm = document.getElementById("driverCollectionForm");
const driverCollectionOrderIdInput = document.getElementById("driverCollectionOrderIdInput");
const driverCollectionFindBtn = document.getElementById("driverCollectionFindBtn");
const driverCollectionResult = document.getElementById("driverCollectionResult");

let currentDriver = null;
let currentOrders = [];
let locationWatchId = null;
let isLocationUpdatePending = false;
let ordersUnsubscribe = null;
let startingOrderIds = new Set();
let finishingOrderIds = new Set();
let lastSharedLocation = null;
let lastTimeoutMessageAt = 0;
let isLocationSharingEnabled = false;
let locationWatchHealthCheckId = null;
let lastLocationActivityAt = 0;
let completedOrdersPage = 1;
let currentCollectionLookupOrder = null;
let isFindingCollectionOrder = false;
let isMarkingCollected = false;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 15000,
  timeout: 30000
};
const LOCATION_UPDATE_MIN_INTERVAL_MS = 15000;
const LOCATION_UPDATE_MIN_DISTANCE_KM = 0.05;
const TIMEOUT_MESSAGE_COOLDOWN_MS = 45000;
const LOCATION_WATCH_HEALTHCHECK_MS = 30000;
const LOCATION_WATCH_STALE_MS = 120000;
const COMPLETED_ORDERS_PER_PAGE = 6;
const DEFAULT_RENTAL_DAYS = 1;

const storedUid = localStorage.getItem("driverUid");

if(!storedUid){
  window.location.href = "driver-login.html";
}

const LOCATION_SHARING_PREFERENCE_KEY = storedUid
  ? `tajDriverLocationSharingEnabled:${storedUid}`
  : "tajDriverLocationSharingEnabled";

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

function setDashboardMessage(message, type = "info"){
  if(!driverDashboardStatus){
    return;
  }

  driverDashboardStatus.textContent = message;
  driverDashboardStatus.className = `driver-dashboard-message is-${type}`;
}

function formatStatusLabel(status){
  return (status || "unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeOrderStatusValue(status){
  return String(status || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeOrderIdInput(value){
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isDriverActiveOrder(order){
  return order.status === "preparing" || order.status === "out-for-delivery";
}

function isCompletedOrder(order){
  return order.status === "delivered" || order.status === "collected";
}

function getPriorityValue(priority){
  const normalizedPriority = String(priority || "normal").toLowerCase().trim();

  if(normalizedPriority === "urgent" || normalizedPriority === "vip"){
    return normalizedPriority;
  }

  return "normal";
}

function getOrderRentalDays(order){
  const rentalDays = Number(order?.rentalDays ?? order?.latestQuoteRentalDays ?? DEFAULT_RENTAL_DAYS);
  return Number.isFinite(rentalDays) && rentalDays >= 1 ? Math.floor(rentalDays) : DEFAULT_RENTAL_DAYS;
}

function getOrderItemsMarkup(order){
  const items = Array.isArray(order?.items) ? order.items : [];

  if(!items.length){
    return '<li class="driver-order-items-empty">No items listed</li>';
  }

  return items.map((item) => `
    <li>
      <span>${escapeHtml(item.name || "Unnamed item")}</span>
      <strong>x${Math.max(1, Number(item.quantity) || 1)}</strong>
    </li>
  `).join("");
}

function formatPriorityLabel(priority){
  const normalizedPriority = getPriorityValue(priority);

  if(normalizedPriority === "urgent"){
    return "Urgent";
  }

  if(normalizedPriority === "vip"){
    return "VIP";
  }

  return "Normal";
}

function getDriverMeta(driver){
  return {
    name: driver?.name || "Driver",
    phone: driver?.phone || "",
    email: driver?.email || "",
    uid: driver?.uid || ""
  };
}

function formatDriverDateTime(value, fallback = "Not recorded"){
  const timestamp = getTimestampValue(value);

  if(!timestamp){
    return fallback;
  }

  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getDeliveredByDisplay(order){
  const deliveredBy = order?.deliveredBy || order?.driver || null;

  if(!deliveredBy){
    return "Not recorded";
  }

  return [deliveredBy.name, deliveredBy.phone || deliveredBy.email].filter(Boolean).join(" | ") || "Not recorded";
}

function getCollectedByDisplay(order){
  const collectedBy = order?.collectedBy || null;

  if(!collectedBy){
    return "Not recorded";
  }

  return [collectedBy.name, collectedBy.phone || collectedBy.email].filter(Boolean).join(" | ") || "Not recorded";
}

function getPhoneForWhatsApp(phone){
  const digits = String(phone || "").replace(/\D/g, "");

  if(digits.startsWith("0")){
    return `971${digits.slice(1)}`;
  }

  return digits;
}

function getPhoneForCall(phone){
  const rawPhone = String(phone || "").trim();

  if(!rawPhone){
    return "";
  }

  if(rawPhone.startsWith("+")){
    return `+${rawPhone.slice(1).replace(/\D/g, "")}`;
  }

  return rawPhone.replace(/[^\d]/g, "");
}

function calculateDistanceInKm(start, end){
  if(!start || !end){
    return null;
  }

  const toRadians = (value) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMapUrl(order){
  const destinationLocation = getValidatedUaeCoordinates(getLocationCoordinates(order?.destinationLocation));

  if(destinationLocation){
    return buildGoogleMapsCoordinateLink(destinationLocation);
  }

  const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(order?.mapLink));

  if(mapLinkCoordinates){
    return buildGoogleMapsCoordinateLink(mapLinkCoordinates);
  }

  if(order.mapLink){
    return normalizeMapUrl(order.mapLink);
  }

  if(order.eventLocation){
    return `https://www.google.com/maps?q=${encodeURIComponent(order.eventLocation)}`;
  }

  return "#";
}

function getCustomerWhatsAppUrl(order){
  const phone = getPhoneForWhatsApp(order.phone);
  const message = `Hello ${order.customerName || "Customer"}, this is your driver for order ${order.orderId}.`;

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "#";
}

function getCustomerCallUrl(order){
  const phone = getPhoneForCall(order.phone);

  return phone ? `tel:${phone}` : "#";
}

function getAssignedDriverMeta(order){
  const currentMeta = getDriverMeta(currentDriver);
  const orderDriver = order?.driver || {};

  return {
    name: currentMeta.name || orderDriver.name || "Driver",
    phone: currentMeta.phone || orderDriver.phone || "",
    email: currentMeta.email || orderDriver.email || "",
    uid: currentMeta.uid || orderDriver.uid || ""
  };
}

async function resolveDriverProfile(user){
  const email = normalizeEmail(user.email);
  const driverDocs = await getDocs(collection(db, "drivers"));
  const driverDoc = driverDocs.docs.find((docSnapshot) => {
    const driver = docSnapshot.data();
    return driver.uid === user.uid || normalizeEmail(driver.email) === email;
  }) || null;

  if(!driverDoc){
    return null;
  }

  const currentData = driverDoc.data();
  const nextData = {};

  if(email && currentData.email !== email){
    nextData.email = email;
  }

  if(currentData.uid !== user.uid){
    nextData.uid = user.uid;
  }

  if(Object.keys(nextData).length){
    await updateDoc(driverDoc.ref, nextData);
  }

  return {
    id: driverDoc.id,
    ...currentData,
    ...nextData
  };
}

async function backfillAssignedOrders(user, driverProfile){
  const email = normalizeEmail(driverProfile?.email || user.email);

  if(!email){
    return;
  }

  const assignedByEmail = await getDocs(
    query(collection(db, "orders"), where("driver.email", "==", email))
  );

  const driverMeta = getDriverMeta({
    name: driverProfile?.name || user.displayName || "Driver",
    phone: driverProfile?.phone || "",
    email,
    uid: user.uid
  });

  const updates = assignedByEmail.docs
    .filter((orderDoc) => {
      const orderDriver = orderDoc.data().driver || {};
      return (
        orderDriver.uid !== user.uid ||
        orderDriver.name !== driverMeta.name ||
        orderDriver.phone !== driverMeta.phone ||
        orderDriver.email !== driverMeta.email
      );
    })
    .map((orderDoc) => updateDoc(orderDoc.ref, { driver: driverMeta }));

  await Promise.all(updates);
}

function sortDriverOrders(orders){
  return [...orders].sort((first, second) => {
    const firstStatusRank = first.status === "out-for-delivery" ? 0 : first.status === "preparing" ? 1 : 2;
    const secondStatusRank = second.status === "out-for-delivery" ? 0 : second.status === "preparing" ? 1 : 2;

    if(firstStatusRank !== secondStatusRank){
      return firstStatusRank - secondStatusRank;
    }

    const firstTime = getOrderSortTime(first);
    const secondTime = getOrderSortTime(second);

    return firstTime - secondTime;
  });
}

function getOrderSortTime(order, fallback = Number.MAX_SAFE_INTEGER){
  const collectedTime = getTimestampValue(order.collectedAt);

  if(collectedTime){
    return collectedTime;
  }

  const deliveredTime = getTimestampValue(order.deliveredAt);

  if(deliveredTime){
    return deliveredTime;
  }

  const eventDateTime = getEventDateTimeValue(order);

  if(eventDateTime){
    return eventDateTime;
  }

  const createdAtTime = getTimestampValue(order.createdAt);
  return createdAtTime || fallback;
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

function getEventDateTimeValue(order){
  if(!order?.eventDate){
    return 0;
  }

  const dateParts = String(order.eventDate).split("-").map(Number);

  if(dateParts.length !== 3 || dateParts.some((value) => Number.isNaN(value))){
    return 0;
  }

  const [year, month, day] = dateParts;
  const eventDate = new Date(year, month - 1, day);

  if(order.eventTime){
    const timeMatch = String(order.eventTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if(timeMatch){
      let hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const meridiem = timeMatch[3].toUpperCase();

      if(meridiem === "PM" && hours !== 12){
        hours += 12;
      }

      if(meridiem === "AM" && hours === 12){
        hours = 0;
      }

      eventDate.setHours(hours, minutes, 0, 0);
    }
  }

  return Number.isNaN(eventDate.getTime()) ? 0 : eventDate.getTime();
}

function getCompletedOrdersRangeValue(order){
  return getTimestampValue(order.collectedAt) || getTimestampValue(order.deliveredAt) || getEventDateTimeValue(order) || getTimestampValue(order.createdAt);
}

function isOrderInCurrentMonth(order){
  const orderTime = getCompletedOrdersRangeValue(order);

  if(!orderTime){
    return false;
  }

  const orderDate = new Date(orderTime);
  const now = new Date();

  return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
}

function getCompletedOrders(){
  const searchValue = completedSearchInput?.value.trim().toLowerCase() || "";
  const rangeValue = completedRangeFilter?.value || "month";
  const sortValue = completedSortFilter?.value || "recent";

  let completedOrders = currentOrders.filter(isCompletedOrder);

  if(rangeValue === "month"){
    completedOrders = completedOrders.filter(isOrderInCurrentMonth);
  }

  if(searchValue){
    completedOrders = completedOrders.filter((order) =>
      String(order.orderId || "").toLowerCase().includes(searchValue) ||
      String(order.customerName || "").toLowerCase().includes(searchValue)
    );
  }

  completedOrders = [...completedOrders].sort((first, second) => {
    const firstTime = getCompletedOrdersRangeValue(first);
    const secondTime = getCompletedOrdersRangeValue(second);
    return sortValue === "oldest" ? firstTime - secondTime : secondTime - firstTime;
  });

  return completedOrders;
}

function syncCollectionControls(){
  if(driverCollectionOrderIdInput){
    driverCollectionOrderIdInput.disabled = isFindingCollectionOrder || isMarkingCollected;
  }

  if(driverCollectionFindBtn){
    driverCollectionFindBtn.disabled = isFindingCollectionOrder || isMarkingCollected || !currentDriver;
    driverCollectionFindBtn.textContent = isFindingCollectionOrder ? "Finding..." : "Find Order";
  }

  const confirmButton = document.getElementById("driverCollectionConfirmBtn");

  if(confirmButton){
    confirmButton.disabled = isMarkingCollected;
    confirmButton.textContent = isMarkingCollected ? "Marking Items Collected..." : "Mark Items Collected";
  }
}

function renderCollectionState(markup){
  if(!driverCollectionResult){
    return;
  }

  driverCollectionResult.innerHTML = markup;
  document.getElementById("driverCollectionConfirmBtn")?.addEventListener("click", handleMarkItemsCollected);
  syncCollectionControls();
}

function renderCollectionEmptyState(){
  currentCollectionLookupOrder = null;
  renderCollectionState(`
    <article class="driver-collection-state is-empty">
      <strong>Ready to collect a delivered order</strong>
      <p>Search by the customer-facing order ID to view the order summary and release inventory after collection.</p>
    </article>
  `);
}

function getCollectionSummaryMarkup(order){
  return `
    <div class="driver-collection-summary-grid">
      <div>
        <span>Order ID</span>
        <strong>${escapeHtml(order.orderId || order.id || "N/A")}</strong>
      </div>
      <div>
        <span>Customer</span>
        <strong>${escapeHtml(order.customerName || "Unknown customer")}</strong>
      </div>
      <div>
        <span>Event Date</span>
        <strong>${escapeHtml(order.eventDate || "N/A")}</strong>
      </div>
      <div>
        <span>Rental Days</span>
        <strong>${getOrderRentalDays(order)}</strong>
      </div>
      <div class="is-wide">
        <span>Event Location</span>
        <strong>${escapeHtml(order.eventLocation || "No location recorded")}</strong>
      </div>
    </div>
    <div class="driver-order-items driver-collection-items">
      <span>Items in this Order</span>
      <ul class="driver-order-items-list">
        ${getOrderItemsMarkup(order)}
      </ul>
    </div>
    <div class="driver-collection-summary-grid driver-collection-history-grid">
      <div>
        <span>Delivered By</span>
        <strong>${escapeHtml(getDeliveredByDisplay(order))}</strong>
      </div>
      <div>
        <span>Delivered At</span>
        <strong>${escapeHtml(formatDriverDateTime(order.deliveredAt))}</strong>
      </div>
      ${normalizeOrderStatusValue(order.status) === "collected" ? `
        <div>
          <span>Collected By</span>
          <strong>${escapeHtml(getCollectedByDisplay(order))}</strong>
        </div>
        <div>
          <span>Collected At</span>
          <strong>${escapeHtml(formatDriverDateTime(order.collectedAt))}</strong>
        </div>
      ` : ""}
    </div>
  `;
}

function renderCollectionLookupOrder(order, options = {}){
  const normalizedStatus = normalizeOrderStatusValue(order?.status);
  const isDeliveredOrder = normalizedStatus === "delivered";
  const isCollectedOrder = normalizedStatus === "collected";
  const tone = options.tone || (isDeliveredOrder ? "ready" : isCollectedOrder ? "success" : "warning");
  const title = options.title || (
    isDeliveredOrder
      ? "Order Ready for Collection"
      : isCollectedOrder
        ? "This order has already been collected"
        : "This order is not ready for collection"
  );
  const description = options.description || (
    isDeliveredOrder
      ? "Review the summary below, then confirm that the rental items have been collected back."
      : isCollectedOrder
        ? "This rental order has already been returned and inventory has been released."
        : `Only orders with status Delivered can be collected. Current status: ${formatStatusLabel(order.status)}.`
  );

  renderCollectionState(`
    <article class="driver-collection-state is-${tone}">
      <div class="driver-collection-state-head">
        <div>
          <span class="driver-order-kicker">Collection Lookup</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <span class="driver-order-badge is-${escapeHtml(normalizedStatus || "unknown")}">
          ${escapeHtml(formatStatusLabel(order.status))}
        </span>
      </div>
      ${getCollectionSummaryMarkup(order)}
      ${isDeliveredOrder ? `
        <div class="driver-collection-actions">
          <button id="driverCollectionConfirmBtn" class="btn btn-primary" type="button">
            Mark Items Collected
          </button>
        </div>
      ` : ""}
    </article>
  `);
}

function renderCollectionLookupMessage(tone, title, description){
  currentCollectionLookupOrder = null;
  renderCollectionState(`
    <article class="driver-collection-state is-${tone}">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
    </article>
  `);
}

async function findOrderByLookupId(orderIdValue){
  const rawValue = String(orderIdValue || "").trim();
  const normalizedValue = normalizeOrderIdInput(orderIdValue);
  const directCandidates = [...new Set([
    rawValue,
    normalizedValue,
    rawValue.toLowerCase(),
    normalizedValue.toLowerCase()
  ].filter(Boolean))];

  for(const candidate of directCandidates){
    const snapshot = await getDoc(doc(db, "orders", candidate));

    if(snapshot.exists()){
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
  }

  const orderIdCandidates = [...new Set([
    rawValue,
    normalizedValue,
    rawValue.toLowerCase(),
    normalizedValue.toLowerCase()
  ].filter(Boolean))];

  for(const candidate of orderIdCandidates){
    const snapshot = await getDocs(query(collection(db, "orders"), where("orderId", "==", candidate)));

    if(!snapshot.empty){
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
  }

  return null;
}

async function handleCollectionLookup(event){
  event.preventDefault();

  if(isFindingCollectionOrder || isMarkingCollected){
    return;
  }

  if(!currentDriver){
    renderCollectionLookupMessage("warning", "Driver profile is still loading", "Please wait a moment and try again.");
    return;
  }

  const enteredOrderId = driverCollectionOrderIdInput?.value || "";
  const normalizedOrderId = normalizeOrderIdInput(enteredOrderId);

  if(!normalizedOrderId){
    renderCollectionLookupMessage("error", "Enter an order ID", "Type the customer-facing order ID before searching.");
    driverCollectionOrderIdInput?.focus();
    return;
  }

  isFindingCollectionOrder = true;
  currentCollectionLookupOrder = null;
  renderCollectionLookupMessage("info", "Searching for order", `Looking up ${normalizedOrderId} now.`);
  syncCollectionControls();

  try{
    const order = await findOrderByLookupId(enteredOrderId);

    if(!order){
      renderCollectionLookupMessage("error", "Order not found", "We could not find an order with that ID. Please check the ID and try again.");
      return;
    }

    currentCollectionLookupOrder = order;
    renderCollectionLookupOrder(order);
  }catch(error){
    console.error("Failed to find collection order:", error);
    renderCollectionLookupMessage("error", "Lookup failed", "We could not load that order right now. Please try again.");
  }finally{
    isFindingCollectionOrder = false;
    syncCollectionControls();
  }
}

async function handleMarkItemsCollected(){
  if(!currentCollectionLookupOrder || isMarkingCollected){
    return;
  }

  if(!currentDriver){
    setDashboardMessage("Your driver profile is unavailable right now.", "error");
    return;
  }

  isMarkingCollected = true;
  syncCollectionControls();

  try{
    const orderRef = doc(db, "orders", currentCollectionLookupOrder.id);
    const latestSnapshot = await getDoc(orderRef);

    if(!latestSnapshot.exists()){
      renderCollectionLookupMessage("error", "Order no longer exists", "This order could not be found anymore.");
      return;
    }

    const latestOrder = {
      id: latestSnapshot.id,
      ...latestSnapshot.data()
    };
    const latestStatus = normalizeOrderStatusValue(latestOrder.status);

    if(latestStatus === "collected"){
      currentCollectionLookupOrder = latestOrder;
      renderCollectionLookupOrder(latestOrder);
      setDashboardMessage(`Order ${latestOrder.orderId || latestOrder.id} has already been collected.`, "warning");
      return;
    }

    if(latestStatus !== "delivered"){
      currentCollectionLookupOrder = latestOrder;
      renderCollectionLookupOrder(latestOrder);
      setDashboardMessage("This order is not ready for collection.", "warning");
      return;
    }

    const collectedBy = getDriverMeta(currentDriver);

    // Preserve the original delivery assignment/details and only append the return metadata.
    await updateDoc(orderRef, {
      status: "collected",
      collectedAt: serverTimestamp(),
      collectedBy
    });

    currentCollectionLookupOrder = {
      ...latestOrder,
      status: "collected",
      collectedAt: new Date(),
      collectedBy
    };

    renderCollectionLookupOrder(currentCollectionLookupOrder, {
      tone: "success",
      title: "Items marked as collected",
      description: "This order has been returned successfully and the reserved inventory is now released."
    });
    setDashboardMessage(`Order ${currentCollectionLookupOrder.orderId || currentCollectionLookupOrder.id} marked as collected.`, "success");
  }catch(error){
    console.error("Failed to mark order as collected:", error);
    setDashboardMessage("We could not mark this order as collected right now.", "error");

    if(currentCollectionLookupOrder){
      renderCollectionLookupOrder(currentCollectionLookupOrder, {
        tone: "warning",
        title: "Collection update failed",
        description: "The order is still eligible for collection, but the update did not go through. Please try again."
      });
    }else{
      renderCollectionLookupMessage("error", "Collection update failed", "We could not mark this order as collected right now.");
    }
  }finally{
    isMarkingCollected = false;
    syncCollectionControls();
  }
}

function getCompletedOrdersPagination(totalOrders){
  const totalPages = Math.max(1, Math.ceil(totalOrders / COMPLETED_ORDERS_PER_PAGE));
  completedOrdersPage = Math.min(completedOrdersPage, totalPages);

  return {
    totalPages,
    currentPage: completedOrdersPage,
    startIndex: (completedOrdersPage - 1) * COMPLETED_ORDERS_PER_PAGE,
    endIndex: completedOrdersPage * COMPLETED_ORDERS_PER_PAGE
  };
}

function syncCompletedOrdersPagination(totalOrders){
  if(!driverCompletedPagination || !driverCompletedPageInfo || !driverCompletedPrevBtn || !driverCompletedNextBtn){
    return;
  }

  if(!totalOrders){
    driverCompletedPagination.style.display = "none";
    driverCompletedPageInfo.textContent = "Page 1 of 1";
    driverCompletedPrevBtn.disabled = true;
    driverCompletedNextBtn.disabled = true;
    return;
  }

  const { totalPages, currentPage } = getCompletedOrdersPagination(totalOrders);
  driverCompletedPagination.style.display = totalPages > 1 ? "flex" : "none";
  driverCompletedPageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  driverCompletedPrevBtn.disabled = currentPage <= 1;
  driverCompletedNextBtn.disabled = currentPage >= totalPages;
}

function getActiveOrders(){
  return sortDriverOrders(currentOrders.filter((order) => !isCompletedOrder(order) && order.status !== "cancelled"));
}

function getLiveDeliveryOrders(orders = currentOrders){
  return sortDriverOrders(
    orders.filter((order) => order.status === "out-for-delivery" && !finishingOrderIds.has(order.id))
  );
}

function isAnyLocationSharingActive(orders = currentOrders){
  return locationWatchId !== null && getLiveDeliveryOrders(orders).length > 0;
}

function isOrderLocationSharingActive(order){
  return order?.status === "out-for-delivery" && !finishingOrderIds.has(order.id) && isAnyLocationSharingActive();
}

function getActionBlock(order, options){
  const isStarting = startingOrderIds.has(order.id);
  const isOutForDelivery = order.status === "out-for-delivery";
  const isDelivered = order.status === "delivered";
  const isCollected = order.status === "collected";
  const isCancelled = order.status === "cancelled";
  const isClosed = isDelivered || isCollected || isCancelled;
  const isFinishing = finishingOrderIds.has(order.id);
  const isSharingLocation = isOrderLocationSharingActive(order);
  const needsLocationWarning = isOutForDelivery && !isSharingLocation;
  const mapActionClass = isClosed ? "is-disabled" : "";
  const customerPhoneAvailable = Boolean(getPhoneForCall(order.phone));
  const contactActionClass = customerPhoneAvailable ? "" : "is-disabled";
  const isCompletedCard = options.variant === "completed";

  let statusAction = "";
  let primaryActions = "";
  let locationStateBlock = "";

  if(order.status === "preparing" && isStarting){
    statusAction = `
      <button class="btn btn-secondary driver-disabled-btn" type="button" disabled>
        Starting Delivery...
      </button>
    `;
  }else if(order.status === "preparing"){
    primaryActions = `
      <button class="btn btn-primary start-delivery-btn" data-id="${order.id}" type="button">
        Start Delivery
      </button>
    `;
  }else if(isOutForDelivery){
    statusAction = `
      <div class="driver-live-state">
        <span class="driver-live-dot"></span>
        <strong>On the Way</strong>
      </div>
    `;
    locationStateBlock = isSharingLocation ? `
      <div class="driver-location-state is-on">
        <strong>Live location is ON</strong>
        <p>Customer can now see your movement</p>
      </div>
    ` : `
      <div class="driver-location-warning" role="alert">
        <strong>Live location is OFF</strong>
        <p>Press "Share Live Location" so the customer can track you</p>
      </div>
    `;
    primaryActions = `
      <button class="btn btn-secondary share-location-btn ${needsLocationWarning ? "is-highlighted" : ""}" data-id="${order.id}" type="button">
        ${isSharingLocation ? "Sharing Live Location" : "Share Live Location"}
      </button>
      <button class="btn btn-primary finish-order-btn" data-id="${order.id}" type="button" ${isFinishing ? "disabled" : ""}>
        ${isFinishing ? "Finishing Order..." : "Finish Order"}
      </button>
    `;
  }else if(isDelivered){
    statusAction = `
      <div class="driver-completed-state">
        <strong>Delivery Completed</strong>
        <span>${formatCompletedDateLabel(order)}</span>
      </div>
    `;
  }else if(isCollected){
    statusAction = `
      <div class="driver-completed-state">
        <strong>Items Collected Back</strong>
        <span>${formatCompletedDateLabel(order)}</span>
      </div>
    `;
  }else if(isCancelled){
    statusAction = `
      <button class="btn btn-secondary driver-disabled-btn" type="button" disabled>
        Cancelled
      </button>
    `;
  }

  return `
    <div class="driver-order-actions ${isCompletedCard ? "is-completed-card" : ""}">
      <div class="driver-action-row driver-action-row-secondary driver-action-row-contact">
        <a class="btn btn-secondary driver-action-link ${mapActionClass}" href="${isClosed ? "#" : getMapUrl(order)}" target="_blank" rel="noreferrer">
          Open Map
        </a>
        <a class="btn btn-secondary driver-action-link ${contactActionClass}" href="${customerPhoneAvailable ? getCustomerCallUrl(order) : "#"}">
          Call Customer
        </a>
        <a class="btn btn-secondary driver-action-link ${contactActionClass}" href="${customerPhoneAvailable ? getCustomerWhatsAppUrl(order) : "#"}" target="_blank" rel="noreferrer">
          Send Message on WhatsApp
        </a>
      </div>
      ${statusAction ? `
        <div class="driver-action-row driver-action-row-status">
          ${statusAction}
        </div>
      ` : ""}
      ${locationStateBlock ? `
        <div class="driver-action-row driver-action-row-status">
          ${locationStateBlock}
        </div>
      ` : ""}
      ${primaryActions ? `
        <div class="driver-action-row driver-action-row-primary">
          ${primaryActions}
        </div>
      ` : ""}
    </div>
  `;
}

function formatCompletedDateLabel(order){
  const completedTime = getCompletedOrdersRangeValue(order);

  if(!completedTime){
    return "Completed";
  }

  return `Completed ${new Date(completedTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function renderOrderCard(order, options = {}){
  const isActive = order.status === "out-for-delivery" || startingOrderIds.has(order.id);
  const isCompletedCard = options.variant === "completed";
  const priority = getPriorityValue(order.priority);

  return `
    <article class="driver-order-card ${isActive ? "is-active" : ""} ${isCompletedCard ? "is-completed-card" : ""}">
      <div class="driver-order-top">
        <div>
          <span class="driver-order-kicker">${order.orderId}</span>
          <h3>${order.customerName || "Unknown customer"}</h3>
        </div>
        <span class="driver-order-badge is-${String(order.status || "unknown").replaceAll(" ", "-")}">
          ${formatStatusLabel(order.status)}
        </span>
      </div>

      <div class="driver-order-priority">
        <span>Priority</span>
        <strong class="driver-priority-badge is-${priority}">${formatPriorityLabel(priority)}</strong>
      </div>

      <div class="driver-order-meta">
        <div>
          <span>Event Time</span>
          <strong>${order.eventDate || "Date TBC"}${order.eventTime ? ` - ${order.eventTime}` : ""}</strong>
        </div>
        <div>
          <span>Rental Days</span>
          <strong>${getOrderRentalDays(order)}</strong>
        </div>
        <div>
          <span>Setup Time</span>
          <strong>${order.setupTime || "N/A"}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>${order.eventLocation || "No location yet"}</strong>
        </div>
      </div>

      <div class="driver-order-items">
        <span>Order Items</span>
        <ul class="driver-order-items-list">
          ${getOrderItemsMarkup(order)}
        </ul>
      </div>

      ${getActionBlock(order, options)}
    </article>
  `;
}

function renderDriverOrders(orders){
  if(!driverOrdersGrid){
    return;
  }

  if(!orders.length){
    driverOrdersGrid.innerHTML = `
      <article class="driver-empty-state">
        <strong>No active orders right now</strong>
        <p>New assigned deliveries will appear here automatically.</p>
      </article>
    `;
    return;
  }

  driverOrdersGrid.innerHTML = orders.map((order) => renderOrderCard(order)).join("");

  attachOrderActions();
}

function renderCompletedOrders(orders){
  if(!driverCompletedOrdersGrid){
    return;
  }

  if(!orders.length){
    completedOrdersPage = 1;
    driverCompletedOrdersGrid.innerHTML = `
      <article class="driver-empty-state is-soft">
        <strong>No completed orders found</strong>
        <p>Try a different filter or complete a delivery or collection to see it here.</p>
      </article>
    `;
    syncCompletedOrdersPagination(0);
    return;
  }

  const { startIndex, endIndex } = getCompletedOrdersPagination(orders.length);
  const paginatedOrders = orders.slice(startIndex, endIndex);

  driverCompletedOrdersGrid.innerHTML = paginatedOrders.map((order) => renderOrderCard(order, {
    variant: "completed"
  })).join("");
  syncCompletedOrdersPagination(orders.length);
}

function attachOrderActions(){
  document.querySelectorAll(".start-delivery-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await startDelivery(button.dataset.id);
    });
  });

  document.querySelectorAll(".share-location-btn").forEach((button) => {
    button.addEventListener("click", () => {
      startLocationSharing(button.dataset.id);
    });
  });

  document.querySelectorAll(".finish-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await finishOrder(button.dataset.id);
    });
  });
}

function updateDashboardSummary(){
  const activeOrders = getActiveOrders();
  const completedOrders = currentOrders.filter(isCompletedOrder);
  const completedOrdersInMonth = completedOrders.filter(isOrderInCurrentMonth);

  if(driverWelcomeName){
    driverWelcomeName.textContent = currentDriver?.name || "Driver";
  }

  if(driverSummaryText){
    const liveDeliveryCount = getLiveDeliveryOrders().length;
    driverSummaryText.textContent = currentOrders.length
      ? `${activeOrders.length} active assigned order${activeOrders.length === 1 ? "" : "s"}, ${completedOrders.length} completed overall, and ${liveDeliveryCount} currently in delivery flow.`
      : "Assigned deliveries will appear here in real time.";
  }

  if(driverActiveOrdersSummary){
    const liveOrderCount = getLiveDeliveryOrders().length;
    driverActiveOrdersSummary.textContent = activeOrders.length
      ? `${activeOrders.length} active assigned order${activeOrders.length === 1 ? "" : "s"} with ${liveOrderCount} currently in delivery status.`
      : "You do not have any active assigned orders right now.";
  }

  if(driverCompletedOrdersSummary){
    driverCompletedOrdersSummary.textContent = completedOrders.length
      ? `${completedOrdersInMonth.length} completed this month and ${completedOrders.length} completed all time.`
      : "Delivered and collected orders will appear here automatically.";
  }

  if(activeDeliveryPill){
    const liveOrders = getLiveDeliveryOrders();
    activeDeliveryPill.textContent = liveOrders.length
      ? `Active deliveries: ${liveOrders.map((order) => order.orderId).join(", ")}`
      : "Active deliveries: none";
  }

  if(locationSharingPill){
    const liveOrderCount = getLiveDeliveryOrders().length;
    const isSharingActive = isAnyLocationSharingActive();
    locationSharingPill.textContent = isSharingActive
      ? "Location sharing: ON"
      : "Location sharing: OFF";
    locationSharingPill.classList.toggle("is-on", isSharingActive);
    locationSharingPill.classList.toggle("is-off", !isSharingActive || !liveOrderCount);
  }
}

function syncLiveDeliveryState(orders){
  const liveOrderIds = new Set(
    orders
      .filter((order) => order.status === "out-for-delivery")
      .map((order) => order.id)
  );

  startingOrderIds = new Set(
    [...startingOrderIds].filter((orderId) => !liveOrderIds.has(orderId))
  );

  finishingOrderIds = new Set(
    [...finishingOrderIds].filter((orderId) => liveOrderIds.has(orderId))
  );

  if(!liveOrderIds.size){
    if(locationWatchId !== null){
      stopLocationSharing({
        preservePreference: true
      });
    }else{
      stopLocationWatchHealthCheck();
    }
    return;
  }

  if(liveOrderIds.size && isLocationSharingEnabled){
    ensureLocationSharingWatch();
  }
}

function renderDriverDashboard(){
  const activeOrders = getActiveOrders();
  const completedOrders = getCompletedOrders();

  updateDashboardSummary();
  renderDriverOrders(activeOrders);
  renderCompletedOrders(completedOrders);
}

function subscribeToDriverOrders(uid){
  ordersUnsubscribe?.();

  const driverOrdersQuery = query(
    collection(db, "orders"),
    where("driver.uid", "==", uid)
  );

  ordersUnsubscribe = onSnapshot(driverOrdersQuery, (snapshot) => {
    const assignedOrders = snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data()
    }));

    currentOrders = assignedOrders;
    syncLiveDeliveryState(currentOrders);
    renderDriverDashboard();
  }, (error) => {
    console.error("Failed to subscribe to driver orders:", error);
    setDashboardMessage("We could not load your deliveries right now.", "error");
  });
}

async function startDelivery(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order || !currentDriver){
    return;
  }

  startingOrderIds.add(orderId);
  renderDriverDashboard();

  try{
    await updateDoc(doc(db, "orders", orderId), {
      status: "out-for-delivery",
      driver: getAssignedDriverMeta(order),
      driverLocation: null
    });

    setDashboardMessage(`Delivery started for ${order.orderId}. You can share live location now.`, "success");
  }catch(error){
    startingOrderIds.delete(orderId);
    renderDriverDashboard();
    console.error("Failed to start delivery:", error);
    setDashboardMessage("We could not start delivery right now.", "error");
  }
}

function startLocationWatchHealthCheck(){
  if(locationWatchHealthCheckId !== null){
    return;
  }

  locationWatchHealthCheckId = window.setInterval(() => {
    const hasLiveDeliveries = getLiveDeliveryOrders().length > 0;

    if(!isLocationSharingEnabled || !hasLiveDeliveries){
      if(locationWatchHealthCheckId !== null && !hasLiveDeliveries){
        window.clearInterval(locationWatchHealthCheckId);
        locationWatchHealthCheckId = null;
      }
      return;
    }

    const isWatchMissing = locationWatchId === null;
    const isWatchStale = lastLocationActivityAt && (Date.now() - lastLocationActivityAt) > LOCATION_WATCH_STALE_MS;

    if(isWatchMissing || isWatchStale){
      restartLocationSharingWatch(isWatchStale ? "refresh" : "resume");
    }
  }, LOCATION_WATCH_HEALTHCHECK_MS);
}

function stopLocationWatchHealthCheck(){
  if(locationWatchHealthCheckId !== null){
    window.clearInterval(locationWatchHealthCheckId);
    locationWatchHealthCheckId = null;
  }
}

function stopLocationSharing(options = {}){
  const {
    preservePreference = false
  } = options;

  if(locationWatchId !== null && navigator.geolocation){
    navigator.geolocation.clearWatch(locationWatchId);
  }

  if(!preservePreference){
    persistLocationSharingPreference(false);
  }

  locationWatchId = null;
  lastSharedLocation = null;
  lastLocationActivityAt = 0;
  isLocationUpdatePending = false;
  stopLocationWatchHealthCheck();
  renderDriverDashboard();
}

function restartLocationSharingWatch(reason = "resume"){
  if(locationWatchId !== null && navigator.geolocation){
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }

  lastLocationActivityAt = 0;
  ensureLocationSharingWatch(reason);
}

function ensureLocationSharingWatch(reason = "resume"){
  const liveOrders = getLiveDeliveryOrders();

  if(!isLocationSharingEnabled || !liveOrders.length){
    if(!liveOrders.length && locationWatchId !== null){
      stopLocationSharing({
        preservePreference: true
      });
    }
    return;
  }

  if(!navigator.geolocation){
    setDashboardMessage("Geolocation is not supported on this device.", "error");
    persistLocationSharingPreference(false);
    renderDriverDashboard();
    return;
  }

  if(locationWatchId !== null){
    startLocationWatchHealthCheck();
    renderDriverDashboard();
    return;
  }

  lastLocationActivityAt = Date.now();
  startLocationWatchHealthCheck();
  locationWatchId = navigator.geolocation.watchPosition(async (position) => {
    const activeLiveOrders = getLiveDeliveryOrders();

    if(!activeLiveOrders.length){
      stopLocationSharing({
        preservePreference: true
      });
      return;
    }

    lastLocationActivityAt = Date.now();

    if(isLocationUpdatePending){
      return;
    }

    isLocationUpdatePending = true;

    try{
      const nextLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        updatedAt: new Date()
      };
      const now = Date.now();
      const distanceFromLastShared = calculateDistanceInKm(lastSharedLocation, nextLocation);
      const wasRecentlyShared = lastSharedLocation && (now - lastSharedLocation.sharedAtMs) < LOCATION_UPDATE_MIN_INTERVAL_MS;
      const hasBarelyMoved = Number.isFinite(distanceFromLastShared) && distanceFromLastShared < LOCATION_UPDATE_MIN_DISTANCE_KM;

      if(wasRecentlyShared && hasBarelyMoved){
        return;
      }

      await Promise.all(activeLiveOrders.map((liveOrder) =>
        updateDoc(doc(db, "orders", liveOrder.id), {
          driverLocation: nextLocation
        })
      ));

      lastSharedLocation = {
        ...nextLocation,
        sharedAtMs: now
      };
      lastLocationActivityAt = now;
    }catch(error){
      console.error("Failed to update driver location:", error);
      setDashboardMessage("Could not update live location. We'll keep trying in the background.", "warning");
    }finally{
      isLocationUpdatePending = false;
    }
  }, (error) => {
    console.error("Geolocation watch failed:", error);
    lastLocationActivityAt = Date.now();

    if(error.code === 1){
      const permissionMessage = "Location permission was denied. Please allow location access to continue live sharing.";
      setDashboardMessage(permissionMessage, "error");
      stopLocationSharing();
      return;
    }

    if(error.code === 3){
      const now = Date.now();

      if((now - lastTimeoutMessageAt) > TIMEOUT_MESSAGE_COOLDOWN_MS){
        lastTimeoutMessageAt = now;
        setDashboardMessage("Live location is taking longer than expected. We'll keep trying in the background.", "warning");
      }

      return;
    }

    setDashboardMessage("Live location signal is weak right now. We'll keep trying in the background.", "warning");
  }, GEOLOCATION_OPTIONS);

  if(reason === "share"){
    setDashboardMessage("Live location sharing started for active deliveries.", "success");
  }else{
    setDashboardMessage("Live location sharing is active for your current deliveries.", "success");
  }

  renderDriverDashboard();
}

async function finishOrder(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order || order.status !== "out-for-delivery"){
    return;
  }

  finishingOrderIds.add(orderId);
  renderDriverDashboard();

  try{
    await updateDoc(doc(db, "orders", orderId), {
      status: "delivered",
      driver: getAssignedDriverMeta(order),
      driverLocation: null,
      deliveredAt: new Date()
    });

    setDashboardMessage(`Order ${order.orderId} completed successfully.`, "success");
  }catch(error){
    console.error("Failed to finish order:", error);
    finishingOrderIds.delete(orderId);
    renderDriverDashboard();
    setDashboardMessage("We could not complete this order right now.", "error");
  }
}

function startLocationSharing(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order){
    return;
  }

  if(order.status !== "out-for-delivery"){
    setDashboardMessage("Start delivery before sharing live location.", "warning");
    return;
  }

  if(!navigator.geolocation){
    setDashboardMessage("Geolocation is not supported on this device.", "error");
    return;
  }

  persistLocationSharingPreference(true);

  if(locationWatchId !== null){
    setDashboardMessage(`Live location is already updating for active deliveries.`, "success");
    startLocationWatchHealthCheck();
    renderDriverDashboard();
    return;
  }

  ensureLocationSharingWatch("share");
}

async function initializeDriverDashboard(user){
  localStorage.setItem("driverUid", user.uid);
  hydrateLocationSharingPreference();
  currentDriver = await resolveDriverProfile(user);

  if(!currentDriver){
    setDashboardMessage("Your driver profile was not found. Please contact admin.", "error");
    return;
  }

  await backfillAssignedOrders(user, currentDriver);
  renderDriverDashboard();
  setDashboardMessage("Dashboard connected. Assigned orders update in real time.", "success");
  subscribeToDriverOrders(user.uid);
}

function attachCompletedOrderFilters(){
  completedRangeFilter?.addEventListener("change", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  completedSortFilter?.addEventListener("change", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  completedSearchInput?.addEventListener("input", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  driverCompletedPrevBtn?.addEventListener("click", () => {
    if(completedOrdersPage <= 1){
      return;
    }

    completedOrdersPage -= 1;
    renderCompletedOrders(getCompletedOrders());
  });

  driverCompletedNextBtn?.addEventListener("click", () => {
    const totalOrders = getCompletedOrders().length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / COMPLETED_ORDERS_PER_PAGE));

    if(completedOrdersPage >= totalPages){
      return;
    }

    completedOrdersPage += 1;
    renderCompletedOrders(getCompletedOrders());
  });
}

function persistLocationSharingPreference(isEnabled){
  isLocationSharingEnabled = Boolean(isEnabled);

  if(isLocationSharingEnabled){
    localStorage.setItem(LOCATION_SHARING_PREFERENCE_KEY, "true");
  }else{
    localStorage.removeItem(LOCATION_SHARING_PREFERENCE_KEY);
  }
}

function hydrateLocationSharingPreference(){
  isLocationSharingEnabled = localStorage.getItem(LOCATION_SHARING_PREFERENCE_KEY) === "true";
}

driverLogoutBtn?.addEventListener("click", async () => {
  stopLocationSharing();
  ordersUnsubscribe?.();
  localStorage.removeItem("driverUid");
  await signOut(auth);
  window.location.href = "driver-login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initScrollTopButton();
  attachCompletedOrderFilters();
  hydrateLocationSharingPreference();
  renderCollectionEmptyState();
  syncCollectionControls();
  driverCollectionForm?.addEventListener("submit", handleCollectionLookup);

  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible" && isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  window.addEventListener("focus", () => {
    if(isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  window.addEventListener("online", () => {
    if(isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if(!user || user.uid !== storedUid){
      localStorage.removeItem("driverUid");
      window.location.href = "driver-login.html";
      return;
    }

    try{
      await initializeDriverDashboard(user);
      syncCollectionControls();
    }catch(error){
      console.error("Driver dashboard init failed:", error);
      setDashboardMessage("We could not open your dashboard right now.", "error");
    }
  });
});
