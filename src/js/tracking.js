import { db } from "./firebase.js";
import { formatLocalizedDate, formatLocalizedTime, initI18n, onLanguageChange, t, translateStatus } from "./i18n.js";
import {
  collection,
  doc,
  documentId,
  getDocs,
  onSnapshot,
  query,
  setDoc,
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
let leafletAssetsLoadPromise = null;
let lastMapViewportKey = "";
let activeReviewSurface = "inline";
let reviewPromptState = {
  orderId: "",
  submitted: false,
  dismissed: false
};
const DEFAULT_MAP_CENTER = [25.2048, 55.2708];
const APPROX_CITY_SPEED_KMH = 32;
const MAX_REASONABLE_DELIVERY_DISTANCE_KM = 120;
const DEFAULT_RENTAL_DAYS = 1;
const REVIEW_DISMISSED_STORAGE_KEY = "taj-track-review-dismissed";
const REVIEW_SUBMITTED_STORAGE_KEY = "taj-track-review-submitted";
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

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value){
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function isSafeMapUrl(link){
  if(!link){
    return false;
  }

  try{
    const url = new URL(String(link).trim());
    const hostname = url.hostname.toLowerCase();
    const allowedHosts = [
      "google.com",
      "www.google.com",
      "maps.google.com",
      "maps.app.goo.gl",
      "goo.gl",
      "openstreetmap.org",
      "www.openstreetmap.org"
    ];

    return url.protocol === "https:" && allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  }catch{
    return false;
  }
}
const UAE_BOUNDS = {
  minLat: 22,
  maxLat: 26.6,
  minLng: 51,
  maxLng: 56.6
};
const LEAFLET_STYLESHEET_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_STYLESHEET_INTEGRITY = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const LEAFLET_SCRIPT_INTEGRITY = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

function clearOrderSubscription(){
  orderUnsubscribe?.();
  orderUnsubscribe = null;
}

function isLeafletReady(){
  return typeof window !== "undefined" && Boolean(window.L);
}

function ensureLeafletStylesheet(){
  if(typeof document === "undefined"){
    return;
  }

  if(document.querySelector(`link[data-leaflet-asset="style"]`)){
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_STYLESHEET_URL;
  link.integrity = LEAFLET_STYLESHEET_INTEGRITY;
  link.crossOrigin = "";
  link.setAttribute("data-leaflet-asset", "style");
  document.head.appendChild(link);
}

function ensureLeafletScript(){
  if(typeof document === "undefined"){
    return Promise.resolve();
  }

  const existingScript = document.querySelector(`script[data-leaflet-asset="script"]`);

  if(existingScript){
    if(isLeafletReady()){
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Leaflet script")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LEAFLET_SCRIPT_URL;
    script.integrity = LEAFLET_SCRIPT_INTEGRITY;
    script.crossOrigin = "";
    script.defer = true;
    script.setAttribute("data-leaflet-asset", "script");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Leaflet script"));
    document.body.appendChild(script);
  });
}

async function ensureLeafletAssets(){
  if(isLeafletReady()){
    return;
  }

  if(!leafletAssetsLoadPromise){
    leafletAssetsLoadPromise = (async () => {
      ensureLeafletStylesheet();
      await ensureLeafletScript();
    })().finally(() => {
      leafletAssetsLoadPromise = null;
    });
  }

  await leafletAssetsLoadPromise;
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

function syncTrackResultLayoutOrder(){
  if(!trackingMap){
    return;
  }

  window.requestAnimationFrame(() => {
    trackingMap?.invalidateSize();
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

  const normalizedLink = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(link)
    ? link
    : `https://${link}`;

  return isSafeMapUrl(normalizedLink) ? normalizedLink : "";
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

function buildWhatsAppUrl(phone, generatedMessage){
  const message = encodeURIComponent(generatedMessage);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return isMobile
    ? `https://wa.me/${phone}?text=${message}`
    : `whatsapp://send?phone=${phone}&text=${message}`;
}

function redirectToWhatsApp(phone, generatedMessage){
  if(!phone){
    return;
  }

  const message = encodeURIComponent(generatedMessage);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const whatsappURL = isMobile
    ? `https://wa.me/${phone}?text=${message}`
    : `whatsapp://send?phone=${phone}&text=${message}`;

  window.location.href = whatsappURL;
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
    return t("track.etaUnavailable");
  }

  if(minutes >= 60){
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes
      ? t("track.etaHoursMinutes", { hours, minutes: remainingMinutes })
      : t("track.etaHours", { hours });
  }

  return t("track.etaMinutes", { minutes });
}

function getFallbackDriverMarkerIcon(){
  if(!isLeafletReady()){
    return null;
  }

  return new window.L.Icon.Default();
}

function createDriverMarkerIcon(iconUrl){
  if(!iconUrl || !isLeafletReady()){
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
  if(driverMarkerIconLoadPromise || driverMarkerIcon || !isLeafletReady()){
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
  if(destinationMarkerIconLoadPromise || destinationMarkerIcon || !isLeafletReady()){
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
  lastMapViewportKey = "";
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
    const nextIcon = getDestinationMarkerIcon();

    if(nextIcon){
      destinationMarker.setIcon(nextIcon);
    }
  }else{
    const icon = getDestinationMarkerIcon();
    const markerOptions = icon ? { icon } : {};
    destinationMarker = window.L.marker(markerLatLng, markerOptions).addTo(map);
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
    const nextIcon = getDriverMarkerIcon();

    if(nextIcon){
      driverMarker.setIcon(nextIcon);
    }

    return;
  }

  const icon = getDriverMarkerIcon();
  const markerOptions = icon ? { icon } : {};

  driverMarker = window.L.marker(markerLatLng, markerOptions).addTo(map).bindPopup("Driver").bindTooltip("Driver", {
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

async function ensureTrackingMap(){
  if(trackingMap){
    return trackingMap;
  }

  const mapContainer = document.getElementById("mapContainer");

  if(!mapContainer){
    return null;
  }

  try{
    await ensureLeafletAssets();
  }catch(error){
    console.error("Failed to load Leaflet assets:", error);
    return null;
  }

  if(!isLeafletReady()){
    return null;
  }

  mapContainer.innerHTML = "";
  trackingMap = window.L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView(DEFAULT_MAP_CENTER, 12);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    updateWhenIdle: true,
    keepBuffer: 2,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(trackingMap);

  return trackingMap;
}

async function renderTrackingMap(driverCoordinates, destinationCoordinates, fallbackEmbedLink, options = {}){
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

  const map = await ensureTrackingMap();

  if(!map){
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

  const nextViewportKey = JSON.stringify(visibleCoordinates);

  if(nextViewportKey !== lastMapViewportKey){
    if(visibleCoordinates.length > 1){
      map.fitBounds(visibleCoordinates, {
        padding: [30, 30]
      });
    }else if(visibleCoordinates.length === 1){
      map.setView(visibleCoordinates[0], 15);
    }else{
      map.setView(DEFAULT_MAP_CENTER, 12);
    }

    lastMapViewportKey = nextViewportKey;
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
    return formatLocalizedTime(value);
  }

  const parsedDate = new Date(value);

  if(Number.isNaN(parsedDate.getTime())){
    return "";
  }

  return formatLocalizedTime(parsedDate);
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
    renderTrackMessage(t("track.orderNotFoundTitle"), t("track.orderNotFoundText"), "not-found");
    return;
  }

  orderUnsubscribe = onSnapshot(resolvedOrderRef, async (snap) => {
    if(!snap.exists()){
      clearOrderSubscription();
      resetTrackState();
      renderTrackMessage(t("track.orderNotFoundTitle"), t("track.orderNotFoundText"), "not-found");
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
    renderTrackMessage(t("track.orderLoadErrorTitle"), t("track.orderLoadErrorText"), "error");
  });
}

function renderTrackMessage(title, description = "", tone = "not-found"){
  const trackResult = document.getElementById("trackResult");

  if(!trackResult){
    return;
  }

  trackResult.innerHTML = `
    <div class="track-status-message is-${escapeAttribute(tone)}">
      <strong>${escapeHtml(title)}</strong>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
    </div>
  `;
}

async function resolveOrderRef(orderId){
  const publicTrackingRef = doc(db, "publicTracking", orderId);
  const publicTrackingSnapshot = await getDocs(query(collection(db, "publicTracking"), where(documentId(), "==", orderId)));

  if(!publicTrackingSnapshot.empty){
    return publicTrackingRef;
  }

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
  syncTrackResultLayoutOrder();

  const info = document.getElementById("orderInfo");
  const orderDetailsBlock = document.getElementById("orderDetailsBlock");
  const normalizedStatus = normalizeStatus(order.status);
  const destinationResolution = resolveDestinationCoordinates(order);
  const destinationCoordinates = destinationResolution.coordinates;
  const driverCoordinates = normalizedStatus === "out-for-delivery"
    ? getLocationCoordinates(order.driverLocation)
    : null;
  const openLocationUrl = getOpenLocationUrl(order, destinationCoordinates);
  const safeOpenLocationUrl = escapeAttribute(openLocationUrl || "#");
  const fallbackEmbedLink = convertToEmbedLink(order.mapLink, order.eventLocation);

  info.innerHTML = `
<div class="track-info-grid">
  <p><strong>${escapeHtml(t("track.orderIdLabel"))}</strong> ${escapeHtml(order.orderId)}</p>
  <p><strong>${escapeHtml(t("track.customerLabel"))}</strong> ${escapeHtml(order.customerName)}</p>
  <p><strong>${escapeHtml(t("track.eventDateLabel"))}</strong> ${escapeHtml(order.eventDate)}</p>
  <p><strong>${t("track.rentalDaysLabel")}</strong> ${getOrderRentalDays(order)}</p>
  <p><strong>${escapeHtml(t("track.eventTimeLabel"))}</strong> ${escapeHtml(order.eventTime || t("common.noData"))}</p>
  <p><strong>${escapeHtml(t("track.setupTimeLabel"))}</strong> ${escapeHtml(order.setupTime || t("common.noData"))}</p>
  <p><strong>${escapeHtml(t("track.locationLabel"))}</strong> ${escapeHtml(order.eventLocation)}</p>
  <p><strong>${escapeHtml(t("track.mapLabel"))}</strong> <a href="${safeOpenLocationUrl}" target="_blank" rel="noreferrer" class="track-inline-link">${escapeHtml(t("track.openLocation"))}</a></p>
</div>
`;

  if(orderDetailsBlock){
    orderDetailsBlock.style.display = "block";
  }

  bindSupportButton(order);

  renderStatusSummary(normalizedStatus || order.status);

  const itemsBox = document.getElementById("orderItems");
  itemsBox.innerHTML = `
<h4>${t("track.orderInfoTitle")}</h4>
<ul class="track-order-items-list">
${(order.items || []).map(item => `<li><span>${escapeHtml(item.name)}</span><strong>x${Math.max(1, Number(item.quantity) || 1)}</strong></li>`).join("")}
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
    <span class="track-status-eyebrow">${escapeHtml(t("track.deliveryLocation"))}</span>
    <strong>${escapeHtml(order.eventLocation || t("track.locationPending"))}</strong>
  </div>
  <a href="${safeOpenLocationUrl}" target="_blank" rel="noreferrer" class="track-open-location-link">
    ${escapeHtml(t("track.openLocation"))}
  </a>
</div>
<div class="track-status-grid">
  ${driverCoordinates ? `
  <article class="track-status-card is-live">
    <span class="track-status-card-label">${t("track.driverUpdate")}</span>
    <strong>${t("track.liveDriverTitle")}</strong>
    <p>${liveLocationTime ? t("track.liveDriverTime", { time: liveLocationTime }) : t("track.liveDriverFallback")}</p>
  </article>
  ` : ""}
  ${normalizedStatus === "delivered" ? `
  <article class="track-status-card is-complete">
    <span class="track-status-card-label">${t("track.deliveryCardLabel")}</span>
    <strong>${t("track.deliveryCompleteTitle")}</strong>
    <p>${t("track.deliveryCompleteText")}</p>
  </article>
  ` : ""}
</div>
`;
  }

  if(etaInfo){
    etaInfo.innerHTML = normalizedStatus === "out-for-delivery"
      ? hasSaneRoute
        ? `
<article class="track-status-hero-card is-active ${etaEstimate.minutes > 60 ? "is-delayed" : "is-on-time"}">
  <div>
    <strong>${formatEta(etaEstimate.minutes)}</strong>
  </div>
</article>
`
        : `
<article class="track-status-hero-card is-muted">
  <div>
    <strong>${t("track.etaUnavailable")}</strong>
    <p>${t("track.etaUnavailableText")}</p>
  </div>
</article>
`
      : "";
  }

  if(mapLegend){
    mapLegend.innerHTML = "";
  }

  if(mapContainer){
    await renderTrackingMap(driverCoordinates, destinationMarkerCoordinates, fallbackEmbedLink, {
      showDestinationMarker: Boolean(destinationMarkerCoordinates),
      drawRoute: hasSaneRoute
    });
  }

  if(normalizedStatus === "out-for-delivery" || hasReliableDestination){
    requestDriverMarkerIcon();
    requestDestinationMarkerIcon();
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
  const statusToneClass = getStatusToneClass(normalizedStatus);

  if(normalizedStatus === "cancelled"){
    summary.innerHTML = `
      <article class="track-status-summary-card is-cancelled ${statusToneClass}">
        <strong>${t("track.orderCancelledTitle")}</strong>
        <p>${t("track.orderCancelledText")}</p>
      </article>
    `;
    return;
  }

  summary.innerHTML = `
    <article class="track-status-summary-card is-${normalizedStatus || "unknown"} ${statusToneClass}">
      <strong>${formatStatusLabel(normalizedStatus || status)}</strong>
      <p>${t("track.latestProgress")}</p>
    </article>
  `;
}

function getStatusToneClass(status){
  const toneClassMap = {
    "quote-requested": "status-quote",
    "quote-sent": "status-sent",
    confirmed: "status-confirmed",
    preparing: "status-preparing",
    "out-for-delivery": "status-delivery",
    delivered: "status-delivered",
    cancelled: "status-cancelled"
  };

  return toneClassMap[status] || "status-quote";
}

function getReviewStorageBucket(key){
  if(typeof window === "undefined"){
    return {};
  }

  try{
    return JSON.parse(window.localStorage.getItem(key) || "{}");
  }catch{
    return {};
  }
}

function setReviewStorageBucket(key, nextBucket){
  if(typeof window === "undefined"){
    return;
  }

  try{
    window.localStorage.setItem(key, JSON.stringify(nextBucket));
  }catch{
    // Ignore storage failures and fall back to Firestore checks.
  }
}

function getReviewDismissedFlag(orderId){
  return Boolean(getReviewStorageBucket(REVIEW_DISMISSED_STORAGE_KEY)[orderId]);
}

function setReviewDismissedFlag(orderId, value){
  if(!orderId){
    return;
  }

  const bucket = getReviewStorageBucket(REVIEW_DISMISSED_STORAGE_KEY);

  if(value){
    bucket[orderId] = true;
  }else{
    delete bucket[orderId];
  }

  setReviewStorageBucket(REVIEW_DISMISSED_STORAGE_KEY, bucket);
}

function getReviewSubmittedFlag(orderId){
  return Boolean(getReviewStorageBucket(REVIEW_SUBMITTED_STORAGE_KEY)[orderId]);
}

function setReviewSubmittedFlag(orderId, value){
  if(!orderId){
    return;
  }

  const bucket = getReviewStorageBucket(REVIEW_SUBMITTED_STORAGE_KEY);

  if(value){
    bucket[orderId] = true;
  }else{
    delete bucket[orderId];
  }

  setReviewStorageBucket(REVIEW_SUBMITTED_STORAGE_KEY, bucket);
}

function getReviewFieldMap(surface = "inline"){
  if(surface === "modal"){
    return {
      form: document.getElementById("reviewModalForm"),
      stars: document.getElementById("reviewModalStars"),
      comment: document.getElementById("reviewModalComment"),
      name: document.getElementById("reviewModalName"),
      submit: document.getElementById("reviewModalSubmitBtn"),
      message: document.getElementById("reviewModalStatusMessage")
    };
  }

  return {
    form: document.getElementById("reviewForm"),
    stars: document.getElementById("reviewStars"),
    comment: document.getElementById("reviewComment"),
    name: document.getElementById("reviewName"),
    submit: document.getElementById("reviewSubmitBtn"),
    message: document.getElementById("reviewStatusMessage")
  };
}

function resetReviewForm(surface = "inline"){
  const fields = getReviewFieldMap(surface);

  if(!fields.form){
    return;
  }

  fields.form.reset();

  if(fields.stars){
    fields.stars.value = "5";
    syncReviewStarField(surface);
  }
}

function syncReviewFormValues(sourceSurface, targetSurface){
  const sourceFields = getReviewFieldMap(sourceSurface);
  const targetFields = getReviewFieldMap(targetSurface);

  if(!sourceFields.form || !targetFields.form){
    return;
  }

  if(sourceFields.stars && targetFields.stars){
    targetFields.stars.value = sourceFields.stars.value || "5";
    syncReviewStarField(targetSurface);
  }

  if(sourceFields.comment && targetFields.comment){
    targetFields.comment.value = sourceFields.comment.value;
  }

  if(sourceFields.name && targetFields.name){
    targetFields.name.value = sourceFields.name.value;
  }
}

function setActiveReviewSurface(surface){
  activeReviewSurface = surface;
}

function getReviewStarField(surface = "inline"){
  return document.querySelector(`.review-star-field[data-review-stars="${surface}"]`);
}

function paintReviewStars(starField, ratingValue = 0, previewValue = 0){
  if(!starField){
    return;
  }

  const activeValue = Number(previewValue || ratingValue || 0);
  const starButtons = starField.querySelectorAll(".review-star-btn");

  starButtons.forEach((button) => {
    const buttonValue = Number(button.dataset.rating);
    const isActive = buttonValue <= activeValue;

    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-idle", !isActive);
    button.setAttribute("aria-pressed", String(buttonValue === Number(ratingValue || 0)));
  });
}

function syncReviewStarField(surface = "inline"){
  const starField = getReviewStarField(surface);
  const fields = getReviewFieldMap(surface);

  if(!starField || !fields.stars){
    return;
  }

  starField.dataset.rating = fields.stars.value || "5";
  paintReviewStars(starField, Number(fields.stars.value || 5));
}

function setReviewStarValue(surface, rating){
  const fields = getReviewFieldMap(surface);

  if(!fields.stars){
    return;
  }

  fields.stars.value = String(rating);
  syncReviewStarField(surface);
}

function initReviewStarControls(){
  document.querySelectorAll(".review-star-field").forEach((starField) => {
    const surface = starField.dataset.reviewStars;
    const starButtons = starField.querySelectorAll(".review-star-btn");

    paintReviewStars(starField, Number(getReviewFieldMap(surface)?.stars?.value || 5));

    starButtons.forEach((button) => {
      const buttonValue = Number(button.dataset.rating);

      button.addEventListener("mouseenter", () => {
        paintReviewStars(starField, Number(getReviewFieldMap(surface)?.stars?.value || 0), buttonValue);
      });

      button.addEventListener("focus", () => {
        paintReviewStars(starField, Number(getReviewFieldMap(surface)?.stars?.value || 0), buttonValue);
      });

      button.addEventListener("click", () => {
        setReviewStarValue(surface, buttonValue);
      });
    });

    starField.addEventListener("mouseleave", () => {
      syncReviewStarField(surface);
    });

    starField.addEventListener("focusout", (event) => {
      if(!starField.contains(event.relatedTarget)){
        syncReviewStarField(surface);
      }
    });
  });
}

function openReviewModal(){
  const reviewModal = document.getElementById("reviewModal");

  if(!reviewModal){
    return;
  }

  syncReviewFormValues("inline", "modal");
  setActiveReviewSurface("modal");
  reviewModal.classList.add("is-visible");
  reviewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("review-modal-open");
}

function closeReviewModal(options = {}){
  const { dismissed = false } = options;
  const reviewModal = document.getElementById("reviewModal");

  if(!reviewModal){
    return;
  }

  if(dismissed && reviewPromptState.orderId && !reviewPromptState.submitted){
    reviewPromptState.dismissed = true;
    setReviewDismissedFlag(reviewPromptState.orderId, true);
  }

  reviewModal.classList.remove("is-visible");
  reviewModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("review-modal-open");
  setActiveReviewSurface("inline");
  syncReviewFormValues("modal", "inline");
  syncReviewPrompts();
}

function hideReviewModal(){
  const reviewModal = document.getElementById("reviewModal");

  if(!reviewModal){
    return;
  }

  reviewModal.classList.remove("is-visible");
  reviewModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("review-modal-open");
}

function setReviewPromptSubmitted(orderId){
  reviewPromptState = {
    orderId,
    submitted: true,
    dismissed: true
  };
  setReviewSubmittedFlag(orderId, true);
  setReviewDismissedFlag(orderId, true);
}

function setReviewSurfaceMessage(surface, message, type){
  const fields = getReviewFieldMap(surface);
  const messageBox = fields.message;

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

function setReviewMessage(message, type){
  setReviewSurfaceMessage("inline", message, type);
  setReviewSurfaceMessage("modal", message, type);
}

function setReviewFormsVisibility(showInlineForm, showModalForm){
  const inlineFields = getReviewFieldMap("inline");
  const modalFields = getReviewFieldMap("modal");

  if(inlineFields.form){
    inlineFields.form.style.display = showInlineForm ? "grid" : "none";
  }

  if(modalFields.form){
    modalFields.form.style.display = showModalForm ? "grid" : "none";
  }
}

function syncReviewPrompts(){
  const reviewSection = document.getElementById("reviewSection");
  const reviewStickyBar = document.getElementById("reviewStickyBar");

  if(!reviewSection || !reviewStickyBar || !reviewPromptState.orderId){
    return;
  }

  if(reviewPromptState.submitted){
    reviewSection.style.display = "none";
    hideReviewModal();
    reviewStickyBar.style.display = "none";
    document.body.classList.remove("track-review-sticky-visible");
    return;
  }

  reviewSection.style.display = reviewPromptState.dismissed ? "block" : "none";
  reviewSection.classList.toggle("is-inline-active", reviewPromptState.dismissed);

  reviewStickyBar.style.display = reviewPromptState.dismissed ? "flex" : "none";
  document.body.classList.toggle("track-review-sticky-visible", reviewPromptState.dismissed);

  if(!reviewPromptState.dismissed){
    openReviewModal();
  }else{
    hideReviewModal();
  }
}

function initReviewInteractions(){
  initReviewStarControls();
  document.getElementById("reviewForm")?.addEventListener("submit", submitReview);
  document.getElementById("reviewModalForm")?.addEventListener("submit", submitReview);

  document.getElementById("reviewMaybeLaterBtn")?.addEventListener("click", () => {
    closeReviewModal({ dismissed: true });
  });

  document.getElementById("reviewModalClose")?.addEventListener("click", () => {
    closeReviewModal({ dismissed: true });
  });

  document.querySelector("#reviewModal [data-review-close=\"backdrop\"]")?.addEventListener("click", () => {
    closeReviewModal({ dismissed: true });
  });

  document.getElementById("reviewStickyOpenBtn")?.addEventListener("click", () => {
    openReviewModal();
  });

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape"){
      closeReviewModal({ dismissed: true });
    }
  });
}

function bindSupportButton(order){
  const supportBtn = document.getElementById("supportBtn");
  const reasonSelect = document.getElementById("supportReason");

  if(!supportBtn || !reasonSelect){
    return;
  }

  supportBtn.onclick = (e) => {
    e.preventDefault();

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

    redirectToWhatsApp("971505373383", message);
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
  const reviewStickyBar = document.getElementById("reviewStickyBar");

  if(!reviewSection || !reviewStickyBar){
    return;
  }

  reviewSection.style.display = "none";
  reviewStickyBar.style.display = "none";
  document.body.classList.remove("track-review-sticky-visible");
  hideReviewModal();
  setReviewFormsVisibility(false, false);
  setReviewMessage("", "");

  if(normalizeStatus(order.status) !== "delivered" || !order?.orderId){
    reviewPromptState = {
      orderId: "",
      submitted: false,
      dismissed: false
    };
    return;
  }

  const existingReview = await getExistingReview(order.orderId);
  const submitted = Boolean(existingReview || getReviewSubmittedFlag(order.orderId));
  const dismissed = submitted ? true : getReviewDismissedFlag(order.orderId);

  reviewPromptState = {
    orderId: order.orderId,
    submitted,
    dismissed
  };

  if(submitted){
    setReviewPromptSubmitted(order.orderId);
    setReviewFormsVisibility(false, false);
    setReviewMessage(`${t("track.reviewThanks")} ${String.fromCodePoint(0x1F64C)}`, "success");
    return;
  }

  resetReviewForm("inline");
  resetReviewForm("modal");
  setReviewFormsVisibility(true, true);
  syncReviewPrompts();
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

  const formId = event.currentTarget?.id;
  const sourceSurface = formId === "reviewModalForm" ? "modal" : "inline";
  const targetSurface = sourceSurface === "modal" ? "inline" : "modal";
  const fields = getReviewFieldMap(sourceSurface);
  const submitButton = fields.submit;
  const rating = Number(fields.stars?.value);
  const comment = fields.comment?.value.trim() || "";
  const name = fields.name?.value.trim() || "";

  if(!rating || rating < 1 || rating > 5){
    setReviewMessage(t("track.reviewRatingRequired"), "error");
    return;
  }

  syncReviewFormValues(sourceSurface, targetSurface);
  submitButton.disabled = true;
  submitButton.textContent = t("track.reviewSubmitting");
  setReviewMessage("", "");

  try{
    const existingReview = await getExistingReview(currentOrder.orderId);

    if(existingReview){
      setReviewPromptSubmitted(currentOrder.orderId);
      setReviewFormsVisibility(false, false);
      hideReviewModal();
      setReviewMessage(`${t("track.reviewThanks")} ${String.fromCodePoint(0x1F64C)}`, "success");
      syncReviewPrompts();
      return;
    }

    await setDoc(doc(db, "reviews", currentOrder.orderId), {
      orderId: currentOrder.orderId,
      rating,
      comment: comment.slice(0, 1000),
      name: (name || "").slice(0, 120),
      approved: false,
      createdAt: new Date()
    });

    setReviewPromptSubmitted(currentOrder.orderId);
    resetReviewForm("inline");
    resetReviewForm("modal");
    setReviewFormsVisibility(false, false);
    hideReviewModal();
    setReviewMessage(`${t("track.reviewThanks")} ${String.fromCodePoint(0x1F64C)}`, "success");
    syncReviewPrompts();
  }catch(error){
    console.error("Review submission failed:", error);
    setReviewMessage(t("track.reviewSubmitError"), "error");
  }finally{
    submitButton.disabled = false;
    submitButton.textContent = t("track.submitReview");
  }
}

function resetTrackState(){
  currentOrder = null;
  destroyTrackingMap();
  document.getElementById("statusSummary").innerHTML = "";
  document.getElementById("orderInfo").innerHTML = "";
  document.getElementById("orderItems").innerHTML = "";
  const orderDetailsBlock = document.getElementById("orderDetailsBlock");
  if(orderDetailsBlock){
    orderDetailsBlock.style.display = "none";
  }
  document.getElementById("locationInfo").innerHTML = "";
  document.getElementById("etaInfo").innerHTML = "";
  document.getElementById("mapLegend").innerHTML = "";
  document.getElementById("mapContainer").innerHTML = "";
  updateDriverInfo(null, "");
  renderStatus("quote-requested");

  const reviewSection = document.getElementById("reviewSection");
  const reviewStickyBar = document.getElementById("reviewStickyBar");

  if(reviewSection){
    reviewSection.style.display = "none";
  }

  if(reviewStickyBar){
    reviewStickyBar.style.display = "none";
  }

  document.body.classList.remove("track-review-sticky-visible");
  reviewPromptState = {
    orderId: "",
    submitted: false,
    dismissed: false
  };
  resetReviewForm("inline");
  resetReviewForm("modal");
  setReviewFormsVisibility(false, false);
  hideReviewModal();
  setReviewMessage("", "");
}

function formatStatusLabel(status){
  return translateStatus(status || "unknown");
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
${t("track.driverMessage", {
    name: order.driver.name || t("track.driverFallbackName"),
    orderId: order.orderId
  })}
`;

  driverInfoBox.style.display = "block";
  driverName.textContent = order.driver.name || t("common.noData");
  driverPhone.textContent = order.driver.phone || t("common.noData");
  driverWhatsappBtn.href = phone
    ? buildWhatsAppUrl(phone, message)
    : "#";
}

async function trackOrder(){
  const orderId = document.getElementById("orderIdInput").value.trim();

  if(!orderId){
    alert(t("track.enterOrderId"));
    return;
  }

  await loadOrder(orderId);
}

document.addEventListener("DOMContentLoaded", async () => {
  initI18n();
  initMobileMenu();
  initReviewInteractions();
  syncTrackResultLayoutOrder();
  window.addEventListener("resize", syncTrackResultLayoutOrder, { passive: true });

  const urlOrderId = getOrderIdFromURL();

  if(urlOrderId){
    document.getElementById("orderIdInput").value = urlOrderId;
    await loadOrder(urlOrderId);
  }
});

onLanguageChange(() => {
  const enteredOrderId = document.getElementById("orderIdInput")?.value.trim();

  if(currentOrder){
    renderOrder(currentOrder);
    return;
  }

  if(enteredOrderId){
    loadOrder(enteredOrderId);
  }
});

window.trackOrder = trackOrder;
