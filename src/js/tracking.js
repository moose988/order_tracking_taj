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
let trackingMap = null;
let driverMarker = null;
let destinationMarker = null;
let destinationRadius = null;
let routeLine = null;
let driverMarkerIcon = null;
let driverMarkerIconLoadPromise = null;
let destinationMarkerIcon = null;
let destinationMarkerIconLoadPromise = null;
const reviewThanksMessage = `Thank you for your feedback ${String.fromCodePoint(0x1F64C)}`;
const DEFAULT_MAP_CENTER = [25.2048, 55.2708];
const APPROX_CITY_SPEED_KMH = 32;
const MAX_REASONABLE_DELIVERY_DISTANCE_KM = 120;
const DEFAULT_RENTAL_DAYS = 1;
const DRIVER_MARKER_ICON_CANDIDATES = [
  "../images/icons/drivericon.png",
  "../images/icons/drivericon.svg",
  "../images/icons/truck-marker.png",
  "../images/icons/truck-marker.svg",
  "../images/logo/drivericon.png"
];
const DESTINATION_MARKER_ICON_CANDIDATES = [
  "../images/icons/destination2.png",
  "../images/icons/destination2.svg",
  "../images/logo/destination2.png",
  "../images/icons/destination-marker.png",
  "../images/icons/destination-marker.svg",
  "../images/icons/destination.png",
  "../images/icons/destination.svg",
  "../images/logo/destination.png"
];
const UAE_BOUNDS = {
  minLat: 22,
  maxLat: 26.6,
  minLng: 51,
  maxLng: 56.6
};

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
  const fallbackCoordinates = parseCoordinateString(fallbackLocation);
  const query = extractMapQuery(link) || (fallbackCoordinates ? `${fallbackCoordinates.lat},${fallbackCoordinates.lng}` : "");

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

function getNormalizedMapUrl(link){
  if(!link){
    return "";
  }

  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(link)
    ? link
    : `https://${link}`;
}

function getLocationCoordinates(value){
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.lon ?? value?.longitude);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return null;
  }

  return { lat, lng };
}

function parseCoordinateString(value){
  const match = String(value || "").trim().match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if(!match){
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return null;
  }

  if(Math.abs(lat) > 90 || Math.abs(lng) > 180){
    return null;
  }

  return { lat, lng };
}

function extractCoordinatesFromMapLink(link){
  const normalizedLink = getNormalizedMapUrl(link);

  if(!normalizedLink){
    return null;
  }

  const extractedQuery = extractMapQuery(normalizedLink);
  const queryCoordinates = parseCoordinateString(extractedQuery);

  if(queryCoordinates){
    return queryCoordinates;
  }

  try{
    const url = new URL(normalizedLink);
    const centerParam = url.searchParams.get("center");
    const centerCoordinates = parseCoordinateString(centerParam);

    if(centerCoordinates){
      return centerCoordinates;
    }

    const pathCoordinates = parseCoordinateString(url.pathname);
    if(pathCoordinates){
      return pathCoordinates;
    }
  }catch{
    return parseCoordinateString(normalizedLink);
  }

  return parseCoordinateString(normalizedLink);
}

function getDestinationQuery(order){
  return (
    extractMapQuery(order?.mapLink) ||
    String(order?.eventLocation || "").trim()
  );
}

function isWithinUaeBounds(coords){
  if(!coords){
    return false;
  }

  return coords.lat >= UAE_BOUNDS.minLat &&
    coords.lat <= UAE_BOUNDS.maxLat &&
    coords.lng >= UAE_BOUNDS.minLng &&
    coords.lng <= UAE_BOUNDS.maxLng;
}

function getValidatedDestinationCoordinates(coords){
  if(!coords){
    return null;
  }

  return isWithinUaeBounds(coords) ? coords : null;
}

function resolveDestinationCoordinates(order){
  const directDestination = getValidatedDestinationCoordinates(getLocationCoordinates(order?.destinationLocation));

  if(directDestination){
    return {
      coordinates: directDestination,
      source: "destination-location",
      isReliable: true
    };
  }

  const mapLinkCoordinates = getValidatedDestinationCoordinates(extractCoordinatesFromMapLink(order?.mapLink));

  if(mapLinkCoordinates){
    return {
      coordinates: mapLinkCoordinates,
      source: "map-link-coordinates",
      isReliable: true
    };
  }

  const extractedQueryCoordinates = getValidatedDestinationCoordinates(parseCoordinateString(getDestinationQuery(order)));

  if(extractedQueryCoordinates){
    return {
      coordinates: extractedQueryCoordinates,
      source: "explicit-coordinate-query",
      isReliable: true
    };
  }

  const eventLocationCoordinates = getValidatedDestinationCoordinates(parseCoordinateString(order?.eventLocation));

  if(eventLocationCoordinates){
    return {
      coordinates: eventLocationCoordinates,
      source: "event-location-coordinates",
      isReliable: true
    };
  }

  return {
    coordinates: null,
    source: "location-text-only",
    isReliable: false
  };
}

function getOpenLocationUrl(order, destinationCoordinates = null){
  if(destinationCoordinates){
    return `https://www.google.com/maps?q=${encodeURIComponent(`${destinationCoordinates.lat},${destinationCoordinates.lng}`)}`;
  }

  if(order?.mapLink){
    return getNormalizedMapUrl(order.mapLink);
  }

  if(order?.eventLocation){
    return `https://www.google.com/maps?q=${encodeURIComponent(order.eventLocation)}`;
  }

  return "#";
}

function getOrderRentalDays(order){
  const rentalDays = Number(order?.rentalDays ?? order?.latestQuoteRentalDays ?? DEFAULT_RENTAL_DAYS);
  return Number.isFinite(rentalDays) && rentalDays >= 1 ? Math.floor(rentalDays) : DEFAULT_RENTAL_DAYS;
}

function getPhoneForWhatsApp(phone){
  const digits = String(phone || "").replace(/\D/g, "");

  if(!digits){
    return "";
  }

  if(digits.startsWith("0")){
    return `971${digits.slice(1)}`;
  }

  return digits;
}

function calculateDistanceInKm(start, end){
  if(!start || !end){
    return null;
  }

  const toRadians = (value) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEtaMinutes(start, end){
  const distanceKm = calculateDistanceInKm(start, end);

  if(!Number.isFinite(distanceKm) || distanceKm > MAX_REASONABLE_DELIVERY_DISTANCE_KM){
    return {
      minutes: null,
      distanceKm
    };
  }

  if(distanceKm < 0.35){
    return {
      minutes: 2,
      distanceKm
    };
  }

  return {
    minutes: Math.max(3, Math.round((distanceKm / APPROX_CITY_SPEED_KMH) * 60)),
    distanceKm
  };
}

function formatEta(minutes){
  if(!Number.isFinite(minutes) || minutes <= 0){
    return "ETA unavailable";
  }

  if(minutes >= 60){
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes
      ? `Estimated arrival: ${hours} hr ${remainingMinutes} min`
      : `Estimated arrival: ${hours} hr`;
  }

  return `Estimated arrival: ${minutes} min`;
}

function getFallbackDriverMarkerIcon(){
  return new window.L.Icon.Default();
}

function createDriverMarkerIcon(iconUrl){
  if(!iconUrl){
    return getFallbackDriverMarkerIcon();
  }

  return window.L.icon({
    iconUrl,
    iconSize: [68, 68],
    iconAnchor: [34, 34],
    popupAnchor: [0, -30],
    tooltipAnchor: [0, -28],
    className: "track-driver-image-marker"
  });
}

function loadImageIcon(url){
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error(`Failed to load icon: ${url}`));
    image.src = url;
  });
}

function requestDriverMarkerIcon(){
  if(driverMarkerIconLoadPromise || driverMarkerIcon || typeof window === "undefined" || !window.L){
    return;
  }

  driverMarkerIconLoadPromise = DRIVER_MARKER_ICON_CANDIDATES.reduce(
    (chain, candidateUrl) => chain.catch(() => loadImageIcon(candidateUrl)),
    Promise.reject(new Error("No driver marker icon loaded"))
  )
    .then((resolvedUrl) => createDriverMarkerIcon(resolvedUrl))
    .catch(() => getFallbackDriverMarkerIcon())
    .then((resolvedIcon) => {
      driverMarkerIcon = resolvedIcon;

      if(driverMarker && trackingMap){
        driverMarker.setIcon(driverMarkerIcon);
      }

      return resolvedIcon;
    })
    .finally(() => {
      driverMarkerIconLoadPromise = null;
    });
}

function getDriverMarkerIcon(){
  requestDriverMarkerIcon();
  return driverMarkerIcon || getFallbackDriverMarkerIcon();
}

function requestDestinationMarkerIcon(){
  if(destinationMarkerIconLoadPromise || destinationMarkerIcon || typeof window === "undefined" || !window.L){
    return;
  }

  destinationMarkerIconLoadPromise = DESTINATION_MARKER_ICON_CANDIDATES.reduce(
    (chain, candidateUrl) => chain.catch(() => loadImageIcon(candidateUrl)),
    Promise.reject(new Error("No destination marker icon loaded"))
  )
    .then((resolvedUrl) => window.L.icon({
      iconUrl: resolvedUrl,
      iconSize: [64, 64],
      iconAnchor: [32, 58],
      popupAnchor: [0, -48],
      tooltipAnchor: [0, -42],
      className: "track-destination-image-marker"
    }))
    .catch(() => getFallbackDriverMarkerIcon())
    .then((resolvedIcon) => {
      destinationMarkerIcon = resolvedIcon;

      if(destinationMarker && trackingMap){
        destinationMarker.setIcon(destinationMarkerIcon);
      }

      return resolvedIcon;
    })
    .finally(() => {
      destinationMarkerIconLoadPromise = null;
    });
}

function getDestinationMarkerIcon(){
  requestDestinationMarkerIcon();
  return destinationMarkerIcon || getFallbackDriverMarkerIcon();
}

function bindDestinationMarkerInteractions(marker){
  marker.bindPopup("Delivery destination");
  marker.bindTooltip("Destination", {
    direction: "top",
    offset: [0, -28]
  });
}

function clearTrackingMapLayers(){
  [driverMarker, destinationMarker, destinationRadius, routeLine].forEach((layer) => {
    if(layer && trackingMap){
      trackingMap.removeLayer(layer);
    }
  });

  driverMarker = null;
  destinationMarker = null;
  destinationRadius = null;
  routeLine = null;
}

function destroyTrackingMap(){
  clearTrackingMapLayers();

  if(trackingMap){
    trackingMap.remove();
    trackingMap = null;
  }
}

function syncDestinationMarker(map, destinationCoordinates, shouldShowDestination){
  if(!shouldShowDestination){
    if(destinationRadius){
      map.removeLayer(destinationRadius);
      destinationRadius = null;
    }

    if(destinationMarker){
      map.removeLayer(destinationMarker);
      destinationMarker = null;
    }

    return;
  }

  const markerLatLng = [destinationCoordinates.lat, destinationCoordinates.lng];

  if(destinationRadius){
    destinationRadius.setLatLng(markerLatLng);
  }else{
    destinationRadius = window.L.circle(markerLatLng, {
      radius: 120,
      color: "#b57d1f",
      weight: 2,
      fillColor: "#d7ad59",
      fillOpacity: 0.16
    }).addTo(map);
  }

  if(destinationMarker){
    destinationMarker.setLatLng(markerLatLng);
    destinationMarker.setIcon(getDestinationMarkerIcon());
  }else{
    destinationMarker = window.L.marker(
      markerLatLng,
      { icon: getDestinationMarkerIcon() }
    ).addTo(map);
    bindDestinationMarkerInteractions(destinationMarker);
  }
}

function syncDriverMarker(map, driverCoordinates){
  if(!driverCoordinates){
    if(driverMarker){
      map.removeLayer(driverMarker);
      driverMarker = null;
    }

    return;
  }

  const markerLatLng = [driverCoordinates.lat, driverCoordinates.lng];

  if(driverMarker){
    driverMarker.setLatLng(markerLatLng);
    driverMarker.setIcon(getDriverMarkerIcon());
    return;
  }

  driverMarker = window.L.marker(markerLatLng, {
    icon: getDriverMarkerIcon()
  }).addTo(map).bindPopup("Driver").bindTooltip("Driver", {
    direction: "top",
    offset: [0, -18]
  });
}

function syncRouteLine(map, driverCoordinates, destinationCoordinates, shouldDrawRoute){
  if(!shouldDrawRoute){
    if(routeLine){
      map.removeLayer(routeLine);
      routeLine = null;
    }

    return;
  }

  const lineCoordinates = [
    [driverCoordinates.lat, driverCoordinates.lng],
    [destinationCoordinates.lat, destinationCoordinates.lng]
  ];

  if(routeLine){
    routeLine.setLatLngs(lineCoordinates);
    return;
  }

  routeLine = window.L.polyline(lineCoordinates, {
    color: "#8f6a27",
    weight: 3,
    opacity: 0.65,
    dashArray: "8 8"
  }).addTo(map);
}

function ensureTrackingMap(){
  if(trackingMap){
    return trackingMap;
  }

  const mapContainer = document.getElementById("mapContainer");

  if(!mapContainer || typeof window === "undefined" || !window.L){
    return null;
  }

  mapContainer.innerHTML = "";
  trackingMap = window.L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView(DEFAULT_MAP_CENTER, 12);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(trackingMap);

  return trackingMap;
}

function renderTrackingMap(driverCoordinates, destinationCoordinates, fallbackEmbedLink, options = {}){
  const mapContainer = document.getElementById("mapContainer");
  const shouldShowDestination = Boolean(options.showDestinationMarker && destinationCoordinates);
  const shouldDrawRoute = Boolean(options.drawRoute && driverCoordinates && destinationCoordinates);
  const hasMarkerCoordinates = Boolean(driverCoordinates || shouldShowDestination);

  if(!mapContainer){
    return;
  }

  if(!hasMarkerCoordinates){
    destroyTrackingMap();
    mapContainer.innerHTML = fallbackEmbedLink
      ? `
<iframe
  width="100%"
  height="350"
  style="border:0;border-radius:12px;"
  loading="lazy"
  allowfullscreen
  src="${fallbackEmbedLink}">
</iframe>
`
      : '<div class="empty-state">Map preview unavailable.</div>';
    return;
  }

  const map = ensureTrackingMap();

  if(!map){
    return;
  }

  const visibleCoordinates = [];

  syncDestinationMarker(map, destinationCoordinates, shouldShowDestination);

  if(shouldShowDestination){
    visibleCoordinates.push([destinationCoordinates.lat, destinationCoordinates.lng]);
  }

  syncDriverMarker(map, driverCoordinates);

  if(driverCoordinates){
    visibleCoordinates.push([driverCoordinates.lat, driverCoordinates.lng]);
  }

  syncRouteLine(map, driverCoordinates, destinationCoordinates, shouldDrawRoute);

  if(visibleCoordinates.length > 1){
    map.fitBounds(visibleCoordinates, {
      padding: [30, 30]
    });
  }else if(visibleCoordinates.length === 1){
    map.setView(visibleCoordinates[0], 15);
  }else{
    map.setView(DEFAULT_MAP_CENTER, 12);
  }

  window.setTimeout(() => {
    trackingMap?.invalidateSize();
  }, 0);
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
  const destinationResolution = resolveDestinationCoordinates(order);
  const destinationCoordinates = destinationResolution.coordinates;
  const driverCoordinates = normalizedStatus === "out-for-delivery"
    ? getLocationCoordinates(order.driverLocation)
    : null;
  const openLocationUrl = getOpenLocationUrl(order, destinationCoordinates);
  const fallbackEmbedLink = convertToEmbedLink(order.mapLink, order.eventLocation);

  info.innerHTML = `
<div class="track-info-grid">
  <p><strong>Order ID:</strong> ${order.orderId}</p>
  <p><strong>Customer:</strong> ${order.customerName}</p>
  <p><strong>Event Date:</strong> ${order.eventDate}</p>
  <p><strong>Rental Days:</strong> ${getOrderRentalDays(order)}</p>
  <p><strong>Event Time:</strong> ${order.eventTime || "N/A"}</p>
  <p><strong>Setup Time:</strong> ${order.setupTime || "N/A"}</p>
  <p><strong>Location:</strong> ${order.eventLocation}</p>
  <p><strong>Map:</strong> <a href="${openLocationUrl}" target="_blank" rel="noreferrer" class="track-inline-link">Open Location</a></p>
</div>
`;

  bindSupportButton(order);

  renderStatusSummary(normalizedStatus || order.status);

  const itemsBox = document.getElementById("orderItems");
  itemsBox.innerHTML = `
<h4>Items in this Order</h4>
<ul class="track-order-items-list">
${(order.items || []).map(item => `<li><span>${item.name}</span><strong>x${Math.max(1, Number(item.quantity) || 1)}</strong></li>`).join("")}
</ul>
  `;

  const mapContainer = document.getElementById("mapContainer");
  const locationInfo = document.getElementById("locationInfo");
  const liveLocationTime = formatLocationTimestamp(order.driverLocation?.updatedAt);
  const etaInfo = document.getElementById("etaInfo");
  const mapLegend = document.getElementById("mapLegend");
  const etaEstimate = normalizedStatus === "out-for-delivery" && driverCoordinates && destinationCoordinates
    ? estimateEtaMinutes(driverCoordinates, destinationCoordinates)
    : { minutes: null, distanceKm: null };
  const hasReliableDestination = Boolean(destinationResolution.isReliable && destinationCoordinates);
  const hasSaneRoute = Boolean(
    hasReliableDestination &&
    driverCoordinates &&
    Number.isFinite(etaEstimate.distanceKm) &&
    etaEstimate.distanceKm <= MAX_REASONABLE_DELIVERY_DISTANCE_KM
  );
  const destinationMarkerCoordinates = hasReliableDestination ? destinationCoordinates : null;

  if(locationInfo){
    locationInfo.innerHTML = `
<div class="track-location-overview">
  <div class="track-location-copy">
    <span class="track-status-eyebrow">Delivery Location</span>
    <strong>${order.eventLocation || "Location pending"}</strong>
  </div>
  <a href="${openLocationUrl}" target="_blank" class="track-open-location-link">
    Open Location
  </a>
</div>
<div class="track-status-grid">
  ${driverCoordinates ? `
  <article class="track-status-card is-live">
    <span class="track-status-card-label">Driver Update</span>
    <strong>Live driver location active</strong>
    <p>${liveLocationTime ? `Last updated at ${liveLocationTime}.` : "Your driver is currently sharing live location."}</p>
  </article>
  ` : ""}
  ${normalizedStatus === "delivered" ? `
  <article class="track-status-card is-complete">
    <span class="track-status-card-label">Delivery</span>
    <strong>Delivery complete</strong>
    <p>This order has been delivered successfully.</p>
  </article>
  ` : ""}
</div>
`;
  }

  if(etaInfo){
    etaInfo.innerHTML = normalizedStatus === "out-for-delivery"
      ? hasSaneRoute
        ? `
<article class="track-status-hero-card is-active">
  <div>
    <span class="track-status-eyebrow">Estimated Arrival</span>
    <strong>${formatEta(etaEstimate.minutes)}</strong>
    <p>Based on the current live driver location and the delivery destination.</p>
  </div>
</article>
`
        : `
<article class="track-status-hero-card is-muted">
  <div>
    <span class="track-status-eyebrow">Estimated Arrival</span>
    <strong>ETA unavailable</strong>
    <p>Live ETA needs reliable destination coordinates and a sane delivery distance.</p>
  </div>
</article>
`
      : "";
  }

  if(mapLegend){
    mapLegend.innerHTML = "";
  }

  if(mapContainer){
    renderTrackingMap(driverCoordinates, destinationMarkerCoordinates, fallbackEmbedLink, {
      showDestinationMarker: Boolean(destinationMarkerCoordinates),
      drawRoute: hasSaneRoute
    });
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
      <article class="track-status-summary-card is-cancelled">
        <span class="track-status-summary-label">Current Status</span>
        <strong>Order Cancelled</strong>
        <p>This order is marked as cancelled. Please contact support if you need help.</p>
      </article>
    `;
    return;
  }

  summary.innerHTML = `
    <article class="track-status-summary-card is-${normalizedStatus || "unknown"}">
      <span class="track-status-summary-label">Current Status</span>
      <strong>${formatStatusLabel(normalizedStatus || status)}</strong>
      <p>Your latest order progress is shown here in real time.</p>
    </article>
  `;
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
    collected: 5,
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

  if(normalizeStatus(order.status) !== "delivered"){
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

  if(!currentOrder || normalizeStatus(currentOrder.status) !== "delivered"){
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
  destroyTrackingMap();
  document.getElementById("statusSummary").innerHTML = "";
  document.getElementById("orderInfo").innerHTML = "";
  document.getElementById("orderItems").innerHTML = "";
  document.getElementById("locationInfo").innerHTML = "";
  document.getElementById("etaInfo").innerHTML = "";
  document.getElementById("mapLegend").innerHTML = "";
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
  const normalizedStatus = (status || "").toLowerCase().trim().replaceAll(" ", "-");

  // Customer tracking still treats returned rentals as a completed delivery milestone.
  return normalizedStatus === "collected" ? "delivered" : normalizedStatus;
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

  const phone = getPhoneForWhatsApp(order.driver.phone);
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
  requestDriverMarkerIcon();
  requestDestinationMarkerIcon();
  document.getElementById("reviewForm")?.addEventListener("submit", submitReview);

  const urlOrderId = getOrderIdFromURL();

  if(urlOrderId){
    document.getElementById("orderIdInput").value = urlOrderId;
    await loadOrder(urlOrderId);
  }
});

window.trackOrder = trackOrder;
