import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const reviewsGrid = document.getElementById("reviewsGrid");

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

async function loadReviews(){
  if(!reviewsGrid){
    return;
  }

  reviewsGrid.innerHTML = '<div class="empty-state">Loading reviews...</div>';

  try{
    const snapshot = await getDocs(collection(db, "reviews"));
    const reviews = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((first, second) => getTimestampValue(second.createdAt) - getTimestampValue(first.createdAt));

    renderReviews(reviews);
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
  loadReviews();
});
