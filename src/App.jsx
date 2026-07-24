import { useState, useMemo, useCallback, useEffect } from "react";

import { fbSignIn, fbSignOut, onAuth, fsGet, fsSet } from "./firebase.js";
import { C, TODAY, DEFAULT_PROFILE, DEFAULT_BROKERS } from "./constants.js";
import { checkIsAdmin } from "./services/adminService.js";
import { ensureFavorites, listenToWatchlists, toggleFavorite, addStockToWatchlist, removeStockFromWatchlist, FAVORITES_ID } from "./services/watchlistService.js";
import { recordAdminUid } from "./services/conversationService.js";
import { inp, card, btn } from "./utils/styleHelpers.js";
import { load, save, daysSince, staleness } from "./utils/dateHelpers.js";
import { calcScore, getRec, generateStrategy, calcTrailingSL } from "./utils/strategyEngine.js";
import { findSRLevels } from "./utils/taIndicators.js";
import { fetchLiveData as fetchLiveDataService } from "./services/liveDataService.js";
import { fetchChartData as fetchChartDataService } from "./services/chartDataService.js";
import { INIT_STOCKS } from "./data/initData.js";

const EMPTY_PORT = [];

import LoginScreen from "./components/LoginScreen.jsx";
import BlockedScreen from "./components/BlockedScreen.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import NotificationBanner from "./components/NotificationBanner.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";
import ShareButton from "./components/ShareButton.jsx";
import WatchlistBar from "./components/WatchlistBar.jsx";
import BroadcastHistory from "./components/BroadcastHistory.jsx";
import ChatHub from "./components/ChatHub.jsx";
import PasteModal from "./components/PasteModal.jsx";
import DeleteConfirm from "./components/DeleteConfirm.jsx";
import BuyRankingPanel from "./components/BuyRankingPanel.jsx";
import ChartModal from "./components/ChartModal.jsx";

import ScreenerTab from "./tabs/ScreenerTab.jsx";
import PortfolioTab from "./tabs/PortfolioTab.jsx";
import TradesTab from "./tabs/TradesTab.jsx";
import ProfitDashboard from "./tabs/ProfitDashboard.jsx";
import RiskTab from "./tabs/RiskTab.jsx";

const SK = "dse-v7";

let _idCounter = 0;
const uid = () => {
  _idCounter += 1;
  return Date.now() * 1000 + (_idCounter % 1000);
};

// Bug fix: "clicking one stock expands several/all of them at once".
// Root cause — if two or more stocks in the loaded data ended up with a
// missing/undefined `id` (or a duplicate id — e.g. from cached
// localStorage data saved before this fix existed), then
// `expanded === s.id` becomes true for every one of them simultaneously,
// since they all compare equal. This sanitizer runs on every stocks
// array as it's loaded (Firestore OR local cache) and guarantees each
// stock has a unique, defined id — assigning a fresh one wherever it's
// missing or already used earlier in the same list.
const sanitizeStocks = (list) => {
  if (!Array.isArray(list)) return list;
  const seen = new Set();
  return list.map((s) => {
    if (s.id == null || seen.has(s.id)) {
      const fixed = { ...s, id: uid() };
      seen.add(fixed.id);
      return fixed;
    }
    seen.add(s.id);
    return s;
  });
};

export default function App() {
  // -- Auth / Profile State --
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminState, setIsAdminState] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  // -- App Data State --
  const [tab, setTab] = useState("screener");
  const [stocks, setStocks] = useState(INIT_STOCKS);
  const [port, setPort] = useState(EMPTY_PORT);
  const [trades, setTrades] = useState([]);
  const [days, setDays] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [sector, setSector] = useState("সব");
  const [catFilter, setCatFilter] = useState("সব");
  const [sigF, setSigF] = useState("সব");
  const [nameFilter, setNameFilter] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [expanded, setExpanded] = useState(null);
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null); // null = "সব" (all stocks)
  const [editMode, setEditMode] = useState(null);
  const [editPort, setEditPort] = useState(null);
  const [showAddS, setShowAddS] = useState(false);
  const [showAddP, setShowAddP] = useState(false);
  const [showPortPaste, setShowPortPaste] = useState(false);
  const [portPasteCode, setPortPasteCode] = useState("");
  const [portPasteErr, setPortPasteErr] = useState("");
  const [portPasteBroker, setPortPasteBroker] = useState("Ecosoft");
  const [showPaste, setShowPaste] = useState(false);
  const [stockPaste, setStockPaste] = useState(null);
  const [showBuyRank, setShowBuyRank] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(null);
  const [chartStock, setChartStock] = useState(null);
  const [chartType, setChartType] = useState("candlestick");
  const [chartData, setChartData] = useState({});
  const [chartLoading, setChartLoading] = useState(false);
  const [taData, setTaData] = useState({});
  const [ns, setNs] = useState({ name:"", sector:"Bank", cat:"A", price:"", eps:"", pe:"", nav:"", div:"", rsi:"50", macd:"0", vol:"", vma20:"", ema20:"", sma50:"", ret6m:"", inst:"", circuit:"" });
  const [nsSearch, setNsSearch] = useState("");
  const [np, setNp] = useState({ stock:"", broker:"Ecosoft", shares:"", buyRate:"", target1:"", target2:"", stopLoss:"", buyDate: TODAY, customSellTarget:"" });
  const [npSearch, setNpSearch] = useState("");

  // -- Optimized Firebase Auth + Parallel Data Load Strategy --
  useEffect(() => {
    // সেফটি টাইমার: ৩ সেকেন্ডের মধ্যে উত্তর না এলে অ্যাপ ওপেন হয়ে যাবে
    const safetyTimer = setTimeout(() => {
      setAuthLoading(false);
      setAdminChecked(true);
    }, 3000);

    const unsub = onAuth(async (u) => {
      setUser(u);
      if (u) {
        // ১. ইনস্ট্যান্ট রেন্ডার: লোকাল ক্যাশ থেকে ডাটা দেখিয়ে অ্যাপ দ্রুত ফাস্ট রেন্ডার করবে
        // Bug fix: sanitizeStocks() applied here too — cached data can
        // predate this fix and still carry corrupted/duplicate ids.
        const cached = load(SK + "-" + u.uid);
        if (cached) {
          if (cached.stocks && cached.stocks.length > 0) setStocks(sanitizeStocks(cached.stocks));
          if (cached.port && cached.port.length > 0) setPort(cached.port);
          if (cached.trades) setTrades(cached.trades);
          setAuthLoading(false); // ক্যাশ ডাটা পাওয়া গেলে সাথে সাথেই লোডার রিমুভ হবে
        }

        // ২. প্যারালাল রিকোয়েস্ট (Promise.allSettled): ৩টি নেটওয়ার্ক কল ইন্ডিপেন্ডেন্টলি সম্পন্ন হবে
        try {
          const [pDataResult, appDataResult, adminStatusResult] = await Promise.allSettled([
            fsGet("users/" + u.uid),
            fsGet("users/" + u.uid + "/appdata/main"),
            checkIsAdmin(u.email)
          ]);

          // প্রোফাইল রেসপন্স হ্যান্ডলিং
          if (pDataResult.status === "fulfilled") {
            const pData = pDataResult.value;
            if (pData) {
              setProfile((p) => ({ ...DEFAULT_PROFILE, ...pData }));
            } else {
              const newProfile = { ...DEFAULT_PROFILE, email: u.email, displayName: u.displayName, photoURL: u.photoURL, joinDate: TODAY };
              fsSet("users/" + u.uid, newProfile);
              setProfile(newProfile);
            }
          }

          // অ্যাপ ডাটা রেসপন্স হ্যান্ডলিং
          // Bug fix: sanitizeStocks() applied to the authoritative
          // Firestore data as well — this is the main fix for the
          // "clicking one stock expands several of them" bug. If
          // sanitizing actually changed anything (missing/duplicate
          // ids were found and fixed), write the corrected list back
          // to Firestore immediately — otherwise the same corrupted
          // ids would just come back on the next login.
          if (appDataResult.status === "fulfilled" && appDataResult.value) {
            const appData = appDataResult.value;
            if (appData.stocks && appData.stocks.length > 0) {
              const cleanStocks = sanitizeStocks(appData.stocks);
              setStocks(cleanStocks);
              const idsChanged = cleanStocks.some((s, i) => s.id !== appData.stocks[i]?.id);
              if (idsChanged) {
                fsSet("users/" + u.uid + "/appdata/main", { stocks: cleanStocks, updatedAt: new Date().toISOString() });
              }
            }
            if (appData.port && appData.port.length > 0) setPort(appData.port);
            if (appData.trades) setTrades(appData.trades);
          }

          // এডমিন স্ট্যাটাস রেসপন্স হ্যান্ডলিং
          if (adminStatusResult.status === "fulfilled") {
            const adminStatus = adminStatusResult.value;
            setIsAdminState(adminStatus);
            if (adminStatus) { recordAdminUid(u.email, u.uid); }
          }

          // Watchlists: make sure this user has their default
          // "Favorites" list — fire-and-forget, doesn't block the
          // rest of app load. The real-time listener (separate
          // useEffect below) picks up the result once created.
          ensureFavorites(u.uid).catch((e) => console.log("ensureFavorites error:", e));
        } catch (e) {
          console.log("Parallel load error:", e);
        }
      } else {
        setIsAdminState(false);
        setProfile(DEFAULT_PROFILE);
        setStocks(INIT_STOCKS);
        setPort(EMPTY_PORT);
        setTrades([]);
        setWatchlists([]);
        setActiveWatchlistId(null);
      }

      clearTimeout(safetyTimer);
      setAdminChecked(true);
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsub();
    };
  }, []);

  // Real-time watchlists listener — separate from the main auth
  // effect so it cleanly subscribes/unsubscribes whenever the signed-in
  // user changes, without re-running the whole auth/profile-load flow.
  useEffect(() => {
    if (!user) return;
    const unsubWatch = listenToWatchlists(user.uid, (lists) => {
      setWatchlists(lists);
    });
    return unsubWatch;
  }, [user]);

  const getBrokerComm = (brokerId) => {
    const b = (profile.brokers || DEFAULT_BROKERS).find((x) => x.id === brokerId || x.name === brokerId);
    return b ? b.commission : 0.3;
  };

  const showToast = (msg, type) => { setToast({ msg, type: type || "ok" }); setTimeout(() => setToast(null), 4000); };

  const persist = useCallback((s, p, t) => {
    const data = { stocks: s || stocks, port: p || port, trades: t || trades };
    if (user) {
      save(SK + "-" + user.uid, data);
      fsSet("users/" + user.uid + "/appdata/main", { ...data, updatedAt: new Date().toISOString() });
    }
  }, [stocks, port, trades, user]);

  const portMap = useMemo(() => { const m = {}; port.forEach((p) => { m[p.stock] = (m[p.stock] || 0) + p.shares; }); return m; }, [port]);

  const fetchLiveData = () => fetchLiveDataService({
    stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt,
  });

  const fetchChartDataForSymbol = (sym) => fetchChartDataService(sym, {
    stocks, setChartData, setTaData, setChartLoading,
  });

  const applyPaste = (data) => {
    if (!data.name) { showToast("❌ name দরকার", "err"); return; }
    const nm = data.name.toUpperCase();
    const ud = { ...data, name: nm, updatedAt: TODAY };
    const exists = stocks.find((s) => s.name.toUpperCase() === nm);
    if (exists) {
      const u = stocks.map((s) => (s.name.toUpperCase() === nm ? { ...s, ...ud, id: s.id } : s));
      setStocks(u); persist(u, null, null); showToast("✅ " + nm + " আপডেট!");
    } else {
      const s = { id: uid(), cat:"A", sector:"অন্যান্য", eps:0, pe:0, nav:1, div:0, rsi:50, macd:0, vol:0, vma20:500000, ema20:0, sma50:0, ret6m:0, inst:0, circuit:0, totalShares:5000000, ...ud };
      const u = [...stocks, s]; setStocks(u); persist(u, null, null); showToast("✅ " + nm + " যোগ হয়েছে!");
    }
  };

  const updateStock = (id, f, v) => { const u = stocks.map((s) => (s.id === id ? { ...s, [f]: v } : s)); setStocks(u); persist(u, null, null); };
  const removeStock = (id) => { const u = stocks.filter((s) => s.id !== id); setStocks(u); persist(u, null, null); showToast("Stock সরানো হয়েছে।"); };

  // Heart icon on a stock card calls this — toggles that stock in/out
  // of the Favorites watchlist specifically (not the currently active tab).
  const handleToggleFavorite = async (stockName) => {
    if (!user) return;
    const nowFavorited = await toggleFavorite(user.uid, stockName, favoriteNames);
    showToast(nowFavorited ? "❤️ Favorites এ যোগ হয়েছে!" : "Favorites থেকে সরানো হয়েছে।");
  };

  // Generic add/remove for the per-stock "add to custom watchlist" dropdown.
  const handleAddToWatchlist = (watchlistId, stockName, currentNames) => {
    if (!user) return;
    addStockToWatchlist(user.uid, watchlistId, stockName, currentNames);
  };
  const handleRemoveFromWatchlist = (watchlistId, stockName, currentNames) => {
    if (!user) return;
    removeStockFromWatchlist(user.uid, watchlistId, stockName, currentNames);
  };

  const selectStockForNS = (s) => {
    setNs({ name: s.name, sector: s.sector, cat: s.cat, price: String(s.price), eps: String(s.eps), pe: String(s.pe), nav: String(s.nav), div: String(s.div), rsi: String(s.rsi), macd: String(s.macd), vol: String(s.vol), vma20: String(s.vma20 || ""), ema20: String(s.ema20 || ""), sma50: String(s.sma50 || ""), ret6m: String(s.ret6m), inst: String(s.inst), circuit: String(s.circuit || "") });
    setNsSearch(s.name);
  };

  const addStock = () => {
    if (!ns.name || !ns.price) return;
    const nm = ns.name.toUpperCase();
    const fields = { price:+ns.price, eps:+ns.eps||0, pe:+ns.pe||0, nav:+ns.nav||0, div:+ns.div||0, rsi:+ns.rsi||50, macd:+ns.macd||0, vol:+ns.vol||0, vma20:+ns.vma20||500000, ema20:+ns.ema20||0, sma50:+ns.sma50||0, ret6m:+ns.ret6m||0, inst:+ns.inst||0, circuit:+ns.circuit||0, cat: ns.cat, sector: ns.sector, updatedAt: TODAY };
    const exists = stocks.find((s) => s.name.toUpperCase() === nm);
    let u;
    if (exists) { u = stocks.map((s) => (s.name.toUpperCase() === nm ? { ...s, ...fields } : s)); showToast("✅ " + nm + " আপডেট!"); }
    else { u = [...stocks, { id: uid(), name: nm, totalShares: 5000000, ...fields }]; showToast("✅ " + nm + " যোগ!"); }
    setStocks(u); persist(u, null, null);
    setNs({ name:"", sector:"Bank", cat:"A", price:"", eps:"", pe:"", nav:"", div:"", rsi:"50", macd:"0", vol:"", vma20:"", ema20:"", sma50:"", ret6m:"", inst:"", circuit:"" });
    setNsSearch(""); setShowAddS(false);
  };

  const selectStockForPort = (s) => {
    setNp((p) => ({ ...p, stock: s.name, target1: +(s.price * 1.07).toFixed(2), target2: +(s.price * 1.15).toFixed(2), stopLoss: +(s.price * 0.92).toFixed(2) }));
    setNpSearch(s.name);
  };

  const addPosition = () => {
    if (!np.stock || !np.shares || !np.buyRate) return;
    const br = +np.buyRate;
    const p = { ...np, id: uid(), shares:+np.shares, buyRate: br, currentPrice: br, target1:+np.target1||(+(br*1.07).toFixed(2)), target2:+np.target2||(+(br*1.15).toFixed(2)), stopLoss:+np.stopLoss||(+(br*0.92).toFixed(2)), trailingSL:+np.stopLoss||(+(br*0.92).toFixed(2)), realized:0, buyDate: np.buyDate || TODAY, customSellTarget:+np.customSellTarget||null, withdrawals: [] };
    const u = [...port, p]; setPort(u); persist(null, u, null);
    setNp({ stock:"", broker:"Ecosoft", shares:"", buyRate:"", target1:"", target2:"", stopLoss:"", buyDate: TODAY, customSellTarget:"" });
    setNpSearch(""); setShowAddP(false); showToast("✅ " + p.stock + " portfolio এ যোগ হয়েছে!");
  };

  const updatePort = (id, f, v) => { const u = port.map((p) => (p.id === id ? { ...p, [f]: +v } : p)); setPort(u); persist(null, u, null); };

  const recordSell = (p, sp, ss, customComm) => {
    const commRate = (customComm !== undefined ? customComm : getBrokerComm(p.broker)) / 100;
    const grossProfit = (sp - p.buyRate) * ss;
    const comm = (ss * p.buyRate + ss * sp) * commRate;
    const profit = grossProfit - comm;
    const t = { id: uid(), stock: p.stock, broker: p.broker, buyRate: p.buyRate, sellPrice: sp, sellShares: ss, profit, commission: comm, date: new Date().toISOString().split("T")[0], withdrawals: [] };
    const ut = [...trades, t];
    const up = port.map((x) => (x.id === p.id ? { ...x, shares: x.shares - ss, realized: (x.realized || 0) + profit } : x)).filter((x) => x.shares > 0);
    setTrades(ut); setPort(up); persist(null, up, ut);
    showToast("✅ " + p.stock + " — ৳" + profit.toFixed(0) + " লাভ রেকর্ড!");
  };

  const applyPortPaste = () => {
    setPortPasteErr("");
    try {
      const raw = JSON.parse(portPasteCode.trim());
      const items = Array.isArray(raw) ? raw : [raw];
      if (!items.length) { setPortPasteErr("❌ কোনো data নেই।"); return; }
      let added = 0, updated = 0, newPort = [...port];
      items.forEach((item) => {
        if (!item.stock || !item.buyRate) return;
        const broker = item.broker || portPasteBroker;
        const br = +item.buyRate;
        const idx = newPort.findIndex((p) => p.stock.toUpperCase() === item.stock.toUpperCase() && p.broker === broker);
        if (idx >= 0) {
          newPort[idx] = { ...newPort[idx], shares: item.shares !== undefined ? +item.shares : newPort[idx].shares, buyRate: br || newPort[idx].buyRate, target1: item.target1 ? +item.target1 : newPort[idx].target1, target2: item.target2 ? +item.target2 : newPort[idx].target2, stopLoss: item.stopLoss ? +item.stopLoss : newPort[idx].stopLoss };
          updated++;
        } else {
          newPort.push({ id: uid(), stock: item.stock.toUpperCase(), broker, shares:+item.shares||0, buyRate: br, currentPrice: br, target1: item.target1?+item.target1:+(br*1.07).toFixed(2), target2: item.target2?+item.target2:+(br*1.15).toFixed(2), stopLoss: item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2), trailingSL: item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2), realized:0, buyDate: item.buyDate || TODAY, customSellTarget: null, withdrawals: [] });
          added++;
        }
      });
      setPort(newPort); persist(null, newPort, null);
      setPortPasteCode(""); setShowPortPaste(false);
      showToast("✅ " + added + "টি নতুন, " + updated + "টি আপডেট!");
    } catch (e) { setPortPasteErr("❌ JSON format ভুল।"); }
  };

  const confirmDelete = (item) => setDeleteItem(item);

  const doDelete = (reason) => {
    setUndoItem({ ...deleteItem, deleteReason: reason });
    const u = port.filter((p) => p.id !== deleteItem.id); setPort(u); persist(null, u, null);
    setDeleteItem(null);
    showToast("🗑️ " + deleteItem.stock + " সরানো হয়েছে। Undo করুন।", "warn");
    setTimeout(() => setUndoItem(null), 15000);
  };

  const undoDelete = () => {
    const pos = { ...undoItem }; delete pos.deleteReason;
    const u = [...port, pos]; setPort(u); persist(null, u, null); setUndoItem(null);
    showToast("✅ " + pos.stock + " ফিরিয়ে আনা হয়েছে!");
  };

  const scored = useMemo(() => stocks.map((s) => {
    const score = calcScore(s, days); const rec = getRec(score);
    const str = generateStrategy(s, days, portMap[s.name] || 0);
    return { ...s, score, rec, str };
  }), [stocks, days, portMap]);

  const activeWatchlist = useMemo(() => watchlists.find((w) => w.id === activeWatchlistId) || null, [watchlists, activeWatchlistId]);
  const favoritesList = useMemo(() => watchlists.find((w) => w.id === FAVORITES_ID) || null, [watchlists]);
  const favoriteNames = favoritesList?.stockNames || [];

  const filtered = useMemo(() => {
    let list = [...scored];
    if (activeWatchlist) list = list.filter((s) => activeWatchlist.stockNames.includes(s.name));
    if (nameFilter.trim()) list = list.filter((s) => s.name.toUpperCase().includes(nameFilter.trim().toUpperCase()));
    if (sector !== "সব") list = list.filter((s) => s.sector === sector);
    if (catFilter !== "সব") list = list.filter((s) => s.cat === catFilter);
    if (sigF !== "সব") {
      const m = { "STRONG BUY": (s) => s.score >= 75, "BUY": (s) => s.score >= 60 && s.score < 75, "WATCH": (s) => s.score >= 45 && s.score < 60, "WEAK": (s) => s.score >= 30 && s.score < 45, "AVOID": (s) => s.score < 30 };
      list = list.filter(m[sigF] || ((_) => true));
    }
    list.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "rsi") return a.rsi - b.rsi;
      if (sortBy === "vol") return b.vol - a.vol;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.eps - a.eps;
    });
    return list;
  }, [scored, activeWatchlist, sector, catFilter, sigF, sortBy, days, nameFilter]);

  const sigC = useMemo(() => {
    const c = { "STRONG BUY": 0, "BUY": 0, "WATCH": 0, "WEAK": 0, "AVOID": 0 };
    scored.forEach((s) => { if (s.score >= 75) c["STRONG BUY"]++; else if (s.score >= 60) c["BUY"]++; else if (s.score >= 45) c["WATCH"]++; else if (s.score >= 30) c["WEAK"]++; else c["AVOID"]++; });
    return c;
  }, [scored]);

  const enriched = useMemo(() => port.map((p) => {
    const sData = stocks.find((s) => s.name === p.stock);
    const cp = sData && sData.price > 0 ? sData.price : p.currentPrice;
    const cost = p.shares * p.buyRate, val = p.shares * cp, pl = val - cost, plp = cost !== 0 ? (pl / cost) * 100 : 0;
    const str = sData ? generateStrategy(sData, days, p.shares) : { t1: p.target1, t2: p.target2, t3: null, sl: p.stopLoss, sellT1:40, sellT2:40, sellT3:20, risk:"🟡 MEDIUM", sellStr:"Screener এ stock নেই।", maSignal:"—", isBreakoutVol:false };
    const tsl = calcTrailingSL({ ...p, currentPrice: cp, str });
    const isTSLActive = tsl > (p.trailingSL || p.stopLoss);
    let sig = "⏳ HOLD"; const effectiveSL = Math.max(tsl, p.stopLoss);
    if (cp <= effectiveSL) sig = "🔴 STOP LOSS!"; else if (cp >= str.t2) sig = "🚀 T2 SELL"; else if (cp >= str.t1) sig = "✅ T1 SELL";
    const holdDays = p.buyDate ? Math.floor((Date.now() - new Date(p.buyDate)) / 86400000) : null;
    const liveChangePct = sData && sData.liveChangePct !== undefined ? sData.liveChangePct : null;
    return { ...p, currentPrice: cp, cost, val, pl, plp, sig, str, sData, tsl, isTSLActive, effectiveSL, liveChangePct, holdDays };
  }), [port, stocks, days]);

  const summ = useMemo(() => {
    const tc = enriched.reduce((a, p) => a + p.cost, 0), tv = enriched.reduce((a, p) => a + p.val, 0), tr = trades.reduce((a, t) => a + (t.profit || 0), 0);
    const byB = {}; enriched.forEach((p) => { if (!byB[p.broker]) byB[p.broker] = { cost: 0, val: 0, n: 0 }; byB[p.broker].cost += p.cost; byB[p.broker].val += p.val; byB[p.broker].n++; });
    return { tc, tv, tpl: tv - tc, tr, byB };
  }, [enriched, trades]);

  const TS = (a) => ({ padding:"10px 18px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer", background: a ? C.card : "transparent", color: a ? C.accent : C.muted, fontWeight:700, fontSize:13, fontFamily:"inherit", borderBottom: a ? "2px solid " + C.accent : "2px solid transparent" });
  const staleCount = stocks.filter((s) => { const d = daysSince(s.updatedAt); return d !== null && d > 3; }).length;

  if (authLoading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}><div style={{ fontSize: 48 }}>📊</div><div style={{ color: C.accent, fontWeight: 700, marginTop: 12 }}>Loading...</div></div>
    </div>
  );

  if (!user) return (
    <>
      <InstallPrompt />
      <LoginScreen onLogin={async () => { await fbSignIn(); }} />
    </>
  );

  if (!isAdminState && profile && profile.isActive === false)
    return <BlockedScreen profile={profile} onSignOut={async () => { await fbSignOut(); setUser(null); setProfile(DEFAULT_PROFILE); setStocks(INIT_STOCKS); setPort(EMPTY_PORT); setTrades([]); }} />;

  if (showAdmin && isAdminState) return <AdminDashboard adminUser={user} stocks={stocks} onClose={() => setShowAdmin(false)} />;

  if (showSettings) return (
    <SettingsPage
      profile={profile}
      user={user}
      onSave={async (p) => { setProfile(p); if (user) { await fsSet("users/" + user.uid, p); } showToast("✅ Settings saved!"); setShowSettings(false); }}
      onClose={() => setShowSettings(false)}
      onSignOut={async () => { await fbSignOut(); setUser(null); setProfile(DEFAULT_PROFILE); setStocks(INIT_STOCKS); setPort(EMPTY_PORT); setTrades([]); }}
    />
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter,-apple-system,sans-serif", color: C.text }}>
      <InstallPrompt />
      <NotificationBanner user={user} />
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10001, background: toast.type === "err" ? C.red : toast.type === "warn" ? C.orange : C.accent, color: "#fff", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 340 }}>{toast.msg}</div>}

      {chartStock && (
        <ChartModal
          stock={chartStock}
          candles={chartData[chartStock.name]}
          chartType={chartType}
          setChartType={setChartType}
          onClose={() => setChartStock(null)}
          srLevels={chartData[chartStock.name] ? findSRLevels(chartData[chartStock.name]) : null}
          taResult={taData[chartStock.name]}
          chartLoading={chartLoading}
        />
      )}
      {showPaste && isAdminState && <PasteModal onApply={applyPaste} onClose={() => setShowPaste(false)} />}
      {stockPaste && isAdminState && <PasteModal stockName={stockPaste.name} onApply={applyPaste} onClose={() => setStockPaste(null)} />}
      {showBuyRank && <BuyRankingPanel stocks={stocks} port={port} days={days} onClose={() => setShowBuyRank(false)} />}
      {deleteItem && <DeleteConfirm item={deleteItem} onConfirm={doDelete} onClose={() => setDeleteItem(null)} />}
      {undoItem && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9998, background: "#1A2D4A", border: "1px solid " + C.yellow, borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: C.text }}><span style={{ color: C.yellow, fontWeight: 700 }}>{undoItem.stock}</span> সরানো হয়েছে {undoItem.deleteReason ? "(" + undoItem.deleteReason + ")" : ""}</div>
          <button onClick={undoDelete} style={btn(C.yellow, true, true)}>↩️ Undo</button>
          <button onClick={() => setUndoItem(null)} style={btn(C.muted, false, true)}>✕</button>
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg,#070D1A,#0F2040,#070D1A)", borderBottom: "1px solid " + C.border, padding: "14px 20px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#00C896,#0080FF)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📊</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>DSE Trading Dashboard <span style={{ fontSize: 13, color: C.accent }}>v7</span></div>
              <div style={{ fontSize: 12, color: C.muted }}>EMA20 · SMA50 · VMA20 · Trailing SL{staleCount > 0 && <span style={{ color: C.orange, marginLeft: 8 }}>⚠️ {staleCount}টি পুরনো</span>}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Horizon:</span>
            <button onClick={() => { setDays(0); setCustomDays(""); }} style={{ ...btn("#9C27B0", days === 0, true), position: "relative" }}>
              0d <span style={{ fontSize: 9, position: "absolute", top: -4, right: -4, background: "#F44336", borderRadius: 8, padding: "1px 4px", color: "#fff" }}>AI</span>
            </button>
            {[3, 5, 7, 10, 14, 21, 30].map((d) => (
              <button key={d} onClick={() => { setDays(d); setCustomDays(""); }} style={btn(C.accent, days === d, true)}>{d}d</button>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" min={1} max={365} value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="Custom" style={{ ...inp({ width: 65, padding: "4px 8px", fontSize: 12 }), border: "1px solid " + (customDays ? C.yellow : C.border) }} />
              {customDays && <button onClick={() => { const d = parseInt(customDays, 10); if (d > 0) { setDays(d); setCustomDays(""); } }} style={btn(C.yellow, true, true)}>✅</button>}
            </div>
            <ShareButton showToast={showToast} />
            <button onClick={() => setShowBuyRank(true)} style={btn(C.accent, true)}>🎯 Buy Ranking</button>
            {isAdminState && (
              <button onClick={fetchLiveData} disabled={liveLoading} style={{ ...btn(liveStatus === "ok" ? C.accent : liveStatus === "error" ? C.red : C.blue, liveStatus === "ok", false), opacity: liveLoading ? 0.7 : 1 }}>
                {liveLoading ? "⏳ Loading..." : liveStatus === "ok" ? "🟢 Updated" : "📡 DSE Sync"}
              </button>
            )}
            {isAdminState && (
              <button onClick={() => setShowAdmin(true)} style={{ ...btn("#9C27B0", true, true), display: "flex", alignItems: "center", gap: 4 }}>👑 Admin</button>
            )}
            <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 2 }}>
              <img src={user.photoURL || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.displayName || "U") + "&background=00C896&color=fff"} style={{ width: 38, height: 38, borderRadius: 19, border: "2px solid " + C.accent }} alt="settings" />
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 1140, margin: "4px auto 0", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: days === 0 ? C.purple : C.yellow, fontWeight: 600 }}>{days === 0 ? "🔮 Natural Mode — Fundamental + Technical Analysis" : "📅 " + days + " দিনের strategy · EMA20/SMA50/VMA20 scoring active"}</span>
          {isAdminState && liveUpdatedAt && <span style={{ fontSize: 11, color: C.accent }}>🟢 শেষ update: {liveUpdatedAt}</span>}
          {isAdminState && liveStatus === "error" && <span style={{ fontSize: 11, color: C.red }}>❌ Sync ব্যর্থ — পরে চেষ্টা করুন</span>}
        </div>
      </div>

      <div style={{ background: C.bg, borderBottom: "1px solid " + C.border, padding: "0 20px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto" }}>
          {[["screener", "📊 Screener"], ["portfolio", "💼 Portfolio"], ["trades", "📋 Trade Log"], ["dashboard", "🏆 Dashboard"], ["chat", "💬 Chat"], ["risk", "⚠️ Risk"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={TS(tab === t)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 20px" }}>
        {tab === "screener" && (
          <ScreenerTab
            stocks={stocks} filtered={filtered} sigC={sigC} portMap={portMap} days={days} chartData={chartData} isAdmin={isAdminState}
            nameFilter={nameFilter} setNameFilter={setNameFilter} sector={sector} setSector={setSector}
            catFilter={catFilter} setCatFilter={setCatFilter}
            sigF={sigF} setSigF={setSigF} sortBy={sortBy} setSortBy={setSortBy}
            liveLoading={liveLoading}
            showAddS={showAddS} setShowAddS={setShowAddS} showPaste={showPaste} setShowPaste={setShowPaste}
            ns={ns} setNs={setNs} nsSearch={nsSearch} setNsSearch={setNsSearch} selectStockForNS={selectStockForNS} addStock={addStock}
            expanded={expanded} setExpanded={setExpanded} editMode={editMode} setEditMode={setEditMode}
            updateStock={updateStock} removeStock={removeStock} showToast={showToast}
            setChartStock={setChartStock} fetchChartDataForSymbol={fetchChartDataForSymbol} setStockPaste={setStockPaste}
            user={user} watchlists={watchlists} activeWatchlistId={activeWatchlistId} setActiveWatchlistId={setActiveWatchlistId}
            favoriteNames={favoriteNames} onToggleFavorite={handleToggleFavorite}
            onAddToWatchlist={handleAddToWatchlist} onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )}

        {tab === "portfolio" && (
          <PortfolioTab
            summ={summ} port={port} stocks={stocks} enriched={enriched} days={days} profile={profile} isAdmin={isAdminState}
            showPortPaste={showPortPaste} setShowPortPaste={setShowPortPaste} portPasteCode={portPasteCode} setPortPasteCode={setPortPasteCode}
            portPasteErr={portPasteErr} setPortPasteErr={setPortPasteErr} portPasteBroker={portPasteBroker} setPortPasteBroker={setPortPasteBroker}
            applyPortPaste={applyPortPaste}
            showAddP={showAddP} setShowAddP={setShowAddP} np={np} setNp={setNp} npSearch={npSearch} setNpSearch={setNpSearch}
            selectStockForPort={selectStockForPort} addPosition={addPosition}
            editPort={editPort} setEditPort={setEditPort} updatePort={updatePort} recordSell={recordSell}
            getBrokerComm={getBrokerComm} confirmDelete={confirmDelete} showToast={showToast}
          />
        )}

        {tab === "trades" && (
          <TradesTab trades={trades} profile={profile} setTrades={setTrades} persist={persist} summ={summ} />
        )}

        {tab === "dashboard" && (
          <div>
            <BroadcastHistory user={user} />
            <div style={{ marginTop: 16 }}>
              <ProfitDashboard trades={trades} portfolio={port} stocks={stocks} />
            </div>
          </div>
        )}

        {tab === "chat" && (
          <ChatHub user={user} profile={profile} isAdmin={isAdminState} />
        )}

        {tab === "risk" && (
          <RiskTab enriched={enriched} summ={summ} stocks={stocks} />
        )}
      </div>
    </div>
  );
}
