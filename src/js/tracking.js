import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDocs,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentOrder = null;
let orderUnsubscribe = null;
const reviewThanksMessage = `Thank you for your feedback ${String.fromCodePoint(0x1F64C)}`;

function clearOrderSubscription(){
  orderUnsubscribe?.();
  orderUnsubscribe = null;
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

function convertToEmbedLink(link, fallbackLocation = ""){
  const query = extractMapQuery(link) || fallbackLocation;

  if(!query){
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function convertDriverLocationToEmbedLink(location){
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&output=embed`;
}

function formatLocationTimestamp(value){
  if(!value){
    return "";
  }

  if(typeof value.toDate === "function"){
    return value.toDate().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  const parsedDate = new Date(value);

  if(Number.isNaN(parsedDate.getTime())){
    return "";
  }

  return parsedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function extractMapQuery(link){
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

    const atMatch = url.pathname.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if(atMatch){
      return `${atMatch[1]},${atMatch[3]}`;
    }

    const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
    if(placeMatch){
      return decodeURIComponent(placeMatch[1]).replaceAll("+", " ");
    }

    const coordMatch = normalizedLink.match(/!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/);
    if(coordMatch){
      return `${coordMatch[1]},${coordMatch[3]}`;
    }

    const searchPathMatch = url.pathname.match(/\/maps\/search\/([^/]+)/);
    if(searchPathMatch){
      return decodeURIComponent(searchPathMatch[1]).replaceAll("+", " ");
    }

    return "";
  }catch{
    const plainQMatch = link.match(/[?&]q=([^&]+)/);
    if(plainQMatch){
      return decodeURIComponent(plainQMatch[1]);
    }

    const atMatch = link.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if(atMatch){
      return `${atMatch[1]},${atMatch[3]}`;
    }

    const coordMatch = link.match(/!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/);
    if(coordMatch){
      return `${coordMatch[1]},${coordMatch[3]}`;
    }

    const placeMatch = link.match(/\/place\/([^/]+)/);
    if(placeMatch){
      return decodeURIComponent(placeMatch[1]).replaceAll("+", " ");
    }

    return "";
  }
}

function getOrderIdFromURL(){
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadOrder(orderId){
  resetTrackState();
  clearOrderSubscription();

  const resolvedOrderRef = await resolveOrderRef(orderId);

  if(!resolvedOrderRef){
    renderTrackMessage("Order not found", "This order may have been removed or the ID is incorrect.", "not-found");
    return;
  }

  orderUnsubscribe = onSnapshot(resolvedOrderRef, async (snap) => {
    if(!snap.exists()){
      clearOrderSubscription();
      resetTrackState();
      renderTrackMessage("Order not found", "This order may have been removed or the ID is incorrect.", "not-found");
      return;
    }

    currentOrder = {
      id: snap.id,
      ...snap.data()
    };
    document.getElementById("trackResult").innerHTML = "";

    await renderOrder(currentOrder);
  }, (error) => {
    console.error("Failed to subscribe to order:", error);
    renderTrackMessage("Unable to load this order", "Please try again in a moment.", "error");
  });
}

function renderTrackMessage(title, description = "", tone = "not-found"){
  const trackResult = document.getElementById("trackResult");

  if(!trackResult){
    return;
  }

  trackResult.innerHTML = `
    <div class="track-status-message is-${tone}">
      <strong>${title}</strong>
      ${description ? `<p>${description}</p>` : ""}
    </div>
  `;
}

async function resolveOrderRef(orderId){
  const directRef = doc(db, "orders", orderId);
  const directSnapshot = await getDocs(query(collection(db, "orders"), where(documentId(), "==", orderId)));

  if(!directSnapshot.empty){
    return directRef;
  }

  const orderQuery = query(collection(db, "orders"), where("orderId", "==", orderId));
  const orderSnapshot = await getDocs(orderQuery);

  if(orderSnapshot.empty){
    return null;
  }

  return doc(db, "orders", orderSnapshot.docs[0].id);
}

async function renderOrder(order){
  const info = document.getElementById("orderInfo");
  const normalizedStatus = normalizeStatus(order.status);

  info.innerHTML = `
<p><strong>Order ID:</strong> ${order.orderId}</p>
<p><strong>Customer:</strong> ${order.customerName}</p>
<p><strong>Event Date:</strong> ${order.eventDate}</p>
<p><strong>Event Time:</strong> ${order.eventTime || "N/A"}</p>
<p><strong>Setup Time:</strong> ${order.setupTime || "N/A"}</p>
<p><strong>Location:</strong> ${order.eventLocation}</p>
<p>
<strong>Map:</strong>
<a href="${order.mapLink}" target="_blank" style="color:#caa45d;font-weight:600;">
Open Location
</a>
</p>
`;

  bindSupportButton(order);

  renderStatusSummary(normalizedStatus || order.status);

  const itemsBox = document.getElementById("orderItems");
  itemsBox.innerHTML = `
<h4 style="margin-top:10px;">Items in this Order</h4>
<ul>
${(order.items || []).map(item => `<li>${item.name} × ${item.quantity}</li>`).join("")}
</ul>
`;

  const mapContainer = document.getElementById("mapContainer");
  const locationInfo = document.getElementById("locationInfo");
  const driverEmbedLink = normalizedStatus === "out-for-delivery"
    ? convertDriverLocationToEmbedLink(order.driverLocation)
    : null;
  const embedLink = driverEmbedLink || convertToEmbedLink(order.mapLink, order.eventLocation);
  const liveLocationTime = formatLocationTimestamp(order.driverLocation?.updatedAt);

  if(locationInfo){
    locationInfo.innerHTML = `
<p><strong>Location:</strong> ${order.eventLocation}</p>
<p>
<a href="${order.mapLink}" target="_blank" style="color:#caa45d;font-weight:600;">
Open Location
</a>
</p>
${driverEmbedLink ? `
<div class="track-live-location-note">
  <strong>Live Driver Location Active</strong>
  <p>${liveLocationTime ? `Last updated at ${liveLocationTime}.` : "Your driver is currently sharing live location."}</p>
</div>
` : ""}
${normalizedStatus === "delivered" ? `
<div class="track-live-location-note">
  <strong>Delivery Complete</strong>
  <p>This order has been delivered successfully.</p>
</div>
` : ""}
`;
  }

  if(mapContainer){
    mapContainer.innerHTML = embedLink
      ? `
<iframe
  width="100%"
  height="350"
  style="border:0;border-radius:12px;"
  loading="lazy"
  allowfullscreen
  src="${embedLink}">
</iframe>
`
      : '<div class="empty-state">Map preview unavailable.</div>';
  }

  updateDriverInfo(order, normalizedStatus);
  renderStatus(normalizedStatus);
  await updateReviewUI(order);
}

function renderStatusSummary(status){
  const summary = document.getElementById("statusSummary");

  if(!summary){
    return;
  }

  const normalizedStatus = normalizeStatus(status);

  if(normalizedStatus === "cancelled"){
    summary.innerHTML = `
      <div class="track-status-message is-cancelled">
        <strong>Order Cancelled</strong>
        <p>This order is marked as cancelled. Please contact support if you need help.</p>
      </div>
    `;
    return;
  }

  summary.className = "";
  summary.innerHTML = `Current Status: ${formatStatusLabel(normalizedStatus || status)}`;
}

function bindSupportButton(order){
  const supportBtn = document.getElementById("supportBtn");
  const reasonSelect = document.getElementById("supportReason");

  if(!supportBtn || !reasonSelect){
    return;
  }

  supportBtn.onclick = () => {
    const reason = reasonSelect.value;
    let message = "";

    if(reason === "delay"){
      message = `Hello, I want an update regarding a delay for order ${order.orderId}`;
    }else if(reason === "edit"){
      message = `Hello, I want to edit items in my order ${order.orderId}`;
    }else if(reason === "cancel"){
      message = `Hello, I would like to cancel my order ${order.orderId}`;
    }else if(reason === "location"){
      message = `Hello, I need to change the location for order ${order.orderId}`;
    }else{
      message = `Hello, I need help with my order ${order.orderId}`;
    }

    const url = `https://wa.me/971505373383?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };
}

function renderStatus(status){
  const steps = {
    "quote-requested": 0,
    "quote-sent": 1,
    confirmed: 2,
    preparing: 3,
    "out-for-delivery": 4,
    delivered: 5,
    cancelled: -1
  };

  const currentIndex = steps[status] ?? 0;
  const statusSteps = document.querySelectorAll(".status-step");

  statusSteps.forEach((step, index) => {
    step.classList.remove("active", "current");

    if(index < currentIndex){
      step.classList.add("active");
    }

    if(index === currentIndex){
      step.classList.add("current");
    }
  });
}

async function updateReviewUI(order){
  const reviewSection = document.getElementById("reviewSection");
  const reviewForm = document.getElementById("reviewForm");

  if(!reviewSection || !reviewForm){
    return;
  }

  reviewSection.style.display = "none";
  reviewForm.style.display = "none";
  setReviewMessage("", "");

  if(order.status !== "delivered"){
    return;
  }

  reviewSection.style.display = "block";

  const existingReview = await getExistingReview(order.orderId);

  if(existingReview){
    setReviewMessage(reviewThanksMessage, "success");
    return;
  }

  reviewForm.reset();
  document.getElementById("reviewStars").value = "5";
  reviewForm.style.display = "grid";
}

async function getExistingReview(orderId){
  const reviewsQuery = query(
    collection(db, "reviews"),
    where("orderId", "==", orderId)
  );

  const snapshot = await getDocs(reviewsQuery);
  return snapshot.docs[0] || null;
}

async function submitReview(event){
  event.preventDefault();

  if(!currentOrder || currentOrder.status !== "delivered"){
    return;
  }

  const reviewForm = document.getElementById("reviewForm");
  const submitButton = document.getElementById("reviewSubmitBtn");
  const rating = Number(document.getElementById("reviewStars").value);
  const comment = document.getElementById("reviewComment").value.trim();
  const name = document.getElementById("reviewName").value.trim();

  if(!rating || rating < 1 || rating > 5 || !comment){
    setReviewMessage("Please add a rating and comment before submitting.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setReviewMessage("", "");

  try{
    const existingReview = await getExistingReview(currentOrder.orderId);

    if(existingReview){
      reviewForm.style.display = "none";
      setReviewMessage(reviewThanksMessage, "success");
      return;
    }

    await addDoc(collection(db, "reviews"), {
      orderId: currentOrder.orderId,
      rating,
      comment,
      name: name || "",
      createdAt: new Date()
    });

    reviewForm.reset();
    reviewForm.style.display = "none";
    setReviewMessage(reviewThanksMessage, "success");
  }catch(error){
    console.error("Review submission failed:", error);
    setReviewMessage("We could not submit your review right now. Please try again.", "error");
  }finally{
    submitButton.disabled = false;
    submitButton.textContent = "Submit Review";
  }
}

function setReviewMessage(message, type){
  const messageBox = document.getElementById("reviewStatusMessage");

  if(!messageBox){
    return;
  }

  messageBox.textContent = message;
  messageBox.className = "review-status-message";

  if(message){
    messageBox.classList.add(type === "success" ? "is-success" : "is-error");
    messageBox.style.display = "block";
  }else{
    messageBox.style.display = "none";
  }
}

function resetTrackState(){
  currentOrder = null;
  document.getElementById("statusSummary").innerHTML = "";
  document.getElementById("orderInfo").innerHTML = "";
  document.getElementById("orderItems").innerHTML = "";
  document.getElementById("locationInfo").innerHTML = "";
  document.getElementById("mapContainer").innerHTML = "";
  updateDriverInfo(null, "");
  renderStatus("quote-requested");

  const reviewSection = document.getElementById("reviewSection");
  const reviewForm = document.getElementById("reviewForm");

  if(reviewSection){
    reviewSection.style.display = "none";
  }

  if(reviewForm){
    reviewForm.reset();
    reviewForm.style.display = "none";
  }

  setReviewMessage("", "");
}

function formatStatusLabel(status){
  return (status || "unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeStatus(status){
  return (status || "").toLowerCase().trim().replaceAll(" ", "-");
}

function updateDriverInfo(order, normalizedStatus){
  const driverInfoBox = document.getElementById("driverInfoBox");
  const driverName = document.getElementById("driverName");
  const driverPhone = document.getElementById("driverPhone");
  const driverWhatsappBtn = document.getElementById("driverWhatsappBtn");

  if(!driverInfoBox || !driverName || !driverPhone || !driverWhatsappBtn){
    return;
  }

  const shouldShowDriver =
    normalizedStatus === "out-for-delivery" &&
    order?.driver &&
    (order.driver.name || order.driver.phone);

  if(!shouldShowDriver){
    driverInfoBox.style.display = "none";
    driverName.textContent = "";
    driverPhone.textContent = "";
    driverWhatsappBtn.removeAttribute("href");
    return;
  }

  const phone = String(order.driver.phone || "").replace(/\D/g, "");
  const message = `
Hello ${order.driver.name || "Driver"},

I'm contacting you regarding my order ${order.orderId}.
`;

  driverInfoBox.style.display = "block";
  driverName.textContent = order.driver.name || "N/A";
  driverPhone.textContent = order.driver.phone || "N/A";
  driverWhatsappBtn.href = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "#";
}

async function trackOrder(){
  const orderId = document.getElementById("orderIdInput").value.trim();

  if(!orderId){
    alert("Please enter an Order ID");
    return;
  }

  await loadOrder(orderId);
}

document.addEventListener("DOMContentLoaded", async () => {
  initMobileMenu();
  document.getElementById("reviewForm")?.addEventListener("submit", submitReview);

  const urlOrderId = getOrderIdFromURL();

  if(urlOrderId){
    document.getElementById("orderIdInput").value = urlOrderId;
    await loadOrder(urlOrderId);
  }
});

window.trackOrder = trackOrder;
