import { useState, useCallback, useEffect } from "react";
import AdminLogin from "./AdminLogin";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import QRCode from "./QRCode";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');`;

const DEFAULT_CATEGORIES = ["主食", "小菜", "湯品", "飲料"];
const FONT_OPTIONS = [
  { label: "思源宋體（溫潤傳統）", value: "Noto+Serif+TC" },
  { label: "思源黑體（現代簡潔）", value: "Noto+Sans+TC" },
];

const styles = `
  ${FONT}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #F7F3EC;
    --surface: #F7F3EC;
    --paper: #FDFAF5;
    --ink: #1a1209;
    --ink-2: #4a3820;
    --ink-3: #BBA98A;
    --accent: #8B4513;
    --accent-dark: #6B3410;
    --border: #E8DABC;
    --border-light: #F0E8D4;
    --green: #3B6B3A;
    --green-dark: #2A4E29;
    --radius: 3px;
    --serif: 'Noto Serif TC', serif;
    --sans: 'Noto Sans TC', sans-serif;
  }
  html { overflow-x: hidden; width: 100%; }
  body { font-family: var(--serif); background: var(--bg); color: var(--ink); overflow-x: hidden; width: 100%; }
  .app { min-height: 100vh; width: 100%; max-width: 480px; margin: 0 auto; overflow-x: hidden; }

  .nav { position: sticky; top: 0; z-index: 100; background: var(--bg); padding: 18px 20px 14px; display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid var(--border); }
  .nav-title { font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: 2px; font-family: var(--serif); line-height: 1; }
  .nav-badge { font-size: 12px; color: var(--accent); cursor: pointer; letter-spacing: 1px; font-family: var(--sans); border: 1px solid var(--accent); padding: 4px 12px; border-radius: 2px; }
  .nav-badge:hover { background: var(--accent); color: #fff; }

  .tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg); overflow-x: auto; }
  .tab { flex: 1; padding: 12px 4px; text-align: center; font-size: 11px; font-weight: 500; color: var(--ink-3); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .2s; white-space: nowrap; font-family: var(--sans); letter-spacing: 1px; }
  .tab.active { color: var(--ink); border-bottom-color: var(--ink); }

  .cat-scroll { display: flex; gap: 0; overflow-x: auto; padding: 12px 12px; scrollbar-width: none; border-bottom: 1px solid var(--border-light); }
  .cat-scroll::-webkit-scrollbar { display: none; }
  .cat-btn { flex: 1; min-width: 0; padding: 8px 4px; border-radius: 0; border: 1px solid var(--border); background: transparent; font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; color: var(--ink-3); font-family: var(--sans); letter-spacing: 1px; margin-right: -1px; transition: all .15s; text-align: center; }
  .cat-btn:first-child { border-radius: 2px 0 0 2px; }
  .cat-btn:last-child { border-radius: 0 2px 2px 0; margin-right: 0; }
  .cat-btn.active { background: var(--ink); border-color: var(--ink); color: var(--bg); z-index: 1; position: relative; }

  .menu-list { padding: 0 20px 120px; }
  .menu-item { padding: 18px 0; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 14px; transition: opacity .15s; }
  .menu-item.unavail { opacity: 0.35; }
  .menu-emoji { font-size: 28px; line-height: 1; width: 36px; text-align: center; flex-shrink: 0; }
  .menu-info { flex: 1; }
  .menu-name { font-size: 16px; font-weight: 500; color: var(--ink); font-family: var(--serif); letter-spacing: 1px; }
  .menu-price { font-size: 12px; color: var(--accent); margin-top: 4px; font-family: var(--sans); letter-spacing: 0.5px; }
  .menu-tag { display: inline-block; font-size: 10px; border: 1px solid var(--border); padding: 1px 6px; color: var(--ink-3); margin-top: 5px; font-family: var(--sans); letter-spacing: 0.5px; border-radius: 0; }
  .qty-ctrl { display: flex; align-items: center; gap: 10px; }
  .qty-btn { width: 26px; height: 26px; border-radius: 2px; border: 1px solid var(--accent); background: transparent; color: var(--accent); font-size: 16px; font-weight: 400; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-family: var(--sans); }
  .qty-btn:hover { background: var(--accent); color: #fff; }
  .qty-num { font-size: 15px; font-weight: 500; font-family: var(--sans); width: 18px; text-align: center; color: var(--ink); }

  .cart-overlay { position: fixed; inset: 0; background: rgba(26,18,9,0.4); z-index: 200; display: flex; align-items: flex-end; animation: fadeIn .2s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .cart-drawer { background: var(--paper); border-radius: 0; width: 100%; max-height: 82vh; overflow-y: auto; padding: 0 20px 36px; animation: slideUp .25s cubic-bezier(.4,0,.2,1); border-top: 2px solid var(--ink); }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .drawer-handle { width: 32px; height: 2px; background: var(--border); margin: 14px auto 22px; }
  .drawer-title { font-size: 17px; font-weight: 700; margin-bottom: 16px; font-family: var(--serif); letter-spacing: 2px; color: var(--ink); }
  .cart-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border-light); }
  .cart-row-name { font-size: 14px; font-weight: 400; font-family: var(--serif); color: var(--ink); }
  .cart-row-price { font-size: 13px; color: var(--ink-2); font-family: var(--sans); }
  .cart-total { display: flex; justify-content: space-between; padding: 16px 0 4px; font-weight: 700; font-size: 17px; font-family: var(--serif); letter-spacing: 1px; }
  .cart-total span:last-child { color: var(--accent); font-family: var(--sans); }
  .submit-btn { width: 100%; margin-top: 18px; padding: 15px; background: var(--ink); color: var(--bg); border: none; border-radius: 2px; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 3px; transition: background .15s; font-family: var(--sans); }
  .submit-btn:hover { background: var(--ink-2); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 14px; padding: 40px 24px; text-align: center; }
  .success-icon { font-size: 48px; line-height: 1; animation: pop .4s cubic-bezier(.4,0,.2,1); display: block; }
  @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
  .success-num { font-size: 52px; font-weight: 700; font-family: var(--serif); color: var(--accent); line-height: 1.2; display: block; letter-spacing: 2px; }
  .success-label { font-size: 13px; color: var(--ink-3); display: block; letter-spacing: 2px; font-family: var(--sans); }
  .back-btn { margin-top: 16px; padding: 10px 28px; border: 1px solid var(--ink); background: transparent; color: var(--ink); border-radius: 2px; font-size: 12px; font-weight: 500; cursor: pointer; letter-spacing: 2px; font-family: var(--sans); }

  .admin-wrap { padding: 0 0 80px; }
  .admin-header { background: var(--ink); color: var(--bg); padding: 20px 20px 16px; }
  .admin-header h2 { font-size: 18px; font-weight: 500; letter-spacing: 3px; color: var(--bg); font-family: var(--serif); }
  .admin-header p { font-size: 11px; color: var(--ink-3); margin-top: 5px; font-family: var(--sans); letter-spacing: 1px; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; padding: 0; background: var(--border); border-bottom: 1px solid var(--border); }
  .stat-card { background: var(--paper); padding: 14px 12px; text-align: center; }
  .stat-num { font-size: 20px; font-weight: 700; color: var(--accent); font-family: var(--sans); }
  .stat-label { font-size: 10px; color: var(--ink-3); margin-top: 3px; letter-spacing: 1px; font-family: var(--sans); }

  .section-title { font-size: 10px; font-weight: 500; color: var(--ink-3); padding: 12px 20px 4px; letter-spacing: 2px; font-family: var(--sans); }
  .order-card { background: var(--paper); margin: 8px 16px; border-radius: 0; border: 1px solid var(--border); overflow: hidden; }
  .order-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; background: var(--bg); border-bottom: 1px solid var(--border-light); flex-wrap: wrap; }
  .order-num { font-size: 14px; font-weight: 700; font-family: var(--serif); letter-spacing: 1px; }
  .order-time { font-size: 11px; color: var(--ink-3); font-family: var(--sans); }
  .order-status { font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 0; letter-spacing: 1px; font-family: var(--sans); }
  .status-pending { background: #FEF9EC; color: #92650A; border: 1px solid #EDD99A; }
  .status-done { background: #EFF7EE; color: #2A5228; border: 1px solid #A8CCA7; }
  .order-items { padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 13px; font-family: var(--serif); }
  .order-item-row span:last-child { color: var(--ink-3); font-family: var(--sans); }
  .order-card-foot { padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); }
  .order-total { font-weight: 700; font-size: 14px; font-family: var(--serif); }
  .order-total span { color: var(--accent); font-family: var(--sans); }
  .done-btn { padding: 6px 14px; background: var(--green); color: #fff; border: none; border-radius: 2px; font-size: 12px; font-weight: 500; cursor: pointer; transition: opacity .15s; letter-spacing: 1px; font-family: var(--sans); }
  .done-btn:hover { background: var(--green-dark); }
  .done-label { font-size: 12px; color: var(--green); font-weight: 500; letter-spacing: 1px; font-family: var(--sans); }
  .order-note { padding: 4px 14px 8px; font-size: 12px; color: var(--ink-3); font-family: var(--sans); }

  .menu-admin-item { background: var(--paper); margin: 0 16px; border-bottom: 1px solid var(--border-light); padding: 12px 4px; display: flex; align-items: center; gap: 10px; }
  .menu-admin-info { flex: 1; }
  .menu-admin-name { font-size: 14px; font-weight: 500; font-family: var(--serif); letter-spacing: 0.5px; }
  .menu-admin-price { font-size: 12px; color: var(--ink-3); font-family: var(--sans); margin-top: 2px; }

  .toggle { position: relative; width: 40px; height: 22px; }
  .toggle input { display: none; }
  .toggle-track { position: absolute; inset: 0; border-radius: 99px; background: var(--border); cursor: pointer; transition: background .2s; }
  .toggle input:checked + .toggle-track { background: var(--green); }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .2s; pointer-events: none; }
  .toggle input:checked ~ .toggle-thumb { transform: translateX(18px); }

  .empty-state { text-align: center; padding: 48px 24px; color: var(--ink-3); }
  .empty-state p { font-size: 28px; margin-bottom: 10px; }
  .empty-state span { font-size: 13px; letter-spacing: 1px; font-family: var(--sans); }

  .logout-btn { margin: 16px 16px 0; padding: 10px; width: calc(100% - 32px); background: transparent; border: 1px solid var(--border); border-radius: 2px; font-size: 12px; font-weight: 500; color: var(--ink-3); cursor: pointer; letter-spacing: 1px; font-family: var(--sans); }
  .logout-btn:hover { border-color: var(--ink); color: var(--ink); }

  .no-shop { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 12px; color: var(--ink-3); text-align: center; padding: 24px; }
  .no-shop p { font-size: 40px; }
  .no-shop span { font-size: 14px; letter-spacing: 1px; font-family: var(--sans); }

  .note-input { width: 100%; padding: 12px; border-radius: 0; border: 1px solid var(--border); font-size: 14px; font-family: var(--serif); resize: none; height: 80px; margin-top: 10px; outline: none; box-sizing: border-box; background: var(--paper); color: var(--ink); }
  .note-input:focus { border-color: var(--ink); }

  .add-item-form { margin: 8px 16px; background: var(--paper); border-radius: 0; border: 1px solid var(--border); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .add-item-form input, .add-item-form select { padding: 9px 12px; border-radius: 0; border: 1px solid var(--border); font-size: 13px; font-family: var(--sans); background: var(--bg); color: var(--ink); outline: none; }
  .add-item-form input:focus, .add-item-form select:focus { border-color: var(--ink); }
  .add-btn { padding: 9px; background: var(--ink); color: var(--bg); border: none; border-radius: 2px; font-size: 12px; font-weight: 500; cursor: pointer; letter-spacing: 2px; font-family: var(--sans); }
  .delete-btn { padding: 3px 8px; background: transparent; border: 1px solid var(--border); border-radius: 2px; font-size: 11px; color: var(--ink-3); cursor: pointer; font-family: var(--sans); letter-spacing: 0.5px; }
  .delete-btn:hover { border-color: var(--accent); color: var(--accent); }

  .size-overlay { position: fixed; inset: 0; background: rgba(26,18,9,0.4); z-index: 300; display: flex; align-items: flex-end; animation: fadeIn .2s; }
  .size-drawer { background: var(--paper); border-radius: 0; width: 100%; padding: 0 20px 36px; animation: slideUp .25s cubic-bezier(.4,0,.2,1); border-top: 2px solid var(--ink); }
  .size-item-name { font-size: 17px; font-weight: 500; margin-bottom: 16px; font-family: var(--serif); letter-spacing: 1px; }
  .size-options { display: flex; flex-direction: column; gap: 8px; }
  .size-btn { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: 0; border: 1px solid var(--border); background: var(--bg); cursor: pointer; transition: all .15s; }
  .size-btn:hover { border-color: var(--ink); background: var(--paper); }
  .size-btn-label { font-size: 15px; font-weight: 500; font-family: var(--serif); letter-spacing: 1px; }
  .size-btn-price { font-size: 14px; font-weight: 400; color: var(--accent); font-family: var(--sans); }
  .cancel-btn { width: 100%; margin-top: 10px; padding: 13px; background: transparent; border: 1px solid var(--border); border-radius: 2px; font-size: 12px; font-weight: 500; color: var(--ink-3); cursor: pointer; letter-spacing: 2px; font-family: var(--sans); }

  .settings-form { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .settings-input { padding: 9px 12px; border-radius: 0; border: 1px solid var(--border); font-size: 13px; font-family: var(--sans); background: var(--bg); color: var(--ink); outline: none; width: 100%; }
  .settings-input:focus { border-color: var(--ink); }
  .save-btn { padding: 11px; background: var(--green); color: #fff; border: none; border-radius: 2px; font-size: 12px; font-weight: 500; cursor: pointer; letter-spacing: 2px; font-family: var(--sans); }
  .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default function App() {
  const shopId = window.location.pathname.split("/")[2];
  const tableNumber = new URLSearchParams(window.location.search).get("table") || null;
  const [view, setView] = useState("customer");
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [success, setSuccess] = useState(null);
  const [category, setCategory] = useState("全部");
  const [adminTab, setAdminTab] = useState("orders");
  const [adminAuth, setAdminAuth] = useState(false);
  const [shopName, setShopName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sizeItem, setSizeItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "主食", hasSizes: false, sizeSmallPrice: "", sizeLargePrice: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [adminCatFilter, setAdminCatFilter] = useState("全部");
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [shopFont, setShopFont] = useState("Noto+Sans+TC");
  const [savingFont, setSavingFont] = useState(false);
  const [tableCount, setTableCount] = useState(0);
  const [savingTable, setSavingTable] = useState(false);
  const [revenueResetAt, setRevenueResetAt] = useState(null);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [resetting, setResetting] = useState(false);

  const uploadImage = async (file, itemId) => {
    const imageRef = ref(storage, `shops/${shopId}/menu/${itemId}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    await updateDoc(doc(db, "shops", shopId, "menu", itemId), { image: url });
  };

  useEffect(() => {
    if (!shopId) return;
    const shopRef = doc(db, "shops", shopId);
    const unsubscribe = onSnapshot(shopRef, (snapshot) => {
      if (snapshot.exists()) {
        setShopName(snapshot.data().name || shopId);
        setShopFont(snapshot.data().fontFamily || "Noto+Sans+TC");
        // 從 Firestore 讀取分類，沒有就用預設
        const saved = snapshot.data().categories;
        if (saved && saved.length > 0) setCategories(saved);
        setTableCount(snapshot.data().tableCount || 0);
        setRevenueResetAt(snapshot.data().revenueResetAt?.toDate() || null);
        setRevenueHistory(snapshot.data().revenueHistory || []);
      }
    });
    return () => unsubscribe();
  }, [shopId]);

  useEffect(() => {
    const fontName = shopFont.replace(/\+/g, " ");
    const id = "dynamic-font-link";
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${shopFont}:wght@400;500;700;900&display=swap`;
    document.body.style.fontFamily = `'${fontName}', sans-serif`;
  }, [shopFont]);

  useEffect(() => {
    if (!shopId) return;
    const menuRef = collection(db, "shops", shopId, "menu");
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const item = { id: d.id, ...d.data() };
        if (typeof item.sizes === "string") {
          try { item.sizes = JSON.parse(item.sizes); } catch { item.sizes = []; }
        }
        return item;
      });
      setMenu(data);
    });
    return () => unsubscribe();
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    const q = query(collection(db, "shops", shopId, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        firestoreId: d.id, ...d.data(),
        time: d.data().createdAt?.toDate() || new Date(),
      }));
      setOrders(data);
    });
    return () => unsubscribe();
  }, [shopId]);

  const addToCart = useCallback((item, size = null) => {
    const price = size ? size.price : item.price;
    const cartKey = item.id + (size ? `-${size.label}` : "");
    const name = item.name + (size ? `（${size.label}）` : "");
    setCart(c => {
      const idx = c.findIndex(x => x.cartKey === cartKey);
      if (idx >= 0) {
        const n = [...c];
        n[idx] = { ...n[idx], qty: n[idx].qty + 1 };
        return n;
      }
      return [...c, { cartKey, id: item.id, name, price, emoji: item.emoji || "🍽", qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((cartKey) => {
    setCart(c => {
      const idx = c.findIndex(x => x.cartKey === cartKey);
      if (idx < 0) return c;
      const n = [...c];
      if (n[idx].qty <= 1) n.splice(idx, 1);
      else n[idx] = { ...n[idx], qty: n[idx].qty - 1 };
      return n;
    });
  }, []);

  const handleAddClick = useCallback((item) => {
    if (item.sizes && item.sizes.length > 0) {
      setSizeItem(item);
    } else {
      addToCart(item);
    }
  }, [addToCart]);

  const cartCount = cart.reduce((a, b) => a + b.qty, 0);
  const cartTotal = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  const filteredMenu = category === "全部" ? menu : menu.filter(m => m.category === category);

  const submitOrder = async () => {
    if (cartCount === 0 || submitting) return;
    setSubmitting(true);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayOrders = orders.filter(o => o.time >= startOfDay);
    const orderNumber = todayOrders.length + 1;
    const items = cart.map(x => ({
      id: x.id, name: x.name, price: x.price, emoji: x.emoji, qty: x.qty
    }));
    try {
      const res = await fetch(
        `https://my-ordering-app-production.up.railway.app/api/order/${shopId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, total: cartTotal, note: note || "", orderNumber, tableNumber }),
        }
      );
      if (!res.ok) throw new Error("送單失敗");
      setCart([]);
      setNote("");
      setCartOpen(false);
      setSuccess(orderNumber);
    } catch (err) {
      alert("送單失敗，請重試");
    } finally {
      setSubmitting(false);
    }
  };

  const markDone = async (firestoreId) => {
    await updateDoc(doc(db, "shops", shopId, "orders", firestoreId), { status: "done" });
  };

  const toggleAvailable = async (item) => {
    await updateDoc(doc(db, "shops", shopId, "menu", item.id), { available: !item.available });
  };

  const addMenuItem = async () => {
    if (!newItem.name) return;
    if (newItem.hasSizes && (!newItem.sizeSmallPrice || !newItem.sizeLargePrice)) return;
    if (!newItem.hasSizes && !newItem.price) return;
    const data = {
      name: newItem.name,
      category: newItem.category,
      available: true,
      price: newItem.hasSizes ? Number(newItem.sizeSmallPrice) : Number(newItem.price),
    };
    if (newItem.hasSizes) {
      data.sizes = [
        { label: "小", price: Number(newItem.sizeSmallPrice) },
        { label: "大", price: Number(newItem.sizeLargePrice) },
      ];
    }
    await addDoc(collection(db, "shops", shopId, "menu"), data);
    setNewItem({ name: "", price: "", category: "主食", hasSizes: false, sizeSmallPrice: "", sizeLargePrice: "" });
    setShowAddForm(false);
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm("確定要刪除這個品項嗎？")) return;
    await deleteDoc(doc(db, "shops", shopId, "menu", itemId));
  };

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    const updated = [...categories, name];
    setCategories(updated);
    await updateDoc(doc(db, "shops", shopId), { categories: updated });
    setNewCatName("");
    setShowAddCat(false);
    // 讓新品項預設選到剛建的分類
    setNewItem(v => ({ ...v, category: name }));
  };

  const deleteCategory = async (cat) => {
    const inUse = menu.some(item => item.category === cat);
    if (inUse) {
      alert(`「${cat}」底下還有品項，請先移除品項再刪除分類`);
      return;
    }
    if (!window.confirm(`確定刪除分類「${cat}」？`)) return;
    const updated = categories.filter(c => c !== cat);
    setCategories(updated);
    await updateDoc(doc(db, "shops", shopId), { categories: updated });
  };

  const saveShopName = async () => {
    if (!editingName.trim()) return;
    setSavingName(true);
    await updateDoc(doc(db, "shops", shopId), { name: editingName.trim() });
    setSavingName(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminAuth(false);
    setView("customer");
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const doneOrders = orders.filter(o => o.status === "done");
  const currentRevenue = orders
    .filter(o => !revenueResetAt || o.time > revenueResetAt)
    .reduce((s, o) => s + o.total, 0);

  const resetRevenue = async () => {
    if (!window.confirm("確定重置營收？目前的營收會存入歷史紀錄。")) return;
    setResetting(true);
    const now = new Date();
    const label = `${now.getMonth()+1}/${now.getDate()} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    const newHistory = [
      { label, total: currentRevenue, resetAt: now.toISOString() },
      ...revenueHistory,
    ].slice(0, 30); // 最多保留 30 筆
    await updateDoc(doc(db, "shops", shopId), {
      revenueResetAt: serverTimestamp(),
      revenueHistory: newHistory,
    });
    setResetting(false);
  };

  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const formatTime = (d) => d ? `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}` : "";

  if (!shopId) {
    return (
      <>
        <style>{styles}</style>
        <div className="no-shop">
          <p>🏮</p>
          <span>找不到店家，請確認網址是否正確</span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <nav className="nav">
          <div>
            <div className="nav-title">{view === "customer" ? shopName : "後台管理"}</div>
            {view === "customer" && tableNumber && (
              <div style={{fontSize:10,color:"var(--ink-3)",letterSpacing:"2px",marginTop:3,fontFamily:"var(--sans)"}}>
                {tableNumber} 號桌
              </div>
            )}
          </div>
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
                  {["全部", ...categories].map(c => (
                    <button key={c} className={`cat-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
                <div className="menu-list">
                  {menu.length === 0 ? (
                    <div className="empty-state"><p>🍽</p><span>菜單載入中...</span></div>
                  ) : (
                    filteredMenu.map(item => {
                      const itemQty = cart.filter(x => x.id === item.id).reduce((a, b) => a + b.qty, 0);
                      return (
                        <div key={item.id} className={`menu-item ${!item.available ? "unavail" : ""}`}>
                          {item.image
                            ? <img src={item.image} style={{width:48, height:48, borderRadius:8, objectFit:"cover"}} />
                            : <div className="menu-emoji">{item.emoji || "🍽"}</div>
                          }
                          <div className="menu-info">
                            <div className="menu-name">{item.name}</div>
                            <div className="menu-price">
                              {item.sizes && item.sizes.length > 0
                                ? `NT$ ${item.sizes[0].price} 起`
                                : `NT$ ${item.price}`
                              }
                            </div>
                            <span className="menu-tag">{item.category}</span>
                            {item.sizes && item.sizes.length > 0 && (
                              <span className="menu-tag" style={{marginLeft:4, borderColor:"var(--gold)", color:"var(--gold)"}}>可選大小</span>
                            )}
                            {!item.available && <span className="menu-tag" style={{marginLeft:4,borderColor:"#D0421B",color:"#D0421B"}}>售完</span>}
                          </div>
                          {item.available && (
                            <div className="qty-ctrl">
                              <button className="qty-btn" onClick={() => {
                                if (item.sizes && item.sizes.length > 0) {
                                  setSizeItem(item);
                                } else {
                                  removeFromCart(item.id);
                                }
                              }}>−</button>
                              <span className="qty-num">{itemQty}</span>
                              <button className="qty-btn" onClick={() => handleAddClick(item)}>＋</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {sizeItem && (
                  <div className="size-overlay" onClick={(e) => e.target === e.currentTarget && setSizeItem(null)}>
                    <div className="size-drawer">
                      <div className="drawer-handle"/>
                      <div className="size-item-name">{sizeItem.name}</div>
                      <div className="size-options">
                        {sizeItem.sizes.map(size => (
                          <div key={size.label} className="size-btn"
                            onClick={() => { addToCart(sizeItem, size); setSizeItem(null); }}
                          >
                            <span className="size-btn-label">{size.label}</span>
                            <span className="size-btn-price">NT$ {size.price}</span>
                          </div>
                        ))}
                      </div>
                      <button className="cancel-btn" onClick={() => setSizeItem(null)}>取消</button>
                    </div>
                  </div>
                )}

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
                      {cart.map(x => (
                        <div key={x.cartKey} className="cart-row">
                          <div className="cart-row-name">{x.emoji} {x.name} × {x.qty}</div>
                          <div className="cart-row-price">NT$ {x.price * x.qty}</div>
                        </div>
                      ))}
                      <div className="cart-total">
                        <span>合計</span>
                        <span>NT$ {cartTotal}</span>
                      </div>
                      <textarea
                        className="note-input"
                        placeholder="備注（例如：不要香菜、少辣）"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                      <button
                        className="submit-btn"
                        onClick={submitOrder}
                        disabled={submitting}
                        style={{opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer"}}
                      >
                        {submitting ? "送出中..." : "送出訂單"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "admin" && (
          !adminAuth
            ? <AdminLogin shopId={shopId} shopName={shopName} onLogin={() => setAdminAuth(true)} />
            : <div className="admin-wrap">
                <div className="admin-header">
                  <h2>{shopName} 後台</h2>
                  <p>今日 {new Date().toLocaleDateString("zh-TW")}</p>
                </div>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-num">{orders.length}</div>
                    <div className="stat-label">總訂單</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-num" style={{color:"var(--accent)"}}>{pendingOrders.length}</div>
                    <div className="stat-label">待處理</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-num">NT${currentRevenue}</div>
                    <div className="stat-label">目前營收</div>
                  </div>
                </div>

                {/* 重置營收 + 歷史紀錄 */}
                <div style={{margin:"0 16px 4px",padding:"12px 14px",background:"var(--paper)",border:"1px solid var(--border-light)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom: revenueHistory.length > 0 ? 10 : 0}}>
                    <div>
                      <div style={{fontSize:11,color:"var(--ink-3)",letterSpacing:"1px",fontFamily:"var(--sans)"}}>
                        {revenueResetAt
                          ? `上次重置：${revenueResetAt.getMonth()+1}/${revenueResetAt.getDate()} ${revenueResetAt.getHours().toString().padStart(2,"0")}:${revenueResetAt.getMinutes().toString().padStart(2,"0")}`
                          : "尚未重置過"
                        }
                      </div>
                    </div>
                    <button
                      onClick={resetRevenue}
                      disabled={resetting}
                      style={{
                        padding:"5px 12px", background:"transparent",
                        border:"1px solid var(--border)", borderRadius:2,
                        fontSize:11, color:"var(--ink-3)", cursor: resetting ? "not-allowed" : "pointer",
                        fontFamily:"var(--sans)", letterSpacing:"1px",
                      }}
                    >
                      {resetting ? "重置中" : "重置營收"}
                    </button>
                  </div>
                  {revenueHistory.length > 0 && (
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {revenueHistory.map((h, i) => (
                        <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--ink-3)",fontFamily:"var(--sans)",paddingTop:4,borderTop:"1px solid var(--border-light)"}}>
                          <span>{h.label}</span>
                          <span>NT$ {h.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tabs">
                  <div className={`tab ${adminTab === "orders" ? "active" : ""}`} onClick={() => setAdminTab("orders")}>
                    訂單 {pendingOrders.length > 0 && `(${pendingOrders.length})`}
                  </div>
                  <div className={`tab ${adminTab === "menu" ? "active" : ""}`} onClick={() => setAdminTab("menu")}>菜單管理</div>
                  <div className={`tab ${adminTab === "history" ? "active" : ""}`} onClick={() => setAdminTab("history")}>歷史</div>
                  <div className={`tab ${adminTab === "qrcode" ? "active" : ""}`} onClick={() => setAdminTab("qrcode")}>QR Code</div>
                  <div className={`tab ${adminTab === "settings" ? "active" : ""}`} onClick={() => { setAdminTab("settings"); setEditingName(shopName); }}>設定</div>
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
                              <span className="order-num">#{order.orderNumber}</span>
                              <span className="order-time">{formatTime(order.time)}</span>
                              {order.tableNumber && (
                                <span style={{fontSize:12, fontWeight:700, background:"#FFF3CD", color:"#856404", borderRadius:99, padding:"3px 10px"}}>
                                  🪑 {order.tableNumber} 桌
                                </span>
                              )}
                              <span className="order-status status-pending">待處理</span>
                            </div>
                            <div className="order-items">
                              {order.items?.map((item, i) => (
                                <div key={i} className="order-item-row">
                                  <span>{item.emoji || "🍽"} {item.name} × {item.qty}</span>
                                  <span>NT$ {item.price * item.qty}</span>
                                </div>
                              ))}
                            </div>
                            {order.note && <div className="order-note">📝 {order.note}</div>}
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
                    {/* 頂部：新增品項按鈕 */}
                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px 4px"}}>
                      <div className="section-title" style={{padding:0}}>菜單品項</div>
                      <button className="add-btn" onClick={() => setShowAddForm(v => !v)} style={{fontSize:13}}>
                        {showAddForm ? "取消" : "＋ 新增品項"}
                      </button>
                    </div>

                    {/* 分類篩選列 */}
                    <div className="cat-scroll" style={{padding:"8px 16px"}}>
                      {["全部", ...categories].map(c => (
                        <button
                          key={c}
                          className={`cat-btn ${adminCatFilter === c ? "active" : ""}`}
                          onClick={() => setAdminCatFilter(c)}
                        >{c}</button>
                      ))}
                      <button
                        className="cat-btn"
                        onClick={() => setShowAddCat(v => !v)}
                        style={{borderStyle:"dashed", color:"var(--ink-3)"}}
                      >＋ 新增分類</button>
                    </div>

                    {/* 新增分類輸入框 */}
                    {showAddCat && (
                      <div style={{display:"flex", gap:8, padding:"0 16px 8px"}}>
                        <input
                          className="settings-input"
                          placeholder="輸入新分類名稱（例如：甜點）"
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCategory()}
                          style={{flex:1}}
                        />
                        <button className="add-btn" onClick={addCategory} style={{whiteSpace:"nowrap"}}>新增</button>
                      </div>
                    )}

                    {/* 新增品項表單 */}
                    {showAddForm && (
                      <div className="add-item-form">
                        <input
                          placeholder="品項名稱（例如：陽春麵）"
                          value={newItem.name}
                          onChange={e => setNewItem(v => ({...v, name: e.target.value}))}
                        />
                        <select
                          value={newItem.category}
                          onChange={e => setNewItem(v => ({...v, category: e.target.value}))}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <label style={{display:"flex", alignItems:"center", gap:8, fontSize:14, color:"var(--ink)"}}>
                          <input
                            type="checkbox"
                            checked={newItem.hasSizes}
                            onChange={e => setNewItem(v => ({...v, hasSizes: e.target.checked}))}
                          />
                          有大小選擇
                        </label>
                        {newItem.hasSizes ? (
                          <>
                            <input
                              placeholder="小碗價格（例如：45）"
                              type="number"
                              value={newItem.sizeSmallPrice}
                              onChange={e => setNewItem(v => ({...v, sizeSmallPrice: e.target.value}))}
                            />
                            <input
                              placeholder="大碗價格（例如：65）"
                              type="number"
                              value={newItem.sizeLargePrice}
                              onChange={e => setNewItem(v => ({...v, sizeLargePrice: e.target.value}))}
                            />
                          </>
                        ) : (
                          <input
                            placeholder="價格（例如：40）"
                            type="number"
                            value={newItem.price}
                            onChange={e => setNewItem(v => ({...v, price: e.target.value}))}
                          />
                        )}
                        <button className="add-btn" onClick={addMenuItem}>新增</button>
                      </div>
                    )}

                    {/* 品項列表：依分類分組 */}
                    {(() => {
                      const visibleCats = adminCatFilter === "全部" ? categories : [adminCatFilter];
                      // 有分類的品項
                      const grouped = visibleCats.map(cat => ({
                        cat,
                        items: menu.filter(item => item.category === cat),
                      }));
                      // 沒有對應分類的品項（舊資料）
                      const uncategorized = menu.filter(item => !categories.includes(item.category));
                      return (
                        <>
                          {grouped.map(({ cat, items }) => (
                            <div key={cat}>
                              <div style={{
                                display:"flex", alignItems:"center", justifyContent:"space-between",
                                padding:"10px 16px 4px"
                              }}>
                                <div style={{
                                  fontSize:12, fontWeight:700, color:"var(--ink-3)",
                                  textTransform:"uppercase", letterSpacing:1
                                }}>
                                  {cat}
                                  <span style={{
                                    marginLeft:6, background:"var(--border)", borderRadius:99,
                                    padding:"1px 7px", fontSize:11, fontWeight:700, color:"var(--ink-3)"
                                  }}>{items.length}</span>
                                </div>
                                <button
                                  onClick={() => deleteCategory(cat)}
                                  style={{
                                    fontSize:11, color:"var(--ink-3)", background:"none",
                                    border:"none", cursor:"pointer", padding:"2px 6px"
                                  }}
                                >刪除分類</button>
                              </div>
                              {items.length === 0 ? (
                                <div style={{padding:"8px 16px 4px", fontSize:13, color:"var(--ink-3)"}}>此分類尚無品項</div>
                              ) : (
                                items.map(item => (
                                  <div key={item.id} className="menu-admin-item">
                                    {item.image
                                      ? <img src={item.image} style={{width:48, height:48, borderRadius:8, objectFit:"cover"}} />
                                      : <span style={{fontSize:24}}>🍽</span>
                                    }
                                    <div className="menu-admin-info">
                                      <div className="menu-admin-name">{item.name}</div>
                                      <div className="menu-admin-price">
                                        {item.sizes && item.sizes.length > 0
                                          ? item.sizes.map(s => `${s.label} NT$${s.price}`).join(" / ")
                                          : `NT$ ${item.price}`
                                        } · {item.category}
                                      </div>
                                    </div>
                                    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                                      <label className="toggle">
                                        <input type="checkbox" checked={item.available ?? true} onChange={() => toggleAvailable(item)} />
                                        <div className="toggle-track"/>
                                        <div className="toggle-thumb"/>
                                      </label>
                                      <label style={{fontSize:10, color:"var(--ink-3)", cursor:"pointer", border:"1px solid var(--border)", padding:"2px 6px", borderRadius:2, fontFamily:"var(--sans)", letterSpacing:"0.5px", whiteSpace:"nowrap"}}>
                                        上傳圖片
                                        <input type="file" accept="image/*" style={{display:"none"}}
                                          onChange={(e) => { if (e.target.files[0]) uploadImage(e.target.files[0], item.id); }}
                                        />
                                      </label>
                                      <button className="delete-btn" onClick={() => deleteMenuItem(item.id)}>刪除</button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          ))}
                          {uncategorized.length > 0 && adminCatFilter === "全部" && (
                            <div>
                              <div style={{padding:"10px 16px 4px", fontSize:12, fontWeight:700, color:"var(--ink-3)", letterSpacing:1}}>
                                未分類 <span style={{marginLeft:6, background:"var(--border)", borderRadius:99, padding:"1px 7px", fontSize:11}}>{uncategorized.length}</span>
                              </div>
                              {uncategorized.map(item => (
                                <div key={item.id} className="menu-admin-item">
                                  {item.image
                                    ? <img src={item.image} style={{width:48, height:48, borderRadius:8, objectFit:"cover"}} />
                                    : <span style={{fontSize:24}}>🍽</span>
                                  }
                                  <div className="menu-admin-info">
                                    <div className="menu-admin-name">{item.name}</div>
                                    <div className="menu-admin-price">NT$ {item.price} · {item.category || "未分類"}</div>
                                  </div>
                                  <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                                    <label className="toggle">
                                      <input type="checkbox" checked={item.available ?? true} onChange={() => toggleAvailable(item)} />
                                      <div className="toggle-track"/>
                                      <div className="toggle-thumb"/>
                                    </label>
                                    <label style={{fontSize:10, color:"var(--ink-3)", cursor:"pointer", border:"1px solid var(--border)", padding:"2px 6px", borderRadius:2, fontFamily:"var(--sans)", letterSpacing:"0.5px", whiteSpace:"nowrap"}}>
                                      上傳圖片
                                      <input type="file" accept="image/*" style={{display:"none"}}
                                        onChange={(e) => { if (e.target.files[0]) uploadImage(e.target.files[0], item.id); }}
                                      />
                                    </label>
                                    <button className="delete-btn" onClick={() => deleteMenuItem(item.id)}>刪除</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                              <span className="order-num">#{order.orderNumber}</span>
                              <span className="order-time">{formatTime(order.time)}</span>
                              {order.tableNumber && (
                                <span style={{fontSize:12, fontWeight:700, background:"#D1FAE5", color:"#065F46", borderRadius:99, padding:"3px 10px"}}>
                                  🪑 {order.tableNumber} 桌
                                </span>
                              )}
                              <span className="order-status status-done">完成</span>
                            </div>
                            <div className="order-items">
                              {order.items?.map((item, i) => (
                                <div key={i} className="order-item-row">
                                  <span>{item.emoji || "🍽"} {item.name} × {item.qty}</span>
                                  <span>NT$ {item.price * item.qty}</span>
                                </div>
                              ))}
                            </div>
                            {order.note && <div className="order-note">📝 {order.note}</div>}
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
                  <div style={{padding:24,display:"flex",flexDirection:"column",gap:16}}>
                    <div className="section-title" style={{padding:0}}>桌號 QR Code</div>
                    {tableCount === 0 ? (
                      <div style={{textAlign:"center",padding:"24px 0",color:"var(--ink-3)",fontSize:14}}>
                        請先到「設定」填入桌數，再來產生 QR Code
                      </div>
                    ) : (
                      <>
                        <div style={{fontSize:13,color:"var(--ink-3)"}}>共 {tableCount} 桌，每張印出來貼在對應桌上</div>
                        <div style={{display:"flex",flexDirection:"column",gap:16}}>
                          {Array.from({length: tableCount}, (_, i) => i + 1).map(t => (
                            <div key={t} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,background:"var(--surface)",borderRadius:12,border:"1.5px solid var(--border)",padding:16}}>
                              <div style={{fontSize:13,fontWeight:700,color:"var(--ink-3)"}}>第 {t} 桌</div>
                              <QRCode url={`https://my-ordering-app.vercel.app/shop/${shopId}?table=${t}`} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {adminTab === "settings" && (
                  <div className="settings-form">
                    <div className="section-title" style={{padding:0}}>商家名稱</div>
                    <input
                      className="settings-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      placeholder="輸入商家名稱"
                    />
                    <button
                      className="save-btn"
                      onClick={saveShopName}
                      disabled={savingName}
                    >
                      {savingName ? "儲存中..." : "儲存"}
                    </button>

                    <div className="section-title" style={{padding:0, marginTop:8}}>桌數設定</div>
                    <input
                      className="settings-input"
                      type="number"
                      min="0"
                      value={tableCount}
                      onChange={e => setTableCount(Number(e.target.value))}
                      placeholder="輸入桌數（例如：8）"
                    />
                    <button
                      className="save-btn"
                      onClick={async () => {
                        setSavingTable(true);
                        await updateDoc(doc(db, "shops", shopId), { tableCount });
                        setSavingTable(false);
                      }}
                      disabled={savingTable}
                    >
                      {savingTable ? "儲存中..." : "儲存桌數"}
                    </button>

                    <div className="section-title" style={{padding:0, marginTop:8}}>前台字體</div>
                    <select
                      className="settings-input"
                      value={shopFont}
                      onChange={e => setShopFont(e.target.value)}
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <div style={{
                      padding:"12px 16px", borderRadius:8, border:"1.5px solid var(--border)",
                      fontFamily:`'${shopFont.replace(/\+/g, " ")}', sans-serif`,
                      fontSize:15, color:"var(--ink-2)", background:"var(--bg)"
                    }}>
                      {shopName} · 大碗 NT$65
                    </div>
                    <button
                      className="save-btn"
                      onClick={async () => {
                        setSavingFont(true);
                        await updateDoc(doc(db, "shops", shopId), { fontFamily: shopFont });
                        setSavingFont(false);
                      }}
                      disabled={savingFont}
                    >
                      {savingFont ? "儲存中..." : "儲存字體"}
                    </button>
                  </div>
                )}

                <button className="logout-btn" onClick={handleLogout}>登出後台</button>
              </div>
        )}
      </div>
    </>
  );
}