export const UAE_BOUNDS = {
  minLat: 22,
  maxLat: 26.6,
  minLng: 51,
  maxLng: 56.6
};

export function normalizeMapUrl(link){
  if(!link){
    return "";
  }

  const trimmedLink = String(link).trim();

  if(!trimmedLink){
    return "";
  }

  const normalizedLink = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedLink)
    ? trimmedLink
    : `https://${trimmedLink}`;

  return isSafeMapUrl(normalizedLink) ? normalizedLink : "";
}

export function isSafeMapUrl(link){
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

export function parseCoordinateString(value){
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

export function getLocationCoordinates(value){
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.lon ?? value?.longitude);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return null;
  }

  return { lat, lng };
}

export function isWithinUaeBounds(coords){
  if(!coords){
    return false;
  }

  return coords.lat >= UAE_BOUNDS.minLat &&
    coords.lat <= UAE_BOUNDS.maxLat &&
    coords.lng >= UAE_BOUNDS.minLng &&
    coords.lng <= UAE_BOUNDS.maxLng;
}

export function getValidatedUaeCoordinates(coords){
  if(!coords){
    return null;
  }

  return isWithinUaeBounds(coords) ? coords : null;
}

export function extractGoogleMapsQuery(link){
  if(!link){
    return "";
  }

  try{
    const normalizedLink = normalizeMapUrl(link);
    const url = new URL(normalizedLink);
    const qParam = url.searchParams.get("q") || url.searchParams.get("query");

    if(qParam){
      return qParam;
    }

    const atMatch = normalizedLink.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if(atMatch){
      return `${atMatch[1]},${atMatch[2]}`;
    }

    const coordMatch = normalizedLink.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if(coordMatch){
      return `${coordMatch[1]},${coordMatch[2]}`;
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
    const plainQMatch = String(link).match(/[?&]q=([^&]+)/);
    if(plainQMatch){
      return decodeURIComponent(plainQMatch[1]);
    }

    return "";
  }
}

export function normalizeGoogleMapsLink(link){
  if(!link){
    return "";
  }

  const trimmedLink = String(link).trim();
  const query = extractGoogleMapsQuery(trimmedLink);

  if(!query){
    const normalizedLink = normalizeMapUrl(trimmedLink);
    return normalizedLink || "";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
}

export function extractCoordinatesFromMapLink(link){
  const normalizedLink = normalizeMapUrl(link);

  if(!normalizedLink){
    return null;
  }

  const queryCoordinates = parseCoordinateString(extractGoogleMapsQuery(normalizedLink));

  if(queryCoordinates){
    return queryCoordinates;
  }

  try{
    const url = new URL(normalizedLink);
    const centerCoordinates = parseCoordinateString(url.searchParams.get("center"));

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

export function buildGoogleMapsCoordinateLink(coords){
  if(!coords){
    return "";
  }

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return "";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function buildDestinationLocation(coords, source = "map-picker-tap"){
  const validatedCoords = getValidatedUaeCoordinates(getLocationCoordinates(coords) || coords);

  if(!validatedCoords){
    return null;
  }

  const lat = Number(validatedCoords.lat);
  const lng = Number(validatedCoords.lng);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return null;
  }

  return {
    lat,
    lng,
    source: source || "map-picker-tap"
  };
}

export function formatCoordinatePair(coords, digits = 5){
  if(!coords){
    return "";
  }

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);

  if(!Number.isFinite(lat) || !Number.isFinite(lng)){
    return "";
  }

  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;
}
