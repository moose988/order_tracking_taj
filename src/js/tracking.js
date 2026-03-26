import { db, storage } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

let currentOrder = null;
const reviewThanksMessage = `Thank you for your feedback ${String.fromCodePoint(0x1F64C)}`;
const ALLOWED_REVIEW_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_REVIEW_IMAGE_SIZE = 5 * 1024 * 1024;

function convertToEmbedLink(link, fallbackLocation = ""){
  const query = extractMapQuery(link) || fallbackLocation;

  if(!query){
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
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

  const orderRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderRef);

  if(!snap.exists()){
    document.getElementById("trackResult").innerHTML = "<p>Order not found.</p>";
    return;
  }

  currentOrder = snap.data();
  document.getElementById("trackResult").innerHTML = "";

  await renderOrder(currentOrder);
}

async function renderOrder(order){
  const info = document.getElementById("orderInfo");

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

  const summary = document.getElementById("statusSummary");
  summary.innerHTML = `Current Status: ${formatStatusLabel(order.status)}`;

  const itemsBox = document.getElementById("orderItems");
  itemsBox.innerHTML = `
<h4 style="margin-top:10px;">Items in this Order</h4>
<ul>
${(order.items || []).map(item => `<li>${item.name} × ${item.quantity}</li>`).join("")}
</ul>
`;

  const mapContainer = document.getElementById("mapContainer");
  const locationInfo = document.getElementById("locationInfo");
  const embedLink = convertToEmbedLink(order.mapLink, order.eventLocation);

  if(locationInfo){
    locationInfo.innerHTML = `
<p><strong>Location:</strong> ${order.eventLocation}</p>
<p>
<a href="${order.mapLink}" target="_blank" style="color:#caa45d;font-weight:600;">
Open Location
</a>
</p>
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

  renderStatus(order.status);
  await updateReviewUI(order);
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
    confirmed: 1,
    preparing: 2,
    "out-for-delivery": 3,
    delivered: 4,
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
  const imageFile = document.getElementById("reviewImage").files[0];

  if(!rating || rating < 1 || rating > 5 || !comment){
    setReviewMessage("Please add a rating and comment before submitting.", "error");
    return;
  }

  const imageValidationError = validateReviewImage(imageFile);

  if(imageValidationError){
    setReviewMessage(imageValidationError, "error");
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

    let imageUrl = "";

    if(imageFile){
      const safeFileName = (imageFile.name || "image.jpg").replace(/\s+/g, "-");
      const storageRef = ref(storage, `reviews/${currentOrder.orderId}/${Date.now()}-${safeFileName}`);

      await withTimeout(uploadBytes(storageRef, imageFile), 20000, "Image upload timed out.");
      imageUrl = await withTimeout(getDownloadURL(storageRef), 10000, "Could not fetch uploaded image URL.");
    }

    await addDoc(collection(db, "reviews"), {
      orderId: currentOrder.orderId,
      rating,
      comment,
      name: name || "",
      imageUrl,
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

function validateReviewImage(file){
  if(!file){
    return "";
  }

  if(!ALLOWED_REVIEW_IMAGE_TYPES.includes(file.type)){
    return "Please upload a JPG, PNG, or WEBP image.";
  }

  if(file.size > MAX_REVIEW_IMAGE_SIZE){
    return "Please upload an image smaller than 5 MB.";
  }

  return "";
}

function withTimeout(promise, timeoutMs, message){
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
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
  return (status || "unknown").replaceAll("-", " ");
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
  document.getElementById("reviewForm")?.addEventListener("submit", submitReview);

  const urlOrderId = getOrderIdFromURL();

  if(urlOrderId){
    document.getElementById("orderIdInput").value = urlOrderId;
    await loadOrder(urlOrderId);
  }
});

window.trackOrder = trackOrder;
