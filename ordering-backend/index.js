const express = require("express");        // 載入express框架
const cors = require("cors");              // 載入cors
const dotenv = require("dotenv");          // 載入環境變數
const bcrypt = require("bcryptjs");        // 載入加密工具
const jwt = require("jsonwebtoken");       // 載入token工具
const admin = require("firebase-admin");   // 載入 Firebase Admin SDK

dotenv.config();                           // 讀取.env檔案

// 初始化 Firebase Admin（用 service account JSON，存在環境變數）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}
const db = admin.firestore();

const app = express();                     // 建立server

// Railway / Vercel 前面有 proxy，要加這行才能拿到真實 IP
app.set("trust proxy", 1);

app.use(cors({
  origin: [
    "https://my-ordering-app.vercel.app",
    "http://localhost:5173"
  ]
}));
app.use(express.json());                   // 允許接收JSON格式資料

// 為既有店家設定或更新密碼（需要舊密碼或是第一次設定）
app.post("/api/set-password/:shopId", async (req, res) => {
  const { shopId } = req.params;
  const { password, masterKey } = req.body;

  // 用 master key 保護，只有你知道
  if (masterKey !== process.env.MASTER_KEY) {
    return res.status(403).json({ message: "無權限" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "密碼至少6個字元" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  await db.collection("shops").doc(shopId).update({ passwordHash });
  res.json({ success: true });
});

// 註冊新店家（需要 masterKey，只有你能建立）
app.post("/api/register", async (req, res) => {
  const { shopId, name, password, masterKey } = req.body;

  // 驗證 masterKey
  if (masterKey !== process.env.MASTER_KEY) {
    return res.status(403).json({ message: "無權限" });
  }

  // 驗證欄位
  if (!shopId || !name || !password) {
    return res.status(400).json({ message: "請填寫所有欄位" });
  }

  // shopId 只允許英文、數字、dash
  if (!/^[a-z0-9-]+$/.test(shopId)) {
    return res.status(400).json({ message: "網址ID只能使用小寫英文、數字、連字號" });
  }

  // 檢查 shopId 是否已被使用
  const shopRef = db.collection("shops").doc(shopId);
  const existing = await shopRef.get();
  if (existing.exists) {
    return res.status(409).json({ message: "此網址ID已被使用，請換一個" });
  }

  // 加密密碼，建立店家文件
  const passwordHash = bcrypt.hashSync(password, 10);
  await shopRef.set({
    name,
    passwordHash,
    categories: ["主食", "小菜", "湯品", "飲料"],
    fontFamily: "Noto+Sans+TC",
    tableCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.json({ success: true, shopId });
});

// 每家店獨立登入
app.post("/api/login/:shopId", async (req, res) => {
  const { shopId } = req.params;
  const { password } = req.body;

  // 從 Firestore 拿這家店的密碼 hash
  const shopRef = db.collection("shops").doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    return res.status(404).json({ message: "找不到此店家" });
  }

  const { passwordHash } = shopDoc.data();
  if (!passwordHash) {
    return res.status(500).json({ message: "此店家尚未設定密碼" });
  }

  const isMatch = bcrypt.compareSync(password, passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "密碼錯誤" });
  }

  const token = jwt.sign(
    { role: "admin", shopId },             // token 裡帶 shopId
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
});

// 驗證token的middleware
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;          // 讀取前端帶來的token
  if (!auth) return res.status(403).json({ message: "沒有token" });

  const token = auth.split(" ")[1];                // 取出token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "token無效" });
    req.user = decoded;
    next();                                        // 驗證通過，繼續執行
  });
}

// 測試用的受保護路由
app.get("/api/admin/test", verifyToken, (req, res) => {
  res.json({ message: "後台驗證成功" });
});

// 送單路由：前端改打這裡，後端抓 IP 後寫進 Firestore
app.post("/api/order/:shopId", async (req, res) => {
  const { shopId } = req.params;
  const { items, total, note, orderNumber, tableNumber } = req.body;

  // 驗證必要欄位
  if (!shopId || !items || !total) {
    return res.status(400).json({ message: "缺少必要欄位" });
  }

  // 抓真實 IP（trust proxy 已設定，Railway 後面的真實 IP）
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  try {
    await db.collection("shops").doc(shopId).collection("orders").add({
      items,
      total,
      note: note || "",
      orderNumber,
      tableNumber: tableNumber || null,
      status: "pending",
      clientIp,                            // 記錄 IP
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error("送單失敗:", err);
    res.status(500).json({ message: "送單失敗，請稍後再試" });
  }
});

// 啟動server
app.listen(process.env.PORT, () => {
  console.log(`Server跑在 port ${process.env.PORT}`);
});