import { auth, db } from "./firebase.js";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_REDIRECT_MESSAGE,
  consumeAuthRedirectMessage,
  getAuthorizedAdminDoc
} from "./auth-access.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginBtn");
const errorMessage = document.getElementById("error");

/* LOGIN FUNCTION */
window.login = async function(){

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  setLoadingState(true);
  setError("");

  try{
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const authorizedAdmin = await getAuthorizedAdminDoc(db, credential.user);

    if(!authorizedAdmin){
      setError(ADMIN_REDIRECT_MESSAGE);
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
    const authorizedAdmin = await getAuthorizedAdminDoc(db, user);

    if(authorizedAdmin){
      window.location.href = "/admin";
      return;
    }

    setError(ADMIN_REDIRECT_MESSAGE);
  }catch(error){
    console.error("Admin auth state verification failed:", error);
    setError("We could not verify admin access right now. Please try again.");
  }
});

const authRedirectMessage = consumeAuthRedirectMessage();

if(authRedirectMessage){
  setError(authRedirectMessage);
}else if(window.location.pathname === ADMIN_LOGIN_PATH){
  setError("");
}
