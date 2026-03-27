const express = require("express");        // 載入express框架
const cors = require("cors");              // 載入cors
const dotenv = require("dotenv");          // 載入環境變數
const bcrypt = require("bcryptjs");        // 載入加密工具
const jwt = require("jsonwebtoken");       // 載入token工具

dotenv.config();                           // 讀取.env檔案

const app = express();                     // 建立server
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

// 啟動server
app.listen(process.env.PORT, () => {
  console.log(`Server跑在 port ${process.env.PORT}`);
});