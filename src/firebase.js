import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJUHd4t-RgruWWyNVy8kfKx6h-8PPk8uc",
  authDomain: "ordering-app-12077.firebaseapp.com",
  projectId: "ordering-app-12077",
  storageBucket: "ordering-app-12077.firebasestorage.app",
  messagingSenderId: "892960955491",
  appId: "1:892960955491:web:f2b3beb68bfbacb73d2c56"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);