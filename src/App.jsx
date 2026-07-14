import { useState, useMemo, useCallback, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// ── Firebase Setup ─────────────────────────────────────────────
const _fbApp = initializeApp({
  apiKey: "AIzaSyCfWlWpPOW5igAZjRaLnWHHa7UcAFFnWcE",
  authDomain: "dse-trading-dashboard.firebaseapp.com",
  projectId: "dse-trading-dashboard",
  storageBucket: "dse-trading-dashboard.firebasestorage.app",
  messagingSenderId: "1373992881",
  appId: "1:1373992881:web:540e6331dd4cade8076f90"
});
const _auth = getAuth(_fbApp);
const _db = getFirestore(_fbApp);
const _gp = new GoogleAuthProvider();
const _signIn = () => signInWithPopup(_auth, _gp);
const _signOut = () => signOut(_auth);
const _getProfile = async (uid) => { try { const s=await getDoc(doc(_db,"users",uid)); return s.exists()?s.data():null; } catch { return null; } };
const _saveProfile = async (uid, data) => { try { await setDoc(doc(_db,"users",uid),data,{merge:true}); } catch(e){console.log(e);} };
const _getData = async (uid) => { try { const s=await getDoc(doc(_db,"users",uid,"appdata","main")); return s.exists()?s.data():null; } catch { return null; } };
const _saveData = async (uid, data) => { try { await setDoc(doc(_db,"users",uid,"appdata","main"),{...data,updatedAt:new Date().toISOString()},{merge:true}); } catch(e){console.log(e);} };

const SK = "dse-v7-local";
const TODAY = new Date().toISOString().split("T")[0];

const DEFAULT_BROKERS = [
  { id:"Ecosoft",     name:"Ecosoft",     commission:0.30, withdrawFee:0 },
  { id:"Lankabangla", name:"Lankabangla", commission:0.30, withdrawFee:0 },
  { id:"অন্য",        name:"অন্য",        commission:0.35, withdrawFee:0 },
  { id:"BRAC",        name:"BRAC",        commission:0.30, withdrawFee:0 },
  { id:"EBL",         name:"EBL",         commission:0.30, withdrawFee:0 },
];

const DEFAULT_PROFILE = {
  displayName:"", email:"", photoURL:"", phone:"",
  defaultBroker:"Ecosoft",
  brokers: DEFAULT_BROKERS,
  bankAccounts:[{ id:"b1", name:"BRAC Bank", accountNo:"", branch:"" }],
  joinDate: new Date().toISOString().split("T")[0],
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("bn-BD") : "—";
const daysBetween = (a,b) => Math.floor((new Date(b)-new Date(a))/86400000);
const load = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (d) => { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} };

// ── INIT_STOCKS — EMA20, SMA50, VMA20 যোগ করা হয়েছে ─────────────────
const INIT_STOCKS = [
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

const INIT_PORT = [
  { id:1,  stock:"EPGL",       broker:"Ecosoft",     shares:7300,  buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0, buyDate:"2026-06-15", customSellTarget:null },
  { id:2,  stock:"EPGL",       broker:"Lankabangla", shares:12000, buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0, buyDate:"2026-06-15", customSellTarget:null },
  { id:3,  stock:"HAKKANIPUL", broker:"Ecosoft",     shares:2500,  buyRate:80.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0, buyDate:"2026-06-20", customSellTarget:null },
  { id:4,  stock:"HAKKANIPUL", broker:"অন্য",        shares:5000,  buyRate:81.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0, buyDate:"2026-06-20", customSellTarget:null },
  { id:5,  stock:"LOVELLO",    broker:"Ecosoft",     shares:9630,  buyRate:71.54, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0, buyDate:"2026-06-10", customSellTarget:null },
  { id:6,  stock:"LOVELLO",    broker:"Lankabangla", shares:5087,  buyRate:75.17, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0, buyDate:"2026-06-10", customSellTarget:null },
  { id:7,  stock:"MONNOFABR",  broker:"Ecosoft",     shares:23526, buyRate:21.77, currentPrice:22.4, target1:23.9, target2:25.0, stopLoss:21.0, trailingSL:21.0, realized:0, buyDate:"2026-05-28", customSellTarget:null },
  { id:8,  stock:"KPPL",       broker:"অন্য",        shares:10000, buyRate:16.25, currentPrice:16.2, target1:17.0, target2:18.0, stopLoss:14.8, trailingSL:14.8, realized:0, buyDate:"2026-06-05", customSellTarget:null },
  { id:9,  stock:"DESHBANDHU", broker:"Lankabangla", shares:10000, buyRate:20.86, currentPrice:21.3, target1:21.8, target2:22.5, stopLoss:19.8, trailingSL:19.8, realized:0, buyDate:"2026-06-18", customSellTarget:null },
  { id:10, stock:"ACMEPL",     broker:"Lankabangla", shares:6400,  buyRate:26.28, currentPrice:23.3, target1:24.1, target2:25.6, stopLoss:22.0, trailingSL:22.0, realized:0, buyDate:"2026-06-01", customSellTarget:null },
  { id:11, stock:"JAMUNABANK", broker:"Lankabangla", shares:19500, buyRate:24.13, currentPrice:24.2, target1:25.0, target2:25.9, stopLoss:22.5, trailingSL:22.5, realized:0, buyDate:"2026-06-22", customSellTarget:null },
];

const SECTORS=["সব","Bank","Insurance","Pharma","Textile","IT","Fuel & Power","NBFI","Food","Engineering","অন্যান্য"];
const BROKERS=["Ecosoft","Lankabangla","অন্য","BRAC","EBL","City","Prime"];
const COMM=0.003;
const TODAY=new Date().toISOString().split("T")[0];

// ── Date Helpers ──────────────────────────────────────────────────────
function daysSince(dateStr){
  if(!dateStr)return null;
  return Math.floor((new Date()-new Date(dateStr))/86400000);
}
function staleness(dateStr){
  const d=daysSince(dateStr);
  if(d===null)return{label:"N/A",color:"#4A6080"};
  if(d===0)return{label:"আজ ✅",color:"#00C896"};
  if(d===1)return{label:"গতকাল",color:"#4CAF50"};
  if(d<=3)return{label:d+" দিন আগে",color:"#FFC107"};
  if(d<=7)return{label:d+" দিন আগে ⚠️",color:"#FF9800"};
  return{label:d+" দিন আগে 🔴",color:"#F44336"};
}

// ── Trailing Stop Loss Calculator ─────────────────────────────────────
// যদি price >= T1 হয়, তাহলে trailing SL = buyRate (profit lock)
// যদি price >= T2 হয়, তাহলে trailing SL = T1 (আরো protect)
function calcTrailingSL(p){
  const t1=p.target1||p.str&&p.str.t1;
  const t2=p.target2||p.str&&p.str.t2;
  const base=p.trailingSL||p.stopLoss;
  if(p.currentPrice>=t2) return Math.max(base, t1||p.buyRate);
  if(p.currentPrice>=t1) return Math.max(base, p.buyRate);
  return base;
}

// ── Dynamic Strategy ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
// ENTERPRISE STRATEGY ENGINE v3
// Rules:
//   1. T1 < T2 < T3 — always guaranteed
//   2. 0d = Pure Natural TA (no dayMult)
//   3. Conflicting indicators resolved with clear explanation
//   4. Minimum gaps enforced: T1 min +2.5%, T2 min +6%
// ════════════════════════════════════════════════════════════════
function generateStrategy(s,days,portShares){
  portShares=portShares||0;
  const p=s.price;
  const rsi=s.rsi||50;
  const macd=s.macd||0;
  const vma20=s.vma20||1000000;
  const ema20=s.ema20||p;
  const sma50=s.sma50||p;
  const isAboveEMA=p>ema20;
  const isAboveSMA=p>sma50;
  const isBreakoutVol=s.vol>vma20*2;
  const isHighVol=s.vol>vma20*1.3;
  const isOversold=rsi<35;
  const isOverbought=rsi>68;
  const isBullMACD=macd>0.3;
  const isBearMACD=macd<-0.3;
  const isPump=s.vol>5000000&&rsi>70&&s.ret6m>40;
  const isFundStrong=s.eps>3&&s.pe>0&&s.pe<20;
  const isUnderval=s.nav>0&&p<s.nav*1.5;
  const volM=(s.vol/1000000).toFixed(1);
  const holdNote=portShares>0?"আপনার "+portShares.toLocaleString()+" shares":"";
  const maSignal=(isAboveEMA&&isAboveSMA)?"🟢 EMA+SMA উপরে":isAboveEMA?"🟡 EMA উপরে":isAboveSMA?"🟡 SMA উপরে":"🔴 MA এর নিচে";

  // Conflict detection: RSI and MACD pointing opposite directions
  const rsiSaysBuy=rsi<40;
  const rsiSaysSell=rsi>65;
  const conflictBullRSIBearMACD=rsiSaysBuy&&isBearMACD;
  const conflictBearRSIBullMACD=rsiSaysSell&&isBullMACD;
  const hasConflict=conflictBullRSIBearMACD||conflictBearRSIBullMACD;
  let conflictNote="";
  if(conflictBullRSIBearMACD) conflictNote="⚠️ Conflict: RSI "+rsi.toFixed(0)+" (buy zone) কিন্তু MACD "+macd.toFixed(2)+" (bearish)। DSE rule: Volume দেখুন — volume বাড়লে তবেই কিনুন।";
  if(conflictBearRSIBullMACD) conflictNote="⚠️ Conflict: RSI "+rsi.toFixed(0)+" (sell zone) কিন্তু MACD "+macd.toFixed(2)+" (bullish momentum)। Trailing SL tight রাখুন।";

  // ── 0d Natural Mode ─────────────────────────────────────────
  if(days===0){
    const sl=+(p*0.93).toFixed(2);
    let t1,t2,t3,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,priority;

    if(isPump){
      t1=+(p*1.03).toFixed(2);t2=+(p*1.06).toFixed(2);t3=null;
      sellT1=70;sellT2=25;sellT3=5;risk="🔴 HIGH";priority=5;
      buySignal="🔴 Pump — কিনবেন না";buyZone="—";
      buyStr="Pump pattern! RSI "+rsi.toFixed(0)+", Volume "+volM+"M। এখন কিনলে আটকে যাবেন।";
      sellStr="এখনই sell করুন। Pump stock যেকোনো সময় crash করতে পারে।";
    } else if(hasConflict){
      t1=+(p*1.04).toFixed(2);t2=+(p*1.09).toFixed(2);t3=null;
      sellT1=40;sellT2=40;sellT3=20;risk="🟡 MEDIUM";priority=3;
      buySignal="⚠️ Mixed Signal";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;
      buyStr=conflictNote;
      sellStr="Mixed signal — নিশ্চিত না হয়ে অপেক্ষা করুন। EMA20 (৳"+ema20.toFixed(2)+") support confirm হলে তবেই কিনুন।";
    } else if(isOversold&&(isBullMACD||isBreakoutVol)){
      t1=+(p*1.06).toFixed(2);t2=+(p*1.12).toFixed(2);t3=s.nav&&s.nav>p*1.15?+(s.nav*0.85).toFixed(2):null;
      sellT1=40;sellT2=40;sellT3=20;risk="🟢 LOW";priority=1;
      buySignal="🚀 Strong Natural Buy";buyZone="৳"+(p*0.98).toFixed(2)+"-৳"+p;
      buyStr="RSI "+rsi.toFixed(0)+" Oversold + "+(isBullMACD?"MACD "+macd.toFixed(2)+" Bullish":"Volume Breakout "+volM+"M")+"। "+(isAboveEMA?"Price > EMA20 — Uptrend নিশ্চিত।":"EMA20 (৳"+ema20.toFixed(2)+") এর উপরে গেলে সিগনাল আরো শক্তিশালী হবে।");
      sellStr="T1 (৳"+(+(p*1.06).toFixed(2))+") এ 40% sell। T1 hit হলে SL buyRate এ move করুন (Trailing SL)।";
    } else if(isOverbought){
      t1=+(p*1.03).toFixed(2);t2=+(p*1.06).toFixed(2);t3=null;
      sellT1=60;sellT2=35;sellT3=5;risk="🔴 HIGH";priority=5;
      buySignal="🔴 এখন কিনবেন না";buyZone="RSI "+(rsi-15).toFixed(0)+" নামলে";
      buyStr="RSI "+rsi.toFixed(0)+" Overbought। "+conflictNote+" RSI ৫০ এর নিচে নামলে এবং EMA20 (৳"+ema20.toFixed(2)+") support এ কিনুন।";
      sellStr="Position থাকলে এখনই sell করুন। Reversal যেকোনো সময় আসতে পারে।";
    } else if(isAboveEMA&&isAboveSMA&&isBullMACD){
      t1=+(p*1.06).toFixed(2);t2=+(p*1.12).toFixed(2);t3=+(p*1.18).toFixed(2);
      sellT1=35;sellT2=40;sellT3=25;risk="🟢 LOW-MED";priority=2;
      buySignal="✅ Natural Buy";buyZone="৳"+ema20.toFixed(2)+"-৳"+p;
      buyStr="Price > EMA20 (৳"+ema20.toFixed(2)+") > SMA50 (৳"+sma50.toFixed(2)+"). MACD "+macd.toFixed(2)+" bullish। Uptrend confirmed।"+(isBreakoutVol?" Volume "+volM+"M — Breakout!":"");
      sellStr="RSI "+rsi.toFixed(0)+" এখন OK। RSI 68+ হলে বা EMA20 ভাঙলে sell করুন।";
    } else if(!isAboveEMA&&isBearMACD){
      t1=+(p*1.04).toFixed(2);t2=+(p*1.08).toFixed(2);t3=null;
      sellT1=50;sellT2=40;sellT3=10;risk="🔴 HIGH";priority=5;
      buySignal="🔴 Downtrend — এড়িয়ে চলুন";buyZone="EMA20 (৳"+ema20.toFixed(2)+") এর উপরে গেলে";
      buyStr="Price < EMA20 (৳"+ema20.toFixed(2)+"). MACD "+macd.toFixed(2)+" Bearish। Downtrend এ আছে।";
      sellStr="এখনই sell করুন। EMA20 এর নিচে থাকলে further drop হতে পারে।";
    } else {
      t1=+(p*1.05).toFixed(2);t2=+(p*1.10).toFixed(2);t3=null;
      sellT1=40;sellT2=45;sellT3=15;risk="🟡 MEDIUM";priority=3;
      buySignal="🟡 Sideways — অপেক্ষা করুন";buyZone="৳"+(p*0.96).toFixed(2)+"-৳"+(p*0.98).toFixed(2);
      buyStr="Sideways market। RSI "+rsi.toFixed(0)+" (neutral)। BB Lower এ কিনুন, BB Upper এ বেচুন। EMA20: ৳"+ema20.toFixed(2)+"।";
      sellStr="Range এর উপরে (BB Upper বা Resistance) গেলে sell করুন।";
    }
    // Safety clamp T1<T2<T3
    t1=Math.max(+(p*1.025).toFixed(2),t1);
    t2=Math.max(+(t1*1.04).toFixed(2),t2);
    if(t3) t3=Math.max(+(t2*1.04).toFixed(2),t3);
    if(s.circuit&&t1>=s.circuit*0.97) t1=+(s.circuit*0.94).toFixed(2);
    if(s.circuit&&t2>=s.circuit) t2=+(s.circuit*0.97).toFixed(2);
    if(t2<=t1) t2=+(t1*1.04).toFixed(2);
    return{t1,t2,t3,sl,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,holding:"Natural",holdNote,priority,maSignal,isBreakoutVol,isAboveEMA,isAboveSMA,hasConflict,conflictNote};
  }

  // ── Timed Mode (days > 0) ────────────────────────────────────
  days=days||7;
  const dayMult=days<=5?0.04:days<=10?0.07:days<=21?0.12:0.20;
  const sl=+(p*0.93).toFixed(2);
  let t1,t2,t3,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,priority;

  if(isPump){
    t1=+(p*(1+dayMult*0.6)).toFixed(2);t2=+(p*(1+dayMult)).toFixed(2);t3=null;
    sellT1=60;sellT2=35;sellT3=5;risk="🔴 HIGH";priority=5;
    buySignal="🔴 কিনবেন না";buyZone="—";
    buyStr="Pump pattern! RSI "+rsi.toFixed(0)+", Vol "+volM+"M। "+days+"d এ আটকে যাওয়ার risk আছে।";
    sellStr="⚠️ Pump! T1 এ "+sellT1+"% sell করুন। Circuit "+s.circuit+" এর আগেই বের হন।";
  } else if(hasConflict){
    t1=+(p*(1+dayMult*0.7)).toFixed(2);t2=+(p*(1+dayMult*1.2)).toFixed(2);t3=null;
    sellT1=40;sellT2=50;sellT3=10;risk="🟡 MEDIUM";priority=3;
    buySignal="⚠️ Mixed Signal";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;
    buyStr=conflictNote;
    sellStr="Mixed signal — T1 এ "+sellT1+"% নিন, বাকি hold। Conflict resolve হলে strategy update করুন।";
  } else if(isOversold&&isBullMACD){
    t1=+(p*(1+dayMult*1.1)).toFixed(2);t2=+(p*(1+dayMult*1.7)).toFixed(2);t3=+(p*(1+dayMult*2.5)).toFixed(2);
    sellT1=25;sellT2=45;sellT3=30;risk="🟢 LOW";priority=1;
    buySignal="🚀 এখনই কিনুন";buyZone="৳"+(p*0.98).toFixed(2)+"-৳"+p;
    buyStr="RSI "+rsi.toFixed(0)+" Oversold + MACD "+macd.toFixed(2)+" Bullish"+(isBreakoutVol?" + Volume Breakout "+volM+"M!":"")+". "+days+"d এ strong return সম্ভব।";
    sellStr="Bottom bouncing — T2 এ "+sellT2+"% রাখুন। T1 hit হলে SL buyRate এ move করুন।";
  } else if(isFundStrong&&isUnderval&&days>10){
    t1=+(p*(1+dayMult*0.9)).toFixed(2);t2=+(p*(1+dayMult*1.5)).toFixed(2);t3=+(s.nav*0.75).toFixed(2);
    sellT1=20;sellT2=35;sellT3=45;risk="🟢 LOW";priority=2;
    buySignal="✅ Long term Buy";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;
    buyStr="P/E "+s.pe+" + NAV "+s.nav+(isAboveEMA?" + EMA20 above":"")+". "+days+"d+ এর জন্য excellent position।";
    sellStr="Fundamental strong — T3 (NAV target ৳"+(s.nav*0.75).toFixed(2)+") পর্যন্ত ধরুন।";
  } else if(isOverbought){
    t1=+(p*(1+dayMult*0.5)).toFixed(2);t2=s.circuit?+(s.circuit*0.97).toFixed(2):+(p*(1+dayMult*0.9)).toFixed(2);t3=null;
    sellT1=60;sellT2=35;sellT3=5;risk="🟠 MEDIUM-HIGH";priority=4;
    buySignal="🟡 অপেক্ষা করুন";buyZone="RSI "+(rsi-15).toFixed(0)+" নামলে";
    buyStr="RSI "+rsi.toFixed(0)+" Overbought। "+conflictNote+" RSI ৫০ এ নামলে এবং EMA20 (৳"+ema20.toFixed(2)+") support এ কিনুন।";
    sellStr="Overbought — T1 এ "+sellT1+"% নিন।"+(s.circuit?" Circuit ৳"+s.circuit+" এর আগেই বের হন!":"");
  } else if(isBreakoutVol&&isBullMACD){
    t1=+(p*(1+dayMult*1.0)).toFixed(2);t2=+(p*(1+dayMult*1.6)).toFixed(2);t3=+(p*(1+dayMult*2.2)).toFixed(2);
    sellT1=30;sellT2=45;sellT3=25;risk="🟢 LOW-MED";priority=1;
    buySignal="🚀 Volume Breakout";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;
    buyStr="Volume "+volM+"M vs VMA "+((vma20)/1000000).toFixed(1)+"M ("+((s.vol/vma20).toFixed(1))+"x)! MACD "+macd.toFixed(2)+" bullish"+(isAboveEMA?" + EMA20 above":"")+".";
    sellStr="Breakout — "+days+"d এ T2 সম্ভব। T1 hit হলে SL buyRate এ move করুন।";
  } else if(isBullMACD&&isAboveEMA){
    t1=+(p*(1+dayMult*0.85)).toFixed(2);t2=+(p*(1+dayMult*1.4)).toFixed(2);t3=+(p*(1+dayMult*1.9)).toFixed(2);
    sellT1=35;sellT2=40;sellT3=25;risk="🟢 LOW-MED";priority=2;
    buySignal="✅ কিনতে পারেন";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;
    buyStr="MACD "+macd.toFixed(2)+" + Price > EMA20 (৳"+ema20.toFixed(2)+")"+(isAboveSMA?" + SMA50 (৳"+sma50.toFixed(2)+") above":"")+". "+days+"d uptrend।";
    sellStr="Trend — "+days+"d এ T1-T2 target। RSI 68+ হলে বের হন।";
  } else if(isBullMACD){
    t1=+(p*(1+dayMult*0.8)).toFixed(2);t2=+(p*(1+dayMult*1.3)).toFixed(2);t3=+(p*(1+dayMult*1.8)).toFixed(2);
    sellT1=35;sellT2=40;sellT3=25;risk="🟡 MEDIUM";priority=2;
    buySignal="✅ কিনতে পারেন";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;
    buyStr="MACD "+macd.toFixed(2)+" bullish। EMA20 (৳"+ema20.toFixed(2)+") support এ রাখুন। "+days+"d target।";
    sellStr="MACD driven — T1 এ "+sellT1+"% নিন। EMA20 ভাঙলে exit।";
  } else {
    t1=+(p*(1+dayMult*0.8)).toFixed(2);t2=+(p*(1+dayMult*1.3)).toFixed(2);t3=null;
    sellT1=40;sellT2=45;sellT3=15;risk="🟡 MEDIUM";priority=3;
    buySignal="🟡 অপেক্ষা করুন";buyZone="৳"+(p*0.95).toFixed(2)+"-৳"+(p*0.98).toFixed(2);
    buyStr="Sideways। EMA20: ৳"+ema20.toFixed(2)+" / SMA50: ৳"+sma50.toFixed(2)+". Volume বাড়লে এবং EMA20 এর উপরে গেলে কিনুন।";
    sellStr="Sideways — T1 এ "+sellT1+"% নিন। Trailing SL maintain করুন।";
  }

  // ── SAFETY: T1 < T2 < T3, minimum gaps enforced ─────────────
  const minT1=+(p*1.025).toFixed(2);
  const minT2=+(p*1.06).toFixed(2);
  t1=Math.max(minT1,t1);
  t2=Math.max(Math.max(minT2,+(t1*1.04).toFixed(2)),t2);
  if(t3) t3=Math.max(+(t2*1.04).toFixed(2),t3);
  // Circuit ceiling
  if(s.circuit){
    if(t1>=s.circuit*0.97) t1=+(s.circuit*0.92).toFixed(2);
    if(t2>=s.circuit) t2=+(s.circuit*0.97).toFixed(2);
    if(t2<=t1) t2=+(t1*1.04).toFixed(2);
    if(t3&&t3>=s.circuit) t3=+(s.circuit*0.97).toFixed(2);
    if(t3&&t3<=t2) t3=+(t2*1.04).toFixed(2);
    if(t2>=s.circuit) sellStr+=" | Circuit ৳"+s.circuit+" এর আগেই বের হন!";
  }

  return{t1,t2,t3,sl,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,holding:days+" দিন",holdNote,priority,maSignal,isBreakoutVol,isAboveEMA,isAboveSMA,hasConflict,conflictNote};
}

// ── Score — EMA20, SMA50, VMA20 যোগ হয়েছে ────────────────────────────
function calcScore(s,days){
  days=days||7;
  let sc=0;
  // Fundamentals
  if(s.eps>5)sc+=20;else if(s.eps>2)sc+=15;else if(s.eps>0)sc+=8;else sc-=15;
  if(s.pe>0&&s.pe<15)sc+=20;else if(s.pe>0&&s.pe<25)sc+=12;else if(s.pe>0&&s.pe<35)sc+=5;else if(s.pe<0)sc-=20;else sc-=10;
  // RSI
  if(days<=10){if(s.rsi>=45&&s.rsi<=65)sc+=20;else if(s.rsi>65&&s.rsi<=70)sc+=8;else if(s.rsi>70)sc-=15;else sc+=5;}
  else{if(s.rsi>=40&&s.rsi<=60)sc+=15;else if(s.rsi<40)sc+=10;else if(s.rsi>70)sc-=5;}
  // MACD
  if(s.macd>0.5)sc+=15;else if(s.macd>0)sc+=8;else if(s.macd<-0.5)sc-=15;else sc-=5;
  // Volume — VMA20 based (dynamic)
  const vma=s.vma20||1000000;
  if(s.vol>vma*2)sc+=15;       // Breakout volume — সর্বোচ্চ
  else if(s.vol>vma*1.2)sc+=10; // Above average
  else if(s.vol>vma*0.8)sc+=5;  // Normal range
  else sc-=5;                   // Below average
  // Dividend
  if(s.div>=20)sc+=10;else if(s.div>=10)sc+=6;else if(s.div>0)sc+=3;else sc-=5;
  // NAV ratio
  const nr=s.nav>0?s.price/s.nav:1;if(nr<2)sc+=10;else if(nr<4)sc+=5;else sc-=5;
  // Institution
  if(s.inst>15)sc+=10;else if(s.inst>8)sc+=5;
  // 6M Return
  if(s.ret6m>20)sc+=8;else if(s.ret6m>0)sc+=4;else sc-=5;
  // Category
  if(s.cat==="A")sc+=5;else sc-=5;
  // ── EMA20 ── price > EMA20 = bullish trend
  if(s.ema20){if(s.price>s.ema20)sc+=10;else sc-=5;}
  // ── SMA50 ── price > SMA50 = strong uptrend
  if(s.sma50){if(s.price>s.sma50)sc+=5;else sc-=3;}
  return Math.min(100,Math.max(0,sc));
}

function getRec(score){
  if(score>=75)return{label:"🚀 STRONG BUY",color:"#00C896",bg:"#00C89618"};
  if(score>=60)return{label:"✅ BUY",color:"#4CAF50",bg:"#4CAF5018"};
  if(score>=45)return{label:"🟡 WATCH",color:"#FFC107",bg:"#FFC10718"};
  if(score>=30)return{label:"⚠️ WEAK",color:"#FF9800",bg:"#FF980018"};
  return{label:"🔴 AVOID",color:"#F44336",bg:"#F4433618"};
}

const C={bg:"#070D1A",card:"#0F1923",border:"#1A2D4A",text:"#E8EAF0",muted:"#4A6080",accent:"#00C896",blue:"#0080FF",yellow:"#FFC107",red:"#F44336",orange:"#FF9800",purple:"#9C27B0"};
const inp=(ex={})=>({background:"#0A1628",border:"1px solid "+C.border,borderRadius:6,color:C.text,padding:"6px 10px",fontSize:13,fontFamily:"inherit",outline:"none",...ex});
const card=(ex={})=>({background:C.card,border:"1px solid "+C.border,borderRadius:12,...ex});
const btn=(color,active,small)=>{color=color||C.accent;return{padding:small?"4px 10px":"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:active?color:color+"20",color:active?"#fff":color,fontWeight:700,fontSize:small?11:13,fontFamily:"inherit",transition:"all 0.15s"};};

// ── Paste Modal ───────────────────────────────────────────────────────
function PasteModal({onApply,onClose,stockName}){
  const [code,setCode]=useState("");const [err,setErr]=useState("");
  const apply=()=>{setErr("");try{const d=JSON.parse(code.trim());if(!d.name&&stockName)d.name=stockName;onApply(d);setCode("");onClose();}catch{setErr("❌ JSON format ঠিক নেই।");}};
  const ex='{"name":"'+(stockName||"STOCKNAME")+'","price":52.5,"eps":2.85,"pe":24.31,"nav":35.37,"div":18,"rsi":53.51,"macd":-0.2,"vol":5143123,"vma20":3381708,"ema20":52.4,"sma50":50.8,"bb_upper":58.6,"bb_lower":46.3,"support1":46.3,"resistance1":56.3,"circuit":56.3,"ret6m":23,"inst":10.23,"cat":"A","sector":"Services & Real Estate","trend":"consolidation","analysisNote":{"trend":"২০২৪-২০২৫ uptrend, এখন consolidation","bb":"BB Median এ আছে","rsiNote":"RSI 53 neutral","macdNote":"MACD -0.2 সামান্য bearish","volumeNote":"Volume VMA 1.5x","fundamental":"EPS 2.85, P/E 24.31, NAV 35.37","strategy":"৳৪৮-৪৯ এ কিনুন, Target ৳৫৬.৩","chartPeriod":"2024-2026 Daily"}}';
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.card,border:"1px solid "+C.purple,borderRadius:16,padding:24,width:"100%",maxWidth:540}}>
        <div style={{fontWeight:800,fontSize:16,color:"#CE93D8",marginBottom:6}}>📋 {stockName||"Stock"} — Code Paste</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>Claude কে screenshot দিয়ে বলুন: <span style={{color:"#CE93D8",fontWeight:700}}>"এই stock এর JSON code দাও"</span></div>
        <div style={{background:"#070D1A",borderRadius:8,padding:10,marginBottom:10,fontFamily:"monospace",fontSize:10,color:"#CE93D8",wordBreak:"break-all",lineHeight:1.6}}>{ex}</div>
        <textarea value={code} onChange={e=>{setCode(e.target.value);setErr("");}} placeholder="এখানে JSON paste করুন..."
          style={{width:"100%",height:110,background:"#070D1A",border:"1px solid "+(err?"#F44336":C.purple+"44"),borderRadius:8,color:"#CE93D8",padding:12,fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
        {err&&<div style={{color:C.red,fontSize:12,marginTop:4,fontWeight:600}}>{err}</div>}
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={apply} style={btn(C.purple,true)}>✅ Apply</button>
          <button onClick={onClose} style={btn(C.muted)}>বাতিল</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────
function DeleteConfirm({item,onConfirm,onClose}){
  const [reason,setReason]=useState("");
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.card,border:"1px solid "+C.red,borderRadius:16,padding:24,width:"100%",maxWidth:400}}>
        <div style={{fontWeight:800,fontSize:16,color:C.red,marginBottom:8}}>🗑️ Position সরাবেন?</div>
        <div style={{fontSize:14,color:C.text,marginBottom:14}}><span style={{fontWeight:700,color:"#fff"}}>{item.stock}</span> — {item.broker} ({item.shares.toLocaleString()} shares)</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:6}}>কারণ:</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
          {["Sell করেছি","Stop Loss hit","ভুলে add","অন্য account","অন্য"].map(r=>(
            <button key={r} onClick={()=>setReason(r)} style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(reason===r?C.red:C.border),background:reason===r?C.red+"22":"transparent",color:reason===r?C.red:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{r}</button>
          ))}
        </div>
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="অথবা লিখুন..." style={{...inp({width:"100%",boxSizing:"border-box",marginBottom:14})}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onConfirm(reason)} style={btn(C.red,true)}>🗑️ হ্যাঁ, সরান</button>
          <button onClick={onClose} style={btn(C.muted)}>বাতিল</button>
        </div>
      </div>
    </div>
  );
}

// ── Stock Search ──────────────────────────────────────────────────────
function StockSearch({stocks,value,onChange,onSelect}){
  const [show,setShow]=useState(false);
  const sugg=value.length>0?stocks.filter(s=>s.name.toUpperCase().includes(value.toUpperCase())).slice(0,8):stocks.slice(0,8);
  return(
    <div style={{position:"relative"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Stock Name * <span style={{color:C.accent,fontSize:10}}>(Screener এর stock)</span></div>
      <input value={value} onChange={e=>{onChange(e.target.value);setShow(true);}} onFocus={()=>setShow(true)} placeholder="Stock খুঁজুন..." style={{...inp({width:"100%",boxSizing:"border-box",border:"1px solid "+C.accent+"44"})}}/>
      {show&&sugg.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:C.card,border:"1px solid "+C.accent+"44",borderRadius:8,overflow:"hidden",maxHeight:220,overflowY:"auto",marginTop:2,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
          {sugg.map(s=>{const rec=getRec(calcScore(s,7));const st=staleness(s.updatedAt);return(
            <div key={s.id} onClick={()=>{onSelect(s);setShow(false);}} style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+C.border}} onMouseEnter={e=>e.currentTarget.style.background="#1A2D4A"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{flex:1}}><div style={{fontWeight:700,color:"#fff",fontSize:14}}>{s.name} <span style={{fontSize:11,color:C.muted}}>৳{s.price}</span></div><div style={{fontSize:10,color:st.color}}>{st.label}</div></div>
              <div style={{fontSize:11,fontWeight:700,color:rec.color,background:rec.bg,borderRadius:6,padding:"2px 8px"}}>{rec.label}</div>
            </div>
          );})}
        </div>
      )}
      {show&&<div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setShow(false)}/>}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────
function Field({label,value,onChange,width}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:2}}>
      <span style={{fontSize:10,color:C.muted}}>{label}</span>
      <input type="number" value={value} onChange={e=>onChange(+e.target.value)}
        style={{...inp({width:width||80,textAlign:"center",color:C.yellow,fontWeight:700,background:"#FFF9C412",border:"1px solid "+C.yellow+"44"})}}/>
    </div>
  );
}

// ── Buy Ranking Panel ─────────────────────────────────────────────────
function BuyRankingPanel({stocks,port,days,onClose}){
  const [aiRanks,setAiRanks]=useState(null);const [loading,setLoading]=useState(false);
  const portMap={};port.forEach(p=>{portMap[p.stock]=(portMap[p.stock]||0)+p.shares;});
  const ranked=useMemo(()=>stocks.map(s=>{
    const str=generateStrategy(s,days,portMap[s.name]||0);
    const score=calcScore(s,days);
    return{...s,str,score};
  }).filter(s=>s.str.priority<=3).sort((a,b)=>a.str.priority-b.str.priority||b.score-a.score),[stocks,days]);

  const getAI=async()=>{
    setLoading(true);
    try{
      const summary=stocks.map(s=>({name:s.name,price:s.price,rsi:s.rsi,macd:s.macd,eps:s.eps,pe:s.pe,nav:s.nav,vol:s.vol,vma20:s.vma20,ema20:s.ema20,sma50:s.sma50,ret6m:s.ret6m,inst:s.inst,circuit:s.circuit,cat:s.cat,sector:s.sector,holding:portMap[s.name]||0}));
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:"তুমি DSE expert। EMA20, SMA50, VMA20 সহ সব indicator বিবেচনা করে আগামী "+days+" দিনের জন্য TOP 5 stock বেছে দাও। শুধু JSON array দাও।\n\nStocks: "+JSON.stringify(summary)+"\n\nFormat: [{\"rank\":1,\"name\":\"STOCK\",\"reason\":\"বাংলায় ২ লাইন\",\"buyZone\":\"৳XX-৳YY\",\"target\":\"৳ZZ\",\"urgency\":\"এখনই|আজই|এই সপ্তাহে\"}]"}]})});
      const data=await resp.json();const text=(data.content&&data.content[0]&&data.content[0].text)||"[]";
      setAiRanks(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const rc=["#FFD700","#C0C0C0","#CD7F32","#00C896","#4FC3F7"];
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.accent,borderRadius:16,padding:24,width:"100%",maxWidth:680,marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:800,fontSize:18,color:"#fff"}}>🎯 Buy Signal — {days} দিনের Ranking</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>EMA20 + SMA50 + VMA20 + সব indicator</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={getAI} disabled={loading} style={btn(C.purple)}>{loading?"⏳ AI...":"🤖 AI Rank"}</button><button onClick={onClose} style={btn(C.red,false,true)}>✕</button></div>
        </div>
        {aiRanks&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:700,color:C.purple,marginBottom:10,fontSize:14}}>🤖 AI Top 5:</div>
            {aiRanks.map((r,i)=>(
              <div key={i} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(rc[i]||C.border)+"44",display:"flex",gap:12}}>
                <div style={{width:30,height:30,background:rc[i]||C.muted,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#000",flexShrink:0}}>#{r.rank}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff",fontSize:14}}>{r.name}</div><div style={{fontSize:12,color:C.text,marginTop:3,lineHeight:1.6}}>{r.reason}</div>
                  <div style={{display:"flex",gap:10,marginTop:5,fontSize:12,flexWrap:"wrap"}}><span style={{color:C.accent}}>Zone: {r.buyZone}</span><span style={{color:C.yellow}}>→ {r.target}</span><span style={{background:C.blue+"22",color:C.blue,borderRadius:6,padding:"1px 8px",fontWeight:700}}>{r.urgency}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{fontWeight:700,color:C.accent,marginBottom:10,fontSize:14}}>📊 Auto Ranking ({days} দিন):</div>
        {ranked.length===0?<div style={{color:C.muted,textAlign:"center",padding:20}}>এখন strong buy signal নেই</div>:ranked.map((s,i)=>{
          const st=staleness(s.updatedAt);
          return(
            <div key={s.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+(i<3?C.accent:C.border)+"44"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:28,height:28,background:i<3?"linear-gradient(135deg,#FFD700,#FFA500)":"#1A2D4A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:i<3?"#000":C.muted,flexShrink:0}}>#{i+1}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff",fontSize:14}}>{s.name} <span style={{fontSize:11,color:C.muted}}>৳{s.price}</span></div>
                  <div style={{fontSize:10,display:"flex",gap:8}}><span style={{color:st.color}}>{st.label}</span><span style={{color:s.str.maSignal.includes("🟢")?C.accent:C.yellow}}>{s.str.maSignal}</span></div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:12,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow}}>{s.str.buySignal}</div><div style={{fontSize:11,color:s.str.risk.includes("LOW")?C.accent:s.str.risk.includes("HIGH")?C.red:C.yellow}}>{s.str.risk}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
                <div style={{background:C.accent+"0a",borderRadius:6,padding:8}}><div style={{color:C.accent,fontWeight:700,marginBottom:3}}>📥 Buy</div><div style={{color:C.text}}>{s.str.buyZone}</div><div style={{color:C.muted,marginTop:3,lineHeight:1.5}}>{s.str.buyStr}</div></div>
                <div style={{background:C.yellow+"0a",borderRadius:6,padding:8}}><div style={{color:C.yellow,fontWeight:700,marginBottom:3}}>🎯 Targets</div>
                  <div>T1: ৳{s.str.t1} <span style={{color:C.muted}}>({s.str.sellT1}%)</span></div>
                  <div>T2: ৳{s.str.t2} <span style={{color:C.muted}}>({s.str.sellT2}%)</span></div>
                  {s.str.t3&&<div>T3: ৳{s.str.t3} <span style={{color:C.muted}}>({s.str.sellT3}%)</span></div>}
                  <div style={{color:C.red,marginTop:3}}>SL: ৳{s.str.sl}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Indicator Explanation Database ───────────────────────────────────
const INDICATOR_EXPLAIN = {
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

function IndicatorCards({signals}){
  const [expanded,setExpanded]=useState({});
  const toggle=(i)=>setExpanded(p=>({...p,[i]:!p[i]}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {signals.map((sig,i)=>{
        const exp=INDICATOR_EXPLAIN[sig.name]||{what:"",dse:"",use:""};
        const isOpen=expanded[i];
        return(
          <div key={i} style={{background:"#070D1A",borderRadius:10,border:"1px solid "+sig.color+"44",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",cursor:"pointer"}} onClick={()=>toggle(i)}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:800,color:"#E8EAF0",fontSize:13}}>{sig.name}</span>
                  <span style={{fontSize:11,fontWeight:700,color:sig.color,background:sig.color+"22",borderRadius:5,padding:"2px 8px"}}>{sig.signal}</span>
                </div>
                <div style={{fontSize:11,color:"#7A8FA0",lineHeight:1.5}}>{sig.detail}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:12,background:isOpen?sig.color+"44":"#1A2D4A",display:"flex",alignItems:"center",justifyContent:"center",color:isOpen?sig.color:"#4A6080",fontWeight:800,fontSize:14,flexShrink:0,transition:"all 0.2s"}}>
                {isOpen?"−":"+"}
              </div>
            </div>
            {isOpen&&(
              <div style={{padding:"0 12px 12px",borderTop:"1px solid "+sig.color+"22"}}>
                {exp.what&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:sig.color,fontWeight:700,marginBottom:2}}>📖 কী এটা?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.what}</div>
                </div>}
                {exp.dse&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"#FFC107",fontWeight:700,marginBottom:2}}>🇧🇩 DSE তে কীভাবে কাজ করে?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.dse}</div>
                </div>}
                {exp.use&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"#00C896",fontWeight:700,marginBottom:2}}>💡 কীভাবে ব্যবহার করবেন?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.use}</div>
                </div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Chart Modal ──────────────────────────────────────────────────────
function ChartModal({ stock, candles, chartType, setChartType, onClose, srLevels, taResult, chartLoading }) {
  const W = Math.min(window.innerWidth - 32, 700);
  const H = 320;
  const PAD = { top: 20, right: 60, bottom: 40, left: 10 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  if (!candles || candles.length === 0) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#0F1923",borderRadius:16,padding:24,width:"100%",maxWidth:400,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>📊</div>
          <div style={{color:"#E8EAF0",fontSize:14,marginBottom:8}}>{stock.name} Chart লোড হচ্ছে...</div>
          <div style={{color:"#4A6080",fontSize:12}}>DSE থেকে ৬০ দিনের data আনছি</div>
          <div style={{marginTop:12,height:4,background:"#1A2D4A",borderRadius:2}}><div style={{height:"100%",width:"60%",background:"#00C896",borderRadius:2,animation:"none"}}/></div>
          <button onClick={onClose} style={{marginTop:16,padding:"8px 20px",background:"#1A2D4A",border:"none",borderRadius:8,color:"#4A6080",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>বন্ধ করুন</button>
        </div>
      </div>
    );
  }

  // Price range
  const allHighs = candles.map(c => c.high);
  const allLows = candles.map(c => c.low);
  let priceMin = Math.min(...allLows);
  let priceMax = Math.max(...allHighs);

  // Include SR levels in range
  if (srLevels) {
    srLevels.supports.forEach(s => { priceMin = Math.min(priceMin, s.price); });
    srLevels.resistances.forEach(r => { priceMax = Math.max(priceMax, r.price); });
  }
  const priceRange = priceMax - priceMin || 1;
  const padding = priceRange * 0.05;
  priceMin -= padding; priceMax += padding;

  const toY = (price) => CH - ((price - priceMin) / (priceMax - priceMin)) * CH + PAD.top;
  const toX = (i) => (i / (candles.length - 1)) * CW + PAD.left;
  const barW = Math.max(2, Math.floor(CW / candles.length) - 1);

  // Build SVG paths
  const linePath = candles.map((c, i) => (i === 0 ? "M" : "L") + toX(i).toFixed(1) + "," + toY(c.close).toFixed(1)).join(" ");

  // Price labels
  const priceTicks = 5;
  const priceLabels = Array.from({length: priceTicks}, (_, i) => {
    const price = priceMin + (priceMax - priceMin) * i / (priceTicks - 1);
    return { price: +price.toFixed(1), y: toY(price) };
  });

  // Date labels (every ~10 candles)
  const dateLabels = candles.filter((_, i) => i % Math.ceil(candles.length / 5) === 0).map((c, i, arr) => ({
    date: c.date ? c.date.slice(5) : "",
    x: toX(candles.indexOf(c))
  }));

  const currentPrice = candles[candles.length - 1].close;
  const priceColor = currentPrice >= candles[0].close ? "#00C896" : "#F44336";

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:"#0F1923",borderRadius:16,padding:16,width:"100%",maxWidth:720,marginTop:8}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>{stock.name} <span style={{fontSize:13,color:"#4A6080"}}>[{stock.cat}]</span></div>
            <div style={{fontSize:12,color:"#4A6080"}}>{stock.sector} · ৳{currentPrice} · {candles.length} দিনের data</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {["candlestick","line","ohlc"].map(t => (
              <button key={t} onClick={() => setChartType(t)}
                style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,
                  background: chartType===t ? "#00C896" : "#1A2D4A",
                  color: chartType===t ? "#fff" : "#4A6080",fontFamily:"inherit"}}>
                {t==="candlestick"?"🕯️":t==="line"?"📈":"📊"}
              </button>
            ))}
            <button onClick={onClose} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#F44336",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>✕</button>
          </div>
        </div>

        {/* TA Master Signal */}
        {taResult && (
          <div style={{background:taResult.masterBg,border:"2px solid "+taResult.masterColor+"88",borderRadius:12,padding:"12px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:17,color:taResult.masterColor}}>{taResult.masterSignal}</div>
                <div style={{fontSize:12,color:"#E8EAF0",marginTop:4,lineHeight:1.6}}>{taResult.actionDetail}</div>
              </div>
              <div style={{textAlign:"center",background:"#070D1A",borderRadius:10,padding:"8px 14px"}}>
                <div style={{fontSize:26,fontWeight:800,color:taResult.compositeScore>=0?"#00C896":"#F44336"}}>{taResult.compositeScore>0?"+":""}{taResult.compositeScore}</div>
                <div style={{fontSize:10,color:"#4A6080"}}>Composite Score</div>
                <div style={{fontSize:10,color:"#4A6080",marginTop:2}}>Buy {taResult.buyScore.toFixed(0)} | Sell {taResult.sellScore.toFixed(0)}</div>
              </div>
            </div>
            {taResult.isSideways&&(
              <div style={{background:"#FFC10718",borderRadius:6,padding:"6px 10px",fontSize:11,color:"#FFC107",fontWeight:700}}>
                📊 Sideways Range: {taResult.rangeWidth.toFixed(1)}% — BB strategy সেরা। Lower এ কিনুন, Upper এ বেচুন।
              </div>
            )}
            {taResult.isTrending&&(
              <div style={{background:"#00C89618",borderRadius:6,padding:"6px 10px",fontSize:11,color:"#00C896",fontWeight:700}}>
                📈 Trending Market — EMA20 ও MACD follow করুন। Trailing SL রাখুন।
              </div>
            )}
            {taResult.signals&&taResult.signals.some(s=>s.signal.includes("SELL")&&s.score>0)&&taResult.signals.some(s=>s.signal.includes("BUY")&&s.score>0)&&(
              <div style={{background:"#FF980018",borderRadius:6,padding:"6px 10px",marginTop:6,fontSize:11,color:"#FF9800"}}>
                ⚠️ Mixed Signal — কিছু indicator BUY, কিছু SELL বলছে। নিচে প্রতিটির বিস্তারিত দেখুন।
              </div>
            )}
            <div style={{marginTop:8,fontSize:11,color:"#4A6080"}}>
              📌 Data source: {taResult.indicators&&taResult.indicators.rsi?"আপনার enter করা RSI/MACD/EMA + Bollinger Bands":"Calculated from chart"}
            </div>
          </div>
        )}

        {/* Sell Signal Banner */}
        {srLevels && srLevels.sellSignal && (
          <div style={{background:"#F4433622",border:"1px solid #F44336",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:13,color:"#F44336",fontWeight:700,textAlign:"center"}}>
            {srLevels.sellSignal}
          </div>
        )}

        {/* Chart SVG */}
        <div style={{background:"#070D1A",borderRadius:10,padding:"4px 0",overflowX:"auto"}}>
          <svg width={W} height={H} style={{display:"block"}}>
            {/* Grid lines */}
            {priceLabels.map((tick, i) => (
              <g key={i}>
                <line x1={PAD.left} y1={tick.y} x2={PAD.left+CW} y2={tick.y} stroke="#1A2D4A" strokeWidth="1" strokeDasharray="3,3"/>
                <text x={PAD.left+CW+4} y={tick.y+4} fontSize="9" fill="#4A6080">{tick.price}</text>
              </g>
            ))}

            {/* Date labels */}
            {dateLabels.map((dl, i) => (
              <text key={i} x={dl.x} y={H-6} fontSize="9" fill="#4A6080" textAnchor="middle">{dl.date}</text>
            ))}

            {/* Support Levels */}
            {srLevels && srLevels.supports.map((s, i) => {
              const y = toY(s.price);
              const isStrong = srLevels.strongSupport && Math.abs(srLevels.strongSupport.price - s.price) < 0.01;
              return (
                <g key={"sup"+i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left+CW} y2={y} stroke={isStrong?"#00C896":"#00C89666"} strokeWidth={isStrong?2:1} strokeDasharray={isStrong?"":"5,3"}/>
                  <rect x={PAD.left+CW-2} y={y-8} width={58} height={16} fill="#070D1A" rx="3"/>
                  <text x={PAD.left+CW+2} y={y+4} fontSize="9" fill={isStrong?"#00C896":"#00C89699"} fontWeight={isStrong?"bold":"normal"}>
                    {isStrong?"🟢S":"S"} ৳{s.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Resistance Levels */}
            {srLevels && srLevels.resistances.map((r, i) => {
              const y = toY(r.price);
              const isStrong = srLevels.strongResistance && Math.abs(srLevels.strongResistance.price - r.price) < 0.01;
              return (
                <g key={"res"+i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left+CW} y2={y} stroke={isStrong?"#F44336":"#F4433666"} strokeWidth={isStrong?2:1} strokeDasharray={isStrong?"":"5,3"}/>
                  <rect x={PAD.left+CW-2} y={y-8} width={58} height={16} fill="#070D1A" rx="3"/>
                  <text x={PAD.left+CW+2} y={y+4} fontSize="9" fill={isStrong?"#F44336":"#F4433699"} fontWeight={isStrong?"bold":"normal"}>
                    {isStrong?"🔴R":"R"} ৳{r.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Current price line */}
            <line x1={PAD.left} y1={toY(currentPrice)} x2={PAD.left+CW} y2={toY(currentPrice)} stroke={priceColor} strokeWidth="1" strokeDasharray="4,2" opacity="0.6"/>

            {/* Chart based on type */}
            {chartType==="line" && (
              <path d={linePath} fill="none" stroke="#00C896" strokeWidth="2"/>
            )}

            {chartType==="candlestick" && candles.map((c, i) => {
              const x = toX(i);
              const openY = toY(c.open);
              const closeY = toY(c.close);
              const highY = toY(c.high);
              const lowY = toY(c.low);
              const isBull = c.close >= c.open;
              const color = isBull ? "#00C896" : "#F44336";
              const bodyTop = Math.min(openY, closeY);
              const bodyH = Math.max(1, Math.abs(closeY - openY));
              return (
                <g key={i}>
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1"/>
                  <rect x={x-barW/2} y={bodyTop} width={barW} height={bodyH} fill={color} opacity="0.9"/>
                </g>
              );
            })}

            {chartType==="ohlc" && candles.map((c, i) => {
              const x = toX(i);
              const isBull = c.close >= c.open;
              const color = isBull ? "#00C896" : "#F44336";
              return (
                <g key={i}>
                  <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1.5"/>
                  <line x1={x-barW} y1={toY(c.open)} x2={x} y2={toY(c.open)} stroke={color} strokeWidth="1.5"/>
                  <line x1={x} y1={toY(c.close)} x2={x+barW} y2={toY(c.close)} stroke={color} strokeWidth="1.5"/>
                </g>
              );
            })}
          </svg>
        </div>

        {/* SR Summary */}
        {srLevels && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
            <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
              <div style={{fontWeight:700,color:"#00C896",marginBottom:8,fontSize:13}}>🟢 Support Levels</div>
              {srLevels.supports.length===0 && <div style={{color:"#4A6080",fontSize:12}}>কোনো support নেই</div>}
              {srLevels.supports.sort((a,b)=>b.price-a.price).map((s,i)=>{
                const isStrong = srLevels.strongSupport && Math.abs(srLevels.strongSupport.price-s.price)<0.01;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:isStrong?"#00C896":"#4A6080"}}>{isStrong?"⭐ Strong":"·"} ৳{s.price.toFixed(2)}</span>
                    <span style={{color:"#4A6080"}}>{s.touches}x touch</span>
                  </div>
                );
              })}
            </div>
            <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
              <div style={{fontWeight:700,color:"#F44336",marginBottom:8,fontSize:13}}>🔴 Resistance Levels</div>
              {srLevels.resistances.length===0 && <div style={{color:"#4A6080",fontSize:12}}>কোনো resistance নেই</div>}
              {srLevels.resistances.sort((a,b)=>a.price-b.price).map((r,i)=>{
                const isStrong = srLevels.strongResistance && Math.abs(srLevels.strongResistance.price-r.price)<0.01;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:isStrong?"#F44336":"#4A6080"}}>{isStrong?"⭐ Strong":"·"} ৳{r.price.toFixed(2)}</span>
                    <span style={{color:"#4A6080"}}>{r.touches}x touch</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TA Indicators Score Card */}
        {taResult && taResult.signals && taResult.signals.length > 0 && (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:700,color:"#E8EAF0",marginBottom:8,fontSize:13}}>📊 Technical Indicators Score Card</div>
            <IndicatorCards signals={taResult.signals}/>

            {/* Key Numbers */}
            <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:8}}>
              <div style={{fontWeight:700,color:"#FFC107",marginBottom:6,fontSize:12}}>📈 Key Indicator Values</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6}}>
                {[
                  ["RSI",taResult.indicators.rsi,taResult.indicators.rsi>70?"#F44336":taResult.indicators.rsi<30?"#00C896":"#FFC107"],
                  ["EMA 20",taResult.indicators.ema20,"#4FC3F7"],
                  ["EMA 50",taResult.indicators.ema50,"#4FC3F7"],
                  ["BB Upper",taResult.indicators.bb?taResult.indicators.bb.upper:"-","#F44336"],
                  ["BB Lower",taResult.indicators.bb?taResult.indicators.bb.lower:"-","#00C896"],
                  ["Stoch K",taResult.indicators.stoch?taResult.indicators.stoch.k:"-",taResult.indicators.stoch&&taResult.indicators.stoch.k>80?"#F44336":taResult.indicators.stoch&&taResult.indicators.stoch.k<20?"#00C896":"#FFC107"],
                  ["W%R",taResult.indicators.willR,taResult.indicators.willR<-80?"#00C896":taResult.indicators.willR>-20?"#F44336":"#4A6080"],
                  ["CCI",taResult.indicators.cci,taResult.indicators.cci>100?"#F44336":taResult.indicators.cci<-100?"#00C896":"#4A6080"],
                  ["VWAP",taResult.indicators.vwap,"#9C27B0"],
                  ["ADX",taResult.indicators.adxData?taResult.indicators.adxData.adx:"-",taResult.indicators.adxData&&taResult.indicators.adxData.adx>25?"#00C896":"#4A6080"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{background:"#0A1628",borderRadius:6,padding:"5px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#4A6080",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:color}}>{val!==null&&val!==undefined?val:"-"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy/Sell Score Bars */}
            <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:8}}>
              <div style={{fontWeight:700,color:"#E8EAF0",marginBottom:8,fontSize:12}}>⚖️ Buy vs Sell Pressure</div>
              {(()=>{
                const totalPts=(taResult.buyScore||0)+(taResult.sellScore||0)||1;
                const buyPct=Math.round((taResult.buyScore||0)/totalPts*100);
                const sellPct=Math.round((taResult.sellScore||0)/totalPts*100);
                return(
                  <div>
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#00C896",fontWeight:700}}>🟢 Buy Signal</span>
                        <span style={{fontSize:11,color:"#00C896",fontWeight:700}}>{taResult.buyScore.toFixed(0)} pts ({buyPct}%)</span>
                      </div>
                      <div style={{height:10,background:"#1A2D4A",borderRadius:5}}>
                        <div style={{height:"100%",width:buyPct+"%",background:"linear-gradient(90deg,#00C896,#4CAF50)",borderRadius:5,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#F44336",fontWeight:700}}>🔴 Sell Signal</span>
                        <span style={{fontSize:11,color:"#F44336",fontWeight:700}}>{taResult.sellScore.toFixed(0)} pts ({sellPct}%)</span>
                      </div>
                      <div style={{height:10,background:"#1A2D4A",borderRadius:5}}>
                        <div style={{height:"100%",width:sellPct+"%",background:"linear-gradient(90deg,#F44336,#FF9800)",borderRadius:5,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                    <div style={{marginTop:8,textAlign:"center",fontSize:12,fontWeight:700,color:buyPct>sellPct?"#00C896":sellPct>buyPct?"#F44336":"#FFC107"}}>
                      {buyPct>sellPct?"✅ Overall: Buy Dominant":sellPct>buyPct?"🔴 Overall: Sell Dominant":"⚪ Overall: Balanced"}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Sell Signal Detail */}
        {srLevels && srLevels.strongResistance && (
          <div style={{marginTop:10,background:"#0A1628",borderRadius:8,padding:12,fontSize:12}}>
            <div style={{fontWeight:700,color:"#FFC107",marginBottom:6}}>📊 Sell Signal Analysis</div>
            <div style={{color:"#E8EAF0",lineHeight:1.8}}>
              <div>Current Price: <span style={{color:"#4FC3F7",fontWeight:700}}>৳{currentPrice}</span></div>
              {srLevels.strongResistance && <div>Strong Resistance: <span style={{color:"#F44336",fontWeight:700}}>৳{srLevels.strongResistance.price.toFixed(2)}</span> ({srLevels.strongResistance.touches}x tested)</div>}
              {srLevels.strongSupport && <div>Strong Support: <span style={{color:"#00C896",fontWeight:700}}>৳{srLevels.strongSupport.price.toFixed(2)}</span> ({srLevels.strongSupport.touches}x tested)</div>}
              {srLevels.strongResistance && <div style={{marginTop:4,color:"#FFC107"}}>Resistance থেকে দূরত্ব: <span style={{fontWeight:700}}>{((srLevels.strongResistance.price-currentPrice)/currentPrice*100).toFixed(1)}%</span></div>}
              {srLevels.strongSupport && <div style={{color:"#00C896"}}>Support থেকে দূরত্ব: <span style={{fontWeight:700}}>{((currentPrice-srLevels.strongSupport.price)/currentPrice*100).toFixed(1)}%</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SellModal ─────────────────────────────────────────────────────────
function SellModal({pos,onSell}){
  const [open,setOpen]=useState(false);
  const [sp,setSp]=useState(pos.currentPrice);
  const [ss,setSs]=useState(Math.floor(pos.shares*0.4));
  const [tab,setTab]=useState("custom"); // custom | t1 | t2

  // Recalculate when open changes
  const handleOpen=()=>{
    setSp(pos.currentPrice);
    setSs(Math.floor(pos.shares*0.4));
    setTab("custom");
    setOpen(true);
  };

  if(!open) return(
    <button onClick={handleOpen}
      style={{background:"#00C89622",color:"#00C896",border:"1px solid #00C89644",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
      💰 Sell
    </button>
  );

  const profit=(sp-pos.buyRate)*ss;
  const comm=(ss*pos.buyRate+ss*sp)*COMM;
  const netPL=profit-comm;
  const str=pos.str||{};
  const t1=str.t1||pos.target1;
  const t2=str.t2||pos.target2;
  const sellT1Pct=str.sellT1||40;
  const sellT2Pct=str.sellT2||40;

  const setPreset=(price,pct)=>{
    setSp(price);
    setSs(Math.round(pos.shares*pct/100));
    setTab("custom");
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0F1923",border:"1px solid #00C896",borderRadius:16,padding:20,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#fff"}}>💰 {pos.stock} Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>{pos.broker} · {pos.shares.toLocaleString()} shares · Buy ৳{pos.buyRate}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:pos.pl>=0?"#00C896":"#F44336"}}>{pos.pl>=0?"+":""}৳{pos.pl.toFixed(0)}</div>
            <div style={{fontSize:11,color:"#4A6080"}}>Current ৳{pos.currentPrice}</div>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={()=>setPreset(t1,sellT1Pct)}
            style={{padding:"8px",background:"#00C89622",border:"1px solid #00C89644",borderRadius:8,color:"#00C896",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🎯 T1 এ Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{t1} · {sellT1Pct}% ({Math.round(pos.shares*sellT1Pct/100)} shares)</div>
          </button>
          <button onClick={()=>setPreset(t2,sellT2Pct)}
            style={{padding:"8px",background:"#FFC10722",border:"1px solid #FFC10744",borderRadius:8,color:"#FFC107",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🚀 T2 এ Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{t2} · {sellT2Pct}% ({Math.round(pos.shares*sellT2Pct/100)} shares)</div>
          </button>
          <button onClick={()=>setPreset(pos.currentPrice,100)}
            style={{padding:"8px",background:"#F4433622",border:"1px solid #F4433644",borderRadius:8,color:"#F44336",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🔴 সব Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{pos.currentPrice} · সব {pos.shares.toLocaleString()} shares</div>
          </button>
          <button onClick={()=>setPreset(pos.currentPrice,50)}
            style={{padding:"8px",background:"#FF980022",border:"1px solid #FF980044",borderRadius:8,color:"#FF9800",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>⚡ ৫০% Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{pos.currentPrice} · {Math.round(pos.shares*0.5)} shares</div>
          </button>
        </div>

        {/* Custom Input */}
        <div style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{fontSize:11,color:"#4A6080",marginBottom:8,fontWeight:700}}>✏️ Custom পরিমাণ:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Sell Price (৳)",sp,setSp],["Shares",ss,setSs]].map(([l,v,set])=>(
              <div key={l}>
                <div style={{fontSize:11,color:"#4A6080",marginBottom:3}}>{l}</div>
                <input type="number" value={v} onChange={e=>set(+e.target.value)}
                  style={{width:"100%",background:"#1A2D4A",border:"none",borderRadius:8,color:"#E8EAF0",padding:"8px 10px",fontSize:14,boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* P&L Preview */}
        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginBottom:12}}>
          {[
            ["Gross P&L","৳"+profit.toFixed(0),profit>=0?"#00C896":"#F44336"],
            ["Commission","-৳"+comm.toFixed(0),"#FF9800"],
            ["Net P&L","৳"+netPL.toFixed(0),netPL>=0?"#00C896":"#F44336"],
            ["Remaining",ss>=pos.shares?"শেষ ✅":(pos.shares-ss).toLocaleString()+" shares","#4A6080"],
          ].map(([l,v,cl])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
              <span style={{color:"#4A6080"}}>{l}</span>
              <span style={{fontWeight:700,color:cl}}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onSell(pos,sp,ss);setOpen(false);}}
            style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#00C896,#0080FF)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
            ✅ Confirm Sell
          </button>
          <button onClick={()=>setOpen(false)}
            style={{padding:"11px 16px",background:"#1A2D4A",border:"none",borderRadius:8,color:"#4A6080",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
// ── Trade Item with Withdrawal ──────────────────────────────
function TradeItem({t,profile,onWithdraw,C}){
  const [showW,setShowW]=useState(false);
  const [wAmt,setWAmt]=useState("");
  const [wBank,setWBank]=useState("");
  const [wDate,setWDate]=useState(new Date().toISOString().split("T")[0]);
  const withdrawn=(t.withdrawals||[]).reduce((a,w)=>a+(w.amount||0),0);
  const balance=(t.profit||0)-withdrawn;
  const btn2=(cl,act,sm)=>({padding:sm?"4px 10px":"7px 14px",borderRadius:8,border:"none",cursor:"pointer",background:act?cl:cl+"22",color:act?"#fff":cl,fontWeight:700,fontSize:sm?11:12,fontFamily:"inherit"});
  const inp2=(ex={})=>({background:"#0A1628",border:"1px solid #1A2D4A",borderRadius:6,color:"#E8EAF0",padding:"6px 10px",fontSize:12,fontFamily:"inherit",outline:"none",...ex});
  const addW=()=>{if(!wAmt||+wAmt<=0)return;onWithdraw(t.id,{id:Date.now(),amount:+wAmt,bank:wBank,date:wDate});setShowW(false);setWAmt("");setWBank("");};
  return(
    <div style={{background:"#0F1923",border:"1px solid #1A2D4A",borderRadius:12,padding:14,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:"#fff",fontSize:14}}>{t.stock} <span style={{background:"#0080FF22",color:"#0080FF",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{t.broker}</span></div>
          <div style={{fontSize:11,color:"#4A6080",marginTop:2}}>Buy ৳{t.buyRate} → Sell ৳{t.sellPrice} · {t.sellShares} shares · {t.date}</div>
          {t.commission>0&&<div style={{fontSize:10,color:"#FF9800"}}>Commission: ৳{t.commission.toFixed(0)}</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:800,fontSize:15,color:t.profit>=0?"#00C896":"#F44336"}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
          <div style={{fontSize:11,color:"#FFC107"}}>Balance: ৳{balance.toFixed(0)}</div>
        </div>
      </div>
      {(t.withdrawals||[]).length>0&&(
        <div style={{marginBottom:8}}>
          {t.withdrawals.map(w=>(
            <div key={w.id} style={{background:"#070D1A",borderRadius:6,padding:"5px 10px",marginBottom:4,fontSize:11,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:"#FFC107"}}>💸 ৳{w.amount} → {w.bank||"Bank"}</span>
              <span style={{color:"#4A6080"}}>{w.date}</span>
            </div>
          ))}
        </div>
      )}
      {showW?(
        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginTop:4}}>
          <div style={{fontSize:11,color:"#FFC107",fontWeight:700,marginBottom:8}}>💸 Withdraw করুন</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><div style={{fontSize:10,color:"#4A6080",marginBottom:2}}>Amount ৳</div><input type="number" value={wAmt} onChange={e=>setWAmt(e.target.value)} style={inp2({width:"100%",boxSizing:"border-box"})}/></div>
            <div><div style={{fontSize:10,color:"#4A6080",marginBottom:2}}>Date</div><input type="date" value={wDate} onChange={e=>setWDate(e.target.value)} style={inp2({width:"100%",boxSizing:"border-box"})}/></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:"#4A6080",marginBottom:2}}>Bank Account</div>
              <select value={wBank} onChange={e=>setWBank(e.target.value)} style={inp2({width:"100%"})}>
                <option value="">Select...</option>
                {(profile&&profile.bankAccounts||[]).map(b=><option key={b.id} value={b.name}>{b.name} {b.accountNo?"("+b.accountNo+")":""}</option>)}
              </select></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addW} style={btn2("#FFC107",true,true)}>✅ Confirm</button>
            <button onClick={()=>setShowW(false)} style={btn2("#4A6080",false,true)}>বাতিল</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setShowW(true)} style={btn2("#FFC107",false,true)}>💸 Withdraw করুন</button>
      )}
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────────
function LoginScreen({onLogin}){
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const go=async()=>{setLoading(true);setErr("");try{await onLogin();}catch(e){setErr("Login ব্যর্থ: "+e.message);}setLoading(false);};
  return(
    <div style={{background:"#070D1A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#0F1923",border:"1px solid #1A2D4A",borderRadius:16,padding:32,width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:12}}>📊</div>
        <div style={{fontWeight:800,fontSize:24,color:"#fff",marginBottom:4}}>DSE Trading Dashboard</div>
        <div style={{fontSize:13,color:"#4A6080",marginBottom:32}}>v7 · Enterprise · Cloud Sync</div>
        <button onClick={go} disabled={loading} style={{width:"100%",padding:14,background:"#fff",border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:15,fontWeight:700,color:"#1A1A1A",marginBottom:12,fontFamily:"inherit"}}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {loading?"লোড হচ্ছে...":"Google দিয়ে Login করুন"}
        </button>
        {err&&<div style={{color:"#F44336",fontSize:12,marginTop:8}}>{err}</div>}
        <div style={{fontSize:11,color:"#4A6080",marginTop:16}}>📊 আপনার data Firebase এ সুরক্ষিত</div>
      </div>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────
function SettingsPage({profile,user,onSave,onClose,onSignOut}){
  const [tab,setTab]=useState("profile");
  const [lp,setLp]=useState({...DEFAULT_PROFILE,...profile});
  const [saving,setSaving]=useState(false);
  const upd=(k,v)=>setLp(p=>({...p,[k]:v}));
  const updBroker=(id,k,v)=>setLp(p=>({...p,brokers:p.brokers.map(b=>b.id===id?{...b,[k]:v}:b)}));
  const updBank=(id,k,v)=>setLp(p=>({...p,bankAccounts:p.bankAccounts.map(b=>b.id===id?{...b,[k]:v}:b)}));
  const save=async()=>{setSaving(true);await onSave(lp);setSaving(false);};
  const C2={bg:"#070D1A",card:"#0F1923",border:"#1A2D4A",text:"#E8EAF0",muted:"#4A6080",accent:"#00C896",blue:"#0080FF",yellow:"#FFC107",red:"#F44336"};
  const inp2=(ex={})=>({background:"#0A1628",border:"1px solid #1A2D4A",borderRadius:6,color:"#E8EAF0",padding:"6px 10px",fontSize:13,fontFamily:"inherit",outline:"none",...ex});
  const btn2=(cl,act,sm)=>({padding:sm?"4px 10px":"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:act?cl:cl+"20",color:act?"#fff":cl,fontWeight:700,fontSize:sm?11:13,fontFamily:"inherit"});
  const TS2=(t)=>({padding:"8px 14px",border:"none",cursor:"pointer",background:tab===t?C2.accent:"transparent",color:tab===t?"#fff":C2.muted,fontWeight:700,fontSize:12,fontFamily:"inherit",borderRadius:8});
  return(
    <div style={{background:C2.bg,minHeight:"100vh",padding:"0 0 80px"}}>
      <div style={{background:"linear-gradient(135deg,#070D1A,#0F2040)",padding:"20px 20px 0",borderBottom:"1px solid "+C2.border}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <img src={user.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(user.displayName||"U")+"&background=00C896&color=fff"} style={{width:64,height:64,borderRadius:32,border:"3px solid #00C896"}} alt="profile"/>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>{lp.displayName||user.displayName}</div>
              <div style={{fontSize:12,color:C2.muted}}>{user.email}</div>
              <div style={{fontSize:11,color:C2.accent,marginTop:2}}>DSE Trader Enterprise</div>
            </div>
            <button onClick={onClose} style={{marginLeft:"auto",...btn2(C2.muted,false,true)}}>✕ বন্ধ</button>
          </div>
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
            {[["profile","👤 Profile"],["brokers","🏦 Brokers"],["banks","🏧 Banks"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={TS2(t)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:680,margin:"20px auto",padding:"0 20px"}}>
        {tab==="profile"&&(
          <div style={{background:C2.card,border:"1px solid "+C2.border,borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,color:C2.accent,marginBottom:14}}>👤 Profile</div>
            {[["displayName","নাম"],["phone","ফোন"]].map(([k,l])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C2.muted,marginBottom:3}}>{l}</div>
                <input value={lp[k]||""} onChange={e=>upd(k,e.target.value)} style={{...inp2({width:"100%",boxSizing:"border-box"})}}/>
              </div>
            ))}
            <div style={{marginTop:20,padding:14,background:"#070D1A",borderRadius:10,border:"1px solid "+C2.red+"44"}}>
              <div style={{fontWeight:700,color:C2.red,marginBottom:8}}>⚠️ Account</div>
              <button onClick={onSignOut} style={{...btn2(C2.red,true),width:"100%",padding:12}}>🚪 Sign Out</button>
            </div>
          </div>
        )}
        {tab==="brokers"&&(
          <div style={{background:C2.card,border:"1px solid "+C2.border,borderRadius:12,padding:20}}>
            <div style={{fontWeight:700,color:C2.accent,marginBottom:6}}>🏦 Broker Commission</div>
            <div style={{fontSize:12,color:C2.muted,marginBottom:14}}>প্রতিটি broker এর আলাদা commission % সেট করুন।</div>
            {(lp.brokers||DEFAULT_BROKERS).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+C2.border}}>
                <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:8}}>{b.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:11,color:C2.muted,marginBottom:3}}>Commission %</div>
                    <input type="number" value={b.commission} step="0.01" min="0" max="2" onChange={e=>updBroker(b.id,"commission",+e.target.value)} style={{...inp2({width:90,textAlign:"center"})}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C2.muted,marginBottom:3}}>Withdraw Fee ৳</div>
                    <input type="number" value={b.withdrawFee||0} min="0" onChange={e=>updBroker(b.id,"withdrawFee",+e.target.value)} style={{...inp2({width:90,textAlign:"center"})}}/>
                  </div>
                </div>
                <div style={{marginTop:6,fontSize:11,color:C2.yellow}}>৳১০,০০০ trade এ commission ≈ ৳{(10000*b.commission/100).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="banks"&&(
          <div style={{background:C2.card,border:"1px solid "+C2.border,borderRadius:12,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontWeight:700,color:C2.accent}}>🏧 Bank Accounts</div>
              <button onClick={()=>setLp(p=>({...p,bankAccounts:[...p.bankAccounts,{id:Date.now()+"",name:"",accountNo:"",branch:""}]}))} style={btn2(C2.blue,true,true)}>+ Add</button>
            </div>
            {(lp.bankAccounts||[]).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+C2.border}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                  {[["name","Bank Name"],["accountNo","Account No"],["branch","Branch"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C2.muted,marginBottom:2}}>{l}</div><input value={b[k]||""} onChange={e=>updBank(b.id,k,e.target.value)} style={{...inp2({width:"100%",boxSizing:"border-box",fontSize:12})}}/></div>
                  ))}
                </div>
                <button onClick={()=>setLp(p=>({...p,bankAccounts:p.bankAccounts.filter(x=>x.id!==b.id)}))} style={btn2(C2.red,false,true)}>🗑️ Remove</button>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:14}}>
          <button onClick={save} disabled={saving} style={{...btn2(C2.accent,true),width:"100%",padding:14}}>{saving?"💾 Saving...":"✅ Save Settings"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Profit Dashboard Tab ──────────────────────────────────────
function ProfitDashboard({trades,portfolio,stocks,profile}){
  const [period,setPeriod]=useState("week");
  const C2={bg:"#070D1A",card:"#0F1923",border:"#1A2D4A",accent:"#00C896",yellow:"#FFC107",red:"#F44336",gold:"#FFD700",muted:"#4A6080",blue:"#0080FF",orange:"#FF9800"};
  const card2=(ex={})=>({background:C2.card,border:"1px solid "+C2.border,borderRadius:12,...ex});
  const btn2=(cl,act,sm)=>({padding:sm?"4px 10px":"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:act?cl:cl+"20",color:act?"#fff":cl,fontWeight:700,fontSize:sm?11:12,fontFamily:"inherit"});

  const filtered=useMemo(()=>{
    const cutoff=new Date();
    if(period==="day")cutoff.setDate(cutoff.getDate()-1);
    else if(period==="week")cutoff.setDate(cutoff.getDate()-7);
    else if(period==="fortnight")cutoff.setDate(cutoff.getDate()-14);
    else if(period==="month")cutoff.setMonth(cutoff.getMonth()-1);
    else cutoff.setFullYear(2000);
    return trades.filter(t=>new Date(t.date)>=cutoff);
  },[trades,period]);

  const totalRealized=trades.reduce((a,t)=>a+(t.profit||0),0);
  const totalWithdrawn=trades.reduce((a,t)=>a+(t.withdrawals||[]).reduce((x,w)=>x+(w.amount||0),0),0);
  const inBroker=totalRealized-totalWithdrawn;
  const periodProfit=filtered.reduce((a,t)=>a+(t.profit||0),0);

  const daily=useMemo(()=>{
    const map={};
    trades.forEach(t=>{const d=t.date?t.date.split("T")[0]:null;if(d)map[d]=(map[d]||0)+(t.profit||0);});
    const days=[];
    for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];days.push({date:k.slice(5),profit:map[k]||0});}
    return days;
  },[trades]);
  const maxP=Math.max(...daily.map(d=>Math.abs(d.profit)),1);

  const portMap={};portfolio.forEach(p=>{portMap[p.stock]=(portMap[p.stock]||0)+p.shares;});
  const top3=[...stocks].map(s=>({...s,score:calcScore(s,7),str:generateStrategy(s,7,portMap[s.name]||0)})).filter(s=>s.score>=60&&s.str&&s.str.priority<=2).sort((a,b)=>b.score-a.score).slice(0,3);

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        {[["Total Realized","৳"+totalRealized.toFixed(0),C2.accent],["Broker Balance","৳"+Math.max(0,inBroker).toFixed(0),C2.blue],["Withdrawn","৳"+totalWithdrawn.toFixed(0),C2.yellow],["Period P&L","৳"+periodProfit.toFixed(0),periodProfit>=0?C2.accent:C2.red]].map(([l,v,cl])=>(
          <div key={l} style={{...card2(),padding:12,textAlign:"center"}}><div style={{fontSize:11,color:C2.muted,marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:cl}}>{v}</div></div>
        ))}
      </div>
      <div style={{...card2(),padding:12,marginBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
        {[["day","আজ"],["week","সাপ্তাহিক"],["fortnight","পাক্ষিক"],["month","মাসিক"],["all","সব"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} style={btn2(C2.accent,period===k,true)}>{l}</button>
        ))}
      </div>
      <div style={{...card2(),padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:C2.accent,marginBottom:10}}>📈 Daily P&L (30 days)</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:80}}>
          {daily.map((d,i)=>{const h=Math.max(2,Math.abs(d.profit)/maxP*70);const color=d.profit>=0?"#00C896":"#F44336";return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:"80%",height:h,background:color,borderRadius:"2px 2px 0 0"}}/>
              {i%5===0&&<div style={{fontSize:7,color:C2.muted,transform:"rotate(-45deg)",whiteSpace:"nowrap",marginTop:2}}>{d.date}</div>}
            </div>
          );})}
        </div>
      </div>
      <div style={{...card2(),padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:C2.accent,marginBottom:10}}>💰 {period==="day"?"আজ":period==="week"?"সাপ্তাহিক":period==="fortnight"?"পাক্ষিক":period==="month"?"মাসিক":"সব"}: <span style={{color:periodProfit>=0?C2.accent:C2.red}}>৳{periodProfit.toFixed(0)}</span></div>
        {filtered.length===0?<div style={{color:C2.muted,fontSize:12}}>এই period এ trade নেই।</div>:filtered.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C2.border}}>
            <div><div style={{fontWeight:700,color:"#fff",fontSize:13}}>{t.stock} <span style={{color:C2.muted,fontSize:11}}>{t.broker}</span></div><div style={{fontSize:10,color:C2.muted}}>{t.date}</div></div>
            <div style={{fontWeight:800,color:t.profit>=0?C2.accent:C2.red}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div style={{...card2(),padding:14}}>
        <div style={{fontWeight:700,color:"#FFD700",marginBottom:10}}>🏆 Top 3 Buy — এখন কিনুন</div>
        {top3.length===0?<div style={{color:C2.muted,fontSize:12}}>এখন strong signal নেই।</div>:top3.map((s,i)=>(
          <div key={s.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32")+"44"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:26,height:26,background:i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#000"}}>#{i+1}</div>
              <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff"}}>{s.name} <span style={{fontSize:11,color:C2.muted}}>৳{s.price}</span></div><div style={{fontSize:10,color:C2.accent}}>Score: {s.score} · {s.str.risk}</div></div>
            </div>
            <div style={{fontSize:12,color:"#E8EAF0",lineHeight:1.5,marginBottom:4}}>{s.str.buyStr}</div>
            <div style={{display:"flex",gap:10,fontSize:11}}><span style={{color:C2.accent}}>T1: ৳{s.str.t1}</span><span style={{color:C2.yellow}}>T2: ৳{s.str.t2}</span><span style={{color:C2.muted}}>Zone: {s.str.buyZone}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App(){
  const sv=load();
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [profile,setProfile]=useState(DEFAULT_PROFILE);
  const [showSettings,setShowSettings]=useState(false);
  const [tab,setTab]=useState("screener");
  const [stocks,setStocks]=useState((sv&&sv.stocks)||INIT_STOCKS);
  const [port,setPort]=useState((sv&&sv.port)||INIT_PORT);
  const [trades,setTrades]=useState((sv&&sv.trades)||[]);
  const [days,setDays]=useState(7);
  const [customDays,setCustomDays]=useState("");
  const [sector,setSector]=useState("সব");
  const [sigF,setSigF]=useState("সব");
  const [nameFilter,setNameFilter]=useState("");
  const [sortBy,setSortBy]=useState("score");
  const [expanded,setExpanded]=useState(null);
  const [editMode,setEditMode]=useState(null);
  const [editPort,setEditPort]=useState(null);
  const [showAddS,setShowAddS]=useState(false);
  const [showAddP,setShowAddP]=useState(false);
  const [showPortPaste,setShowPortPaste]=useState(false);
  const [portPasteCode,setPortPasteCode]=useState("");
  const [portPasteErr,setPortPasteErr]=useState("");
  const [portPasteBroker,setPortPasteBroker]=useState("Ecosoft");
  const [showPaste,setShowPaste]=useState(false);
  const [stockPaste,setStockPaste]=useState(null);
  const [showBuyRank,setShowBuyRank]=useState(false);
  const [deleteItem,setDeleteItem]=useState(null);
  const [undoItem,setUndoItem]=useState(null);
  const [toast,setToast]=useState(null);
  const [liveLoading,setLiveLoading]=useState(false);
  const [liveStatus,setLiveStatus]=useState(null); // null | "ok" | "error"
  const [liveUpdatedAt,setLiveUpdatedAt]=useState(null);
  const [chartStock,setChartStock]=useState(null); // stock being charted
  const [chartType,setChartType]=useState("candlestick"); // candlestick|line|ohlc
  const [chartData,setChartData]=useState({}); // {SYMBOL: [{date,open,high,low,close,vol}]}
  const [chartLoading,setChartLoading]=useState(false);
  const [taData,setTaData]=useState({}); // {SYMBOL: fullTA result}
  const [ns,setNs]=useState({name:"",sector:"Bank",cat:"A",price:"",eps:"",pe:"",nav:"",div:"",rsi:"50",macd:"0",vol:"",vma20:"",ema20:"",sma50:"",ret6m:"",inst:"",circuit:""});
  const [nsSearch,setNsSearch]=useState("");
  const [np,setNp]=useState({stock:"",broker:"Ecosoft",shares:"",buyRate:"",target1:"",target2:"",stopLoss:"",buyDate:TODAY,customSellTarget:""});
  const [npSearch,setNpSearch]=useState("");

  // ── Technical Indicator Calculators ─────────────────────────────────
  const calcRSI = (closes, period) => {
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

  const calcEMA = (closes, period) => {
    if (!closes || closes.length < period) return null;
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return +ema.toFixed(2);
  };

  const calcSMA = (closes, period) => {
    if (!closes || closes.length < period) return null;
    const slice = closes.slice(-period);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
  };

  const calcMACD = (closes) => {
    if (!closes || closes.length < 26) return { macd: null, signal: null, hist: null };
    const ema12 = calcEMA(closes, 12);
    const ema26 = calcEMA(closes, 26);
    if (!ema12 || !ema26) return { macd: null, signal: null, hist: null };
    const macd = +(ema12 - ema26).toFixed(3);
    // Signal line approximation
    const signal = +(macd * 0.9).toFixed(3);
    return { macd, signal, hist: +(macd - signal).toFixed(3) };
  };

  const calcVMA = (volumes, period) => {
    period = period || 20;
    if (!volumes || volumes.length < period) return null;
    const slice = volumes.slice(-period);
    return Math.round(slice.reduce((a, b) => a + b, 0) / period);
  };

  // ── Fetch Live Data from DSE via proxy ───────────────────────────────
  const fetchLiveData = async () => {
    setLiveLoading(true);
    setLiveStatus(null);
    showToast("⏳ DSE থেকে data আনছি...");
    try {
      // Use allorigins proxy to bypass CORS
      const stockNames = stocks.map(s => s.name);
      let successCount = 0;
      const updatedStocks = [...stocks];

      for (let i = 0; i < stockNames.length; i++) {
        const sym = stockNames[i];
        try {
          // Fetch historical data for technical indicators
          const today = new Date();
          const from = new Date(today);
          from.setDate(from.getDate() - 60); // last 60 days
          const fromStr = from.toISOString().split("T")[0];
          const toStr = today.toISOString().split("T")[0];

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
                updatedStocks[idx] = Object.assign({}, updatedStocks[idx], {
                  price: price,
                  vol: vol || updatedStocks[idx].vol,
                  updatedAt: TODAY,
                  liveChange: change,
                  liveChangePct: changePct,
                  ycp: ycp,
                });
                successCount++;
              }
            }
          }
        } catch (e) {
          console.log("Skip " + sym + ": " + e.message);
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 200));
      }

      if (successCount > 0) {
        setStocks(updatedStocks);
        persist(updatedStocks, null, null);
        setLiveStatus("ok");
        setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
        showToast("✅ " + successCount + "টি stock এর data আপডেট হয়েছে!");
      } else {
        // Fallback: try alternative proxy
        await fetchLiveDataFallback();
      }
    } catch (e) {
      console.error("Live fetch error:", e);
      setLiveStatus("error");
      showToast("❌ Data আনতে সমস্যা। পরে try করুন।", "err");
    }
    setLiveLoading(false);
  };

  // Fallback using DSE scraper proxy
  const fetchLiveDataFallback = async () => {
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
        return Object.assign({}, s, {
          price: price,
          vol: parseInt(d.volume || d.VOLUME || s.vol),
          updatedAt: TODAY,
          liveChange: parseFloat(d.change || d.CHANGE || 0),
          liveChangePct: parseFloat(d.percent_change || d.PERCENT_CHANGE || 0),
          ycp: parseFloat(d.ycp || d.YCP || 0),
        });
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
  };

  // ════════════════════════════════════════════════════════════════════
  // TECHNICAL ANALYSIS ENGINE — DSE Bangladesh Market Optimized
  // ════════════════════════════════════════════════════════════════════

  const calcBollingerBands = (closes, period, mult) => {
    period = period || 20; mult = mult || 2;
    if (!closes || closes.length < period) return null;
    const slice = closes.slice(-period);
    const sma = slice.reduce((a,b)=>a+b,0) / period;
    const variance = s
