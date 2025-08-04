// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsOP0gddOxoTsfs1m9EQMM9InGBN_Bcq8",
  authDomain: "agrosure-e5a7c.firebaseapp.com",
  projectId: "agrosure-e5a7c",
  storageBucket: "agrosure-e5a7c.firebasestorage.app",
  messagingSenderId: "877020219547",
  appId: "1:877020219547:web:7d9d87b5a890d86c60de3e",
  measurementId: "G-CRXMF47CMF"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();