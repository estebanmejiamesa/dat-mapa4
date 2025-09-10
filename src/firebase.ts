// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 🔹 Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBESJjCqj6xWFLZI6ZnF5P8UMv7gNZSdFU",
  authDomain: "veolia-e2b97.firebaseapp.com",
  projectId: "veolia-e2b97",
  storageBucket: "veolia-e2b97.firebasestorage.app",
  messagingSenderId: "178382545075",
  appId: "1:178382545075:web:3891ddeb029046d85c10c6",
};

// Inicializa Firebase una sola vez
const app = initializeApp(firebaseConfig);

// Exporta Firestore y Auth para usarlos en el resto de la app
export const db = getFirestore(app);
export const auth = getAuth(app);
