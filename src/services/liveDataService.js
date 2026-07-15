import { TODAY } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// LIVE DSE DATA SERVICE
// Fetches closing prices via allorigins proxy (bypasses CORS).
// Designed to be called from a component with its state setters
// passed in as `ctx` — keeps this file framework-agnostic.
//
// ctx = {
//   stocks, setStocks, persist, showToast,
//   setLiveLoading, setLiveStatus, setLiveUpdatedAt
// }
// ══════════════════════════════════════════════════════════════

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ DSE থেকে data আনছি...");

  try {
    const stockNames = stocks.map(s => s.name);
    let successCount = 0;
    const updatedStocks = [...stocks];

    for (let i = 0; i < stockNames.length; i++) {
      const sym = stockNames[i];
      try {
        const url = "https://api.allorigins.win/get?url=" + encodeURIComponent(
          "https://www.dsebd.org/api/latest-share-price-all-by-symbol.json?symbol=" + sym
        );
        const resp = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
        if (!resp.ok) continue;
        const wrapper = await resp.json();
        const data = JSON.parse(wrapper.contents);

        if (data && (data.latest || data.data)) {
          const d = data.latest || data.data || data;
          const price = parseFloat(d.ltp || d.last_trade_price || d.close || d.closingPrice || 0);
          const vol = parseInt(d.volume || d.total_volume || 0);
          const change = parseFloat(d.change || d.price_change || 0);
          const changePct = parseFloat(d.change_percent || d.percent_change || 0);
          const ycp = parseFloat(d.ycp || d.yesterday_closing_price || 0);

          if (price > 0) {
            const idx = updatedStocks.findIndex(s => s.name === sym);
            if (idx >= 0) {
              updatedStocks[idx] = {
                ...updatedStocks[idx],
                price, vol: vol || updatedStocks[idx].vol,
                updatedAt: TODAY, liveChange: change, liveChangePct: changePct, ycp,
              };
              successCount++;
            }
          }
        }
      } catch (e) {
        console.log("Skip " + sym + ": " + e.message);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (successCount > 0) {
      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast("✅ " + successCount + "টি stock এর data আপডেট হয়েছে!");
    } else {
      await fetchLiveDataFallback(ctx);
    }
  } catch (e) {
    console.error("Live fetch error:", e);
    setLiveStatus("error");
    showToast("❌ Data আনতে সমস্যা। পরে try করুন।", "err");
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
      showToast("❌ DSE API response পাওয়া যায়নি।", "err");
    }
  } catch (e) {
    setLiveStatus("error");
    showToast("❌ " + e.message, "err");
  }
}
