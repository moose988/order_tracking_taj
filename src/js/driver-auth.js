import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
  console.debug("[driver-auth] resolving driver profile", {
    uid: user?.uid || "",
    email: normalizedEmail
  });

  const uidDocRef = doc(db, "drivers", user.uid);
  const uidDocSnapshot = await getDoc(uidDocRef);

  console.debug("[driver-auth] driver doc by document ID", {
    uid: user?.uid || "",
    exists: uidDocSnapshot.exists()
  });

  if(uidDocSnapshot.exists()){
    return uidDocSnapshot;
  }

  const uidQuerySnapshot = await getDocs(
    query(collection(db, "drivers"), where("uid", "==", user.uid))
  );

  console.debug("[driver-auth] driver fallback by uid field", {
    uid: user?.uid || "",
    found: !uidQuerySnapshot.empty
  });

  if(!uidQuerySnapshot.empty){
    return uidQuerySnapshot.docs[0];
  }

  if(!normalizedEmail){
    console.debug("[driver-auth] driver fallback by email skipped", {
      reason: "missing-email"
    });
    return null;
  }

  const emailQuerySnapshot = await getDocs(
    query(collection(db, "drivers"), where("email", "==", normalizedEmail))
  );

  console.debug("[driver-auth] driver fallback by email", {
    email: normalizedEmail,
    found: !emailQuerySnapshot.empty
  });

  return emailQuerySnapshot.empty ? null : emailQuerySnapshot.docs[0];
}

async function syncDriverProfile(user){
  const email = normalizeEmail(user.email);
  const driverDoc = await findDriverDocByUser(user);

  if(!driverDoc){
    console.debug("[driver-auth] no driver profile found", {
      uid: user?.uid || "",
      email
    });
    return null;
  }

  const driverData = driverDoc.data();
  const nextData = {};

  if(email && driverData.email !== email){
    nextData.email = email;
  }

  if(driverData.uid !== user.uid){
    nextData.uid = user.uid;
  }

  if(Object.keys(nextData).length){
    await updateDoc(driverDoc.ref, nextData);
    console.debug("[driver-auth] driver profile synced", {
      driverDocId: driverDoc.id,
      updates: nextData
    });
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
      console.debug("[driver-auth] login rejected", {
        reason: "missing-driver-profile",
        uid: userCredential.user?.uid || "",
        email: normalizeEmail(userCredential.user?.email)
      });
      await signOut(auth);
      setError("No driver profile was found for this account. Please contact admin.");
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
