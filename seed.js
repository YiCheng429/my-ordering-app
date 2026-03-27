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
  // 主食
  { name: "滷肉飯（小）", price: 35, category: "主食", available: true },
  { name: "滷肉飯（大）", price: 45, category: "主食", available: true },
  { name: "乾麵", price: 45, category: "主食", available: true },
  { name: "陽春麵（乾）小", price: 45, category: "主食", available: true },
  { name: "陽春麵（乾）大", price: 65, category: "主食", available: true },
  { name: "陽春麵（湯）小", price: 45, category: "主食", available: true },
  { name: "陽春麵（湯）大", price: 65, category: "主食", available: true },
  { name: "冬粉（乾）小", price: 45, category: "主食", available: true },
  { name: "冬粉（乾）大", price: 65, category: "主食", available: true },
  { name: "冬粉（湯）小", price: 45, category: "主食", available: true },
  { name: "冬粉（湯）大", price: 65, category: "主食", available: true },
  { name: "切仔麵（乾）小", price: 45, category: "主食", available: true },
  { name: "切仔麵（乾）大", price: 65, category: "主食", available: true },
  { name: "切仔麵（湯）小", price: 45, category: "主食", available: true },
  { name: "切仔麵（湯）大", price: 65, category: "主食", available: true },
  { name: "板條（乾）小", price: 45, category: "主食", available: true },
  { name: "板條（乾）大", price: 65, category: "主食", available: true },
  { name: "板條（湯）小", price: 45, category: "主食", available: true },
  { name: "板條（湯）大", price: 65, category: "主食", available: true },
  { name: "切仔米粉（乾）小", price: 45, category: "主食", available: true },
  { name: "切仔米粉（乾）大", price: 65, category: "主食", available: true },
  { name: "切仔米粉（湯）小", price: 45, category: "主食", available: true },
  { name: "切仔米粉（湯）大", price: 65, category: "主食", available: true },
  { name: "餡餃麵（乾）小", price: 65, category: "主食", available: true },
  { name: "餡餃麵（乾）大", price: 85, category: "主食", available: true },
  { name: "餡餃麵（湯）小", price: 65, category: "主食", available: true },
  { name: "餡餃麵（湯）大", price: 85, category: "主食", available: true },
  { name: "貢丸麵（乾）小", price: 65, category: "主食", available: true },
  { name: "貢丸麵（乾）大", price: 85, category: "主食", available: true },
  { name: "貢丸麵（湯）小", price: 65, category: "主食", available: true },
  { name: "貢丸麵（湯）大", price: 85, category: "主食", available: true },
  { name: "紅燒排骨麵（小）", price: 85, category: "主食", available: true },
  { name: "紅燒排骨麵（大）", price: 105, category: "主食", available: true },
  { name: "蛤蠣麵（小）", price: 85, category: "主食", available: true },
  { name: "蛤蠣麵（大）", price: 105, category: "主食", available: true },
  { name: "豬肝麵（小）", price: 85, category: "主食", available: true },
  { name: "豬肝麵（大）", price: 105, category: "主食", available: true },
  { name: "招牌私房麵", price: 150, category: "主食", available: true },
  // 湯類
  { name: "貢丸湯", price: 35, category: "湯品", available: true },
  { name: "餡餃湯", price: 45, category: "湯品", available: true },
  { name: "豬肝湯", price: 50, category: "湯品", available: true },
  { name: "蛤蠣湯", price: 55, category: "湯品", available: true },
  { name: "軟骨蘿蔔湯", price: 70, category: "湯品", available: true },
  // 小菜
  { name: "燙青菜", price: 40, category: "小菜", available: true },
  { name: "燙豬肝", price: 50, category: "小菜", available: true },
  { name: "蒜泥白肉", price: 70, category: "小菜", available: true },
  { name: "松板肉", price: 70, category: "小菜", available: true },
  { name: "涼拌川耳", price: 35, category: "小菜", available: true },
  { name: "滷蛋", price: 15, category: "小菜", available: true },
  { name: "豆干", price: 20, category: "小菜", available: true },
  { name: "海帶", price: 20, category: "小菜", available: true },
  { name: "甜不辣", price: 20, category: "小菜", available: true },
  { name: "素雞", price: 20, category: "小菜", available: true },
  { name: "百頁豆腐", price: 20, category: "小菜", available: true },
  { name: "米血糕", price: 25, category: "小菜", available: true },
  { name: "糯米腸", price: 25, category: "小菜", available: true },
  { name: "貢丸", price: 25, category: "小菜", available: true },
  { name: "豆皮", price: 25, category: "小菜", available: true },
  { name: "素肚", price: 25, category: "小菜", available: true },
  { name: "蘿蔔", price: 25, category: "小菜", available: true },
  { name: "花干", price: 30, category: "小菜", available: true },
  { name: "素胗", price: 30, category: "小菜", available: true },
  { name: "麵腸", price: 30, category: "小菜", available: true },
  { name: "雞翅", price: 30, category: "小菜", available: true },
  { name: "雞腳", price: 30, category: "小菜", available: true },
  { name: "鴨胗", price: 35, category: "小菜", available: true },
  { name: "杏鮑菇", price: 40, category: "小菜", available: true },
  { name: "豬頭皮", price: 45, category: "小菜", available: true },
  { name: "豬耳朵", price: 60, category: "小菜", available: true },
  { name: "豬舌頭", price: 60, category: "小菜", available: true },
  { name: "肝連", price: 65, category: "小菜", available: true },
  { name: "大腸頭", price: 85, category: "小菜", available: true },
];

async function seed() {
  for (const item of menu) {
    await addDoc(collection(db, "shops", "yangchun", "menu"), item);
    console.log("新增：", item.name);
  }
  console.log("完成！");
}

seed();