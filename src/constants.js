// ── Admin Configuration ─────────────────────────────────────────
export const ADMIN_EMAIL = "admin@sharemarket.com";
export const SUB_ADMIN_EMAILS = []; // add extra admin emails here

export const isAdmin = (email) => email === ADMIN_EMAIL || SUB_ADMIN_EMAILS.includes(email);

// ── Local Storage ─────────────────────────────────────────────
export const SK = "dse-v7";
export const TODAY = new Date().toISOString().split("T")[0];
export const COMM = 0.003; // legacy fallback commission

// ── Color Palette ─────────────────────────────────────────────
export const C = {
  bg: "#070D1A",
  card: "#0F1923",
  border: "#1A2D4A",
  text: "#E8EAF0",
  muted: "#4A6080",
  accent: "#00C896",
  blue: "#0080FF",
  yellow: "#FFC107",
  red: "#F44336",
  orange: "#FF9800",
  purple: "#9C27B0",
  gold: "#FFD700",
};

// ── Broker Defaults ─────────────────────────────────────────────
export const DEFAULT_BROKERS = [
  { id: "Ecosoft",     name: "Ecosoft",     commission: 0.30, withdrawFee: 0 },
  { id: "Lankabangla", name: "Lankabangla", commission: 0.30, withdrawFee: 0 },
  { id: "অন্য",        name: "অন্য",        commission: 0.35, withdrawFee: 0 },
  { id: "BRAC",        name: "BRAC",        commission: 0.30, withdrawFee: 0 },
  { id: "EBL",         name: "EBL",         commission: 0.30, withdrawFee: 0 },
];

export const BROKERS = ["Ecosoft", "Lankabangla", "অন্য", "BRAC", "EBL", "City", "Prime"];

export const SECTORS = ["সব", "Bank", "Insurance", "Pharma", "Textile", "IT", "Fuel & Power", "NBFI", "Food", "Engineering", "অন্যান্য"];

// ── Default User Profile ─────────────────────────────────────────
export const DEFAULT_PROFILE = {
  displayName: "", phone: "", whatsapp: "", bkash: "",
  defaultBroker: "Ecosoft",
  brokers: DEFAULT_BROKERS,
  bankAccounts: [{ id: "b1", name: "BRAC Bank", accountNo: "", branch: "" }],
  joinDate: TODAY,
  monthlyFee: 1000,
  isActive: true,
  lastPaymentDate: null,
  lastPaymentAmount: 0,
};

// ── Indicator Explanation Database ───────────────────────────────
export const INDICATOR_EXPLAIN = {
  "RSI": {
    what: "Relative Strength Index — ০ থেকে ১০০ এর মধ্যে থাকে।",
    dse: "DSE তে RSI < 30 = Oversold (কিনুন), RSI > 70 = Overbought (বেচুন)। Bangladesh market এ RSI 45-65 = healthy zone।",
    use: "Short-term swing trade এর জন্য সবচেয়ে reliable indicator DSE তে।"
  },
  "MACD": {
    what: "Moving Average Convergence Divergence — দুটো EMA এর পার্থক্য।",
    dse: "MACD > 0 ও বাড়ছে = Buy। MACD < 0 ও কমছে = Sell। DSE তে MACD crossover অনেক accurate signal দেয়।",
    use: "Trend direction confirm করতে RSI এর সাথে use করুন।"
  },
  "BB": {
    what: "Bollinger Bands — Price এর উপরে/নিচে ২টি band।",
    dse: "DSE sideways stock এর জন্য সেরা। Lower band ছুঁলে কিনুন, Upper band ছুঁলে বেচুন।",
    use: "Sideways market এ সবচেয়ে effective। Trending market এ কম কাজ করে।"
  },
  "EMA": {
    what: "Exponential Moving Average — সাম্প্রতিক price কে বেশি গুরুত্ব দেয়।",
    dse: "Price > EMA20 = Short-term bullish। Price > EMA50 = Medium-term bullish। DSE big investors EMA use করেন।",
    use: "Support/Resistance level হিসেবে কাজ করে। EMA20 ভাঙলে exit করুন।"
  },
  "Stoch": {
    what: "Stochastic Oscillator — Recent high/low এর তুলনায় current price।",
    dse: "Stoch < 20 = Oversold (buy signal), Stoch > 80 = Overbought (sell signal)।",
    use: "RSI এর সাথে একসাথে দেখলে false signal কমে। Short-term entry/exit এর জন্য ভালো।"
  },
  "Williams %R": {
    what: "Williams Percent Range — Stochastic এর মতোই, কিন্তু উল্টো।",
    dse: "W%R -80 এর নিচে = Oversold, -20 এর উপরে = Overbought। DSE তে fast reversal detect করে।",
    use: "Very short-term (1-5 দিন) trade এর জন্য ভালো signal দেয়।"
  },
  "CCI": {
    what: "Commodity Channel Index — Normal থেকে কতটা দূরে আছে।",
    dse: "CCI < -100 = Oversold/Undervalued, CCI > +100 = Overbought। DSE তে trend strength মাপে।",
    use: "Breakout confirm করতে ভালো। CCI 0 cross করলে trend change হতে পারে।"
  },
  "Volume": {
    what: "কতগুলো শেয়ার trade হয়েছে — সবচেয়ে গুরুত্বপূর্ণ indicator।",
    dse: "DSE তে Volume সবকিছুর আগে। High volume + price up = strong buy। High volume + price down = strong sell। Low volume = fake signal।",
    use: "অন্য সব indicator Volume দিয়ে confirm করুন। Volume ছাড়া signal বিশ্বাস করবেন না।"
  },
  "VWAP": {
    what: "Volume Weighted Average Price — Institutional buyers এর average price।",
    dse: "Price < VWAP = Institutional buy zone (সস্তা)। Price > VWAP = উপরে আছে (সতর্ক)।",
    use: "Big investors (mutual fund, institution) কোথায় কিনছেন সেটা বোঝা যায়।"
  },
};
