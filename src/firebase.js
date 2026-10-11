import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Paste your Firebase Config keys here
const firebaseConfig = {
  apiKey: "AIzaSyDwMSt2rBdrx8i2ELscCJhSvN11ZNPr0xg",
  authDomain: "gugan-homemade-cakes.firebaseapp.com",
  projectId: "gugan-homemade-cakes",
  storageBucket: "gugan-homemade-cakes.firebasestorage.app",
  messagingSenderId: "298911164261",
  appId: "1:298911164261:web:c39dc36774ec33f7b7238c",
  measurementId: "G-542MQSR6H6"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);