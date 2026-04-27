import { auth, db } from "./firebase.js";
import {
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginBtn");
const errorMessage = document.getElementById("error");

async function getAuthorizedAdminDoc(user){
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

  const email = String(user.email || "").trim().toLowerCase();

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

/* LOGIN FUNCTION */
window.login = async function(){

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  setLoadingState(true);
  setError("");

  try{
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const authorizedAdmin = await getAuthorizedAdminDoc(credential.user);

    if(!authorizedAdmin){
      await signOut(auth);
      setError("This account does not have admin access.");
      setLoadingState(false);
      return;
    }

    window.location.href = "/admin";
  }catch(error){
    console.error("Admin login failed:", error);
    setError(error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password" || error?.code === "auth/user-not-found"
      ? "Invalid email or password"
      : "We could not verify admin access right now. Please try again.");
    setLoadingState(false);
  }

};

function setLoadingState(isLoading){
  if(!loginButton){
    return;
  }

  loginButton.disabled = isLoading;
  loginButton.textContent = isLoading ? "Logging in..." : "Login to Dashboard";
}

function setError(message){
  if(!errorMessage){
    return;
  }

  errorMessage.textContent = message;
  errorMessage.classList.toggle("visible", Boolean(message));
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  window.login();
});

onAuthStateChanged(auth, async (user) => {
  if(!user){
    return;
  }

  try{
    const authorizedAdmin = await getAuthorizedAdminDoc(user);

    if(authorizedAdmin){
      window.location.href = "/admin";
      return;
    }

    await signOut(auth);
  }catch(error){
    console.error("Admin auth state verification failed:", error);
    await signOut(auth);
  }
});
