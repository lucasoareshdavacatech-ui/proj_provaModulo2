import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDIrhuGOCAP8_5Pvm_gjdDgzQvxTc0-mB0",
  authDomain: "provamodulo2-c1097.firebaseapp.com",
  projectId: "provamodulo2-c1097",
  storageBucket: "provamodulo2-c1097.firebasestorage.app",
  messagingSenderId: "171776204858",
  appId: "1:171776204858:web:92e20665838ef7d310d503"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, onSnapshot };  