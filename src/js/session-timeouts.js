export const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";

const SESSION_STORAGE_KEYS = Object.freeze({
  adminLoginAt: "adminLoginAt",
  adminLastActivityAt: "adminLastActivityAt",
  driverLoginAt: "driverLoginAt"
});

function getNow(){
  return Date.now();
}

function getTimestamp(key){
  const rawValue = localStorage.getItem(key);
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function setTimestamp(key, value = getNow()){
  localStorage.setItem(key, String(value));
}

function removeTimestamp(key){
  localStorage.removeItem(key);
}

export function startAdminSession(){
  const now = getNow();
  setTimestamp(SESSION_STORAGE_KEYS.adminLoginAt, now);
  setTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt, now);
}

export function touchAdminSessionActivity(){
  setTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt, getNow());
}

export function ensureAdminSessionMetadata(){
  const loginAt = getTimestamp(SESSION_STORAGE_KEYS.adminLoginAt);

  if(!loginAt){
    startAdminSession();
    return;
  }

  const lastActivityAt = getTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt);

  if(!lastActivityAt){
    setTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt, getNow());
  }
}

export function clearAdminSession(){
  removeTimestamp(SESSION_STORAGE_KEYS.adminLoginAt);
  removeTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt);
}

export function getAdminSessionStatus({
  maxSessionMs,
  inactivityLimitMs
}){
  const loginAt = getTimestamp(SESSION_STORAGE_KEYS.adminLoginAt);
  const lastActivityAt = getTimestamp(SESSION_STORAGE_KEYS.adminLastActivityAt);
  const now = getNow();

  if(!loginAt || !lastActivityAt){
    return {
      isExpired: false,
      reason: ""
    };
  }

  if(maxSessionMs > 0 && (now - loginAt) >= maxSessionMs){
    return {
      isExpired: true,
      reason: "max-session"
    };
  }

  if(inactivityLimitMs > 0 && (now - lastActivityAt) >= inactivityLimitMs){
    return {
      isExpired: true,
      reason: "inactivity"
    };
  }

  return {
    isExpired: false,
    reason: ""
  };
}

export function startDriverSession(){
  setTimestamp(SESSION_STORAGE_KEYS.driverLoginAt, getNow());
}

export function ensureDriverSessionMetadata(){
  if(!getTimestamp(SESSION_STORAGE_KEYS.driverLoginAt)){
    startDriverSession();
  }
}

export function clearDriverSession(){
  removeTimestamp(SESSION_STORAGE_KEYS.driverLoginAt);
}

export function getDriverSessionStatus({
  maxSessionMs
}){
  const loginAt = getTimestamp(SESSION_STORAGE_KEYS.driverLoginAt);

  if(!loginAt){
    return {
      isExpired: false
    };
  }

  return {
    isExpired: maxSessionMs > 0 && (getNow() - loginAt) >= maxSessionMs
  };
}
