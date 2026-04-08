import { useState } from "react";
import { auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";

const API = "https://my-ordering-app-production.up.railway.app";

const inputStyle = (error) => ({
  padding: "12px 16px", borderRadius: 10,
  border: `2px solid ${error ? "#D0421B" : "#E8D9C0"}`,
  fontSize: 16, width: "100%", maxWidth: 320,
  outline: "none", fontFamily: "Noto Sans TC, sans-serif",
  background: "#fff", boxSizing: "border-box",
});

const btnStyle = (loading, color = "#D0421B") => ({
  padding: "12px 32px",
  background: loading ? "#ccc" : color,
  color: "#fff", border: "none", borderRadius: 10,
  fontSize: 16, fontWeight: 900,
  cursor: loading ? "not-allowed" : "pointer",
  width: "100%", maxWidth: 320,
});

export default function AdminLogin({ shopId, onLogin }) {
  const [mode, setMode] = useState("login");   // "login" | "register"
  const [pw, setPw] = useState("");
  const [regShopId, setRegShopId] = useState("");
  const [regName, setRegName] = useState("");
  const [regPw, setRegPw] = useState("");
  const [regPw2, setRegPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 2500);
  };

  // 登入
  const handleLogin = async () => {
    if (!pw) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        await signInAnonymously(auth);
        onLogin();
      } else {
        showError(data.message || "密碼錯誤");
      }
    } catch {
      showError("無法連線到伺服器");
    }
    setLoading(false);
  };

  // 註冊
  const handleRegister = async () => {
    if (!regShopId || !regName || !regPw || !regPw2) {
      return showError("請填寫所有欄位");
    }
    if (regPw !== regPw2) {
      return showError("兩次密碼不一致");
    }
    if (regPw.length < 6) {
      return showError("密碼至少6個字元");
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: regShopId, name: regName, password: regPw }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`註冊成功！\n你的點餐網址：\nhttps://my-ordering-app.vercel.app/shop/${regShopId}\n\n請用剛才設定的密碼登入後台`);
        // 跳回登入頁，讓他用新帳號登入
        window.location.href = `https://my-ordering-app.vercel.app/shop/${regShopId}`;
      } else {
        showError(data.message || "註冊失敗");
      }
    } catch {
      showError("無法連線到伺服器");
    }
    setLoading(false);
  };

  const wrap = {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", gap: 14,
    padding: 24, background: "#FDF6EC",
  };

  if (mode === "register") {
    return (
      <div style={wrap}>
        <div style={{fontSize: 40}}>🏮</div>
        <div style={{fontSize: 20, fontWeight: 900, fontFamily: "Noto Sans TC"}}>建立新店家</div>

        <input
          placeholder="店家名稱（例如：古早味陽春麵）"
          value={regName}
          onChange={e => setRegName(e.target.value)}
          style={inputStyle(false)}
        />
        <div style={{width: "100%", maxWidth: 320}}>
          <input
            placeholder="網址ID（英文小寫、數字、-）"
            value={regShopId}
            onChange={e => setRegShopId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            style={inputStyle(false)}
          />
          {regShopId && (
            <div style={{fontSize: 12, color: "#8C7355", marginTop: 4, paddingLeft: 4}}>
              點餐網址：my-ordering-app.vercel.app/shop/{regShopId}
            </div>
          )}
        </div>
        <input
          type="password"
          placeholder="設定密碼（至少6位）"
          value={regPw}
          onChange={e => setRegPw(e.target.value)}
          style={inputStyle(false)}
        />
        <input
          type="password"
          placeholder="再輸入一次密碼"
          value={regPw2}
          onChange={e => setRegPw2(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleRegister()}
          style={inputStyle(error && regPw !== regPw2)}
        />
        {error && <div style={{color: "#D0421B", fontSize: 13, fontWeight: 700}}>{error}</div>}
        <button onClick={handleRegister} disabled={loading} style={btnStyle(loading)}>
          {loading ? "建立中..." : "建立店家"}
        </button>
        <button
          onClick={() => setMode("login")}
          style={{background: "none", border: "none", color: "#8C7355", fontSize: 13, cursor: "pointer"}}
        >
          已有帳號？回到登入
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{fontSize: 48}}>🔐</div>
      <div style={{fontSize: 20, fontWeight: 900, fontFamily: "Noto Sans TC"}}>後台登入</div>
      <input
        type="password"
        placeholder="輸入密碼"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleLogin()}
        style={inputStyle(!!error)}
      />
      {error && <div style={{color: "#D0421B", fontSize: 13, fontWeight: 700}}>{error}</div>}
      <button onClick={handleLogin} disabled={loading} style={btnStyle(loading)}>
        {loading ? "驗證中..." : "登入"}
      </button>
    </div>
  );
}