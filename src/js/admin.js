import { auth } from "./firebase.js";
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
  onSnapshot,
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

const STATUS_META = {
  "quote-requested": { label: "quote requested", className: "is-quote-requested" },
  confirmed: { label: "confirmed", className: "is-confirmed" },
  preparing: { label: "preparing", className: "is-preparing" },
  "out-for-delivery": { label: "out for delivery", className: "is-out-for-delivery" },
  delivered: { label: "delivered", className: "is-delivered" },
  cancelled: { label: "cancelled", className: "is-cancelled" }
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

    renderDriverPanel();
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
    "confirmed",
    "preparing",
    "out-for-delivery",
    "delivered",
    "cancelled"
  ];

  return statuses.map(status => `
    <option value="${status}" ${status===current?"selected":""}>
      ${status.replaceAll("-", " ")}
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

Status: ${order.status.replaceAll("-", " ")}

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

function renderEditableItems(items){
  if(!editItemsContainer){
    return;
  }

  const normalizedItems = items.length
    ? items
    : [{ name: "", quantity: 1 }];

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
      quantity: Number(row.querySelector(".edit-item-quantity")?.value) || 0
    }))
    .filter((item) => item.name && item.quantity > 0);
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
  return (status || "unknown").replaceAll("-", " ");
}

function getStatusColor(status){
  const colorMap = {
    "quote-requested": "#9da1a8",
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
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const status = document.getElementById("statusFilter")?.value || "all";
  const priority = document.getElementById("priorityFilter")?.value || "all";

  let filtered = allOrders;

  if(activeOpsFilter === "today"){
    filtered = filtered.filter(o => isToday(o.eventDate));
  }else if(activeOpsFilter === "upcoming"){
    filtered = filtered.filter(o => isWithinNextHours(o.eventDate, o.eventTime));
  }else if(activeOpsFilter === "tomorrow"){
    filtered = filtered.filter(o => isTomorrow(o.eventDate));
  }

  if(search){
    filtered = filtered.filter(o =>
      o.orderId.toLowerCase().includes(search) ||
      o.customerName.toLowerCase().includes(search)
    );
  }

  if(status !== "all"){
    filtered = filtered.filter(o => o.status === status);
  }

  if(priority !== "all"){
    filtered = filtered.filter(o => getPriorityValue(o.priority) === priority);
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
  document.getElementById("addEditItemBtn")?.addEventListener("click", addEditableItem);
  editOrderForm?.addEventListener("submit", handleEditOrderSubmit);
  editDeleteBtn?.addEventListener("click", handleDeleteOrder);
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
  editOrderModal?.addEventListener("click", (event) => {
    if(event.target === editOrderModal){
      closeEditOrderModal();
    }
  });
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
