import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

function formatTimeTo12Hour(time24){
  const [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12;
  h = h ? h : 12;

  return `${h}:${minutes} ${ampm}`;
}

function normalizeGoogleMapsLink(link){
  if(!link){
    return "";
  }

  const query = extractGoogleMapsQuery(link);

  if(!query){
    return link.trim();
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
    const plainQMatch = link.match(/[?&]q=([^&]+)/);
    if(plainQMatch){
      return decodeURIComponent(plainQMatch[1]);
    }

    return "";
  }
}

async function loadHomepageReviews(){
  const reviewsGrid = document.getElementById("homeReviewsGrid");

  if(!reviewsGrid){
    return;
  }

  reviewsGrid.innerHTML = '<div class="empty-state">Loading reviews...</div>';

  try{
    const snapshot = await getDocs(collection(db, "reviews"));
    const reviews = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt))
      .slice(0, 3);

    if(reviews.length === 0){
      reviewsGrid.innerHTML = '<div class="empty-state">No reviews yet</div>';
      return;
    }

    reviewsGrid.innerHTML = reviews.map(review => `
      <article class="review-card">
        <div class="stars">${"&#9733;".repeat(Number(review.rating) || 0)}</div>
        <p>${escapeHtml(review.comment || "")}</p>
        <div class="review-author">${escapeHtml(review.name || "Anonymous")}</div>
      </article>
    `).join("");
  }catch(error){
    console.error("Failed to load homepage reviews:", error);
    reviewsGrid.innerHTML = '<div class="empty-state">No reviews yet</div>';
  }
}

function getTimestampValue(timestamp){
  if(!timestamp){
    return 0;
  }

  if(typeof timestamp.toDate === "function"){
    return timestamp.toDate().getTime();
  }

  return new Date(timestamp).getTime() || 0;
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let order = [];

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

function saveOrder(){
  localStorage.setItem("tajOrder", JSON.stringify(order));
}

function syncQuoteOrderFromStorage(){
  order = JSON.parse(localStorage.getItem("tajOrder")) || [];
  renderQuoteItems();
}

function getOrderItemCount(){
  return order.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function updateQuoteSummary(){
  const itemCount = document.getElementById("quoteItemCount");
  const submitButton = document.getElementById("quoteSubmitBtn");
  const clearButton = document.getElementById("quoteClearAllBtn");

  if(itemCount){
    const count = getOrderItemCount();
    itemCount.textContent = `${count} item${count !== 1 ? "s" : ""} selected`;
  }

  if(submitButton){
    submitButton.disabled = order.length === 0;
  }

  if(clearButton){
    clearButton.hidden = order.length === 0;
  }
}

function renderQuoteItems(){
  const list = document.getElementById("quoteItemsList");
  const empty = document.getElementById("quoteEmptyState");

  if(!list || !empty){
    return;
  }

  if(order.length === 0){
    empty.style.display = "block";
    list.innerHTML = "";
    updateQuoteSummary();
    return;
  }

  empty.style.display = "none";
  list.innerHTML = order.map(item => `
    <div class="quote-item">
      <div class="quote-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <div class="item-category">${escapeHtml(item.category || "")}</div>
      </div>

      <div class="qty-controls">
        <button type="button" class="qty-minus" data-id="${escapeHtml(item.id)}">-</button>
        <span>${item.quantity}</span>
        <button type="button" class="qty-plus" data-id="${escapeHtml(item.id)}">+</button>
      </div>
    </div>
  `).join("");
  updateQuoteSummary();
}

function increaseQuantity(id){
  const item = order.find((entry) => String(entry.id) === String(id));

  if(!item){
    return;
  }

  item.quantity += 1;
  saveOrder();
  renderQuoteItems();
}

function decreaseQuantity(id){
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
  renderQuoteItems();
}

function clearQuoteOrder(){
  order = [];
  saveOrder();
  renderQuoteItems();
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEls = document.querySelectorAll(".current-year");
  const currentYear = new Date().getFullYear();

  yearEls.forEach((el) => {
    el.textContent = currentYear;
  });

  initMobileMenu();
  loadHomepageReviews();

  const list = document.getElementById("quoteItemsList");
  const clearButton = document.getElementById("quoteClearAllBtn");

  if(list){
    syncQuoteOrderFromStorage();

    list.addEventListener("click", (event) => {
      const plusButton = event.target.closest(".qty-plus");
      const minusButton = event.target.closest(".qty-minus");

      if(plusButton){
        increaseQuantity(plusButton.dataset.id);
      }

      if(minusButton){
        decreaseQuantity(minusButton.dataset.id);
      }
    });
  }

  if(clearButton){
    clearButton.addEventListener("click", () => {
      clearQuoteOrder();
    });
  }

  window.addEventListener("pageshow", () => {
    syncQuoteOrderFromStorage();
  });

  window.addEventListener("focus", () => {
    syncQuoteOrderFromStorage();
  });

  const locationBtn = document.getElementById("useLocationBtn");
  const mapLinkInput = document.getElementById("mapLink");

  if(locationBtn){
    locationBtn.addEventListener("click", () => {
      if(!navigator.geolocation){
        alert("Geolocation not supported on this device.");
        return;
      }

      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

        document.getElementById("mapLink").value = normalizeGoogleMapsLink(mapUrl);
        alert("Location captured successfully.");
      }, () => {
        alert("Unable to retrieve your location.");
      });
    });
  }

  if(mapLinkInput){
    mapLinkInput.addEventListener("blur", () => {
      mapLinkInput.value = normalizeGoogleMapsLink(mapLinkInput.value);
    });
  }

  const form = document.getElementById("quoteForm");

  if(!form){
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const order = JSON.parse(localStorage.getItem("tajOrder")) || [];

    if(order.length === 0){
      alert("Add items first.");
      return;
    }

    const name = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value;
    const date = document.getElementById("eventDate").value;
    const rawTime = document.getElementById("eventTime").value;
    const time = formatTimeTo12Hour(rawTime);
    const rawSetupTime = document.getElementById("setupTime").value;
    const setupTime = formatTimeTo12Hour(rawSetupTime);
    const location = document.getElementById("eventLocation").value;
    const mapLink = normalizeGoogleMapsLink(document.getElementById("mapLink").value);
    const notes = document.getElementById("eventNotes").value;

    const orderId = await generateOrderId();

    await setDoc(doc(db, "orders", orderId), {
      orderId,
      customerName: name,
      phone,
      eventDate: date,
      eventTime: time,
      setupTime,
      eventLocation: location,
      mapLink: mapLink || "",
      notes: notes || "",
      items: order,
      status: "quote-requested",
      createdAt: new Date()
    });

    const itemsText = order.map(item => `${item.name} x${item.quantity}`).join("\n");

    const message = `Quote Request - Al Taj Al Malaky

Order ID: ${orderId}

Name: ${name}
Phone: ${phone}

Event Date: ${date}
Event Time: ${time}
Setup Time: ${setupTime}

Location: ${location}
Map: ${mapLink || "Not provided"}

Items:
${itemsText}

Notes:
${notes || "None"}
`;

    const url = `https://wa.me/971505373383?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });
});
