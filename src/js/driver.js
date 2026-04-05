import { auth, db } from "./firebase.js";
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

let currentDriver = null;
let currentOrders = [];
let locationWatchId = null;
let isLocationUpdatePending = false;
let ordersUnsubscribe = null;
let startingOrderIds = new Set();
let finishingOrderIds = new Set();

const storedUid = localStorage.getItem("driverUid");

if(!storedUid){
  window.location.href = "driver-login.html";
}

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

function getMapUrl(order){
  if(order.mapLink){
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(order.mapLink)
      ? order.mapLink
      : `https://${order.mapLink}`;
  }

  if(order.eventLocation){
    return `https://www.google.com/maps?q=${encodeURIComponent(order.eventLocation)}`;
  }

  return "#";
}

function getCustomerContactUrl(order){
  const phone = getPhoneForWhatsApp(order.phone);
  const message = `Hello ${order.customerName || ""}, I'm your driver for order ${order.orderId}.`;

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "#";
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
  const contactActionClass = order.phone && !isClosed ? "" : "is-disabled";
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
      <div class="driver-action-row driver-action-row-secondary">
        <a class="btn btn-secondary driver-action-link ${mapActionClass}" href="${isClosed ? "#" : getMapUrl(order)}" target="_blank" rel="noreferrer">
          Open Map
        </a>
        <a class="btn btn-secondary driver-action-link ${contactActionClass}" href="${order.phone && !isClosed ? getCustomerContactUrl(order) : "#"}" target="_blank" rel="noreferrer">
          Contact Customer
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
    driverCompletedOrdersGrid.innerHTML = `
      <article class="driver-empty-state is-soft">
        <strong>No completed orders found</strong>
        <p>Try a different filter or finish an active delivery to see it here.</p>
      </article>
    `;
    return;
  }

  driverCompletedOrdersGrid.innerHTML = orders.map((order) => renderOrderCard(order, {
    variant: "completed"
  })).join("");
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

  if(!liveOrderIds.size && locationWatchId !== null){
    stopLocationSharing();
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

function stopLocationSharing(){
  if(locationWatchId !== null && navigator.geolocation){
    navigator.geolocation.clearWatch(locationWatchId);
  }

  locationWatchId = null;
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

  if(locationWatchId !== null){
    setDashboardMessage(`Live location is already updating for active deliveries.`, "success");
    return;
  }

  renderDriverDashboard();
  setDashboardMessage(`Live location sharing started for active deliveries.`, "success");

  locationWatchId = navigator.geolocation.watchPosition(async (position) => {
    const liveOrders = getLiveDeliveryOrders();

    if(!liveOrders.length){
      stopLocationSharing();
      return;
    }

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

      await Promise.all(liveOrders.map((liveOrder) =>
        updateDoc(doc(db, "orders", liveOrder.id), {
          driverLocation: nextLocation
        })
      ));
    }catch(error){
      console.error("Failed to update driver location:", error);
      setDashboardMessage("Could not update live location. Please try again.", "error");
    }finally{
      isLocationUpdatePending = false;
    }
  }, (error) => {
    console.error("Geolocation watch failed:", error);
    const locationMessage = `Location issue: ${error.message || "Unable to access live location."}`;
    setDashboardMessage(locationMessage, "error");

    if(error.code === error.PERMISSION_DENIED){
      stopLocationSharing();
    }

    alert(locationMessage);
  }, {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 20000
  });

  renderDriverDashboard();
}

async function initializeDriverDashboard(user){
  localStorage.setItem("driverUid", user.uid);
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
    renderCompletedOrders(getCompletedOrders());
    updateDashboardSummary();
  });

  completedSortFilter?.addEventListener("change", () => {
    renderCompletedOrders(getCompletedOrders());
  });

  completedSearchInput?.addEventListener("input", () => {
    renderCompletedOrders(getCompletedOrders());
  });
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
