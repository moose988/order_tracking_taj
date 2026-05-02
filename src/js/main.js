import { db } from "./firebase.js";
import { CATALOG_PLACEHOLDER_IMAGE, PRODUCTS } from "../data/products.js";
import { formatLocalizedDate, initI18n, onLanguageChange, t, translateCategory, translateCount } from "./i18n.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createLocationFieldBinding, reverseGeocodeCoordinates } from "./location-picker.js";
import { normalizeGoogleMapsLink } from "./location-utils.js";

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

function getRentalDaysValue(){
  const rentalDaysInput = document.getElementById("rentalDays");
  const rentalDays = Number(rentalDaysInput?.value);

  return Number.isFinite(rentalDays) && rentalDays >= 1
    ? Math.floor(rentalDays)
    : 1;
}

function buildWhatsAppUrl(phone, generatedMessage){
  const message = encodeURIComponent(generatedMessage);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return isMobile
    ? `https://wa.me/${phone}?text=${message}`
    : `whatsapp://send?phone=${phone}&text=${message}`;
}

async function loadHomepageReviews(){
  const reviewsGrid = document.getElementById("homeReviewsGrid");

  if(!reviewsGrid){
    return;
  }

  reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.loadingReviews"))}</div>`;

  try{
    let reviews = [];

    try{
      const latestReviewsQuery = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const snapshot = await getDocs(latestReviewsQuery);
      reviews = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    }catch(queryError){
      console.warn("Falling back to full reviews fetch for homepage preview:", queryError);
      const snapshot = await getDocs(collection(db, "reviews"));
      reviews = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt))
        .slice(0, 3);
    }

    if(reviews.length === 0){
      reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.noReviewsYet"))}</div>`;
      return;
    }

    reviewsGrid.innerHTML = reviews.map(review => `
      <article class="review-card" data-home-reveal>
        <div class="stars">${"&#9733;".repeat(Number(review.rating) || 0)}</div>
        <p class="review-comment">${escapeHtml(review.comment || "")}</p>
        <div class="review-meta">
          <div class="review-author">${escapeHtml(review.name || t("common.anonymous"))}</div>
          <div class="review-date">${escapeHtml(formatReviewDate(review.createdAt))}</div>
        </div>
      </article>
    `).join("");

    initHomepageRevealAnimations();
  }catch(error){
    console.error("Failed to load homepage reviews:", error);
    reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.noReviewsYet"))}</div>`;
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

function formatReviewDate(timestamp){
  const timestampValue = getTimestampValue(timestamp);

  if(!timestampValue){
    return t("common.recentReview");
  }

  return formatLocalizedDate(new Date(timestampValue));
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value){
  return escapeHtml(value).replaceAll("`", "&#96;");
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

function normalizeHomeText(value){
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getPreferredCollectionImage(product){
  const images = Array.isArray(product?.images) ? product.images : [];
  const normalizedImages = images
    .map((image) => normalizeCatalogImageUrl(image))
    .filter((image) => String(image || "").trim());
  const preferredImage = normalizedImages.find((image) => !String(image).startsWith("data:image/svg+xml"))
    || normalizedImages.find((image) => String(image || "").trim())
    || CATALOG_PLACEHOLDER_IMAGE;

  return preferredImage;
}

function getHomepageCollectionImageClasses(category){
  const classes = ["home-collection-image"];
  const normalizedCategory = normalizeHomeText(category);

  if(normalizedCategory === normalizeHomeText("Dining Tables")){
    classes.push("home-collection-image-dining");
  }

  if(normalizedCategory === normalizeHomeText("Bridal Sofa") || normalizedCategory === normalizeHomeText("Majlis Sofa")){
    classes.push("home-collection-image-sofa");
  }

  if(normalizedCategory === normalizeHomeText("Chairs")){
    classes.push("home-collection-image-chair");
  }

  return classes.join(" ");
}

function getHomepageCollectionDefinitions(){
  return [
    {
      category: "Dining Tables",
      featuredProductName: "Dining Table 15",
      descriptionKey: "home.collectionDiningDescription"
    },
    {
      category: "Chairs",
      featuredProductName: "Chair 19",
      descriptionKey: "home.collectionChairsDescription"
    },
    {
      category: "Coffee Table",
      featuredProductName: "Coffee Table 18",
      descriptionKey: "home.collectionCoffeeDescription"
    },
    {
      category: "Bridal Sofa",
      featuredProductName: "Bridal Sofa 35",
      descriptionKey: "home.collectionBridalDescription"
    },
    {
      category: "Majlis Sofa",
      featuredProductName: "Sofa 23",
      descriptionKey: "home.collectionMajlisDescription"
    },
    {
      category: "Cocktail Table",
      featuredProductName: "Cocktail Table 2",
      descriptionKey: "home.collectionCocktailDescription"
    }
  ];
}

function renderHomepageCollections(){
  const collectionsGrid = document.getElementById("homeCollectionsGrid");

  if(!collectionsGrid){
    return;
  }

  const cards = getHomepageCollectionDefinitions().map((definition) => {
    const matchingProducts = PRODUCTS.filter((product) => normalizeHomeText(product.category) === normalizeHomeText(definition.category));
    const featuredProduct = matchingProducts.find((product) => product.name === definition.featuredProductName)
      || matchingProducts[0]
      || null;
    const image = getPreferredCollectionImage(featuredProduct);
    const collectionHref = `/order?category=${encodeURIComponent(definition.category)}`;
    const categoryLabel = translateCategory(definition.category);
    const altText = featuredProduct?.name
      ? t("home.collectionAlt", { product: featuredProduct.name, category: categoryLabel })
      : t("home.collectionAltFallback", { category: categoryLabel });

    return `
      <a class="home-collection-card" href="${escapeAttribute(collectionHref)}" aria-label="${escapeAttribute(t("home.collectionAria", { category: categoryLabel }))}" data-home-reveal>
        <div class="home-collection-media">
          <img
            class="${escapeAttribute(getHomepageCollectionImageClasses(definition.category))}"
            src="${escapeAttribute(image)}"
            alt="${escapeAttribute(altText)}"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            onerror="this.onerror=null;this.src='${escapeAttribute(CATALOG_PLACEHOLDER_IMAGE)}';"
          />
        </div>
        <div class="home-collection-copy">
          <h3>${escapeHtml(categoryLabel)}</h3>
          <p>${escapeHtml(t(definition.descriptionKey))}</p>
          <span class="home-collection-link">${escapeHtml(t("common.viewCollection"))}</span>
        </div>
      </a>
    `;
  });

  collectionsGrid.innerHTML = cards.join("");
}

function initHomepageRevealAnimations(){
  const revealItems = Array.from(document.querySelectorAll("[data-home-reveal]"));

  if(!revealItems.length){
    return;
  }

  if(typeof window.IntersectionObserver !== "function"){
    revealItems.forEach((item) => item.classList.add("home-is-visible"));
    return;
  }

  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    revealItems.forEach((item) => item.classList.add("home-is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add("home-is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
    observer.observe(item);
  });
}

function initHomepageHeroScrollEffect(){
  if(!document.body.classList.contains("home-page")){
    return;
  }

  let isTicking = false;

  const updateHeroProgress = () => {
    const maxScroll = Math.max(window.innerHeight * 0.92, 1);
    const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    document.body.style.setProperty("--home-hero-progress", progress.toFixed(3));
    isTicking = false;
  };

  updateHeroProgress();

  window.addEventListener("scroll", () => {
    if(isTicking){
      return;
    }

    isTicking = true;
    window.requestAnimationFrame(updateHeroProgress);
  }, { passive: true });

  window.addEventListener("resize", updateHeroProgress);
}

function initHomepageHeaderScrollState(){
  if(!document.body.classList.contains("home-page")){
    return;
  }

  const header = document.querySelector(".site-header");

  if(!header){
    return;
  }

  let isTicking = false;

  const syncHeaderState = () => {
    header.classList.toggle("scrolled", window.scrollY > 80);
    isTicking = false;
  };

  syncHeaderState();

  window.addEventListener("scroll", () => {
    if(isTicking){
      return;
    }

    isTicking = true;
    window.requestAnimationFrame(syncHeaderState);
  }, { passive: true });
}

function initHomepageExperience(){
  if(!document.body.classList.contains("home-page")){
    return;
  }

  document.body.classList.add("home-animations-ready");
  renderHomepageCollections();
  initHomepageRevealAnimations();
  initHomepageHeroScrollEffect();
  initHomepageHeaderScrollState();
}

let order = [];
const QUOTE_SUCCESS_STORAGE_KEY = "tajQuoteSuccess";
let quoteLocationBinding = null;

function buildQuoteSuccessUrl(orderId){
  const params = new URLSearchParams();

  if(orderId){
    params.set("id", String(orderId));
  }

  return `/quote-success${params.toString() ? `?${params.toString()}` : ""}`;
}

function saveQuoteSuccessState(payload){
  if(typeof window === "undefined"){
    return;
  }

  try{
    sessionStorage.setItem(QUOTE_SUCCESS_STORAGE_KEY, JSON.stringify({
      ...payload,
      savedAt: Date.now()
    }));
  }catch(error){
    console.warn("Unable to store quote success state:", error);
  }
}

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
    itemCount.textContent = count > 0
      ? translateCount("quote.totalItems", count)
      : t("quote.totalItemsZero");
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
        <div class="item-category">${escapeHtml(translateCategory(item.category || ""))}</div>
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
  initI18n();
  const yearEls = document.querySelectorAll(".current-year");
  const currentYear = new Date().getFullYear();

  yearEls.forEach((el) => {
    el.textContent = currentYear;
  });

  initMobileMenu();
  loadHomepageReviews();
  initHomepageExperience();

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
  const pickLocationBtn = document.getElementById("pickEventLocationBtn");
  const mapLinkInput = document.getElementById("mapLink");
  const eventLocationInput = document.getElementById("eventLocation");
  const locationSummary = document.getElementById("quoteLocationSummary");
  quoteLocationBinding = pickLocationBtn && mapLinkInput && eventLocationInput && locationSummary
    ? createLocationFieldBinding({
      triggerButton: pickLocationBtn,
      summaryContainer: locationSummary,
      eventLocationInput,
      mapLinkInput,
      pickerTitle: t("quote.pickerTitle"),
      pickerSubtitle: t("quote.pickerSubtitle"),
      summaryTitle: t("quote.summaryTitle")
    })
    : null;

  if(locationBtn){
    locationBtn.addEventListener("click", async () => {
      if(!navigator.geolocation){
        alert(t("quote.geolocationUnsupported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const reverseResult = await reverseGeocodeCoordinates({ lat, lng });

        if(quoteLocationBinding){
          quoteLocationBinding.setSelection({
            lat,
            lng,
            label: reverseResult?.label || reverseResult?.address || eventLocationInput?.value.trim() || "Current location",
            address: reverseResult?.address || reverseResult?.label || "",
            source: "map-picker-tap"
          }, {
            syncFields: true
          });
        }else if(mapLinkInput){
          mapLinkInput.value = normalizeGoogleMapsLink(`https://maps.google.com/?q=${lat},${lng}`);
        }

        alert(t("quote.locationCaptured"));
      }, () => {
        alert(t("quote.locationUnavailable"));
      }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });
  }

  const form = document.getElementById("quoteForm");

  if(!form){
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = document.getElementById("quoteSubmitBtn");
    const originalButtonText = submitButton?.textContent || t("quote.submitBtn");

    if(submitButton){
      submitButton.disabled = true;
      submitButton.textContent = t("quote.submitting");
    }

    const order = JSON.parse(localStorage.getItem("tajOrder")) || [];

    if(order.length === 0){
      alert(t("quote.addItemsFirst"));
      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      return;
    }

    try{
      const name = document.getElementById("customerName").value;
      const phone = document.getElementById("customerPhone").value;
      const date = document.getElementById("eventDate").value;
      const rawTime = document.getElementById("eventTime").value;
      const time = formatTimeTo12Hour(rawTime);
      const rawSetupTime = document.getElementById("setupTime").value;
      const setupTime = formatTimeTo12Hour(rawSetupTime);
      const rentalDays = getRentalDaysValue();
      const location = document.getElementById("eventLocation").value;
      const mapLink = normalizeGoogleMapsLink(document.getElementById("mapLink").value);
      const notes = document.getElementById("eventNotes").value;
      const destinationLocation = quoteLocationBinding?.getDestinationLocation() || null;

      if(!mapLink){
        alert(t("quote.mapLinkRequired"));
        document.getElementById("mapLink")?.focus();
        return;
      }

      const orderId = await generateOrderId();

      await setDoc(doc(db, "orders", orderId), {
        orderId,
        customerName: name,
        phone,
        eventDate: date,
        rentalDays,
        eventTime: time,
        setupTime,
        eventLocation: location,
        mapLink,
        notes: notes || "",
        items: order,
        priority: "normal",
        status: "quote-requested",
        createdAt: serverTimestamp(),
        ...(destinationLocation ? { destinationLocation } : {})
      });

      const itemsText = order.map(item => `${item.name} x${item.quantity}`).join("\n");

      const message = `Quote Request - Al Taj Al Malaky

Order ID: ${orderId}

Name: ${name}
Phone: ${phone}

Event Date: ${date}
Event Time: ${time}
Setup Time: ${setupTime}
Rental Days: ${rentalDays}

Location: ${location}
Map: ${mapLink}

Items:
${itemsText}

Notes:
${notes || "None"}
`;

      const whatsappUrl = buildWhatsAppUrl("971505373383", message);
      saveQuoteSuccessState({
        orderId,
        customerName: name,
        whatsappUrl,
        whatsappMessage: message,
        autoOpenWhatsApp: true
      });

      localStorage.removeItem("tajOrder");
      window.location.href = buildQuoteSuccessUrl(orderId);
    }catch(error){
      console.error("Quote submission failed:", error);
      alert(t("quote.submitError"));
    }finally{
      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
});

onLanguageChange(() => {
  if(document.body.classList.contains("home-page")){
    renderHomepageCollections();
    loadHomepageReviews();
    initHomepageRevealAnimations();
  }

  if(document.body.classList.contains("quote-page")){
    renderQuoteItems();

    if(quoteLocationBinding?.refreshLabels){
      quoteLocationBinding.refreshLabels({
        pickerTitle: t("quote.pickerTitle"),
        pickerSubtitle: t("quote.pickerSubtitle"),
        summaryTitle: t("quote.summaryTitle")
      });
    }
  }
});
