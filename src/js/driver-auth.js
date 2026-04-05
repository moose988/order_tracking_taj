import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

async function findDriverDocByUser(user){
  const normalizedEmail = normalizeEmail(user.email);
  const snapshot = await getDocs(collection(db, "drivers"));

  return snapshot.docs.find((docSnapshot) => {
    const driver = docSnapshot.data();
    return driver.uid === user.uid || normalizeEmail(driver.email) === normalizedEmail;
  }) || null;
}

async function syncDriverProfile(user){
  const email = normalizeEmail(user.email);

  if(!email){
    return null;
  }

  const driverDoc = await findDriverDocByUser(user);

  if(!driverDoc){
    return null;
  }

  const driverData = driverDoc.data();
  const nextData = {};

  if(driverData.email !== email){
    nextData.email = email;
  }

  if(driverData.uid !== user.uid){
    nextData.uid = user.uid;
  }

  if(Object.keys(nextData).length){
    await updateDoc(driverDoc.ref, nextData);
  }

  return {
    id: driverDoc.id,
    ...driverData,
    ...nextData
  };
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
    const driverProfile = await syncDriverProfile(userCredential.user);

    if(!driverProfile){
      setError("No driver profile was found for this account. Please contact admin.");
      return;
    }

    localStorage.setItem("driverUid", userCredential.user.uid);
    window.location.href = "driver.html";
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
