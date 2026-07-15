import { TODAY } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// LIVE DSE DATA SERVICE (DIRECT PYTHON CONNECT)
// পাইথন স্ক্রিপ্ট থেকে সরাসরি লাইভ ডাটা লোড করার জন্য মডিফাইড
// ══════════════════════════════════════════════════════════════

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ পাইথন সার্ভার থেকে লাইভ ডাটা আনছি...");

  // আপনার পাইথন কোডে যে KVDB লিংকটি ব্যবহার করেছেন সেটি এখানে দিন
  const apiUrl = "https://kvdb.io/MN9vjH6XyJt5bQ4r7BvZ2a/dse_live_data";

  try {
    // সরাসরি আমাদের ফ্রি এপিআই থেকে এক ক্লিকে সব ডাটা নিয়ে আসা হচ্ছে
    const resp = await fetch(apiUrl);
    if (!resp.ok) throw new Error("সার্ভার থেকে ডাটা পাওয়া যায়নি");
    
    const pythonStocks = await resp.json();

    if (pythonStocks && Array.isArray(pythonStocks) && pythonStocks.length > 0) {
      
      // পাইথন থেকে আসা নতুন ডাটা দিয়ে অ্যাপের বর্তমান স্টক লিস্ট আপডেট করা
      const updatedStocks = stocks.map(currentStock => {
        // পাইথনের ডাটার সাথে নাম ম্যাচ করানো হচ্ছে
        const newLiveStock = pythonStocks.find(ps => ps.name.toUpperCase() === currentStock.name.toUpperCase());
        
        if (newLiveStock) {
          // যদি পাইথনে এই স্টকের নতুন ডাটা থাকে, তবে সেটা বসবে
          return {
            ...currentStock,
            ...newLiveStock, // পাইথনের পাঠানো rsi, macd, price, bb_upper সব এখানে ইনজেক্ট হবে
            updatedAt: TODAY
          };
        }
        return currentStock; // ম্যাচ না করলে আগেরটাই থাকবে
      });

      // অ্যাপের স্টেট এবং লোকাল স্টোরেজে ডাটা সেভ করা
      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast("✅ পাইথন লাইভ ডাটা সফলভাবে সিঙ্ক হয়েছে!");
      
    } else {
      throw new Error("ফাঁকা ডাটা এসেছে");
    }
  } catch (e) {
    console.error("Live fetch error:", e);
    // যদি কোনো কারণে KVDB এপিআই কাজ না করে, তবে আপনার আগের পুরনো ফলব্যাক রান করবে
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
