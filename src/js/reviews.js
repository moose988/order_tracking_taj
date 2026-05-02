import { db } from "./firebase.js";
import { formatLocalizedDate, initI18n, onLanguageChange, t } from "./i18n.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reviewsGrid = document.getElementById("reviewsGrid");
const reviewsPagination = document.getElementById("reviewsPagination");
const filterButtons = Array.from(document.querySelectorAll(".reviews-filter-btn"));
let allReviews = [];
let activeFilter = "all";
let currentPage = 1;
const REVIEWS_PER_PAGE = 6;

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

async function loadReviews(){
  if(!reviewsGrid || !reviewsPagination){
    return;
  }

  reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.loadingReviews"))}</div>`;
  reviewsPagination.innerHTML = "";
  reviewsPagination.style.display = "none";

  try{
    try{
      const orderedReviewsQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(orderedReviewsQuery);
      allReviews = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
    }catch(queryError){
      console.warn("Falling back to client-side review sorting:", queryError);
      const snapshot = await getDocs(collection(db, "reviews"));
      allReviews = snapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt));
    }

    applyActiveFilter();
  }catch(error){
    console.error("Failed to load reviews:", error);
    reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.noReviewsYet"))}</div>`;
    reviewsPagination.innerHTML = "";
    reviewsPagination.style.display = "none";
  }
}

function renderReviews(reviews){
  if(!reviews.length){
    reviewsGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("common.noReviewsYet"))}</div>`;
    renderPagination(0, 0);
    return;
  }

  reviewsGrid.innerHTML = reviews.map(review => `
    <article class="review-card">
      <div class="stars">${"&#9733;".repeat(Number(review.rating) || 0)}</div>
      <p class="review-comment">${escapeHtml(review.comment || "")}</p>
      ${review.imageUrl ? `<img class="review-image" src="${escapeAttribute(review.imageUrl)}" alt="${escapeAttribute(t("reviews.reviewPhotoAlt"))}" loading="lazy" decoding="async">` : ""}
      <div class="review-meta">
        <div class="review-author">${escapeHtml(review.name || t("common.anonymous"))}</div>
        <div class="review-date">${formatReviewDate(review.createdAt)}</div>
      </div>
    </article>
  `).join("");
}

function applyActiveFilter(){
  let reviews = [...allReviews];

  if(activeFilter === "five-star"){
    reviews = reviews.filter((review) => Number(review.rating) === 5);
  }else if(activeFilter === "recent"){
    reviews = reviews.filter((review) => getTimestampValue(review.createdAt) > 0);
  }

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  if(!reviews.length){
    currentPage = 1;
    renderReviews([]);
    return;
  }

  currentPage = Math.min(currentPage, totalPages);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const paginatedReviews = reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

  renderReviews(paginatedReviews);
  renderPagination(currentPage, totalPages);
}

function initReviewFilters(){
  if(!filterButtons.length){
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      currentPage = 1;

      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyActiveFilter();
    });
  });
}

function renderPagination(activePage, totalPages){
  if(!reviewsPagination){
    return;
  }

  if(totalPages <= 1){
    reviewsPagination.innerHTML = "";
    reviewsPagination.style.display = "none";
    return;
  }

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const pageNumber = index + 1;
    return `
      <button
        class="reviews-pagination-btn ${pageNumber === activePage ? "is-active" : ""}"
        type="button"
        data-page="${pageNumber}"
        aria-label="${escapeAttribute(t("reviews.goToPage", { page: pageNumber }))}"
        ${pageNumber === activePage ? 'aria-current="page"' : ""}
      >
        ${pageNumber}
      </button>
    `;
  }).join("");

  reviewsPagination.innerHTML = `
    <button
      class="reviews-pagination-btn reviews-pagination-btn--nav"
      type="button"
      data-page-nav="prev"
      ${activePage === 1 ? "disabled" : ""}
    >
      ${escapeHtml(t("reviews.previous"))}
    </button>
    <div class="reviews-pagination-pages">
      ${pageButtons}
    </div>
    <button
      class="reviews-pagination-btn reviews-pagination-btn--nav"
      type="button"
      data-page-nav="next"
      ${activePage === totalPages ? "disabled" : ""}
    >
      ${escapeHtml(t("reviews.next"))}
    </button>
  `;

  reviewsPagination.style.display = "flex";

  reviewsPagination.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = Number(button.dataset.page) || 1;
      applyActiveFilter();
      scrollReviewsToTop();
    });
  });

  reviewsPagination.querySelector("[data-page-nav=\"prev\"]")?.addEventListener("click", () => {
    if(currentPage > 1){
      currentPage -= 1;
      applyActiveFilter();
      scrollReviewsToTop();
    }
  });

  reviewsPagination.querySelector("[data-page-nav=\"next\"]")?.addEventListener("click", () => {
    if(currentPage < totalPages){
      currentPage += 1;
      applyActiveFilter();
      scrollReviewsToTop();
    }
  });
}

function scrollReviewsToTop(){
  reviewsGrid?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
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
  if(!timestamp){
    return "";
  }

  const date = typeof timestamp.toDate === "function"
    ? timestamp.toDate()
    : new Date(timestamp);

  return formatLocalizedDate(date);
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

document.addEventListener("DOMContentLoaded", () => {
  initI18n();
  initMobileMenu();
  initReviewFilters();
  loadReviews();
});

onLanguageChange(() => {
  if(reviewsGrid){
    applyActiveFilter();
  }
});
