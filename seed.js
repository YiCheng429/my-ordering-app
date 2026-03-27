import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJUHd4t-RgruWWyNVy8kfKx6h-8PPk8uc",
  authDomain: "ordering-app-12077.firebaseapp.com",
  projectId: "ordering-app-12077",
  storageBucket: "ordering-app-12077.firebasestorage.app",
  messagingSenderId: "892960955491",
  appId: "1:892960955491:web:f2b3beb68bfbacb73d2c56"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const menu = [
  { name: "滷肉飯", price: 40, category: "主食", available: true },
  { name: "陽春麵（乾）", price: 45, category: "主食", available: true },
  { name: "陽春麵（湯）", price: 45, category: "主食", available: true },
];

async function seed() {
  for (const item of menu) {
    await addDoc(collection(db, "shops", "yangchun", "menu"), item);
    console.log("新增：", item.name);
  }
  console.log("完成！");
}

seed();