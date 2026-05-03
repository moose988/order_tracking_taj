import { auth, db } from "./firebase.js";
import {
  DRIVER_LOGIN_PATH,
  DRIVER_REDIRECT_MESSAGE,
  consumeAuthRedirectMessage,
  normalizeEmail,
  resolveDriverProfile
} from "./auth-access.js";
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const loginForm = document.getElementById("driverLoginForm");
const loginButton = document.getElementById("driverLoginBtn");
const errorBox = document.getElementById("driverLoginError");

function setError(message = ""){
  if(!errorBox){
    return;
  }

  errorBox.textContent = message;
  errorBox.classList.toggle("visible", Boolean(message));
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if(!email || !password){
    setError("Enter both email and password.");
    return;
  }

  if(loginButton){
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";
  }

  try{
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const driverProfile = await resolveDriverProfile(db, userCredential.user);

    if(!driverProfile){
      console.debug("[driver-auth] login rejected", {
        reason: "missing-driver-profile",
        uid: userCredential.user?.uid || "",
        email: normalizeEmail(userCredential.user?.email)
      });
      setError(DRIVER_REDIRECT_MESSAGE);
      return;
    }

    localStorage.setItem("driverUid", userCredential.user.uid);
    window.location.href = "/driver";
  }catch(error){
    console.error("Driver login failed:", error);
    setError(error.message || "Unable to sign in right now.");
  }finally{
    if(loginButton){
      loginButton.disabled = false;
      loginButton.textContent = "Login to Driver Dashboard";
    }
  }
});

onAuthStateChanged(auth, async (user) => {
  if(!user){
    return;
  }

  try{
    const driverProfile = await resolveDriverProfile(db, user);

    if(driverProfile){
      localStorage.setItem("driverUid", user.uid);
      window.location.href = "/driver";
      return;
    }

    setError(DRIVER_REDIRECT_MESSAGE);
  }catch(error){
    console.error("Driver auth state verification failed:", error);
    setError("Unable to verify driver access right now. Please try again.");
  }
});

const authRedirectMessage = consumeAuthRedirectMessage();

if(authRedirectMessage){
  setError(authRedirectMessage);
}else if(window.location.pathname === DRIVER_LOGIN_PATH){
  setError("");
}
