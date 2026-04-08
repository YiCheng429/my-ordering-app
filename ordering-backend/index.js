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

// 把管理員密碼加密存起來
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

// 登入路由
app.post("/api/login", (req, res) => {
  const { password } = req.body;           // 接收前端傳來的密碼

  const isMatch = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH); // 比對密碼

  if (!isMatch) {
    return res.status(401).json({ message: "密碼錯誤" }); // 錯誤回傳401
  }

  const token = jwt.sign(               // 密碼正確，產生token
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }                 // token 8小時後過期
  );

  res.json({ token });                  // 把token回傳給前端
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