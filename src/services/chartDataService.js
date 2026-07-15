import { calcFullTA } from "../utils/taIndicators.js";

// ══════════════════════════════════════════════════════════════
// CHART DATA SERVICE
// Fetches 60-day OHLCV candles for a stock symbol via allorigins
// proxy. Falls back to simulated candles anchored to the stock's
// current price/volume if the DSE endpoint is unavailable.
//
// ctx = { stocks, setChartData, setTaData, setChartLoading }
// ══════════════════════════════════════════════════════════════

export async function fetchChartData(sym, ctx) {
  const { stocks, setChartData, setTaData, setChartLoading } = ctx;

  setChartLoading(true);
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];

    const url = "https://api.allorigins.win/get?url=" + encodeURIComponent(
      "https://www.dsebd.org/api/historical-data.json?symbol=" + sym + "&start=" + startDate + "&end=" + endDate
    );
    const resp = await fetch(url);
    const wrapper = await resp.json();
    const raw = JSON.parse(wrapper.contents);

    let candles = [];
    if (Array.isArray(raw)) {
      candles = raw.map(d => ({
        date: d.date || d.trading_date || d.DATE,
        open: parseFloat(d.open || d.open_price || d.OPEN || 0),
        high: parseFloat(d.high || d.high_price || d.HIGH || 0),
        low: parseFloat(d.low || d.low_price || d.LOW || 0),
        close: parseFloat(d.close || d.closing_price || d.CLOSE || d.ltp || 0),
        vol: parseInt(d.volume || d.VOLUME || 0),
      })).filter(c => c.close > 0).slice(-60);
    }

    if (candles.length < 5) throw new Error("Not enough data");

    setChartData(prev => ({ ...prev, [sym]: candles }));
    const sDataReal = stocks.find(x => x.name === sym);
    const taReal = calcFullTA(candles, sDataReal);
    if (taReal) setTaData(prev => ({ ...prev, [sym]: taReal }));
  } catch (e) {
    // Fallback: generate demo candles anchored to the stock's real data
    const s = stocks.find(x => x.name === sym);
    if (s) {
      const demoCandles = [];
      let price = s.price * 0.85;
      for (let i = 59; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const change = (Math.random() - 0.48) * price * 0.025;
        const open = price;
        const close = Math.max(price * 0.5, price + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.015);
        const low = Math.min(open, close) * (1 - Math.random() * 0.015);
        demoCandles.push({
          date: d.toISOString().split("T")[0],
          open: +open.toFixed(2), high: +high.toFixed(2),
          low: +low.toFixed(2), close: +close.toFixed(2),
          vol: Math.round(s.vma20 * (0.5 + Math.random())),
        });
        price = close;
      }
      if (demoCandles.length > 0) {
        demoCandles[demoCandles.length - 1].close = s.price;
        demoCandles[demoCandles.length - 1].high = Math.max(demoCandles[demoCandles.length - 1].high, s.price);
      }
      setChartData(prev => ({ ...prev, [sym]: demoCandles }));
      const sData = stocks.find(x => x.name === sym);
      setTimeout(() => {
        const ta = calcFullTA(demoCandles, sData);
        if (ta) setTaData(prev => ({ ...prev, [sym]: ta }));
      }, 100);
    }
  }
  setChartLoading(false);
}
