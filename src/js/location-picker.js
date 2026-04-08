import {
  buildDestinationLocation,
  buildGoogleMapsCoordinateLink,
  extractCoordinatesFromMapLink,
  formatCoordinatePair,
  getLocationCoordinates,
  getValidatedUaeCoordinates,
  UAE_BOUNDS,
  normalizeGoogleMapsLink
} from "./location-utils.js";

const DEFAULT_CENTER = [25.2048, 55.2708];
const DEFAULT_ZOOM = 11;
const PICKER_ZOOM = 16;
const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_CACHE = new Map();
const REVERSE_CACHE = new Map();

let pickerController = null;

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureLeaflet(){
  if(!window.L){
    throw new Error("Leaflet is not available");
  }
}

function toSelection(value = {}){
  const coordinates = getValidatedUaeCoordinates(getLocationCoordinates(value) || value);

  if(!coordinates){
    return null;
  }

  const label = String(value.label || value.name || value.address || "").trim();
  const address = String(value.address || value.displayName || value.label || "").trim();

  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    label,
    address,
    source: String(value.source || "map-picker-search").trim() || "map-picker-search"
  };
}

function hasValidSelectionCoordinates(value){
  return Boolean(getValidatedUaeCoordinates(getLocationCoordinates(value) || value));
}

function getSelectionHeading(selection){
  if(!selection){
    return "No location selected yet";
  }

  return selection.label || selection.address || formatCoordinatePair(selection);
}

function getSelectionMeta(selection){
  if(!selection){
    return "Search for a venue or tap on the map to place the exact destination pin.";
  }

  const primaryAddress = selection.address && selection.address !== selection.label
    ? selection.address
    : "";

  return [primaryAddress, `Coordinates: ${formatCoordinatePair(selection)}`]
    .filter(Boolean)
    .join(" | ");
}

function createDestinationIcon(){
  ensureLeaflet();

  return window.L.divIcon({
    className: "location-picker-destination-icon",
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

async function searchPlaces(query){
  const normalizedQuery = String(query || "").trim().toLowerCase();

  if(SEARCH_CACHE.has(normalizedQuery)){
    return SEARCH_CACHE.get(normalizedQuery);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "ae");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("viewbox", `${UAE_BOUNDS.minLng},${UAE_BOUNDS.maxLat},${UAE_BOUNDS.maxLng},${UAE_BOUNDS.minLat}`);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });

  if(!response.ok){
    throw new Error("Could not search locations");
  }

  const payload = await response.json();
  const results = Array.isArray(payload)
    ? payload
      .map((item) => toSelection({
        lat: Number(item.lat),
        lng: Number(item.lon),
        label: item.name || item.display_name,
        address: item.display_name,
        source: "map-picker-search"
      }))
      .filter(Boolean)
    : [];

  SEARCH_CACHE.set(normalizedQuery, results);
  return results;
}

export async function reverseGeocodeCoordinates(coords){
  const validatedCoords = getValidatedUaeCoordinates(getLocationCoordinates(coords) || coords);

  if(!validatedCoords){
    return null;
  }

  const cacheKey = formatCoordinatePair(validatedCoords, 6);

  if(REVERSE_CACHE.has(cacheKey)){
    return REVERSE_CACHE.get(cacheKey);
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(validatedCoords.lat));
  url.searchParams.set("lon", String(validatedCoords.lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  try{
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });

    if(!response.ok){
      throw new Error("Could not reverse geocode");
    }

    const payload = await response.json();
    const selection = toSelection({
      ...validatedCoords,
      label: payload?.name || payload?.display_name,
      address: payload?.display_name,
      source: "map-picker-tap"
    });

    REVERSE_CACHE.set(cacheKey, selection);
    return selection;
  }catch{
    return null;
  }
}

function ensurePickerController(){
  if(pickerController){
    return pickerController;
  }

  ensureLeaflet();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay location-picker-overlay";
  overlay.innerHTML = `
    <div class="modal location-picker-modal" role="dialog" aria-modal="true" aria-labelledby="locationPickerTitle">
      <div class="modal-content location-picker-modal-content">
        <button type="button" class="modal-close location-picker-close" aria-label="Close location picker">&times;</button>
        <div class="location-picker-head">
          <div>
            <h3 id="locationPickerTitle">Pick Event Location</h3>
            <p id="locationPickerSubtitle">Search for a place in the UAE or tap directly on the map.</p>
          </div>
        </div>

        <div class="location-picker-search">
          <label class="location-picker-label" for="locationPickerSearchInput">Search place or venue</label>
          <input id="locationPickerSearchInput" type="search" placeholder="Hotel, villa, hall, address..." autocomplete="off" />
          <div id="locationPickerSearchStatus" class="location-picker-search-status">Results are focused on the UAE.</div>
          <div id="locationPickerResults" class="location-picker-results"></div>
        </div>

        <div id="locationPickerMap" class="location-picker-map" aria-label="Location picker map"></div>

        <div class="location-picker-preview">
          <div>
            <strong id="locationPickerPreviewTitle">No location selected yet</strong>
            <p id="locationPickerPreviewMeta">Search for a venue or tap on the map to place the exact destination pin.</p>
          </div>
        </div>

        <div class="modal-actions location-picker-actions">
          <button type="button" class="btn btn-primary" id="locationPickerConfirmBtn" disabled>Confirm Location</button>
          <button type="button" class="btn btn-secondary" id="locationPickerCancelBtn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const title = overlay.querySelector("#locationPickerTitle");
  const subtitle = overlay.querySelector("#locationPickerSubtitle");
  const searchInput = overlay.querySelector("#locationPickerSearchInput");
  const searchStatus = overlay.querySelector("#locationPickerSearchStatus");
  const results = overlay.querySelector("#locationPickerResults");
  const previewTitle = overlay.querySelector("#locationPickerPreviewTitle");
  const previewMeta = overlay.querySelector("#locationPickerPreviewMeta");
  const confirmButton = overlay.querySelector("#locationPickerConfirmBtn");
  const cancelButton = overlay.querySelector("#locationPickerCancelBtn");
  const closeButton = overlay.querySelector(".location-picker-close");

  const map = window.L.map(overlay.querySelector("#locationPickerMap"), {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true
  });

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  let marker = null;
  let activeResolver = null;
  let pendingSelection = null;
  let searchDebounceId = null;
  let activeSearchToken = 0;
  let previousBodyOverflow = "";

  function updatePreview(selection){
    previewTitle.textContent = getSelectionHeading(selection);
    previewMeta.textContent = getSelectionMeta(selection);
    confirmButton.disabled = !selection;
  }

  function setMarker(selection, { centerMap = true } = {}){
    pendingSelection = selection ? { ...selection } : null;

    if(!selection){
      if(marker){
        map.removeLayer(marker);
        marker = null;
      }
      updatePreview(null);
      return;
    }

    const latLng = [selection.lat, selection.lng];

    if(!marker){
      marker = window.L.marker(latLng, {
        draggable: true,
        icon: createDestinationIcon()
      }).addTo(map);

      marker.on("dragend", async () => {
        const { lat, lng } = marker.getLatLng();
        const nextSelection = {
          lat,
          lng,
          label: "",
          address: "",
          source: "map-picker-tap"
        };

        if(!hasValidSelectionCoordinates(nextSelection)){
          setMarker(pendingSelection, { centerMap: false });
          searchStatus.textContent = "Please choose a location within the UAE.";
          return;
        }

        setMarker(nextSelection, { centerMap: false });
        const reverseResult = await reverseGeocodeCoordinates(nextSelection);
        if(!pendingSelection){
          return;
        }

        const currentKey = formatCoordinatePair(pendingSelection, 6);
        const nextKey = formatCoordinatePair(nextSelection, 6);

        if(currentKey === nextKey && reverseResult){
          setMarker({
            ...nextSelection,
            label: reverseResult.label || reverseResult.address || "",
            address: reverseResult.address || reverseResult.label || "",
            source: "map-picker-tap"
          }, { centerMap: false });
        }
      });
    }else{
      marker.setLatLng(latLng);
    }

    updatePreview(selection);

    if(centerMap){
      map.setView(latLng, PICKER_ZOOM, {
        animate: false
      });
    }
  }

  function closePicker(selection = null){
    overlay.classList.remove("active");
    document.body.style.overflow = previousBodyOverflow;

    if(activeResolver){
      const resolver = activeResolver;
      activeResolver = null;
      resolver(selection ? { ...selection } : null);
    }
  }

  function renderResults(items){
    if(!items.length){
      results.innerHTML = '<div class="location-picker-result-empty">No matching places found in the UAE.</div>';
      return;
    }

    results.innerHTML = items.map((item, index) => `
      <button type="button" class="location-picker-result" data-index="${index}">
        <strong>${escapeHtml(item.label || item.address || formatCoordinatePair(item))}</strong>
        <span>${escapeHtml(item.address || formatCoordinatePair(item))}</span>
      </button>
    `).join("");

    results.querySelectorAll(".location-picker-result").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items[Number(button.dataset.index)];
        setMarker(item);
        searchStatus.textContent = "Selected result is ready to confirm.";
      });
    });
  }

  async function runSearch(query){
    const normalizedQuery = String(query || "").trim();

    if(normalizedQuery.length < 2){
      results.innerHTML = "";
      searchStatus.textContent = "Results are focused on the UAE.";
      return;
    }

    const searchToken = activeSearchToken + 1;
    activeSearchToken = searchToken;
    searchStatus.textContent = "Searching places...";

    try{
      const items = await searchPlaces(normalizedQuery);

      if(activeSearchToken !== searchToken){
        return;
      }

      searchStatus.textContent = `${items.length} result${items.length === 1 ? "" : "s"} found.`;
      renderResults(items);
    }catch{
      if(activeSearchToken !== searchToken){
        return;
      }

      results.innerHTML = '<div class="location-picker-result-empty">Search is temporarily unavailable. You can still tap on the map.</div>';
      searchStatus.textContent = "Search is temporarily unavailable.";
    }
  }

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchDebounceId);
    searchDebounceId = window.setTimeout(() => {
      runSearch(searchInput.value);
    }, SEARCH_DEBOUNCE_MS);
  });

  map.on("click", async (event) => {
    const nextSelection = {
      lat: event.latlng.lat,
      lng: event.latlng.lng,
      label: "",
      address: "",
      source: "map-picker-tap"
    };

    if(!hasValidSelectionCoordinates(nextSelection)){
      searchStatus.textContent = "Please choose a location within the UAE.";
      return;
    }

    setMarker(nextSelection, { centerMap: false });
    searchStatus.textContent = "Pin placed on the map. Fetching location details...";
    const reverseResult = await reverseGeocodeCoordinates(nextSelection);

    if(!pendingSelection){
      return;
    }

    const currentKey = formatCoordinatePair(pendingSelection, 6);
    const nextKey = formatCoordinatePair(nextSelection, 6);

    if(currentKey === nextKey){
      setMarker({
        ...nextSelection,
        label: reverseResult?.label || reverseResult?.address || "",
        address: reverseResult?.address || reverseResult?.label || "",
        source: "map-picker-tap"
      }, { centerMap: false });
      searchStatus.textContent = "Pin placed on the map. Confirm when ready.";
    }
  });

  cancelButton.addEventListener("click", () => closePicker(null));
  closeButton.addEventListener("click", () => closePicker(null));
  confirmButton.addEventListener("click", () => closePicker(pendingSelection));
  overlay.addEventListener("click", (event) => {
    if(event.target === overlay){
      closePicker(null);
    }
  });

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && overlay.classList.contains("active")){
      closePicker(null);
    }
  });

  pickerController = {
    open({
      titleText = "Pick Event Location",
      subtitleText = "Search for a place in the UAE or tap directly on the map.",
      initialSelection = null
    } = {}){
      title.textContent = titleText;
      subtitle.textContent = subtitleText;
      results.innerHTML = "";
      searchInput.value = "";
      searchStatus.textContent = "Results are focused on the UAE.";
      setMarker(initialSelection ? { ...initialSelection } : null);
      overlay.classList.add("active");
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      window.setTimeout(() => {
        map.invalidateSize();

        if(initialSelection){
          map.setView([initialSelection.lat, initialSelection.lng], PICKER_ZOOM, {
            animate: false
          });
        }else{
          map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, {
            animate: false
          });
        }
      }, 50);

      return new Promise((resolve) => {
        activeResolver = resolve;
      });
    }
  };

  return pickerController;
}

function renderSummary(summaryContainer, triggerButton, selection, summaryTitle){
  if(!summaryContainer){
    return;
  }

  if(!selection){
    summaryContainer.innerHTML = `
      <div class="location-selection-summary is-empty">
        <div>
          <strong>${escapeHtml(summaryTitle)}</strong>
          <p>Tracking ETA works best after you confirm the exact map destination.</p>
        </div>
        <button type="button" class="btn btn-secondary location-selection-change-btn">${escapeHtml(triggerButton?.dataset.emptyLabel || triggerButton?.textContent?.trim() || "Pick Event Location on Map")}</button>
      </div>
    `;
  }else{
    summaryContainer.innerHTML = `
      <div class="location-selection-summary">
        <div class="location-selection-copy">
          <span class="location-selection-kicker">${escapeHtml(summaryTitle)}</span>
          <strong>${escapeHtml(getSelectionHeading(selection))}</strong>
          <p>${escapeHtml(getSelectionMeta(selection))}</p>
        </div>
        <button type="button" class="btn btn-secondary location-selection-change-btn">Change Location</button>
      </div>
    `;
  }
}

export function getInitialSelectionFromOrder(order){
  const destinationCoordinates = getLocationCoordinates(order?.destinationLocation);
  const destinationLocation = destinationCoordinates ? toSelection({
    ...destinationCoordinates,
    label: order?.eventLocation,
    address: order?.eventLocation,
    source: order?.destinationLocation?.source || "map-picker-search"
  }) : null;

  if(destinationLocation){
    return destinationLocation;
  }

  const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(order?.mapLink));

  if(mapLinkCoordinates){
    return toSelection({
      ...mapLinkCoordinates,
      label: order?.eventLocation,
      address: order?.eventLocation,
      source: "mapLink"
    });
  }

  return null;
}

export function createLocationFieldBinding({
  triggerButton,
  summaryContainer,
  eventLocationInput,
  mapLinkInput,
  pickerTitle = "Pick Event Location",
  pickerSubtitle = "Search for a place in the UAE or tap directly on the map.",
  summaryTitle = "Selected Location"
}){
  let selection = null;
  let isSyncingFields = false;
  let hasPendingManualMapLinkEdit = false;
  let isMapLinkAutoSynced = false;

  function syncInputs(nextSelection){
    if(!eventLocationInput || !mapLinkInput){
      return;
    }

    isSyncingFields = true;
    const currentEventLocation = eventLocationInput.value.trim();
    const nextLabel = nextSelection?.label || nextSelection?.address || currentEventLocation || formatCoordinatePair(nextSelection);

    if(nextSelection){
      eventLocationInput.value = nextLabel || currentEventLocation;
      const coordinateLink = buildGoogleMapsCoordinateLink(nextSelection);
      mapLinkInput.value = coordinateLink || normalizeGoogleMapsLink(mapLinkInput.value);
      isMapLinkAutoSynced = Boolean(coordinateLink);
    }else{
      mapLinkInput.value = normalizeGoogleMapsLink(mapLinkInput.value);
      isMapLinkAutoSynced = false;
    }

    isSyncingFields = false;
  }

  function render(){
    renderSummary(summaryContainer, triggerButton, selection, summaryTitle);
    summaryContainer?.querySelector(".location-selection-change-btn")?.addEventListener("click", openPicker);
  }

  async function openPicker(){
    const controller = ensurePickerController();
    const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(mapLinkInput?.value));
    const initialSelection = selection || (mapLinkCoordinates ? {
      ...mapLinkCoordinates,
      label: eventLocationInput?.value.trim() || "",
      address: eventLocationInput?.value.trim() || "",
      source: "mapLink"
    } : null);
    const nextSelection = await controller.open({
      titleText: pickerTitle,
      subtitleText: pickerSubtitle,
      initialSelection
    });

    if(nextSelection){
      binding.setSelection(nextSelection, {
        syncFields: true
      });
    }
  }

  if(triggerButton){
    triggerButton.addEventListener("click", openPicker);
  }

  mapLinkInput?.addEventListener("input", () => {
    if(isSyncingFields){
      return;
    }

    hasPendingManualMapLinkEdit = true;
    isMapLinkAutoSynced = false;
  });

  mapLinkInput?.addEventListener("blur", () => {
    const normalizedLink = normalizeGoogleMapsLink(mapLinkInput.value);
    mapLinkInput.value = normalizedLink;

    const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(normalizedLink));

    if(!mapLinkCoordinates){
      if(hasPendingManualMapLinkEdit && selection){
        selection = null;
        render();
      }

      hasPendingManualMapLinkEdit = false;
      return;
    }

    binding.setSelection({
      ...mapLinkCoordinates,
      label: eventLocationInput?.value.trim() || "",
      address: eventLocationInput?.value.trim() || "",
      source: "mapLink"
    }, {
      syncFields: false
    });
    hasPendingManualMapLinkEdit = false;
    isMapLinkAutoSynced = false;
  });

  eventLocationInput?.addEventListener("input", () => {
    if(isSyncingFields){
      return;
    }

    if(selection){
      if(isMapLinkAutoSynced && mapLinkInput){
        mapLinkInput.value = "";
      }

      isMapLinkAutoSynced = false;
      selection = null;
      render();
    }
  });

  const binding = {
    getSelection(){
      return selection ? { ...selection } : null;
    },
    setSelection(nextSelection, { syncFields = false } = {}){
      selection = toSelection(nextSelection);

      if(syncFields && selection){
        syncInputs(selection);
      }else if(syncFields){
        syncInputs(null);
      }else{
        isMapLinkAutoSynced = false;
      }

      render();
    },
    clear(){
      selection = null;
      hasPendingManualMapLinkEdit = false;
      isMapLinkAutoSynced = false;
      render();
    },
    preloadFromOrder(order){
      const nextSelection = getInitialSelectionFromOrder(order);
      if(nextSelection){
        this.setSelection(nextSelection, {
          syncFields: false
        });
      }else{
        this.clear();
      }
    },
    getDestinationLocation(existingValue = null){
      const selectedCoords = getValidatedUaeCoordinates(getLocationCoordinates(selection));

      if(selectedCoords){
        return buildDestinationLocation(selectedCoords, selection.source);
      }

      const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(mapLinkInput?.value));

      if(mapLinkCoordinates){
        return buildDestinationLocation(mapLinkCoordinates, "mapLink");
      }

      const existingCoords = getValidatedUaeCoordinates(getLocationCoordinates(existingValue));

      if(existingCoords){
        return buildDestinationLocation(existingCoords, existingValue?.source || "map-picker-search");
      }

      return null;
    }
  };

  render();
  return binding;
}
