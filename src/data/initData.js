// ══════════════════════════════════════════════════════════════
// INITIAL SEED DATA
// Used only when a user has no data yet (fresh signup / no
// localStorage). Real data is loaded from Firestore per-user
// once they've saved anything.
// ══════════════════════════════════════════════════════════════

export const INIT_STOCKS = [
  { id:1,  name:"SIMTEX",     sector:"Textile",      cat:"A", price:27.5,  eps:1.28,  pe:20.94, nav:22.39, div:10, rsi:65.85, macd:0.8,  vol:3460000, vma20:2800000, ema20:26.8,  sma50:25.4, ret6m:20, inst:7.57,  circuit:29.5, totalShares:7960000,  updatedAt:"2026-07-02" },
  { id:2,  name:"MONOSPOOL",  sector:"Engineering",  cat:"A", price:114.3, eps:4.12,  pe:27.74, nav:41.83, div:15, rsi:64.55, macd:2.5,  vol:771667,  vma20:600000,  ema20:110.5, sma50:105.2,ret6m:21, inst:4.13,  circuit:123.3,totalShares:3920000,  updatedAt:"2026-07-02" },
  { id:3,  name:"SAPORTL",    sector:"Services & Real Estate", cat:"A", price:52.5, eps:2.85, pe:24.31, nav:35.37, div:18, rsi:53.51, macd:-0.2, vol:5143123, vma20:3381708, ema20:52.4, sma50:50.8, ret6m:23, inst:10.23, circuit:56.3, totalShares:23690000, updatedAt:"2026-07-15",
    bb_upper:58.6, bb_lower:46.3, support1:46.3, support2:42.7, resistance1:56.3, resistance2:64.3,
    w52h:64.3, w52l:22.3, ycp:51.2,
    trend:"consolidation",
    analysisNote:{
      trend:"২০২৪ থেকে ২০২৫ পর্যন্ত strong uptrend (৳২০ → ৳৬৪), তারপর correction, এখন ৳৪৬-৳৫৩ range এ consolidation।",
      bb:"BB Upper ৳৫৮.৬, Median ৳৫২.৪, Lower ৳৪৬.৩ — price এখন median এর কাছে ৳৫২.৫। Sideways range এ আছে।",
      rsiNote:"RSI ৫৩.৫১ — neutral zone, না overbought না oversold। কোনো extreme signal নেই।",
      macdNote:"MACD -০.২ (Signal 0.0, Histogram -০.২) — সামান্য bearish, কিন্তু almost zero। Crossover আসতে পারে।",
      volumeNote:"৯০ দিনে avg volume ৩৩.৮ লাখ। আজ ৫১.৪ লাখ — VMA এর ১.৫x, above average। Interest বাড়ছে।",
      fundamental:"EPS ২.৮৫ (annualized), P/E ২৪.৩১, NAV ৳৩৫.৩৭, Div ১৮% cash, Institute ১০.২৩%। ৫২W High ৳৬৪.৩, Low ৳২২.৩।",
      strategy:"৳৪৮-৪৯ এ নামলে কিনুন (BB Lower দিকে)। অথবা ৳৫৪+ break করলে এবং MACD positive হলে কিনুন। Target: ৳৫৬.৩ (Circuit)। Stop Loss: ৳৪৬.৩।",
      updatedBy:"Claude Analysis — Chart + Fundamental",
      chartPeriod:"2024-2026 (Daily)"
    }
  },
  { id:4,  name:"PROVATIINS", sector:"Insurance",    cat:"A", price:58.9,  eps:2.8,   pe:21.0,  nav:32.1,  div:8,  rsi:76.66, macd:4.4,  vol:2511187, vma20:1800000, ema20:55.3,  sma50:51.6, ret6m:35, inst:6.2,   circuit:64.8, totalShares:5000000,  updatedAt:"2026-07-02" },
  { id:5,  name:"BRACBANK",   sector:"Bank",         cat:"A", price:65.3,  eps:5.8,   pe:11.3,  nav:42.5,  div:20, rsi:52.0,  macd:0.3,  vol:4624118, vma20:3500000, ema20:64.1,  sma50:62.5, ret6m:18, inst:28.5,  circuit:71.8, totalShares:12000000, updatedAt:"2026-07-02" },
  { id:6,  name:"CVOPRL",     sector:"Fuel & Power", cat:"A", price:167.1, eps:6.77,  pe:24.68, nav:31.9,  div:20, rsi:56.92, macd:1.3,  vol:154363,  vma20:120000,  ema20:162.4, sma50:158.9,ret6m:13, inst:19.23, circuit:181.7,totalShares:3030000,  updatedAt:"2026-07-02" },
  { id:7,  name:"EPGL",       sector:"Fuel & Power", cat:"B", price:19.6,  eps:1.1,   pe:17.8,  nav:14.2,  div:5,  rsi:55.12, macd:0.4,  vol:673551,  vma20:500000,  ema20:19.1,  sma50:18.6, ret6m:12, inst:8.3,   circuit:21.6, totalShares:5000000,  updatedAt:"2026-07-02" },
  { id:8,  name:"LOVELLO",    sector:"Food",         cat:"A", price:71.9,  eps:3.5,   pe:20.5,  nav:38.2,  div:15, rsi:41.98, macd:-1.9, vol:1330933, vma20:1500000, ema20:73.8,  sma50:76.2, ret6m:-5, inst:5.1,   circuit:79.1, totalShares:4000000,  updatedAt:"2026-07-02" },
  { id:9,  name:"JAMUNABANK", sector:"Bank",         cat:"A", price:24.2,  eps:2.1,   pe:11.5,  nav:18.9,  div:10, rsi:49.53, macd:-0.2, vol:2304420, vma20:1900000, ema20:24.5,  sma50:25.1, ret6m:8,  inst:15.2,  circuit:26.6, totalShares:19000000, updatedAt:"2026-07-02" },
  { id:10, name:"KPPL",       sector:"Engineering",  cat:"A", price:16.2,  eps:1.1,   pe:14.7,  nav:12.5,  div:8,  rsi:58.39, macd:0.0,  vol:654750,  vma20:500000,  ema20:15.8,  sma50:15.2, ret6m:10, inst:6.8,   circuit:17.8, totalShares:6000000,  updatedAt:"2026-07-02" },
  { id:11, name:"DESHBANDHU", sector:"Engineering",  cat:"B", price:21.3,  eps:-3.85, pe:-5.43, nav:11.66, div:0,  rsi:57.89, macd:0.5,  vol:773817,  vma20:600000,  ema20:20.6,  sma50:19.8, ret6m:24, inst:21.34, circuit:22.8, totalShares:6140000,  updatedAt:"2026-07-02" },
  { id:12, name:"ACMEPL",     sector:"Pharma",       cat:"A", price:23.3,  eps:1.8,   pe:12.9,  nav:19.5,  div:8,  rsi:45.44, macd:-0.1, vol:1430000, vma20:1200000, ema20:23.8,  sma50:24.5, ret6m:5,  inst:9.8,   circuit:25.6, totalShares:7000000,  updatedAt:"2026-07-02" },
  { id:13, name:"MONNOFABR",  sector:"Textile",      cat:"A", price:22.4,  eps:0.9,   pe:24.9,  nav:18.2,  div:5,  rsi:48.33, macd:-0.2, vol:1010000, vma20:900000,  ema20:22.8,  sma50:23.4, ret6m:-3, inst:3.2,   circuit:24.6, totalShares:8000000,  updatedAt:"2026-07-02" },
  { id:14, name:"HAKKANIPUL", sector:"NBFI",         cat:"A", price:80.0,  eps:0.41,  pe:195.1, nav:24.32, div:5,  rsi:47.54, macd:-0.2, vol:155061,  vma20:140000,  ema20:80.5,  sma50:79.2, ret6m:15, inst:4.58,  circuit:85.4, totalShares:1900000,  updatedAt:"2026-07-02" },
  { id:15, name:"MALEKSPIN",  sector:"Textile",      cat:"A", price:34.0,  eps:5.39,  pe:6.31,  nav:64.15, div:10, rsi:76.38, macd:0.7,  vol:8895183, vma20:4000000, ema20:30.2,  sma50:27.8, ret6m:46, inst:15.45, circuit:35.4, totalShares:19360000, updatedAt:"2026-07-02" },
  { id:16, name:"SQURPHARMA", sector:"Pharma",       cat:"A", price:224.1, eps:18.5,  pe:12.1,  nav:98.2,  div:30, rsi:58.0,  macd:1.2,  vol:765549,  vma20:600000,  ema20:220.5, sma50:215.8,ret6m:12, inst:22.1,  circuit:246.5,totalShares:4000000,  updatedAt:"2026-07-02" },
];


export const INIT_PORT = [
  { id:1,  stock:"EPGL",       broker:"Ecosoft",     shares:7300,  buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0, buyDate:"2026-06-15", customSellTarget:null, withdrawals:[] },
  { id:2,  stock:"EPGL",       broker:"Lankabangla", shares:12000, buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0, buyDate:"2026-06-15", customSellTarget:null, withdrawals:[] },
  { id:3,  stock:"HAKKANIPUL", broker:"Ecosoft",     shares:2500,  buyRate:80.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0, buyDate:"2026-06-20", customSellTarget:null, withdrawals:[] },
  { id:4,  stock:"HAKKANIPUL", broker:"অন্য",        shares:5000,  buyRate:81.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0, buyDate:"2026-06-20", customSellTarget:null, withdrawals:[] },
  { id:5,  stock:"LOVELLO",    broker:"Ecosoft",     shares:9630,  buyRate:71.54, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0, buyDate:"2026-06-10", customSellTarget:null, withdrawals:[] },
  { id:6,  stock:"LOVELLO",    broker:"Lankabangla", shares:5087,  buyRate:75.17, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0, buyDate:"2026-06-10", customSellTarget:null, withdrawals:[] },
  { id:7,  stock:"MONNOFABR",  broker:"Ecosoft",     shares:23526, buyRate:21.77, currentPrice:22.4, target1:23.9, target2:25.0, stopLoss:21.0, trailingSL:21.0, realized:0, buyDate:"2026-05-28", customSellTarget:null, withdrawals:[] },
  { id:8,  stock:"KPPL",       broker:"অন্য",        shares:10000, buyRate:16.25, currentPrice:16.2, target1:17.0, target2:18.0, stopLoss:14.8, trailingSL:14.8, realized:0, buyDate:"2026-06-05", customSellTarget:null, withdrawals:[] },
  { id:9,  stock:"DESHBANDHU", broker:"Lankabangla", shares:10000, buyRate:20.86, currentPrice:21.3, target1:21.8, target2:22.5, stopLoss:19.8, trailingSL:19.8, realized:0, buyDate:"2026-06-18", customSellTarget:null, withdrawals:[] },
  { id:10, stock:"ACMEPL",     broker:"Lankabangla", shares:6400,  buyRate:26.28, currentPrice:23.3, target1:24.1, target2:25.6, stopLoss:22.0, trailingSL:22.0, realized:0, buyDate:"2026-06-01", customSellTarget:null, withdrawals:[] },
  { id:11, stock:"JAMUNABANK", broker:"Lankabangla", shares:19500, buyRate:24.13, currentPrice:24.2, target1:25.0, target2:25.9, stopLoss:22.5, trailingSL:22.5, realized:0, buyDate:"2026-06-22", customSellTarget:null, withdrawals:[] },
];
