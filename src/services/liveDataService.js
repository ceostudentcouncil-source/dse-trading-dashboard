import { TODAY } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// LIVE DSE DATA SERVICE (LOCAL ST STORAGE CONNECT)
// ══════════════════════════════════════════════════════════════

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ লোকাল স্টোরেজ থেকে লাইভ ডাটা লোড করছি...");

  try {
    // পাইথন স্ক্রিপ্ট যেখানে ফাইলটি সেভ করেছে, ঠিক সেই পাথ
    const fileUrl = "/storage/emulated/0/Download/dse_data.json";
    
    const resp = await fetch(fileUrl);
    if (!resp.ok) throw new Error("লোকাল ডাটা ফাইলটি খুঁজে পাওয়া যায়নি। আগে পাইথন রান করুন।");
    
    const pythonStocks = await resp.json();

    if (pythonStocks && Array.isArray(pythonStocks) && pythonStocks.length > 0) {
      
      const updatedStocks = stocks.map(currentStock => {
        const newLiveStock = pythonStocks.find(ps => ps.name.toUpperCase() === currentStock.name.toUpperCase());
        
        if (newLiveStock) {
          return {
            ...currentStock,
            ...newLiveStock, // পাইথন ফাইলের ফ্রেশ প্রাইস, RSI, MACD, অ্যানালাইসিস নোট সব লোড হবে
            updatedAt: TODAY
          };
        }
        return currentStock; 
      });

      // অ্যাপের মূল ডাটা স্টেট ও লোকাল স্টোরেজ আপডেট
      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast("✅ পাইথন লোকাল ডাটা সফলভাবে সিঙ্ক হয়েছে!");
      
    } else {
      throw new Error("ফাইলটি ফাঁকা ছিল");
    }
  } catch (e) {
    console.error("Live fetch error:", e);
    // যদি কোনো কারণে লোকাল ফাইল সরাসরি রিড না হয়, তবে ব্যাকআপ হিসেবে অনলাইন ফলব্যাক ট্রাই করবে
    await fetchLiveDataFallback(ctx);
  }
  setLiveLoading(false);
}

export async function fetchLiveDataFallback(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveStatus, setLiveUpdatedAt } = ctx;

  try {
    const url = "https://api.allorigins.win/get?url=" + encodeURIComponent(
      "https://www.dsebd.org/api/latest-share-price-all.json"
    );
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Fallback failed");
    const wrapper = await resp.json();
    const allData = JSON.parse(wrapper.contents);
    if (!allData || !Array.isArray(allData)) throw new Error("Invalid data");

    const dataMap = {};
    allData.forEach(item => {
      const sym = (item.trading_code || item.symbol || item.TRADING_CODE || "").trim().toUpperCase();
      if (sym) dataMap[sym] = item;
    });

    let count = 0;
    const updatedStocks = stocks.map(s => {
      const d = dataMap[s.name.toUpperCase()];
      if (!d) return s;
      const price = parseFloat(d.ltp || d.close || d.last_trade_price || d.LTP || 0);
      if (price <= 0) return s;
      count++;
      return {
        ...s,
        price,
        vol: parseInt(d.volume || d.VOLUME || s.vol),
        updatedAt: TODAY,
        liveChange: parseFloat(d.change || d.CHANGE || 0),
        liveChangePct: parseFloat(d.percent_change || d.PERCENT_CHANGE || 0),
        ycp: parseFloat(d.ycp || d.YCP || 0),
      };
    });

    if (count > 0) {
      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast("✅ " + count + "টি stock updated (fallback)!");
    } else {
      setLiveStatus("error");
      showToast("❌ DSE API response পাওয়া যায়নি।", "err");
    }
  } catch (e) {
    setLiveStatus("error");
    showToast("❌ " + e.message, "err");
  }
}
