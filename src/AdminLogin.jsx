import { useState } from "react";
import { auth } from "./firebase";
import { signInAnonymously } from "firebase/auth";

const API = "https://my-ordering-app-production.up.railway.app";

export default function AdminLogin({ shopId, shopName, onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 2500);
  };

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

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center",
      height:"100vh",
      overflow:"hidden",
      padding:32, background:"#F7F3EC",
    }}>
      <div style={{textAlign:"center", marginBottom:8}}>
        <div style={{fontSize:13, color:"#BBA98A", letterSpacing:"3px", fontFamily:"'Noto Sans TC',sans-serif", marginBottom:10}}>
          後台登入
        </div>
        <div style={{fontSize:24, fontWeight:700, color:"#1a1209", fontFamily:"'Noto Serif TC',serif", letterSpacing:"4px"}}>
          {shopName || shopId}
        </div>
      </div>

      <div style={{width:"100%", maxWidth:300, display:"flex", flexDirection:"column", gap:12}}>
        <input
          type="password"
          placeholder="密碼"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            padding:"12px 16px",
            border:`1px solid ${error ? "#8B4513" : "#E8DABC"}`,
            borderRadius:0,
            fontSize:14,
            width:"100%",
            outline:"none",
            background:"#FDFAF5",
            color:"#1a1209",
            fontFamily:"'Noto Sans TC',sans-serif",
            letterSpacing:"1px",
            boxSizing:"border-box",
          }}
        />
        {error && (
          <div style={{fontSize:12, color:"#8B4513", letterSpacing:"1px", fontFamily:"'Noto Sans TC',sans-serif"}}>
            {error}
          </div>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding:"13px",
            background: loading ? "#BBA98A" : "#1a1209",
            color:"#F7F3EC",
            border:"none",
            borderRadius:0,
            fontSize:12,
            fontWeight:500,
            cursor: loading ? "not-allowed" : "pointer",
            width:"100%",
            letterSpacing:"3px",
            fontFamily:"'Noto Sans TC',sans-serif",
          }}
        >
          {loading ? "驗證中" : "登　入"}
        </button>
      </div>
    </div>
  );
}