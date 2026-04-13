import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reviewsGrid = document.getElementById("reviewsGrid");
const filterButtons = Array.from(document.querySelectorAll(".reviews-filter-btn"));
let allReviews = [];
let activeFilter = "all";

function initMobileMenu(){
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if(!menuBtn || !navLinks){
    return;
  }

  const syncMenuState = (isOpen) => {
    navLinks.classList.toggle("active", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("mobile-nav-open", isOpen && window.innerWidth <= 760);
  };

  menuBtn.setAttribute("aria-expanded", "false");

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
}

async function loadReviews(){
  if(!reviewsGrid){
    return;
  }

  reviewsGrid.innerHTML = '<div class="empty-state">Loading reviews...</div>';

  try{
    const snapshot = await getDocs(collection(db, "reviews"));
    allReviews = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt));

    applyActiveFilter();
  }catch(error){
    console.error("Failed to load reviews:", error);
    reviewsGrid.innerHTML = '<div class="empty-state">No reviews yet</div>';
  }
}

function renderReviews(reviews){
  if(!reviews.length){
    reviewsGrid.innerHTML = '<div class="empty-state">No reviews yet</div>';
    return;
  }

  reviewsGrid.innerHTML = reviews.map(review => `
    <article class="review-card">
      <div class="stars">${"&#9733;".repeat(Number(review.rating) || 0)}</div>
      <p class="review-comment">${escapeHtml(review.comment || "")}</p>
      ${review.imageUrl ? `<img class="review-image" src="${review.imageUrl}" alt="Customer review photo">` : ""}
      <div class="review-meta">
        <div class="review-author">${escapeHtml(review.name || "Anonymous")}</div>
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
    reviews = reviews
      .filter((review) => getTimestampValue(review.createdAt) > 0)
      .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt));
  }

  renderReviews(reviews);
}

function initReviewFilters(){
  if(!filterButtons.length){
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";

      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyActiveFilter();
    });
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function escapeHtml(value){
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initReviewFilters();
  loadReviews();
});
