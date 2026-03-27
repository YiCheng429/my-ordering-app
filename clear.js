import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function clear() {
  const snapshot = await getDocs(collection(db, "shops", "yangchun", "menu"));
  for (const item of snapshot.docs) {
    await deleteDoc(doc(db, "shops", "yangchun", "menu", item.id));
    console.log("刪除：", item.data().name);
  } 
  console.log("清除完成！");
}

clear();