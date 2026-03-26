import { auth } from "./firebase.js";
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
    await signInWithEmailAndPassword(auth, email, password);

    // redirect to admin
    window.location.href = "admin.html";

  }catch{
    setError("Invalid email or password");
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
