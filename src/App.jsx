import { useState, useCallback, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import QRCode from "./QRCode";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Space+Mono:wght@400;700&display=swap');`;

const INITIAL_MENU = [
  { id: 1, name: "滷肉飯", price: 40, category: "主食", available: true, emoji: "🍚" },
  { id: 2, name: "虱目魚粥", price: 65, category: "主食", available: true, emoji: "🐟" },
  { id: 3, name: "肉燥麵", price: 50, category: "主食", available: true, emoji: "🍜" },
  { id: 4, name: "油豆腐", price: 20, category: "小菜", available: true, emoji: "🟡" },
  { id: 5, name: "滷蛋", price: 15, category: "小菜", available: true, emoji: "🥚" },
  { id: 6, name: "燙青菜", price: 25, category: "小菜", available: true, emoji: "🥬" },
  { id: 7, name: "魚丸湯", price: 30, category: "湯品", available: true, emoji: "🍲" },
  { id: 8, name: "豆腐味噌湯", price: 25, category: "湯品", available: false, emoji: "🍵" },
  { id: 9, name: "紅茶", price: 20, category: "飲料", available: true, emoji: "🧋" },
];

const CATEGORIES = ["全部", "主食", "小菜", "湯品", "飲料"];

const styles = `
  ${FONT}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #FDF6EC; --surface: #FFFFFF; --red: #D0421B; --red-dark: #A83214;
    --gold: #C8861A; --ink: #1A1209; --ink-2: #4A3820; --ink-3: #8C7355;
    --border: #E8D9C0; --green: #2D7A4F; --radius: 12px;
    --shadow: 0 2px 12px rgba(26,18,9,0.10);
  }
  body { font-family: 'Noto Sans TC', sans-serif; background: var(--bg); color: var(--ink); }
  .app { min-height: 100vh; max-width: 480px; margin: 0 auto; position: relative; }
  .nav { position: sticky; top: 0; z-index: 100; background: var(--red); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; }
  .nav-title { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 2px; }
  .nav-badge { background: var(--gold); color: #fff; border-radius: 99px; padding: 4px 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform .15s; }
  .nav-badge:hover { transform: scale(1.05); }
  .tabs { display: flex; border-bottom: 2px solid var(--border); background: var(--surface); overflow-x: auto; }
  .tab { flex: 1; padding: 12px 4px; text-align: center; font-size: 12px; font-weight: 700; color: var(--ink-3); cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all .2s; white-space: nowrap; }
  .tab.active { color: var(--red); border-bottom-color: var(--red); }
  .cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding: 14px 16px; scrollbar-width: none; }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-btn { flex-shrink: 0; padding: 6px 16px; border-radius: 99px; border: 1.5px solid var(--border); background: var(--surface); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
  .cat-btn.active { background: var(--red); border-color: var(--red); color: #fff; }
  .menu-list { padding: 0 16px 120px; display: flex; flex-direction: column; gap: 10px; }
  .menu-item { background: var(--surface); border-radius: var(--radius); border: 1.5px solid var(--border); padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow); transition: transform .15s; }
  .menu-item.unavail { opacity: 0.45; }
  .menu-emoji { font-size: 32px; line-height: 1; width: 42px; text-align: center; }
  .menu-info { flex: 1; }
  .menu-name { font-size: 16px; font-weight: 700; }
  .menu-price { font-size: 13px; color: var(--red); font-weight: 700; font-family: 'Space Mono', monospace; margin-top: 2px; }
  .menu-tag { display: inline-block; font-size: 11px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; color: var(--ink-3); margin-top: 4px; }
  .qty-ctrl { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--red); background: transparent; color: var(--red); font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; line-height: 1; }
  .qty-btn:hover { background: var(--red); color: #fff; }
  .qty-num { font-size: 16px; font-weight: 700; font-family: 'Space Mono', monospace; width: 20px; text-align: center; }
  .cart-overlay { position: fixed; inset: 0; background: rgba(26,18,9,0.5); z-index: 200; display: flex; align-items: flex-end; animation: fadeIn .2s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .cart-drawer { background: var(--surface); border-radius: 20px 20px 0 0; width: 100%; max-height: 80vh; overflow-y: auto; padding: 0 20px 32px; animation: slideUp .25s cubic-bezier(.4,0,.2,1); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .drawer-handle { width: 40px; height: 4px; background: var(--border); border-radius: 99px; margin: 12px auto 20px; }
  .drawer-title { font-size: 18px; font-weight: 900; margin-bottom: 16px; }
  .cart-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .cart-row-name { font-size: 15px; font-weight: 500; }
  .cart-row-price { font-size: 14px; font-family: 'Space Mono', monospace; color: var(--ink-2); }
  .cart-total { display: flex; justify-content: space-between; padding: 14px 0 4px; font-weight: 900; font-size: 18px; }
  .cart-total span:last-child { color: var(--red); font-family: 'Space Mono', monospace; }
  .submit-btn { width: 100%; margin-top: 16px; padding: 16px; background: var(--red); color: #fff; border: none; border-radius: var(--radius); font-size: 17px; font-weight: 900; cursor: pointer; letter-spacing: 1px; transition: background .15s; }
  .submit-btn:hover { background: var(--red-dark); }
  .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; padding: 40px 24px; text-align: center; }
  .success-icon { font-size: 56px; line-height: 1; animation: pop .4s cubic-bezier(.4,0,.2,1); display: block; }
  @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  .success-num { font-size: 48px; font-weight: 900; font-family: 'Space Mono', monospace; color: var(--red); line-height: 1.2; display: block; }
  .success-label { font-size: 15px; color: var(--ink-3); display: block; }
  .back-btn { margin-top: 16px; padding: 12px 32px; border: 2px solid var(--red); background: transparent; color: var(--red); border-radius: var(--radius); font-size: 15px; font-weight: 700; cursor: pointer; }
  .admin-wrap { padding: 0 0 80px; }
  .admin-header { background: var(--ink); color: #fff; padding: 20px 20px 16px; }
  .admin-header h2 { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
  .admin-header p { font-size: 12px; color: var(--ink-3); margin-top: 4px; font-family: 'Space Mono', monospace; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 14px 16px; }
  .stat-card { background: var(--surface); border-radius: var(--radius); border: 1.5px solid var(--border); padding: 12px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 900; font-family: 'Space Mono', monospace; color: var(--red); }
  .stat-label { font-size: 11px; color: var(--ink-3); margin-top: 2px; }
  .section-title { font-size: 13px; font-weight: 700; color: var(--ink-3); padding: 8px 16px 4px; text-transform: uppercase; letter-spacing: 1px; }
  .order-card { background: var(--surface); margin: 8px 16px; border-radius: var(--radius); border: 1.5px solid var(--border); overflow: hidden; box-shadow: var(--shadow); }
  .order-card-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg); border-bottom: 1px solid var(--border); }
  .order-num { font-size: 16px; font-weight: 900; font-family: 'Space Mono', monospace; }
  .order-time { font-size: 12px; color: var(--ink-3); }
  .order-status { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
  .status-pending { background: #FFF3CD; color: #856404; }
  .status-done { background: #D1FAE5; color: #065F46; }
  .order-items { padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 14px; }
  .order-item-row span:last-child { color: var(--ink-3); font-family: 'Space Mono', monospace; }
  .order-card-foot { padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); }
  .order-total { font-weight: 900; font-size: 15px; }
  .order-total span { color: var(--red); font-family: 'Space Mono', monospace; }
  .done-btn { padding: 7px 18px; background: var(--green); color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .15s; }
  .done-btn:hover { opacity: 0.85; }
  .done-label { font-size: 13px; color: var(--green); font-weight: 700; }
  .menu-admin-item { background: var(--surface); margin: 8px 16px; border-radius: var(--radius); border: 1.5px solid var(--border); padding: 12px 16px; display: flex; align-items: center; gap: 10px; }
  .menu-admin-info { flex: 1; }
  .menu-admin-name { font-size: 15px; font-weight: 700; }
  .menu-admin-price { font-size: 13px; color: var(--ink-3); font-family: 'Space Mono', monospace; }
  .toggle { position: relative; width: 44px; height: 24px; }
  .toggle input { display: none; }
  .toggle-track { position: absolute; inset: 0; border-radius: 99px; background: var(--border); cursor: pointer; transition: background .2s; }
  .toggle input:checked + .toggle-track { background: var(--green); }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; pointer-events: none; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
  .toggle input:checked ~ .toggle-thumb { transform: translateX(20px); }
  .empty-state { text-align: center; padding: 48px 24px; color: var(--ink-3); }
  .empty-state p { font-size: 32px; margin-bottom: 8px; }
  .empty-state span { font-size: 14px; }
  .logout-btn { margin: 0 16px 16px; padding: 10px; width: calc(100% - 32px); background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 13px; font-weight: 700; color: var(--ink-3); cursor: pointer; }
  .logout-btn:hover { border-color: var(--red); color: var(--red); }
`;

export default function App() {
  const [view, setView] = useState("customer");
  const [menu] = useState(INITIAL_MENU);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [success, setSuccess] = useState(null);
  const [category, setCategory] = useState("全部");
  const [adminTab, setAdminTab] = useState("orders");
  const [adminAuth, setAdminAuth] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data(),
        time: doc.data().createdAt?.toDate() || new Date(),
      }));
      setOrders(data);
    });
    return () => unsubscribe();
  }, []);

  const addItem = useCallback((id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(c => {
      const n = { ...c };
      if (n[id] <= 1) delete n[id]; else n[id]--;
      return n;
    });
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id === Number(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const filteredMenu = category === "全部" ? menu : menu.filter(m => m.category === category);

  const submitOrder = async () => {
    if (cartCount === 0) return;
    const items = Object.entries(cart).map(([id, qty]) => {
      const item = menu.find(m => m.id === Number(id));
      return { id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty };
    });
    const docRef = await addDoc(collection(db, "orders"), {
      items,
      total: cartTotal,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setCart({});
    setCartOpen(false);
    setSuccess(docRef.id.slice(-4).toUpperCase());
  };

  const markDone = async (firestoreId) => {
    await updateDoc(doc(db, "orders", firestoreId), { status: "done" });
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminAuth(false);
    setView("customer");
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const doneOrders = orders.filter(o => o.status === "done");
  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const formatTime = (d) => d ? `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}` : "";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <nav className="nav">
          <span className="nav-title">{view === "customer" ? "🏮 阿嬤小吃" : "⚙️ 後台管理"}</span>
          <span className="nav-badge" onClick={() => setView(v => v === "customer" ? "admin" : "customer")}>
            {view === "customer" ? "後台" : "點餐"}
          </span>
        </nav>

        {view === "customer" && (
          <>
            {success ? (
              <div className="success-screen">
                <div className="success-icon">✅</div>
                <div className="success-num">#{success}</div>
                <div className="success-label">取餐號碼，請稍候</div>
                <button className="back-btn" onClick={() => setSuccess(null)}>繼續點餐</button>
              </div>
            ) : (
              <>
                <div className="cat-scroll">
                  {CATEGORIES.map(c => (
                    <button key={c} className={`cat-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
                <div className="menu-list">
                  {filteredMenu.map(item => (
                    <div key={item.id} className={`menu-item ${!item.available ? "unavail" : ""}`}>
                      <div className="menu-emoji">{item.emoji}</div>
                      <div className="menu-info">
                        <div className="menu-name">{item.name}</div>
                        <div className="menu-price">NT$ {item.price}</div>
                        <span className="menu-tag">{item.category}</span>
                        {!item.available && <span className="menu-tag" style={{marginLeft:4,borderColor:"#D0421B",color:"#D0421B"}}>售完</span>}
                      </div>
                      {item.available && (
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={() => removeItem(item.id)}>−</button>
                          <span className="qty-num">{cart[item.id] || 0}</span>
                          <button className="qty-btn" onClick={() => addItem(item.id)}>＋</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {cartCount > 0 && (
                  <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:150,width:"calc(100% - 32px)",maxWidth:448}}>
                    <button className="submit-btn" onClick={() => setCartOpen(true)}>
                      🛒 查看購物車 ({cartCount}) · NT$ {cartTotal}
                    </button>
                  </div>
                )}
                {cartOpen && (
                  <div className="cart-overlay" onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}>
                    <div className="cart-drawer">
                      <div className="drawer-handle"/>
                      <div className="drawer-title">確認訂單</div>
                      {Object.entries(cart).map(([id, qty]) => {
                        const item = menu.find(m => m.id === Number(id));
                        return (
                          <div key={id} className="cart-row">
                            <div className="cart-row-name">{item.emoji} {item.name} × {qty}</div>
                            <div className="cart-row-price">NT$ {item.price * qty}</div>
                          </div>
                        );
                      })}
                      <div className="cart-total">
                        <span>合計</span>
                        <span>NT$ {cartTotal}</span>
                      </div>
                      <button className="submit-btn" onClick={submitOrder}>送出訂單</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "admin" && (
          !adminAuth
            ? <AdminLogin onLogin={() => setAdminAuth(true)} />
            : <div className="admin-wrap">
                <div className="admin-header">
                  <h2>阿嬤小吃 後台</h2>
                  <p>今日 {new Date().toLocaleDateString("zh-TW")}</p>
                </div>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-num">{orders.length}</div>
                    <div className="stat-label">總訂單</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-num" style={{color:"var(--gold)"}}>{pendingOrders.length}</div>
                    <div className="stat-label">待處理</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-num">NT${todayRevenue}</div>
                    <div className="stat-label">今日營收</div>
                  </div>
                </div>
                <div className="tabs">
                  <div className={`tab ${adminTab === "orders" ? "active" : ""}`} onClick={() => setAdminTab("orders")}>
                    訂單 {pendingOrders.length > 0 && `(${pendingOrders.length})`}
                  </div>
                  <div className={`tab ${adminTab === "menu" ? "active" : ""}`} onClick={() => setAdminTab("menu")}>菜單管理</div>
                  <div className={`tab ${adminTab === "history" ? "active" : ""}`} onClick={() => setAdminTab("history")}>歷史</div>
                  <div className={`tab ${adminTab === "qrcode" ? "active" : ""}`} onClick={() => setAdminTab("qrcode")}>QR Code</div>
                </div>
                {adminTab === "orders" && (
                  <>
                    {pendingOrders.length === 0 ? (
                      <div className="empty-state"><p>☕</p><span>目前沒有待處理訂單</span></div>
                    ) : (
                      <>
                        <div className="section-title">待處理</div>
                        {pendingOrders.map(order => (
                          <div key={order.firestoreId} className="order-card">
                            <div className="order-card-head">
                              <span className="order-num">#{order.firestoreId?.slice(-4).toUpperCase()}</span>
                              <span className="order-time">{formatTime(order.time)}</span>
                              <span className="order-status status-pending">待處理</span>
                            </div>
                            <div className="order-items">
                              {order.items?.map(item => (
                                <div key={item.id} className="order-item-row">
                                  <span>{item.emoji} {item.name} × {item.qty}</span>
                                  <span>NT$ {item.price * item.qty}</span>
                                </div>
                              ))}
                            </div>
                            <div className="order-card-foot">
                              <div className="order-total">合計 <span>NT$ {order.total}</span></div>
                              <button className="done-btn" onClick={() => markDone(order.firestoreId)}>✓ 完成</button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
                {adminTab === "menu" && (
                  <>
                    <div className="section-title">菜單品項</div>
                    {menu.map(item => (
                      <div key={item.id} className="menu-admin-item">
                        <span style={{fontSize:24}}>{item.emoji}</span>
                        <div className="menu-admin-info">
                          <div className="menu-admin-name">{item.name}</div>
                          <div className="menu-admin-price">NT$ {item.price} · {item.category}</div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" checked={item.available} onChange={() => {}} />
                          <div className="toggle-track"/>
                          <div className="toggle-thumb"/>
                        </label>
                      </div>
                    ))}
                  </>
                )}
                {adminTab === "history" && (
                  <>
                    {doneOrders.length === 0 ? (
                      <div className="empty-state"><p>📋</p><span>還沒有完成的訂單</span></div>
                    ) : (
                      <>
                        <div className="section-title">已完成</div>
                        {doneOrders.map(order => (
                          <div key={order.firestoreId} className="order-card">
                            <div className="order-card-head">
                              <span className="order-num">#{order.firestoreId?.slice(-4).toUpperCase()}</span>
                              <span className="order-time">{formatTime(order.time)}</span>
                              <span className="order-status status-done">完成</span>
                            </div>
                            <div className="order-items">
                              {order.items?.map(item => (
                                <div key={item.id} className="order-item-row">
                                  <span>{item.emoji} {item.name} × {item.qty}</span>
                                  <span>NT$ {item.price * item.qty}</span>
                                </div>
                              ))}
                            </div>
                            <div className="order-card-foot">
                              <div className="order-total">合計 <span>NT$ {order.total}</span></div>
                              <span className="done-label">✓ 已完成</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
                {adminTab === "qrcode" && (
                  <div style={{padding:24,display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                    <div className="section-title" style={{alignSelf:"flex-start"}}>點餐QR Code</div>
                    <QRCode url="https://my-ordering-app.vercel.app" />
                    <div style={{fontSize:13,color:"#8C7355",textAlign:"center"}}>印出來貼在桌上，客人掃描即可點餐</div>
                  </div>
                )}
                <button className="logout-btn" onClick={handleLogout}>登出後台</button>
              </div>
        )}
      </div>
    </>
  );
}