import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AUTH_MESSAGE_PARAM = "authMessage";

export const ADMIN_LOGIN_PATH = "/admin-login";
export const DRIVER_LOGIN_PATH = "/driver-login";
export const ADMIN_REDIRECT_MESSAGE = "Please sign in with an admin account.";
export const DRIVER_REDIRECT_MESSAGE = "Please sign in with a driver account.";

export function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

export function buildAuthRedirectUrl(path, message = ""){
  const targetUrl = new URL(path, window.location.origin);

  if(message){
    targetUrl.searchParams.set(AUTH_MESSAGE_PARAM, message);
  }

  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

export function redirectToAuthPage(path, message = ""){
  window.location.replace(buildAuthRedirectUrl(path, message));
}

export function consumeAuthRedirectMessage(){
  const currentUrl = new URL(window.location.href);
  const message = currentUrl.searchParams.get(AUTH_MESSAGE_PARAM) || "";

  if(message){
    currentUrl.searchParams.delete(AUTH_MESSAGE_PARAM);
    window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  }

  return message;
}

export async function getAuthorizedAdminDoc(db, user){
  if(!user?.uid){
    return null;
  }

  const adminDocRef = doc(db, "admins", user.uid);
  const adminSnapshot = await getDoc(adminDocRef);

  if(adminSnapshot.exists()){
    const adminData = adminSnapshot.data() || {};
    const role = typeof adminData.role === "string" ? adminData.role.trim().toLowerCase() : "";
    const roleAllowed = !role || role === "admin";

    return adminData.active === true && roleAllowed
      ? { id: adminSnapshot.id, ...adminData }
      : null;
  }

  const email = normalizeEmail(user.email);

  if(!email){
    return null;
  }

  const fallbackQuery = query(collection(db, "admins"), where("email", "==", email));
  const fallbackSnapshot = await getDocs(fallbackQuery);

  if(fallbackSnapshot.empty){
    return null;
  }

  const fallbackDoc = fallbackSnapshot.docs[0];
  const fallbackData = fallbackDoc.data() || {};
  const role = typeof fallbackData.role === "string" ? fallbackData.role.trim().toLowerCase() : "";
  const roleAllowed = !role || role === "admin";

  return fallbackData.active === true && roleAllowed
    ? { id: fallbackDoc.id, ...fallbackData }
    : null;
}

export async function findDriverDocByUser(db, user){
  const email = normalizeEmail(user?.email);

  const uidDocRef = doc(db, "drivers", user.uid);
  const uidDocSnapshot = await getDoc(uidDocRef);

  if(uidDocSnapshot.exists()){
    return uidDocSnapshot;
  }

  const uidQuerySnapshot = await getDocs(
    query(collection(db, "drivers"), where("uid", "==", user.uid))
  );

  if(!uidQuerySnapshot.empty){
    return uidQuerySnapshot.docs[0];
  }

  if(!email){
    return null;
  }

  const emailQuerySnapshot = await getDocs(
    query(collection(db, "drivers"), where("email", "==", email))
  );

  return emailQuerySnapshot.empty ? null : emailQuerySnapshot.docs[0];
}

export async function resolveDriverProfile(db, user, options = {}){
  const { syncProfile = true } = options;
  const email = normalizeEmail(user?.email);
  const driverDoc = await findDriverDocByUser(db, user);

  if(!driverDoc){
    return null;
  }

  const currentData = driverDoc.data() || {};
  const nextData = {};

  if(syncProfile){
    if(email && currentData.email !== email){
      nextData.email = email;
    }

    if(currentData.uid !== user.uid){
      nextData.uid = user.uid;
    }

    if(Object.keys(nextData).length){
      await updateDoc(driverDoc.ref, nextData);
    }
  }

  return {
    id: driverDoc.id,
    ...currentData,
    ...nextData
  };
}
