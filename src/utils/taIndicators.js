// ══════════════════════════════════════════════════════════════
// TECHNICAL ANALYSIS ENGINE — DSE Bangladesh Market Optimized
// Pure functions: RSI, EMA, SMA, MACD, VMA, Bollinger Bands,
// Stochastic, Williams %R, CCI, ADX, OBV, VWAP, Full TA composite,
// and Support/Resistance auto-detection.
// ══════════════════════════════════════════════════════════════

export const calcRSI = (closes, period) => {
  period = period || 14;
  if (!closes || closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2);
};

export const calcEMA = (closes, period) => {
  if (!closes || closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return +ema.toFixed(2);
};

export const calcSMA = (closes, period) => {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
};

export const calcMACD = (closes) => {
  if (!closes || closes.length < 26) return { macd: null, signal: null, hist: null };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12 || !ema26) return { macd: null, signal: null, hist: null };
  const macd = +(ema12 - ema26).toFixed(3);
  // Signal line approximation
  const signal = +(macd * 0.9).toFixed(3);
  return { macd, signal, hist: +(macd - signal).toFixed(3) };
};

export const calcVMA = (volumes, period) => {
  period = period || 20;
  if (!volumes || volumes.length < period) return null;
  const slice = volumes.slice(-period);
  return Math.round(slice.reduce((a, b) => a + b, 0) / period);
};

export const calcBollingerBands = (closes, period, mult) => {
  period = period || 20; mult = mult || 2;
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const sma = slice.reduce((a,b)=>a+b,0) / period;
  const variance = slice.reduce((a,b)=>a+Math.pow(b-sma,2),0) / period;
  const std = Math.sqrt(variance);
  return { upper:+(sma+mult*std).toFixed(2), middle:+sma.toFixed(2), lower:+(sma-mult*std).toFixed(2), std:+std.toFixed(2) };
};

export const calcStochastic = (candles, k, d) => {
  k = k || 14; d = d || 3;
  if (!candles || candles.length < k) return null;
  const recent = candles.slice(-k);
  const highestHigh = Math.max(...recent.map(c=>c.high));
  const lowestLow = Math.min(...recent.map(c=>c.low));
  const last = candles[candles.length-1];
  if (highestHigh === lowestLow) return { k:50, d:50 };
  const kVal = +((last.close - lowestLow) / (highestHigh - lowestLow) * 100).toFixed(2);
  // D = 3-period SMA of K (simplified)
  const dVal = kVal;
  return { k: kVal, d: dVal };
};

export const calcWilliamsR = (candles, period) => {
  period = period || 14;
  if (!candles || candles.length < period) return null;
  const recent = candles.slice(-period);
  const highestHigh = Math.max(...recent.map(c=>c.high));
  const lowestLow = Math.min(...recent.map(c=>c.low));
  const last = candles[candles.length-1];
  if (highestHigh === lowestLow) return -50;
  return +((highestHigh - last.close) / (highestHigh - lowestLow) * -100).toFixed(2);
};

export const calcCCI = (candles, period) => {
  period = period || 14;
  if (!candles || candles.length < period) return null;
  const tps = candles.slice(-period).map(c=>(c.high+c.low+c.close)/3);
  const sma = tps.reduce((a,b)=>a+b,0)/period;
  const mad = tps.reduce((a,b)=>a+Math.abs(b-sma),0)/period;
  if (mad === 0) return 0;
  return +((tps[tps.length-1]-sma)/(0.015*mad)).toFixed(2);
};

export const calcADX = (candles, period) => {
  period = period || 14;
  if (!candles || candles.length < period+1) return null;
  let dmPlus=0, dmMinus=0, tr=0;
  for (let i=1; i<candles.length; i++) {
    const c=candles[i], p=candles[i-1];
    const upMove=c.high-p.high, downMove=p.low-c.low;
    dmPlus += upMove>downMove&&upMove>0?upMove:0;
    dmMinus += downMove>upMove&&downMove>0?downMove:0;
    tr += Math.max(c.high-c.low, Math.abs(c.high-p.close), Math.abs(c.low-p.close));
  }
  if (tr===0) return 25;
  const diPlus=(dmPlus/tr)*100, diMinus=(dmMinus/tr)*100;
  const dx=Math.abs(diPlus-diMinus)/(diPlus+diMinus||1)*100;
  return {adx:+dx.toFixed(2), diPlus:+diPlus.toFixed(2), diMinus:+diMinus.toFixed(2)};
};

export const calcOBV = (candles) => {
  if (!candles || candles.length < 2) return null;
  let obv = 0;
  for (let i=1; i<candles.length; i++) {
    if (candles[i].close > candles[i-1].close) obv += candles[i].vol;
    else if (candles[i].close < candles[i-1].close) obv -= candles[i].vol;
  }
  return obv;
};

export const calcVWAP = (candles) => {
  if (!candles || candles.length === 0) return null;
  let totalPV=0, totalV=0;
  candles.slice(-20).forEach(c=>{
    const tp=(c.high+c.low+c.close)/3;
    totalPV += tp*c.vol; totalV += c.vol;
  });
  return totalV>0?+(totalPV/totalV).toFixed(2):null;
};

// DSE-Optimized Complete Technical Score
export const calcFullTA = (candles, stockData) => {
  if (!candles || candles.length < 20) return null;
  const closes = candles.map(c=>c.close);
  const vols = candles.map(c=>c.vol);
  const last = candles[candles.length-1];
  const prev = candles[candles.length-2];

  // HYBRID: prefer user-entered data over demo-candle calculations
  // This ensures RSI/MACD/EMA match what user sees in StockNow
  const rsi = (stockData&&stockData.rsi&&stockData.rsi>0) ? stockData.rsi : calcRSI(closes, 14);
  const calcMacdRaw = calcMACD(closes);
  const macdFromStock = (stockData&&stockData.macd!==undefined) ? {macd:stockData.macd, signal:0, hist:stockData.macd*0.1} : null;
  const macdData = macdFromStock || calcMacdRaw;
  const bb = calcBollingerBands(closes, 20, 2);
  const ema20 = (stockData&&stockData.ema20&&stockData.ema20>0) ? stockData.ema20 : calcEMA(closes, 20);
  const ema50 = (stockData&&stockData.sma50&&stockData.sma50>0) ? stockData.sma50 : calcEMA(closes, 50);
  const sma200 = calcSMA(closes, Math.min(200, closes.length));
  const stoch = calcStochastic(candles, 14, 3);
  const willR = calcWilliamsR(candles, 14);
  const cci = calcCCI(candles, 14);
  const adxData = calcADX(candles, 14);
  const obv = calcOBV(candles);
  const vwap = calcVWAP(candles);
  const vma20 = (stockData&&stockData.vma20&&stockData.vma20>0) ? stockData.vma20 : calcVMA(vols, 20);
  const currentPrice = (stockData&&stockData.price>0) ? stockData.price : last.close;

  // ── Sideways Detection ─────────────────────────────────────────
  const period20H = Math.max(...candles.slice(-20).map(c=>c.high));
  const period20L = Math.min(...candles.slice(-20).map(c=>c.low));
  // Use stock's actual range if available (52W High/Low or BB)
  const actualHigh = (stockData&&stockData.bb_upper) ? stockData.bb_upper : period20H;
  const actualLow  = (stockData&&stockData.bb_lower) ? stockData.bb_lower : period20L;
  const rangeWidth = (actualHigh - actualLow) / actualLow * 100;
  const isSideways = rangeWidth < 12 && rsi > 35 && rsi < 65;
  const isTrending = adxData && adxData.adx > 25 && !isSideways;

  // ── Individual Signals ─────────────────────────────────────────
  const signals = [];
  let buyScore = 0, sellScore = 0, totalWeight = 0;

  // RSI Signal (weight: 15)
  const rsiW = 15;
  if (rsi !== null) {
    totalWeight += rsiW;
    if (rsi < 30) { signals.push({name:"RSI",signal:"🟢 STRONG BUY",detail:"RSI "+rsi+" — Oversold! Bounce সম্ভব",color:"#00C896",score:rsiW}); buyScore+=rsiW; }
    else if (rsi < 40) { signals.push({name:"RSI",signal:"🟡 BUY",detail:"RSI "+rsi+" — সস্তা zone এ",color:"#4CAF50",score:rsiW*0.7}); buyScore+=rsiW*0.7; }
    else if (rsi >= 40 && rsi <= 60) { signals.push({name:"RSI",signal:"⚪ NEUTRAL",detail:"RSI "+rsi+" — Balanced",color:"#4A6080",score:0}); }
    else if (rsi > 70) { signals.push({name:"RSI",signal:"🔴 SELL",detail:"RSI "+rsi+" — Overbought! Sell করুন",color:"#F44336",score:rsiW}); sellScore+=rsiW; }
    else if (rsi > 60) { signals.push({name:"RSI",signal:"🟠 CAUTION",detail:"RSI "+rsi+" — উপরের দিকে",color:"#FF9800",score:rsiW*0.5}); sellScore+=rsiW*0.5; }
  }

  // MACD Signal (weight: 15)
  const macdW = 15;
  if (macdData && macdData.macd !== null) {
    totalWeight += macdW;
    const macd = macdData.macd, hist = macdData.hist;
    if (macd > 0 && hist > 0) { signals.push({name:"MACD",signal:"🟢 BUY",detail:"MACD "+macd+" Bullish crossover — uptrend শুরু",color:"#00C896",score:macdW}); buyScore+=macdW; }
    else if (macd > 0 && hist < 0) { signals.push({name:"MACD",signal:"🟡 WEAK BUY",detail:"MACD positive কিন্তু momentum কমছে",color:"#FFC107",score:macdW*0.4}); buyScore+=macdW*0.4; }
    else if (macd < 0 && hist < 0) { signals.push({name:"MACD",signal:"🔴 SELL",detail:"MACD "+macd+" Bearish — downtrend",color:"#F44336",score:macdW}); sellScore+=macdW; }
    else { signals.push({name:"MACD",signal:"🟠 CAUTION",detail:"MACD negative কিন্তু improving",color:"#FF9800",score:macdW*0.3}); sellScore+=macdW*0.3; }
  }

  // Bollinger Bands (weight: 15) — use stock's BB data if available
  const bbW = 15;
  const bbData = (stockData&&stockData.bb_upper&&stockData.bb_lower)
    ? {upper:stockData.bb_upper, lower:stockData.bb_lower, middle:((stockData.bb_upper+stockData.bb_lower)/2).toFixed(2)}
    : bb;
  if (bbData) {
    totalWeight += bbW;
    const bbPct = (currentPrice - bbData.lower) / (bbData.upper - bbData.lower) * 100;
    if (currentPrice <= bbData.lower) { signals.push({name:"BB",signal:"🟢 STRONG BUY",detail:"BB Lower (৳"+bbData.lower+") ছুঁয়েছে — Bounce প্রায় নিশ্চিত",color:"#00C896",score:bbW}); buyScore+=bbW; }
    else if (bbPct < 25) { signals.push({name:"BB",signal:"🟢 BUY",detail:"BB Lower এর কাছে ("+bbPct.toFixed(0)+"%) — সস্তা zone। Lower: ৳"+bbData.lower,color:"#4CAF50",score:bbW*0.7}); buyScore+=bbW*0.7; }
    else if (currentPrice >= bbData.upper) { signals.push({name:"BB",signal:"🔴 SELL",detail:"BB Upper (৳"+bbData.upper+") ছুঁয়েছে — Reversal সম্ভব",color:"#F44336",score:bbW}); sellScore+=bbW; }
    else if (bbPct > 75) { signals.push({name:"BB",signal:"🟠 CAUTION",detail:"BB Upper (৳"+bbData.upper+") এর কাছে ("+bbPct.toFixed(0)+"%) — সাবধান",color:"#FF9800",score:bbW*0.5}); sellScore+=bbW*0.5; }
    else { signals.push({name:"BB",signal:"⚪ NEUTRAL",detail:"BB Median (৳"+bbData.middle+") এর কাছে। Range: ৳"+bbData.lower+"-৳"+bbData.upper,color:"#4A6080",score:0}); }
  } 
 // EMA Signal (weight: 10)
  const emaW = 10;
  if (ema20 && ema50) {
    totalWeight += emaW;
    if (currentPrice > ema20 && ema20 > ema50) { signals.push({name:"EMA",signal:"🟢 BUY",detail:"Price > EMA20 > EMA50 — Perfect uptrend",color:"#00C896",score:emaW}); buyScore+=emaW; }
    else if (currentPrice > ema20) { signals.push({name:"EMA",signal:"🟡 BUY",detail:"Price > EMA20(৳"+ema20+") — Short term bullish",color:"#4CAF50",score:emaW*0.6}); buyScore+=emaW*0.6; }
    else if (currentPrice < ema20 && currentPrice < ema50) { signals.push({name:"EMA",signal:"🔴 SELL",detail:"Price < EMA20 < EMA50 — Downtrend",color:"#F44336",score:emaW}); sellScore+=emaW; }
    else { signals.push({name:"EMA",signal:"🟠 CAUTION",detail:"EMA20(৳"+ema20+") resistance হিসেবে কাজ করছে",color:"#FF9800",score:emaW*0.4}); sellScore+=emaW*0.4; }
  }

  // Stochastic (weight: 10) — DSE তে short-term খুব effective
  const stochW = 10;
  if (stoch) {
    totalWeight += stochW;
    if (stoch.k < 20) { signals.push({name:"Stoch",signal:"🟢 BUY",detail:"Stoch "+stoch.k+" — Oversold, buy signal",color:"#00C896",score:stochW}); buyScore+=stochW; }
    else if (stoch.k > 80) { signals.push({name:"Stoch",signal:"🔴 SELL",detail:"Stoch "+stoch.k+" — Overbought, sell signal",color:"#F44336",score:stochW}); sellScore+=stochW; }
    else { signals.push({name:"Stoch",signal:"⚪ NEUTRAL",detail:"Stoch "+stoch.k+" — Middle zone",color:"#4A6080",score:0}); }
  }

  // Williams %R (weight: 8)
  const willW = 8;
  if (willR !== null) {
    totalWeight += willW;
    if (willR < -80) { signals.push({name:"Williams %R",signal:"🟢 BUY",detail:"W%R "+willR+" — Oversold zone",color:"#00C896",score:willW}); buyScore+=willW; }
    else if (willR > -20) { signals.push({name:"Williams %R",signal:"🔴 SELL",detail:"W%R "+willR+" — Overbought zone",color:"#F44336",score:willW}); sellScore+=willW; }
    else { signals.push({name:"Williams %R",signal:"⚪ NEUTRAL",detail:"W%R "+willR+" — Normal range",color:"#4A6080",score:0}); }
  }

  // CCI (weight: 7)
  const cciW = 7;
  if (cci !== null) {
    totalWeight += cciW;
    if (cci < -100) { signals.push({name:"CCI",signal:"🟢 BUY",detail:"CCI "+cci+" — Oversold, mean reversion সম্ভব",color:"#00C896",score:cciW}); buyScore+=cciW; }
    else if (cci > 100) { signals.push({name:"CCI",signal:"🔴 SELL",detail:"CCI "+cci+" — Overbought",color:"#F44336",score:cciW}); sellScore+=cciW; }
    else { signals.push({name:"CCI",signal:"⚪ NEUTRAL",detail:"CCI "+cci+" — Normal",color:"#4A6080",score:0}); }
  }

  // Volume Analysis (weight: 15) — DSE তে অনেক গুরুত্বপূর্ণ
  const volW = 15;
  if (vma20 && last.vol) {
    totalWeight += volW;
    const volRatio = last.vol / vma20;
    const priceChange = prev?(currentPrice-prev.close)/prev.close*100:0;
    if (volRatio > 2 && priceChange > 0) { signals.push({name:"Volume",signal:"🟢 STRONG BUY",detail:"Breakout Volume! "+volRatio.toFixed(1)+"x VMA — Strong buying",color:"#00C896",score:volW}); buyScore+=volW; }
    else if (volRatio > 1.5 && priceChange > 0) { signals.push({name:"Volume",signal:"🟢 BUY",detail:"Volume "+volRatio.toFixed(1)+"x VMA — Bullish accumulation",color:"#4CAF50",score:volW*0.7}); buyScore+=volW*0.7; }
    else if (volRatio > 2 && priceChange < 0) { signals.push({name:"Volume",signal:"🔴 SELL",detail:"High Volume selloff! Distribution হচ্ছে",color:"#F44336",score:volW}); sellScore+=volW; }
    else if (volRatio < 0.5) { signals.push({name:"Volume",signal:"🟠 WEAK",detail:"Volume অনেক কম ("+volRatio.toFixed(1)+"x) — false signal হতে পারে",color:"#FF9800",score:0}); }
    else { signals.push({name:"Volume",signal:"⚪ NORMAL",detail:"Volume "+volRatio.toFixed(1)+"x VMA — স্বাভাবিক",color:"#4A6080",score:0}); }
  }

  // VWAP (weight: 5) — Institutional buying level
  const vwapW = 5;
  if (vwap) {
    totalWeight += vwapW;
    if (currentPrice < vwap) { signals.push({name:"VWAP",signal:"🟢 BUY",detail:"Price ৳"+currentPrice+" < VWAP ৳"+vwap+" — Institutional buy zone",color:"#00C896",score:vwapW}); buyScore+=vwapW; }
    else { signals.push({name:"VWAP",signal:"🔴 CAUTION",detail:"Price ৳"+currentPrice+" > VWAP ৳"+vwap+" — উপরে আছে",color:"#FF9800",score:vwapW*0.3}); sellScore+=vwapW*0.3; }
  }

  // ── Composite Score ────────────────────────────────────────────
  const netBuyScore = buyScore - sellScore;
  const maxPossible = totalWeight;
  const compositeScore = Math.round((netBuyScore / maxPossible) * 100);

  // ── Master Signal ──────────────────────────────────────────────
  let masterSignal, masterColor, masterBg, actionDetail;

  if (isSideways) {
    // Sideways: BB + RSI এর উপর বেশি নির্ভর
    if (rsi && rsi < 35 && bb && currentPrice <= bb.lower) {
      masterSignal = "🚀 SIDEWAYS BUY";
      masterColor = "#00C896";
      masterBg = "#00C89618";
      actionDetail = "Sideways stock! BB Lower + RSI Oversold — Range এর নিচে কিনুন, উপরে বেচুন।";
    } else if (rsi && rsi > 65 && bb && currentPrice >= bb.upper) {
      masterSignal = "🔴 SIDEWAYS SELL";
      masterColor = "#F44336";
      masterBg = "#F4433618";
      actionDetail = "Sideways stock! BB Upper + RSI Overbought — Range এর উপরে বেচুন।";
    } else {
      masterSignal = "⚪ SIDEWAYS HOLD";
      masterColor = "#4A6080";
      masterBg = "#4A608018";
      actionDetail = "Sideways range এ আছে। BB Lower এর কাছে কিনুন (৳"+( bb?bb.lower:"-")+"), BB Upper এ বেচুন (৳"+(bb?bb.upper:"-")+")।";
    }
  } else if (compositeScore >= 40) {
    masterSignal = "🚀 STRONG BUY";
    masterColor = "#00C896";
    masterBg = "#00C89618";
    actionDetail = "সব major indicator buy signal দিচ্ছে। এখনই কিনুন।";
  } else if (compositeScore >= 20) {
    masterSignal = "✅ BUY";
    masterColor = "#4CAF50";
    masterBg = "#4CAF5018";
    actionDetail = "বেশিরভাগ indicator positive। কিনতে পারেন।";
  } else if (compositeScore >= -10) {
    masterSignal = "🟡 NEUTRAL";
    masterColor = "#FFC107";
    masterBg = "#FFC10718";
    actionDetail = "Mixed signal। নিশ্চিত না হয়ে অপেক্ষা করুন।";
  } else if (compositeScore >= -30) {
    masterSignal = "🟠 WEAK SELL";
    masterColor = "#FF9800";
    masterBg = "#FF980018";
    actionDetail = "বেশিরভাগ indicator negative। সাবধান থাকুন।";
  } else {
    masterSignal = "🔴 STRONG SELL";
    masterColor = "#F44336";
    masterBg = "#F4433618";
    actionDetail = "Sell signal! Position থাকলে বের হন।";
  }

  return {
    signals, buyScore, sellScore, compositeScore,
    masterSignal, masterColor, masterBg, actionDetail,
    isSideways, isTrending, rangeWidth,
    indicators: { rsi, macd:macdData, bb, ema20, ema50, sma200, stoch, willR, cci, adxData, obv, vwap, vma20 },
    sr: findSRLevels(candles)
  };
};

// ── Support/Resistance Auto-detect ─────────────────────────────────
export const findSRLevels = (candles) => {
  if (!candles || candles.length < 5) return { supports: [], resistances: [], strongSupport: null, strongResistance: null };

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  // Find pivot highs (resistance) and pivot lows (support)
  const pivotHighs = [];
  const pivotLows = [];

  for (let i = 2; i < candles.length - 2; i++) {
    // Pivot High: higher than 2 candles on each side
    if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
      pivotHighs.push({ price: highs[i], date: candles[i].date, touches: 1 });
    }
    // Pivot Low: lower than 2 candles on each side
    if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
      pivotLows.push({ price: lows[i], date: candles[i].date, touches: 1 });
    }
  }

  // Cluster nearby levels (within 1.5%)
  const cluster = (levels) => {
    const clustered = [];
    levels.sort((a, b) => a.price - b.price);
    levels.forEach(lvl => {
      const existing = clustered.find(c => Math.abs(c.price - lvl.price) / c.price < 0.015);
      if (existing) {
        existing.price = (existing.price * existing.touches + lvl.price) / (existing.touches + 1);
        existing.touches++;
      } else {
        clustered.push({ ...lvl });
      }
    });
    return clustered.sort((a, b) => b.touches - a.touches);
  };

  const supports = cluster(pivotLows).filter(l => l.price < currentPrice).slice(0, 4);
  const resistances = cluster(pivotHighs).filter(l => l.price > currentPrice).slice(0, 4);

  // Strong = most touches or nearest to price
  const strongSupport = supports.length > 0 ? supports.sort((a,b) => b.touches - a.touches)[0] : null;
  const strongResistance = resistances.length > 0 ? resistances.sort((a,b) => b.touches - a.touches)[0] : null;

  // Sell signal: price near strong resistance (within 2%)
  const sellSignal = strongResistance && (strongResistance.price - currentPrice) / currentPrice < 0.02
    ? "🔴 Resistance কাছে — SELL সিগনাল!"
    : strongResistance && (strongResistance.price - currentPrice) / currentPrice < 0.05
    ? "⚠️ Resistance এর কাছাকাছি"
    : null;

  return { supports, resistances, strongSupport, strongResistance, sellSignal };
}; 
