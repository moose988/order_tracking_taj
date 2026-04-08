import { auth, db } from "./firebase.js";
import {
  buildGoogleMapsCoordinateLink,
  extractCoordinatesFromMapLink,
  getLocationCoordinates,
  getValidatedUaeCoordinates,
  normalizeMapUrl
} from "./location-utils.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function isDriverActiveOrder(order){
  return order.status === "preparing" || order.status === "out-for-delivery";
}

function isCompletedOrder(order){
  return order.status === "delivered";
}

function getPriorityValue(priority){
  const normalizedPriority = String(priority || "normal").toLowerCase().trim();

  if(normalizedPriority === "urgent" || normalizedPriority === "vip"){
    return normalizedPriority;
  }

  return "normal";
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
  return getTimestampValue(order.deliveredAt) || getEventDateTimeValue(order) || getTimestampValue(order.createdAt);
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
  const isCancelled = order.status === "cancelled";
  const isClosed = isDelivered || isCancelled;
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
          <span>Setup Time</span>
          <strong>${order.setupTime || "N/A"}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>${order.eventLocation || "No location yet"}</strong>
        </div>
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
        <p>Try a different filter or finish an active delivery to see it here.</p>
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
      : "Delivered orders you complete will appear here automatically.";
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
  attachCompletedOrderFilters();
  hydrateLocationSharingPreference();

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
    }catch(error){
      console.error("Driver dashboard init failed:", error);
      setDashboardMessage("We could not open your dashboard right now.", "error");
    }
  });
});
