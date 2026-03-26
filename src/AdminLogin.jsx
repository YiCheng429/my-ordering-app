import { useState } from "react";

export default function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pw) return;
    setLoading(true);                          // 顯示載入中

    try {
        const res = await fetch("https://my-ordering-app-production.up.railway.app/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }) // 把密碼包成JSON傳過去
      });

      const data = await res.json();           // 接收後端回傳的資料

      if (res.ok) {
        localStorage.setItem("admin_token", data.token); // 把token存在瀏覽器
        onLogin();                             // 通知App.jsx登入成功
      } else {
        setError(data.message || "密碼錯誤");
        setTimeout(() => setError(""), 1500);
      }
    } catch (e) {
      setError("無法連線到伺服器");
      setTimeout(() => setError(""), 2000);
    }

    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:16,padding:24,background:"#FDF6EC"}}>
      <div style={{fontSize:48}}>🔐</div>
      <div style={{fontSize:20,fontWeight:900,fontFamily:"Noto Sans TC"}}>後台登入</div>
      <input
        type="password"
        placeholder="輸入密碼"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleLogin()}
        style={{padding:"12px 16px",borderRadius:10,border:`2px solid ${error ? "#D0421B" : "#E8D9C0"}`,fontSize:16,width:"100%",maxWidth:280,outline:"none"}}
      />
      {error && <div style={{color:"#D0421B",fontSize:13,fontWeight:700}}>{error}</div>}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{padding:"12px 32px",background: loading ? "#ccc" : "#D0421B",color:"#fff",border:"none",borderRadius:10,fontSize:16,fontWeight:900,cursor: loading ? "not-allowed" : "pointer",width:"100%",maxWidth:280}}
      >
        {loading ? "驗證中..." : "登入"}
      </button>
    </div>
  );
}