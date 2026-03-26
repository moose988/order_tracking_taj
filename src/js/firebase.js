// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG6B6--bQNuz3b8fv_Z2w12URjWhH8tfA",
  authDomain: "taj-almalaki-orders.firebaseapp.com",
  projectId: "taj-almalaki-orders",
  storageBucket: "taj-almalaki-orders.firebasestorage.app",
  messagingSenderId: "780463484497",
  appId: "1:780463484497:web:a84ceb7d85d6fbb02d9270",
  measurementId: "G-SS5W1K2LQ7"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

/* IMPORTANT: force the default Firestore database */
const db = getFirestore(app, "(default)");

/* Initialize authentication */
const auth = getAuth(app);
const storage = getStorage(app);

/* Export services */
export { db, auth, storage };
