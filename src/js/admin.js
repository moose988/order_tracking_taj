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
  getDocs,
  doc,
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

let allOrders = [];
let driversList = [];
let currentCalendarDate = new Date();
let ordersPerDayChart = null;
let ordersByStatusChart = null;
let topProductsChart = null;
let selectedOrderId = null;

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

async function loadOrders(){
  const snapshot = await getDocs(collection(db, "orders"));

  allOrders = snapshot.docs.map(doc => doc.data());

  renderOrders(allOrders);
  updateStats(allOrders);
  generateAnalytics();
  renderCalendar();
}

async function loadDrivers(){
  const snapshot = await getDocs(collection(db, "drivers"));
  driversList = snapshot.docs.map((driverDoc) => ({
    id: driverDoc.id,
    ...driverDoc.data()
  }));
}

/* RENDER TABLE */

function renderOrders(orders){

  if(orders.length === 0){
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px;">
          No orders found
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = "";

  orders.forEach(order => {

    const row = document.createElement("tr");
    row.classList.add("order-row");

    row.innerHTML = `
    <td>${order.orderId}</td>
    <td>${order.customerName}</td>
    <td>${order.eventDate}</td>
    <td>${order.eventLocation}</td>
  
    <td>
      <select class="status-select no-modal" data-id="${order.orderId}">
          ${getStatusOptions(order.status)}
        </select>
      </td>

      <td>
        <div class="action-buttons">
          <button class="btn btn-secondary copy-btn no-modal" data-id="${order.orderId}">
            Copy Link
          </button>

          <button class="btn btn-primary wa-btn no-modal" data-id="${order.orderId}">
            WhatsApp
          </button>

          <button class="btn btn-secondary assign-driver-btn no-modal" data-id="${order.orderId}">
            ${order.driver?.name ? `Driver: ${order.driver.name}` : "Assign Driver"}
          </button>

          ${order.status === "delivered" ? `
            <button class="btn btn-dark review-request-btn no-modal" data-id="${order.orderId}">
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

  /* STATUS CHANGE */
  document.querySelectorAll(".status-select").forEach(select => {

    select.addEventListener("change", async (e)=>{

      e.stopPropagation();

      const orderId = e.target.dataset.id;
      const newStatus = e.target.value;

      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });

      const targetOrder = allOrders.find(order => order.orderId === orderId);
      if(targetOrder){
        targetOrder.status = newStatus;
      }

      updateStats(allOrders);
      generateAnalytics();
      renderCalendar();
      applyFilters();

      alert("Status updated");
    });

  });

  /* COPY LINK */
  document.querySelectorAll(".copy-btn").forEach(btn => {

    btn.addEventListener("click", (e)=>{

      e.stopPropagation();

      const orderId = btn.dataset.id;
      const link = `${window.location.origin}/pages/track.html?id=${orderId}`;

      navigator.clipboard.writeText(link);

      alert("Tracking link copied");
    });

  });

  /* WHATSAPP */
document.querySelectorAll(".wa-btn").forEach(btn => {

  btn.addEventListener("click", (e)=>{

    e.stopPropagation();

    const orderId = btn.dataset.id;

    const order = allOrders.find(o => o.orderId === orderId);

    const itemsText = order.items
  .map(i => `• ${i.name} × ${i.quantity}`)
  .join("\n");

// 🔥 dynamic tracking link
const trackingLink = `${window.location.origin}/track.html?id=${order.orderId}`;

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
      const order = allOrders.find(item => item.orderId === orderId);

      if(!order){
        return;
      }

      const cleanPhone = (order.phone || "").replace(/\D/g, "");
      let formattedPhone = cleanPhone;

      if(cleanPhone.startsWith("0")){
        formattedPhone = "971" + cleanPhone.slice(1);
      }

      const reviewLink = `${window.location.origin}/pages/track.html?id=${order.orderId}`;
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

  document.querySelectorAll(".assign-driver-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      selectedOrderId = btn.dataset.id;

      const select = document.getElementById("driverSelect");
      const order = allOrders.find((item) => item.orderId === selectedOrderId);

      if(!select){
        return;
      }

      if(!driversList.length){
        select.innerHTML = '<option value="">No drivers available</option>';
        document.getElementById("confirmAssignDriver").disabled = true;
      }else{
        select.innerHTML = driversList.map((driver) => `
          <option value="${driver.phone}" ${order?.driver?.phone === driver.phone ? "selected" : ""}>
            ${driver.name} (${driver.phone})
          </option>
        `).join("");
        document.getElementById("confirmAssignDriver").disabled = false;
      }

      document.getElementById("driverModal").classList.add("active");
      document.body.style.overflow = "hidden";
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

function closeDriverModal(){
  document.getElementById("driverModal").classList.remove("active");
  selectedOrderId = null;
  document.body.style.overflow = "auto";
}

async function assignDriverToOrder(){
  const select = document.getElementById("driverSelect");

  if(!select || !selectedOrderId){
    return;
  }

  const selectedPhone = select.value;
  const driver = driversList.find((item) => item.phone === selectedPhone);

  if(!driver){
    alert("Please select a driver.");
    return;
  }

  await updateDoc(doc(db, "orders", selectedOrderId), {
    driver: {
      name: driver.name,
      phone: driver.phone
    }
  });

  const targetOrder = allOrders.find((order) => order.orderId === selectedOrderId);
  if(targetOrder){
    targetOrder.driver = {
      name: driver.name,
      phone: driver.phone
    };
  }

  closeDriverModal();
  applyFilters();
  alert("Driver assigned");
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
          data-order-id="${order.orderId}"
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
      const order = allOrders.find(item => item.orderId === button.dataset.orderId);
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

function applyFilters(){

  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  let filtered = allOrders;

  if(search){
    filtered = filtered.filter(o =>
      (o.orderId || "").toLowerCase().includes(search) ||
      (o.customerName || "").toLowerCase().includes(search)
    );
  }

  if(status !== "all"){
    filtered = filtered.filter(o => o.status === status);
  }

  renderOrders(filtered);
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
  document.getElementById("confirmAssignDriver")?.addEventListener("click", assignDriverToOrder);
  prevMonthBtn?.addEventListener("click", ()=> changeMonth(-1));
  nextMonthBtn?.addEventListener("click", ()=> changeMonth(1));
  await Promise.all([loadDrivers(), loadOrders()]);

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("statusFilter").addEventListener("change", applyFilters);

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
