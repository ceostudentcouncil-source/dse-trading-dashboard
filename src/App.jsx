import { useState, useMemo, useCallback } from "react";

const SK = "dse-v6";
const load = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (d) => { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} };

// ── INIT_STOCKS — EMA20, SMA50, VMA20 যোগ করা হয়েছে ─────────────────
const INIT_STOCKS = [
  { id:1,  name:"SIMTEX",     sector:"Textile",      cat:"A", price:27.5,  eps:1.28,  pe:20.94, nav:22.39, div:10, rsi:65.85, macd:0.8,  vol:3460000, vma20:2800000, ema20:26.8,  sma50:25.4, ret6m:20, inst:7.57,  circuit:29.5, totalShares:7960000,  updatedAt:"2026-07-02" },
  { id:2,  name:"MONOSPOOL",  sector:"Engineering",  cat:"A", price:114.3, eps:4.12,  pe:27.74, nav:41.83, div:15, rsi:64.55, macd:2.5,  vol:771667,  vma20:600000,  ema20:110.5, sma50:105.2,ret6m:21, inst:4.13,  circuit:123.3,totalShares:3920000,  updatedAt:"2026-07-02" },
  { id:3,  name:"SAPORTL",    sector:"NBFI",         cat:"A", price:52.8,  eps:3.2,   pe:16.5,  nav:28.5,  div:12, rsi:51.69, macd:1.4,  vol:5465800, vma20:4000000, ema20:51.2,  sma50:49.8, ret6m:15, inst:12.5,  circuit:57.8, totalShares:10000000, updatedAt:"2026-07-02" },
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
  { id:1,  stock:"EPGL",       broker:"Ecosoft",     shares:7300,  buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0 },
  { id:2,  stock:"EPGL",       broker:"Lankabangla", shares:12000, buyRate:19.26, currentPrice:19.6, target1:20.5, target2:20.7, stopLoss:18.0, trailingSL:18.0, realized:0 },
  { id:3,  stock:"HAKKANIPUL", broker:"Ecosoft",     shares:2500,  buyRate:80.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0 },
  { id:4,  stock:"HAKKANIPUL", broker:"অন্য",        shares:5000,  buyRate:81.24, currentPrice:80.0, target1:82.0, target2:84.0, stopLoss:76.5, trailingSL:76.5, realized:0 },
  { id:5,  stock:"LOVELLO",    broker:"Ecosoft",     shares:9630,  buyRate:71.54, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0 },
  { id:6,  stock:"LOVELLO",    broker:"Lankabangla", shares:5087,  buyRate:75.17, currentPrice:71.9, target1:75.5, target2:78.0, stopLoss:67.5, trailingSL:67.5, realized:0 },
  { id:7,  stock:"MONNOFABR",  broker:"Ecosoft",     shares:23526, buyRate:21.77, currentPrice:22.4, target1:23.9, target2:25.0, stopLoss:21.0, trailingSL:21.0, realized:0 },
  { id:8,  stock:"KPPL",       broker:"অন্য",        shares:10000, buyRate:16.25, currentPrice:16.2, target1:17.0, target2:18.0, stopLoss:14.8, trailingSL:14.8, realized:0 },
  { id:9,  stock:"DESHBANDHU", broker:"Lankabangla", shares:10000, buyRate:20.86, currentPrice:21.3, target1:21.8, target2:22.5, stopLoss:19.8, trailingSL:19.8, realized:0 },
  { id:10, stock:"ACMEPL",     broker:"Lankabangla", shares:6400,  buyRate:26.28, currentPrice:23.3, target1:24.1, target2:25.6, stopLoss:22.0, trailingSL:22.0, realized:0 },
  { id:11, stock:"JAMUNABANK", broker:"Lankabangla", shares:19500, buyRate:24.13, currentPrice:24.2, target1:25.0, target2:25.9, stopLoss:22.5, trailingSL:22.5, realized:0 },
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
function generateStrategy(s,days,portShares){
  days=days||7; portShares=portShares||0;
  const navRatio=s.nav>0?s.price/s.nav:1;
  const volM=s.vol/1000000;
  const vma20=s.vma20||1000000;
  const isBreakoutVol=s.vol>vma20*2;
  const isPump=s.vol>5000000&&s.rsi>70&&s.ret6m>40;
  const isOversold=s.rsi<35;
  const isBullMACD=s.macd>0.3;
  const isFundStrong=s.eps>3&&s.pe>0&&s.pe<20;
  const isUnderval=navRatio<1.5;
  const isOverbought=s.rsi>68;
  const isAboveEMA=s.ema20&&s.price>s.ema20;
  const isAboveSMA=s.sma50&&s.price>s.sma50;
  const dayMult=days<=5?0.04:days<=10?0.07:days<=21?0.12:0.20;
  const sl=+(s.price*0.93).toFixed(2);
  let t1,t2,t3,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,priority;

  if(isPump){
    t1=+(s.price*(1+dayMult*0.6)).toFixed(2);t2=+(s.price*(1+dayMult)).toFixed(2);t3=null;
    sellT1=60;sellT2=35;sellT3=5;risk="🔴 HIGH";priority=4;
    buySignal="🔴 কিনবেন না";buyZone="—";
    buyStr="Pump pattern! RSI "+s.rsi.toFixed(0)+" — অতিরিক্ত উপরে।";
    sellStr="⚠️ Pump! T1 এ "+sellT1+"% — দেরি করবেন না। Circuit "+s.circuit+" এর আগেই বের হন।";
  } else if(isOversold&&isBullMACD){
    t1=+(s.price*(1+dayMult*1.1)).toFixed(2);t2=+(s.price*(1+dayMult*1.7)).toFixed(2);t3=+(s.price*(1+dayMult*2.5)).toFixed(2);
    sellT1=25;sellT2=45;sellT3=30;risk="🟢 LOW";priority=1;
    buySignal="🚀 এখনই কিনুন";buyZone="৳"+(s.price*0.98).toFixed(2)+"-৳"+s.price;
    buyStr="Oversold bounce RSI "+s.rsi.toFixed(0)+" + MACD bullish"+(isBreakoutVol?" + Breakout Volume!":"")+". Budget ৬০% এখন।";
    sellStr="Bottom থেকে উঠছে — T2 এ "+sellT2+"% রাখুন। Trailing SL active!";
  } else if(isFundStrong&&isUnderval&&days>10){
    t1=+(s.price*(1+dayMult*0.9)).toFixed(2);t2=+(s.price*(1+dayMult*1.5)).toFixed(2);t3=+(s.nav*0.75).toFixed(2);
    sellT1=20;sellT2=35;sellT3=45;risk="🟢 LOW";priority=2;
    buySignal="✅ Long term Buy";buyZone="৳"+(s.price*0.97).toFixed(2)+"-৳"+s.price;
    buyStr="P/E "+s.pe+" + NAV "+s.nav+(isAboveEMA?" + EMA20 above":"")+". "+days+"+ দিনের জন্য excellent।";
    sellStr="Fundamental strong — T3 পর্যন্ত ধরুন ("+sellT3+"%)। NAV target ৳"+t3+"।";
  } else if(isOverbought){
    t1=+(s.price*(1+dayMult*0.5)).toFixed(2);t2=s.circuit?+(s.circuit*0.97).toFixed(2):+(s.price*(1+dayMult*0.9)).toFixed(2);t3=null;
    sellT1=60;sellT2=35;sellT3=5;risk="🟡 MEDIUM";priority=4;
    buySignal="🟡 অপেক্ষা করুন";buyZone="RSI "+(s.rsi-15).toFixed(0)+" এ নামলে";
    buyStr="RSI "+s.rsi.toFixed(0)+" — Overbought। RSI ৫০ এ নামলে এবং EMA20 support এ কিনুন।";
    sellStr="Overbought — T1 এ "+sellT1+"% নিন।"+(s.circuit?" Circuit "+s.circuit+" এর আগেই বের হন!":"");
  } else if(isBreakoutVol&&isBullMACD){
    t1=+(s.price*(1+dayMult*1.0)).toFixed(2);t2=+(s.price*(1+dayMult*1.6)).toFixed(2);t3=+(s.price*(1+dayMult*2.2)).toFixed(2);
    sellT1=30;sellT2=45;sellT3=25;risk="🟢 LOW-MED";priority=1;
    buySignal="🚀 Volume Breakout";buyZone="৳"+(s.price*0.99).toFixed(2)+"-৳"+s.price;
    buyStr="Breakout Volume ("+volM.toFixed(1)+"M vs VMA "+((vma20||0)/1000000).toFixed(1)+"M)! MACD bullish"+(isAboveEMA?" + EMA20 above":"")+". Strong signal!";
    sellStr="Volume breakout — "+days+" দিনে T2 সম্ভব। T1 এ trailing SL set করুন।";
  } else if(isBullMACD&&isAboveEMA){
    t1=+(s.price*(1+dayMult*0.85)).toFixed(2);t2=+(s.price*(1+dayMult*1.4)).toFixed(2);t3=+(s.price*(1+dayMult*1.9)).toFixed(2);
    sellT1=35;sellT2=40;sellT3=25;risk="🟢 LOW-MED";priority=2;
    buySignal="✅ কিনতে পারেন";buyZone="৳"+(s.price*0.99).toFixed(2)+"-৳"+s.price;
    buyStr="MACD "+s.macd.toFixed(1)+" + Price > EMA20"+(isAboveSMA?" + SMA50 above":"")+". Trend bullish।";
    sellStr="Trend following — "+days+" দিনে T1-T2 target। RSI ৬৮ হলে বের হন।";
  } else if(isBullMACD){
    t1=+(s.price*(1+dayMult*0.8)).toFixed(2);t2=+(s.price*(1+dayMult*1.3)).toFixed(2);t3=+(s.price*(1+dayMult*1.8)).toFixed(2);
    sellT1=35;sellT2=40;sellT3=25;risk="🟡 MEDIUM";priority=2;
    buySignal="✅ কিনতে পারেন";buyZone="৳"+(s.price*0.99).toFixed(2)+"-৳"+s.price;
    buyStr="MACD "+s.macd.toFixed(1)+" bullish। EMA20 (৳"+(s.ema20||"-")+") support এ রাখুন।";
    sellStr="MACD driven — "+days+" দিনে T1-T2 target।";
  } else {
    t1=+(s.price*(1+dayMult*0.8)).toFixed(2);t2=+(s.price*(1+dayMult*1.3)).toFixed(2);t3=null;
    sellT1=40;sellT2=45;sellT3=15;risk="🟡 MEDIUM";priority=3;
    buySignal="🟡 অপেক্ষা করুন";buyZone="৳"+(s.price*0.95).toFixed(2)+"-৳"+(s.price*0.98).toFixed(2);
    buyStr="Sideways। EMA20: ৳"+(s.ema20||"-")+" / SMA50: ৳"+(s.sma50||"-")+". Breakout এর জন্য অপেক্ষা করুন।";
    sellStr="Sideways — T1 এ "+sellT1+"% নিন। Trailing SL maintain করুন।";
  }

  if(s.circuit&&t2>=s.circuit){t2=+(s.circuit*0.97).toFixed(2);sellStr+=" | Circuit "+s.circuit+" এর আগেই বের হন!";}
  const holdNote=portShares>0?"আপনার "+portShares.toLocaleString()+" shares":"";
  const maSignal=(isAboveEMA&&isAboveSMA)?"🟢 EMA+SMA উপরে":isAboveEMA?"🟡 EMA উপরে":isAboveSMA?"🟡 SMA উপরে":"🔴 MA এর নিচে";
  return{t1,t2,t3,sl,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,holding:days+" দিন",holdNote,priority,maSignal,isBreakoutVol,isAboveEMA,isAboveSMA};
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
  const ex='{"name":"'+(stockName||"STOCKNAME")+'","price":28.5,"rsi":62,"macd":0.8,"eps":1.5,"pe":19,"nav":22,"div":10,"vol":3500000,"vma20":2000000,"ema20":27.2,"sma50":26.5,"ret6m":18,"inst":8,"circuit":31.5,"cat":"A","sector":"Textile"}';
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

// ── SellModal ─────────────────────────────────────────────────────────
function SellModal({pos,onSell}){
  const [open,setOpen]=useState(false);
  const [sp,setSp]=useState(pos.currentPrice);
  const [ss,setSs]=useState(Math.floor(pos.shares*0.4));
  if(!open)return <button onClick={()=>setOpen(true)} style={{background:"#00C89622",color:"#00C896",border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>💰 Sell</button>;
  const profit=(sp-pos.buyRate)*ss,comm=(ss*pos.buyRate+ss*sp)*COMM;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0F1923",border:"1px solid #00C896",borderRadius:16,padding:24,width:"100%",maxWidth:360}}>
        <div style={{fontWeight:800,fontSize:16,color:"#fff",marginBottom:14}}>💰 {pos.stock} Sell</div>
        {[["Sell Price",sp,setSp],["Shares",ss,setSs]].map(([l,v,set])=>(
          <div key={l} style={{marginBottom:12}}><div style={{fontSize:12,color:"#4A6080",marginBottom:3}}>{l}</div>
            <input type="number" value={v} onChange={e=>set(+e.target.value)} style={{width:"100%",background:"#1A2D4A",border:"none",borderRadius:8,color:"#E8EAF0",padding:"8px 12px",fontSize:14,boxSizing:"border-box"}}/></div>
        ))}
        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginBottom:14}}>
          {[["Gross P&L","৳"+profit.toFixed(0),profit>=0?"#00C896":"#F44336"],["Commission","-৳"+comm.toFixed(0),"#FF9800"],["Net P&L","৳"+(profit-comm).toFixed(0),(profit-comm)>=0?"#00C896":"#F44336"]].map(([l,v,cl])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}><span style={{color:"#4A6080"}}>{l}</span><span style={{fontWeight:700,color:cl}}>{v}</span></div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onSell(pos,sp,ss);setOpen(false);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#00C896,#0080FF)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>✅ Confirm</button>
          <button onClick={()=>setOpen(false)} style={{padding:"10px 16px",background:"#1A2D4A",border:"none",borderRadius:8,color:"#4A6080",cursor:"pointer",fontWeight:700}}>বাতিল</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
export default function App(){
  const sv=load();
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
  const [ns,setNs]=useState({name:"",sector:"Bank",cat:"A",price:"",eps:"",pe:"",nav:"",div:"",rsi:"50",macd:"0",vol:"",vma20:"",ema20:"",sma50:"",ret6m:"",inst:"",circuit:""});
  const [nsSearch,setNsSearch]=useState("");
  const [np,setNp]=useState({stock:"",broker:"Ecosoft",shares:"",buyRate:"",target1:"",target2:"",stopLoss:""});
  const [npSearch,setNpSearch]=useState("");

  const showToast=(msg,type)=>{setToast({msg,type:type||"ok"});setTimeout(()=>setToast(null),4000);};
  const persist=useCallback((s,p,t)=>save({stocks:s||stocks,port:p||port,trades:t||trades}),[stocks,port,trades]);

  const portMap=useMemo(()=>{const m={};port.forEach(p=>{m[p.stock]=(m[p.stock]||0)+p.shares;});return m;},[port]);

  // Apply paste
  const applyPaste=(data)=>{
    if(!data.name){showToast("❌ name দরকার","err");return;}
    const nm=data.name.toUpperCase();
    const ud=Object.assign({},data,{name:nm,updatedAt:TODAY});
    const exists=stocks.find(s=>s.name.toUpperCase()===nm);
    if(exists){
      const u=stocks.map(s=>s.name.toUpperCase()===nm?Object.assign({},s,ud,{id:s.id}):s);
      setStocks(u);persist(u,null,null);showToast("✅ "+nm+" আপডেট হয়েছে!");
    }else{
      const s=Object.assign({id:Date.now(),cat:"A",sector:"অন্যান্য",eps:0,pe:0,nav:1,div:0,rsi:50,macd:0,vol:0,vma20:500000,ema20:0,sma50:0,ret6m:0,inst:0,circuit:0,totalShares:5000000},ud);
      const u=[...stocks,s];setStocks(u);persist(u,null,null);showToast("✅ "+nm+" নতুন যোগ হয়েছে!");
    }
  };

  // Portfolio paste
  const applyPortPaste=()=>{
    setPortPasteErr("");
    try{
      const raw=JSON.parse(portPasteCode.trim());
      const items=Array.isArray(raw)?raw:[raw];
      if(!items.length){setPortPasteErr("❌ কোনো data নেই।");return;}
      let added=0,updated=0;
      let newPort=[...port];
      items.forEach(item=>{
        if(!item.stock||!item.buyRate)return;
        const broker=item.broker||portPasteBroker;
        const br=+item.buyRate;
        const idx=newPort.findIndex(p=>p.stock.toUpperCase()===item.stock.toUpperCase()&&p.broker===broker);
        if(idx>=0){
          newPort[idx]=Object.assign({},newPort[idx],{shares:item.shares!==undefined?+item.shares:newPort[idx].shares,buyRate:br||newPort[idx].buyRate,currentPrice:item.currentPrice!==undefined?+item.currentPrice:newPort[idx].currentPrice,target1:item.target1?+item.target1:newPort[idx].target1,target2:item.target2?+item.target2:newPort[idx].target2,stopLoss:item.stopLoss?+item.stopLoss:newPort[idx].stopLoss});
          updated++;
        }else{
          newPort.push({id:Date.now()+Math.random(),stock:item.stock.toUpperCase(),broker,shares:+item.shares||0,buyRate:br,currentPrice:item.currentPrice!==undefined?+item.currentPrice:br,target1:item.target1?+item.target1:+(br*1.07).toFixed(2),target2:item.target2?+item.target2:+(br*1.15).toFixed(2),stopLoss:item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2),trailingSL:item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2),realized:0});
          added++;
        }
      });
      setPort(newPort);persist(null,newPort,null);
      setPortPasteCode("");setShowPortPaste(false);setPortPasteErr("");
      showToast("✅ "+added+"টি নতুন যোগ, "+updated+"টি আপডেট হয়েছে!");
    }catch(e){setPortPasteErr("❌ JSON format ঠিক নেই।");}
  };

  // Scored stocks
  const scored=useMemo(()=>stocks.map(s=>{
    const score=calcScore(s,days);const rec=getRec(score);
    const str=generateStrategy(s,days,portMap[s.name]||0);
    return Object.assign({},s,{score,rec,str});
  }),[stocks,days,portMap]);

  // Filtered
  const filtered=useMemo(()=>{
    let list=[...scored];
    if(nameFilter.trim())list=list.filter(s=>s.name.toUpperCase().includes(nameFilter.trim().toUpperCase()));
    if(sector!=="সব")list=list.filter(s=>s.sector===sector);
    if(sigF!=="সব"){const m={"STRONG BUY":s=>s.score>=75,"BUY":s=>s.score>=60&&s.score<75,"WATCH":s=>s.score>=45&&s.score<60,"WEAK":s=>s.score>=30&&s.score<45,"AVOID":s=>s.score<30};list=list.filter(m[sigF]||(_=>true));}
    list.sort((a,b)=>sortBy==="score"?b.score-a.score:sortBy==="rsi"?a.rsi-b.rsi:sortBy==="vol"?b.vol-a.vol:b.eps-a.eps);
    return list;
  },[scored,sector,sigF,sortBy,days,nameFilter]);

  const sigC=useMemo(()=>{
    const c={"STRONG BUY":0,"BUY":0,"WATCH":0,"WEAK":0,"AVOID":0};
    scored.forEach(s=>{if(s.score>=75)c["STRONG BUY"]++;else if(s.score>=60)c["BUY"]++;else if(s.score>=45)c["WATCH"]++;else if(s.score>=30)c["WEAK"]++;else c["AVOID"]++;});
    return c;
  },[scored]);

  // Enriched portfolio — Trailing SL logic
  const enriched=useMemo(()=>port.map(p=>{
    const cost=p.shares*p.buyRate,val=p.shares*p.currentPrice,pl=val-cost,plp=cost!==0?(pl/cost)*100:0;
    const sData=stocks.find(s=>s.name===p.stock);
    const str=sData?generateStrategy(sData,days,p.shares):{t1:p.target1,t2:p.target2,t3:null,sl:p.stopLoss,sellT1:40,sellT2:40,sellT3:20,risk:"🟡 MEDIUM",sellStr:"Screener এ stock নেই।",maSignal:"—",isBreakoutVol:false};
    // Trailing SL calculation
    const tsl=calcTrailingSL({...p,str});
    const isTSLActive=tsl>p.stopLoss;
    let sig="⏳ HOLD";
    const effectiveSL=Math.max(tsl,p.stopLoss);
    if(p.currentPrice<=effectiveSL)sig="🔴 STOP LOSS!";
    else if(p.currentPrice>=str.t2)sig="🚀 T2 SELL";
    else if(p.currentPrice>=str.t1)sig="✅ T1 SELL";
    return Object.assign({},p,{cost,val,pl,plp,sig,str,sData,tsl,isTSLActive,effectiveSL});
  }),[port,stocks,days]);

  const summ=useMemo(()=>{
    const tc=enriched.reduce((a,p)=>a+p.cost,0),tv=enriched.reduce((a,p)=>a+p.val,0),tr=trades.reduce((a,t)=>a+(t.profit||0),0);
    const byB={};enriched.forEach(p=>{if(!byB[p.broker])byB[p.broker]={cost:0,val:0,n:0};byB[p.broker].cost+=p.cost;byB[p.broker].val+=p.val;byB[p.broker].n++;});
    return{tc,tv,tpl:tv-tc,tr,byB};
  },[enriched,trades]);

  const updateStock=(id,f,v)=>{const u=stocks.map(s=>s.id===id?Object.assign({},s,{[f]:v}):s);setStocks(u);persist(u,null,null);};
  const updatePort=(id,f,v)=>{const u=port.map(p=>p.id===id?Object.assign({},p,{[f]:+v}):p);setPort(u);persist(null,u,null);};
  const removeStock=(id)=>{const u=stocks.filter(s=>s.id!==id);setStocks(u);persist(u,null,null);showToast("Stock সরানো হয়েছে।");};
  const confirmDelete=(item)=>setDeleteItem(item);
  const doDelete=(reason)=>{
    setUndoItem(Object.assign({},deleteItem,{deleteReason:reason}));
    const u=port.filter(p=>p.id!==deleteItem.id);setPort(u);persist(null,u,null);setDeleteItem(null);
    showToast("🗑️ "+deleteItem.stock+" সরানো হয়েছে। Undo করুন।","warn");
    setTimeout(()=>setUndoItem(null),15000);
  };
  const undoDelete=()=>{
    const pos=Object.assign({},undoItem);delete pos.deleteReason;
    const u=[...port,pos];setPort(u);persist(null,u,null);setUndoItem(null);
    showToast("✅ "+pos.stock+" ফিরিয়ে আনা হয়েছে!");
  };

  const addStock=()=>{
    if(!ns.name||!ns.price)return;
    const nm=ns.name.toUpperCase();
    const fields={price:+ns.price,eps:+ns.eps||0,pe:+ns.pe||0,nav:+ns.nav||0,div:+ns.div||0,rsi:+ns.rsi||50,macd:+ns.macd||0,vol:+ns.vol||0,vma20:+ns.vma20||500000,ema20:+ns.ema20||0,sma50:+ns.sma50||0,ret6m:+ns.ret6m||0,inst:+ns.inst||0,circuit:+ns.circuit||0,cat:ns.cat,sector:ns.sector,updatedAt:TODAY};
    const exists=stocks.find(s=>s.name.toUpperCase()===nm);
    let u;
    if(exists){u=stocks.map(s=>s.name.toUpperCase()===nm?Object.assign({},s,fields,{name:s.name}):s);showToast("✅ "+nm+" আপডেট হয়েছে!");}
    else{u=[...stocks,Object.assign({id:Date.now(),name:nm,totalShares:5000000},fields)];showToast("✅ "+nm+" যোগ হয়েছে!");}
    setStocks(u);persist(u,null,null);
    setNs({name:"",sector:"Bank",cat:"A",price:"",eps:"",pe:"",nav:"",div:"",rsi:"50",macd:"0",vol:"",vma20:"",ema20:"",sma50:"",ret6m:"",inst:"",circuit:""});setNsSearch("");setShowAddS(false);
  };

  const selectStockForNS=(s)=>{
    setNs({name:s.name,sector:s.sector,cat:s.cat,price:String(s.price),eps:String(s.eps),pe:String(s.pe),nav:String(s.nav),div:String(s.div),rsi:String(s.rsi),macd:String(s.macd),vol:String(s.vol),vma20:String(s.vma20||""),ema20:String(s.ema20||""),sma50:String(s.sma50||""),ret6m:String(s.ret6m),inst:String(s.inst),circuit:String(s.circuit||"")});
    setNsSearch(s.name);
  };
  const selectStockForPort=(s)=>{
    setNp(p=>Object.assign({},p,{stock:s.name,target1:+(s.price*1.07).toFixed(2),target2:+(s.price*1.15).toFixed(2),stopLoss:+(s.price*0.92).toFixed(2)}));
    setNpSearch(s.name);
  };
  const addPosition=()=>{
    if(!np.stock||!np.shares||!np.buyRate)return;
    const br=+np.buyRate;
    const p=Object.assign({},np,{id:Date.now(),shares:+np.shares,buyRate:br,currentPrice:br,target1:+np.target1||(+(br*1.07).toFixed(2)),target2:+np.target2||(+(br*1.15).toFixed(2)),stopLoss:+np.stopLoss||(+(br*0.92).toFixed(2)),trailingSL:+np.stopLoss||(+(br*0.92).toFixed(2)),realized:0});
    const u=[...port,p];setPort(u);persist(null,u,null);
    setNp({stock:"",broker:"Ecosoft",shares:"",buyRate:"",target1:"",target2:"",stopLoss:""});setNpSearch("");setShowAddP(false);
    showToast("✅ "+p.stock+" portfolio এ যোগ হয়েছে!");
  };
  const recordSell=(p,sp,ss)=>{
    const profit=(sp-p.buyRate)*ss-(ss*p.buyRate+ss*sp)*COMM;
    const t={id:Date.now(),stock:p.stock,broker:p.broker,buyRate:p.buyRate,sellPrice:sp,sellShares:ss,profit,date:new Date().toLocaleDateString()};
    const ut=[...trades,t];
    const up=port.map(x=>x.id===p.id?Object.assign({},x,{shares:x.shares-ss,realized:(x.realized||0)+profit}):x).filter(x=>x.shares>0);
    setTrades(ut);setPort(up);persist(null,up,ut);
    showToast("✅ "+p.stock+" — ৳"+profit.toFixed(0)+" লাভ রেকর্ড!");
  };

  const TS=(a)=>({padding:"10px 18px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",background:a?C.card:"transparent",color:a?C.accent:C.muted,fontWeight:700,fontSize:13,fontFamily:"inherit",borderBottom:a?"2px solid "+C.accent:"2px solid transparent"});
  const staleCount=stocks.filter(s=>{const d=daysSince(s.updatedAt);return d!==null&&d>3;}).length;

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"Inter,-apple-system,sans-serif",color:C.text}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:10001,background:toast.type==="err"?C.red:toast.type==="warn"?C.orange:C.accent,color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:340}}>{toast.msg}</div>}
      {showPaste&&<PasteModal onApply={applyPaste} onClose={()=>setShowPaste(false)}/>}
      {stockPaste&&<PasteModal stockName={stockPaste.name} onApply={applyPaste} onClose={()=>setStockPaste(null)}/>}
      {showBuyRank&&<BuyRankingPanel stocks={stocks} port={port} days={days} onClose={()=>setShowBuyRank(false)}/>}
      {deleteItem&&<DeleteConfirm item={deleteItem} onConfirm={doDelete} onClose={()=>setDeleteItem(null)}/>}
      {undoItem&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"#1A2D4A",border:"1px solid "+C.yellow,borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",flexWrap:"wrap"}}>
          <div style={{fontSize:13,color:C.text}}><span style={{color:C.yellow,fontWeight:700}}>{undoItem.stock}</span> সরানো হয়েছে {undoItem.deleteReason?"("+undoItem.deleteReason+")":""}</div>
          <button onClick={undoDelete} style={btn(C.yellow,true,true)}>↩️ Undo</button>
          <button onClick={()=>setUndoItem(null)} style={btn(C.muted,false,true)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#070D1A,#0F2040,#070D1A)",borderBottom:"1px solid "+C.border,padding:"14px 20px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#00C896,#0080FF)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📊</div>
            <div>
              <div style={{fontWeight:800,fontSize:20,color:"#fff"}}>DSE Trading Dashboard <span style={{fontSize:13,color:C.accent}}>v6</span></div>
              <div style={{fontSize:12,color:C.muted}}>EMA20 · SMA50 · VMA20 · Trailing SL{staleCount>0&&<span style={{color:C.orange,marginLeft:8}}>⚠️ {staleCount}টি পুরনো</span>}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:C.muted}}>Horizon:</span>
            {[3,5,7,10,14,21,30].map(d=>(
              <button key={d} onClick={()=>{setDays(d);setCustomDays("");}} style={btn(C.accent,days===d,true)}>{d}d</button>
            ))}
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <input type="number" min={1} max={365} value={customDays} onChange={e=>setCustomDays(e.target.value)} placeholder="Custom" style={{...inp({width:65,padding:"4px 8px",fontSize:12}),border:"1px solid "+(customDays?C.yellow:C.border)}}/>
              {customDays&&<button onClick={()=>{const d=parseInt(customDays,10);if(d>0){setDays(d);setCustomDays("");}}} style={btn(C.yellow,true,true)}>✅</button>}
            </div>
            <button onClick={()=>setShowBuyRank(true)} style={btn(C.accent,true)}>🎯 Buy Ranking</button>
          </div>
        </div>
        <div style={{maxWidth:1140,margin:"4px auto 0",fontSize:12,color:C.yellow,fontWeight:600}}>
          📅 {days} দিনের strategy · EMA20/SMA50/VMA20 scoring active
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:C.bg,borderBottom:"1px solid "+C.border,padding:"0 20px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",gap:4,overflowX:"auto"}}>
          {[["screener","📊 Screener"],["portfolio","💼 Portfolio"],["trades","📋 Trade Log"],["risk","⚠️ Risk"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={TS(tab===t)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1140,margin:"0 auto",padding:"16px 20px"}}>

        {/* ══ SCREENER ══ */}
        {tab==="screener"&&(
          <div>
            {/* Filter bar */}
            <div style={{...card(),padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:600}}>মোট: {stocks.length} · {days} দিনের Signal</div>
                <div style={{position:"relative",minWidth:180}}>
                  <input value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="🔍 Stock নাম খুঁজুন..."
                    style={{...inp({width:"100%",boxSizing:"border-box",border:"1px solid "+(nameFilter?C.accent:C.border),fontSize:12,padding:"6px 10px"})}}/>
                  {nameFilter&&<button onClick={()=>setNameFilter("")} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,fontWeight:700}}>✕</button>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["সব",stocks.length,"#4A6080"],["STRONG BUY",sigC["STRONG BUY"],"#00C896"],["BUY",sigC["BUY"],"#4CAF50"],["WATCH",sigC["WATCH"],"#FFC107"],["WEAK",sigC["WEAK"],"#FF9800"],["AVOID",sigC["AVOID"],"#F44336"]].map(([lb,ct,cl])=>(
                  <button key={lb} onClick={()=>setSigF(lb)} style={{padding:"7px 14px",borderRadius:8,border:"2px solid "+(sigF===lb?cl:"transparent"),background:sigF===lb?cl+"28":cl+"0e",color:cl,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                    {lb} <span style={{background:cl+"30",borderRadius:20,padding:"1px 7px",fontSize:11}}>{ct}</span>
                  </button>
                ))}
              </div>
              {(nameFilter||sector!=="সব"||sigF!=="সব")&&<div style={{marginTop:8,fontSize:11,color:C.yellow}}>দেখাচ্ছে: {filtered.length}টি <button onClick={()=>{setNameFilter("");setSector("সব");setSigF("সব");}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontWeight:700,textDecoration:"underline"}}>সব ফিল্টার মুছুন</button></div>}
            </div>

            {/* Controls */}
            <div style={{...card(),padding:12,marginBottom:12,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <select value={sector} onChange={e=>setSector(e.target.value)} style={inp()}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={inp()}>
                <option value="score">Score</option><option value="vol">Volume</option><option value="eps">EPS</option><option value="rsi">RSI</option>
              </select>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                <button onClick={()=>{setShowPaste(true);setShowAddS(false);}} style={btn(C.purple)}>📋 Code Paste</button>
                <button onClick={()=>setShowAddS(!showAddS)} style={btn(C.blue,showAddS)}>+ Manual যোগ</button>
              </div>
            </div>

            {/* Manual Add / Edit */}
            {showAddS&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:10,fontSize:15}}>Stock যোগ / আপডেট (Manual)</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:10}}>💡 আগের stock বেছে নিলে data auto-fill হবে</div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Stock Name (suggestion):</div>
                  <StockSearch stocks={stocks} value={nsSearch} onChange={v=>{setNsSearch(v);setNs(p=>Object.assign({},p,{name:v}));}} onSelect={selectStockForNS}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(125px,1fr))",gap:10,marginBottom:14}}>
                  {[["price","Price*"],["eps","EPS"],["pe","P/E"],["nav","NAV"],["div","Div%"],["rsi","RSI"],["macd","MACD"],["vol","Volume"],["vma20","VMA20 (avg vol)"],["ema20","EMA 20"],["sma50","SMA 50"],["ret6m","6M Ret%"],["inst","Inst%"],["circuit","Circuit Up"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div>
                      <input type="number" value={ns[k]} onChange={e=>setNs(p=>Object.assign({},p,{[k]:e.target.value}))}
                        style={{...inp({width:"100%",boxSizing:"border-box",border:"1px solid "+(ns[k]?C.accent:C.border)})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Category</div><select value={ns.cat} onChange={e=>setNs(p=>Object.assign({},p,{cat:e.target.value}))} style={inp({width:"100%"})}><option>A</option><option>B</option><option>Z</option></select></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Sector</div><select value={ns.sector} onChange={e=>setNs(p=>Object.assign({},p,{sector:e.target.value}))} style={inp({width:"100%"})}>{SECTORS.filter(s=>s!=="সব").map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{display:"flex",gap:8}}><button onClick={addStock} style={btn(C.accent,true)}>✅ যোগ/আপডেট</button><button onClick={()=>{setShowAddS(false);setNsSearch("");}} style={btn(C.muted)}>বাতিল</button></div>
              </div>
            )}

            {/* Stock List */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map((s,idx)=>{
                const st=staleness(s.updatedAt);const isExp=expanded===s.id;
                const dCount=daysSince(s.updatedAt);
                const vmaRatio=s.vma20?s.vol/s.vma20:0;
                return(
                  <div key={s.id} style={{...card(),border:"1px solid "+(isExp?s.rec.color:(dCount&&dCount>7)?"#F4433640":C.border),transition:"border 0.2s"}}>
                    <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",cursor:"pointer"}} onClick={()=>{setExpanded(isExp?null:s.id);setEditMode(null);}}>
                      <div style={{width:28,height:28,background:idx<3?"linear-gradient(135deg,#FFD700,#FFA500)":"#1A2D4A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:idx<3?"#000":C.muted,flexShrink:0}}>{idx+1}</div>
                      <div style={{flex:1,minWidth:100}}>
                        <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{s.name} <span style={{fontSize:10,color:s.cat==="A"?C.accent:C.orange,fontWeight:700}}>[{s.cat}]</span></div>
                        <div style={{fontSize:10,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                          <span style={{color:st.color,fontWeight:600}}>{st.label}</span>
                          {portMap[s.name]&&<span style={{color:C.purple}}>👤{portMap[s.name].toLocaleString()}</span>}
                          <span style={{color:s.str.maSignal.includes("🟢")?C.accent:C.yellow,fontSize:10}}>{s.str.maSignal}</span>
                          {s.str.isBreakoutVol&&<span style={{color:C.orange,fontWeight:700,fontSize:10}}>🔥 VOL BREAKOUT</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"center",minWidth:65}}>
                        <div style={{fontSize:18,fontWeight:800,color:"#4FC3F7"}}>৳{s.price}</div>
                        <div style={{fontSize:9,color:C.muted}}>circ ৳{s.circuit||"—"}</div>
                      </div>
                      <div style={{display:"flex",gap:8,minWidth:70}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.rsi>70?"#F44336":s.rsi<35?"#00C896":"#FFC107"}}>{s.rsi.toFixed(0)}</div><div style={{fontSize:9,color:C.muted}}>RSI</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.macd>0?"#00C896":"#F44336"}}>{s.macd.toFixed(1)}</div><div style={{fontSize:9,color:C.muted}}>MACD</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:s.price>s.ema20?C.accent:"#FF6B6B"}}>{s.ema20||"—"}</div><div style={{fontSize:9,color:C.muted}}>EMA20</div></div>
                      </div>
                      <div style={{minWidth:110}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:C.muted}}>Score/{days}d</span><span style={{fontSize:13,fontWeight:800,color:s.rec.color}}>{s.score}</span></div>
                        <div style={{height:5,background:"#1A2D4A",borderRadius:3}}><div style={{height:"100%",width:s.score+"%",background:s.rec.color,borderRadius:3}}/></div>
                      </div>
                      <div style={{background:s.rec.bg,border:"1px solid "+s.rec.color+"44",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,color:s.rec.color,minWidth:110,textAlign:"center"}}>{s.rec.label}</div>
                      <div style={{minWidth:100,textAlign:"center"}}>
                        <div style={{fontSize:12,fontWeight:700,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow}}>{s.str.buySignal}</div>
                        <div style={{fontSize:9,color:C.muted}}>T1 ৳{s.str.t1} · T2 ৳{s.str.t2}</div>
                      </div>
                      <div style={{display:"flex",gap:5}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setStockPaste(s)} style={btn(C.purple,false,true)} title="JSON paste update">📋</button>
                        <button onClick={()=>{setEditMode(editMode===s.id?null:s.id);setExpanded(s.id);}} style={btn(C.yellow,editMode===s.id,true)}>✏️</button>
                        <button onClick={()=>removeStock(s.id)} style={btn(C.red,false,true)}>✕</button>
                      </div>
                    </div>

                    {/* Edit Mode — EMA20, SMA50, VMA20 সহ */}
                    {editMode===s.id&&(
                      <div style={{padding:"12px 16px",borderTop:"1px solid "+C.border,background:"#070D1A"}}>
                        <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>✏️ Chart দেখে update করুন (EMA20, SMA50, VMA20 সহ):</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                          <Field label="Price" value={s.price} onChange={v=>updateStock(s.id,"price",v)} width={78}/>
                          <Field label="RSI" value={s.rsi} onChange={v=>updateStock(s.id,"rsi",v)} width={62}/>
                          <Field label="MACD" value={s.macd} onChange={v=>updateStock(s.id,"macd",v)} width={62}/>
                          <Field label="EMA 20" value={s.ema20||0} onChange={v=>updateStock(s.id,"ema20",v)} width={70}/>
                          <Field label="SMA 50" value={s.sma50||0} onChange={v=>updateStock(s.id,"sma50",v)} width={70}/>
                          <Field label="VMA 20" value={s.vma20||0} onChange={v=>updateStock(s.id,"vma20",v)} width={90}/>
                          <Field label="Volume" value={s.vol} onChange={v=>updateStock(s.id,"vol",v)} width={90}/>
                          <Field label="EPS" value={s.eps} onChange={v=>updateStock(s.id,"eps",v)} width={62}/>
                          <Field label="Circuit" value={s.circuit||0} onChange={v=>updateStock(s.id,"circuit",v)} width={68}/>
                          <button onClick={()=>{updateStock(s.id,"updatedAt",TODAY);setEditMode(null);showToast("✅ "+s.name+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅ Save</button>
                        </div>
                        {s.vma20&&s.vol&&(
                          <div style={{marginTop:8,fontSize:11,color:C.muted}}>
                            Volume/VMA ratio: <span style={{color:s.vol>s.vma20*2?C.orange:s.vol>s.vma20?C.accent:C.muted,fontWeight:700}}>{(s.vol/s.vma20).toFixed(2)}x</span>
                            {s.vol>s.vma20*2&&<span style={{color:C.orange,fontWeight:700,marginLeft:8}}>🔥 BREAKOUT VOLUME!</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {isExp&&editMode!==s.id&&(
                      <div style={{padding:"0 16px 16px",borderTop:"1px solid "+C.border,paddingTop:14}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10}}>
                          {/* Buy Strategy */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:8}}>📥 Buy Strategy ({days}d)</div>
                            <div style={{fontSize:13,fontWeight:700,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow,marginBottom:4}}>{s.str.buySignal}</div>
                            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Zone: <span style={{color:C.text}}>{s.str.buyZone}</span></div>
                            <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{s.str.buyStr}</div>
                            <div style={{marginTop:6,fontSize:11,fontWeight:700,color:s.str.risk.includes("LOW")?C.accent:s.str.risk.includes("HIGH")?C.red:C.yellow}}>{s.str.risk}</div>
                            <div style={{marginTop:4,fontSize:11,color:s.str.maSignal.includes("🟢")?C.accent:C.yellow}}>{s.str.maSignal}</div>
                          </div>
                          {/* Sell Strategy */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.yellow,fontWeight:700,marginBottom:8}}>🎯 Dynamic Sell ({days}d)</div>
                            <div style={{fontSize:12,marginBottom:3}}>T1 ৳{s.str.t1}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT1}% sell</span></div>
                            <div style={{fontSize:12,marginBottom:3}}>T2 ৳{s.str.t2}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT2}% sell</span></div>
                            {s.str.t3&&<div style={{fontSize:12,marginBottom:3}}>T3 ৳{s.str.t3}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT3}% sell</span></div>}
                            <div style={{fontSize:12,color:C.red,marginBottom:6}}>SL: ৳{s.str.sl}</div>
                            <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{s.str.sellStr}</div>
                          </div>
                          {/* MA + Volume indicators */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:"#4FC3F7",fontWeight:700,marginBottom:8}}>📊 MA + Volume Analysis</div>
                            {[
                              ["EMA 20","৳"+(s.ema20||"N/A"),s.price>s.ema20?C.accent:C.red],
                              ["SMA 50","৳"+(s.sma50||"N/A"),s.price>s.sma50?C.accent:C.red],
                              ["Current Price","৳"+s.price,"#4FC3F7"],
                              ["Volume",(s.vol/1000000).toFixed(2)+"M",C.text],
                              ["VMA 20",(s.vma20?((s.vma20)/1000000).toFixed(2):"N/A")+"M",C.text],
                              ["Vol/VMA Ratio",s.vma20?(s.vol/s.vma20).toFixed(2)+"x":"N/A",s.vma20&&s.vol>s.vma20*2?C.orange:s.vma20&&s.vol>s.vma20?C.accent:C.muted],
                            ].map(([l,v,cl])=>(
                              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.muted}}>{l}</span><span style={{color:cl,fontWeight:600}}>{v}</span></div>
                            ))}
                            {s.str.isBreakoutVol&&<div style={{marginTop:6,background:C.orange+"22",borderRadius:4,padding:"3px 8px",fontSize:11,color:C.orange,fontWeight:700}}>🔥 Breakout Volume! VMA x{s.vma20?(s.vol/s.vma20).toFixed(1):""}</div>}
                          </div>
                          {/* Fundamentals */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.yellow,fontWeight:700,marginBottom:8}}>💰 Fundamentals</div>
                            {[["EPS",s.eps],["P/E",s.pe>0?s.pe:"Negative"],["NAV",s.nav],["P/NAV",(s.nav>0?s.price/s.nav:0).toFixed(1)+"x"],["Div",s.div+"%"],["Inst",s.inst+"%"],["6M Ret",s.ret6m+"%"]].map(([l,v])=>(
                              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{l}</span><span style={{color:C.text,fontWeight:600}}>{v}</span></div>
                            ))}
                            {s.str.holdNote&&<div style={{marginTop:6,fontSize:11,color:C.purple,fontWeight:600}}>👤{s.str.holdNote}</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ PORTFOLIO ══ */}
        {tab==="portfolio"&&(
          <div>
            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:14}}>
              {[["মোট Investment","৳"+summ.tc.toLocaleString("en",{maximumFractionDigits:0}),"#4FC3F7"],["Current Value","৳"+summ.tv.toLocaleString("en",{maximumFractionDigits:0}),C.accent],["Unrealized",(summ.tpl>=0?"+":"")+"৳"+summ.tpl.toFixed(0),summ.tpl>=0?C.accent:C.red],["Realized","৳"+summ.tr.toFixed(0),C.yellow]].map(([l,v,cl])=>(
                <div key={l} style={{...card(),padding:12,textAlign:"center"}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:17,fontWeight:800,color:cl}}>{v}</div></div>
              ))}
            </div>

            {/* Broker */}
            <div style={{...card(),padding:12,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                <div style={{fontWeight:700,color:C.accent,fontSize:13}}>🏦 Broker-wise</div>
                <div style={{fontSize:11,color:C.muted}}>📤 Export → Claude এ paste → update → Import</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(summ.byB).map(([br,d])=>{
                  const brPos=port.filter(p=>p.broker===br);
                  const exportJ=JSON.stringify(brPos.map(p=>({stock:p.stock,broker:p.broker,shares:p.shares,buyRate:p.buyRate,currentPrice:p.currentPrice,target1:p.target1,target2:p.target2,stopLoss:p.stopLoss})),null,2);
                  return(
                    <div key={br} style={{background:"#070D1A",borderRadius:8,padding:"10px 14px",border:"1px solid "+C.border}}>
                      <div style={{fontWeight:700,color:"#4FC3F7",fontSize:12}}>{br}</div>
                      <div style={{fontSize:11,color:C.muted}}>{d.n} pos</div>
                      <div style={{fontSize:12,fontWeight:700,color:(d.val-d.cost)>=0?C.accent:C.red,marginBottom:6}}>{(d.val-d.cost)>=0?"+":""}৳{(d.val-d.cost).toFixed(0)}</div>
                      <button onClick={()=>{if(navigator.clipboard){navigator.clipboard.writeText(exportJ).then(()=>showToast("✅ "+br+" JSON copied!")).catch(()=>{setPortPasteCode(exportJ);setShowPortPaste(true);});}else{setPortPasteCode(exportJ);setShowPortPaste(true);}}}
                        style={{padding:"3px 8px",background:C.purple+"22",color:C.purple,border:"none",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",width:"100%"}}>📤 Export</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:14}}>💼 Positions ({port.length}) · {days}d strategy</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setShowPortPaste(!showPortPaste);setShowAddP(false);}} style={btn(C.purple,showPortPaste)}>📋 JSON Import</button>
                <button onClick={()=>{setShowAddP(!showAddP);setShowPortPaste(false);}} style={btn(C.blue,showAddP)}>+ Manual যোগ</button>
              </div>
            </div>

            {/* Port Paste */}
            {showPortPaste&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.purple}}>
                <div style={{fontWeight:700,color:"#CE93D8",fontSize:15,marginBottom:6}}>📋 Portfolio JSON Import</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>
                  Claude কে বলুন: <span style={{color:"#CE93D8",fontWeight:700}}>"আমার Ecosoft এ EPGL ৭৩০০ শেয়ার ১৯.২৬ টাকায় — JSON দাও"</span>
                </div>
                <div style={{background:"#070D1A",borderRadius:8,padding:10,marginBottom:12,fontSize:11}}>
                  <div style={{color:C.yellow,fontWeight:700,marginBottom:4}}>📌 Single:</div>
                  <div style={{color:"#CE93D8",fontFamily:"monospace"}}>{"{"}"stock":"EPGL","broker":"Ecosoft","shares":7300,"buyRate":19.26{"}"}</div>
                  <div style={{color:C.yellow,fontWeight:700,marginTop:8,marginBottom:4}}>📌 Batch:</div>
                  <div style={{color:"#CE93D8",fontFamily:"monospace"}}>[{"{"}"stock":"EPGL","shares":7300,"buyRate":19.26{"}"},{"{"}"stock":"LOVELLO","shares":9630{"}"} ]</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:12,color:C.muted}}>Default Broker:</span>
                  <select value={portPasteBroker} onChange={e=>setPortPasteBroker(e.target.value)} style={inp()}>
                    {BROKERS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <textarea value={portPasteCode} onChange={e=>{setPortPasteCode(e.target.value);setPortPasteErr("");}}
                  placeholder="এখানে JSON paste করুন..."
                  style={{width:"100%",height:130,background:"#070D1A",border:"1px solid "+(portPasteErr?"#F44336":C.purple+"44"),borderRadius:8,color:"#CE93D8",padding:12,fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
                {portPasteErr&&<div style={{color:C.red,fontSize:12,marginTop:6,fontWeight:600}}>{portPasteErr}</div>}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={applyPortPaste} style={btn(C.purple,true)}>✅ Apply</button>
                  <button onClick={()=>{setShowPortPaste(false);setPortPasteCode("");setPortPasteErr("");}} style={btn(C.muted)}>বাতিল</button>
                </div>
              </div>
            )}

            {/* Manual Add */}
            {showAddP&&(
              <div style={{...card(),padding:16,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:12,fontSize:14}}>নতুন Position</div>
                <div style={{marginBottom:12}}><StockSearch stocks={stocks} value={npSearch} onChange={v=>{setNpSearch(v);setNp(p=>Object.assign({},p,{stock:v}));}} onSelect={selectStockForPort}/></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:10}}>
                  {[["shares","Shares*"],["buyRate","Buy Rate*"],["target1","Target 1"],["target2","Target 2"],["stopLoss","Stop Loss"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div><input type="number" value={np[k]} onChange={e=>setNp(p=>Object.assign({},p,{[k]:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Broker</div><select value={np.broker} onChange={e=>setNp(p=>Object.assign({},p,{broker:e.target.value}))} style={inp({width:"100%"})}>{BROKERS.map(b=><option key={b}>{b}</option>)}</select></div>
                </div>
                {np.stock&&np.buyRate&&<div style={{fontSize:12,color:C.muted,marginBottom:10}}>Investment: <span style={{color:C.yellow,fontWeight:700}}>৳{((+np.shares||0)*(+np.buyRate||0)).toLocaleString()}</span></div>}
                <div style={{display:"flex",gap:8}}><button onClick={addPosition} style={btn(C.accent,true)}>✅ যোগ</button><button onClick={()=>{setShowAddP(false);setNpSearch("");}} style={btn(C.muted)}>বাতিল</button></div>
              </div>
            )}

            {/* Portfolio List */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {enriched.map(p=>{
                const sData=p.sData;const str=p.str;
                return(
                  <div key={p.id} style={{...card(),border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.border)}}>
                    <div style={{padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{p.stock} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{p.broker}</span></div>
                          <div style={{fontSize:11,color:C.muted,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:2}}>
                            <span>{p.shares.toLocaleString()} shares · Buy ৳{p.buyRate}</span>
                            {sData&&(()=>{const st=staleness(sData.updatedAt);return <span style={{color:st.color,fontWeight:600}}>· {st.label}</span>;})()}
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700,fontSize:10}}>🔒 TSL Active</span>}
                            {sData&&sData.str&&<span style={{color:sData.str.maSignal.includes("🟢")?C.accent:C.yellow,fontSize:10}}>{sData.str.maSignal}</span>}
                          </div>
                        </div>
                        <div style={{textAlign:"center"}}><div style={{fontWeight:800,fontSize:15,color:p.pl>=0?C.accent:C.red}}>{p.pl>=0?"+":""}৳{p.pl.toFixed(0)}</div><div style={{fontSize:11,color:p.pl>=0?C.accent:C.red}}>{p.plp.toFixed(1)}%</div></div>
                        <div style={{background:p.sig.includes("STOP")?C.red+"22":p.sig.includes("SELL")?C.accent+"22":C.muted+"22",border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted)+"44",borderRadius:8,padding:"5px 10px",fontWeight:700,fontSize:12,color:p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted}}>{p.sig}</div>
                        <div style={{fontSize:11,fontWeight:700,color:str.risk.includes("LOW")?C.accent:str.risk.includes("HIGH")?C.red:C.yellow}}>{str.risk}</div>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>setEditPort(editPort===p.id?null:p.id)} style={btn(C.yellow,editPort===p.id,true)}>✏️</button>
                          <SellModal pos={p} onSell={recordSell}/>
                          <button onClick={()=>confirmDelete(p)} style={btn(C.red,false,true)}>✕</button>
                        </div>
                      </div>
                      {editPort===p.id?(
                        <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:4}}>
                          <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>✏️ Update:</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                            <Field label="Current Price" value={p.currentPrice} onChange={v=>updatePort(p.id,"currentPrice",v)} width={88}/>
                            <Field label="Target 1" value={p.target1} onChange={v=>updatePort(p.id,"target1",v)} width={78}/>
                            <Field label="Target 2" value={p.target2} onChange={v=>updatePort(p.id,"target2",v)} width={78}/>
                            <Field label="Stop Loss" value={p.stopLoss} onChange={v=>updatePort(p.id,"stopLoss",v)} width={78}/>
                            <button onClick={()=>{setEditPort(null);showToast("✅ "+p.stock+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅ Save</button>
                          </div>
                        </div>
                      ):(
                        <div>
                          <div style={{display:"flex",gap:12,fontSize:12,marginBottom:4,flexWrap:"wrap"}}>
                            <span style={{color:C.muted}}>T1: <span style={{color:C.accent,fontWeight:700}}>৳{str.t1||p.target1}</span> <span style={{color:C.muted,fontSize:10}}>({str.sellT1}%)</span></span>
                            <span style={{color:C.muted}}>T2: <span style={{color:C.accent,fontWeight:700}}>৳{str.t2||p.target2}</span> <span style={{color:C.muted,fontSize:10}}>({str.sellT2}%)</span></span>
                            {str.t3&&<span style={{color:C.muted}}>T3: <span style={{color:C.accent,fontWeight:700}}>৳{str.t3}</span></span>}
                            <span style={{color:C.muted}}>SL: <span style={{color:C.red,fontWeight:700}}>৳{p.stopLoss}</span></span>
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700}}>🔒 TSL: ৳{p.tsl.toFixed(2)} (profit locked!)</span>}
                            <span style={{color:C.muted}}>Cost: ৳{p.cost.toFixed(0)}</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}><span style={{color:C.orange,fontWeight:600}}>💡 </span>{str.sellStr}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ TRADES ══ */}
        {tab==="trades"&&(
          <div>
            <div style={{...card(),padding:14,marginBottom:14,display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["Trades",trades.length,"#4FC3F7"],["Realized","৳"+summ.tr.toFixed(0),summ.tr>=0?C.accent:C.red],["✅",trades.filter(t=>t.profit>0).length,C.accent],["🔴",trades.filter(t=>t.profit<0).length,C.red]].map(([l,v,cl])=>(
                <div key={l} style={{textAlign:"center"}}><div style={{fontSize:11,color:C.muted}}>{l}</div><div style={{fontSize:22,fontWeight:800,color:cl}}>{v}</div></div>
              ))}
            </div>
            {trades.length===0?<div style={{...card(),padding:60,textAlign:"center"}}><div style={{fontSize:40}}>📋</div><div style={{color:C.muted,marginTop:12}}>Portfolio থেকে sell করলে এখানে দেখাবে।</div></div>:(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[...trades].reverse().map(t=>(
                  <div key={t.id} style={{...card(),padding:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{fontWeight:800,color:"#fff",minWidth:90}}>{t.stock}</div>
                    <span style={{background:C.blue+"22",color:C.blue,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{t.broker}</span>
                    <div style={{fontSize:12,color:C.muted}}>Buy ৳{t.buyRate} → Sell ৳{t.sellPrice} · {t.sellShares} shares</div>
                    <div style={{marginLeft:"auto",fontWeight:800,fontSize:15,color:t.profit>=0?C.accent:C.red}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
                    <div style={{fontSize:11,color:C.muted}}>{t.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ RISK ══ */}
        {tab==="risk"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.red,marginBottom:10,fontSize:14}}>🚨 Stop Loss Alert (TSL সহ)</div>
              {enriched.filter(p=>p.currentPrice<=p.effectiveSL*1.05).map(p=>(
                <div key={p.id} style={{background:C.red+"12",border:"1px solid "+C.red+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.red}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>৳{p.currentPrice} · SL: ৳{p.stopLoss} {p.isTSLActive&&"· TSL: ৳"+p.tsl.toFixed(2)}</div>
                </div>
              ))}
              {enriched.filter(p=>p.currentPrice<=p.effectiveSL*1.05).length===0&&<div style={{color:C.accent,fontSize:13}}>✅ সব নিরাপদ</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.orange,marginBottom:10,fontSize:14}}>🔒 Trailing SL Active</div>
              {enriched.filter(p=>p.isTSLActive).map(p=>(
                <div key={p.id} style={{background:C.orange+"12",border:"1px solid "+C.orange+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.orange}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>Buy: ৳{p.buyRate} · TSL: ৳{p.tsl.toFixed(2)} (Profit locked!)</div>
                  <div style={{fontSize:12,color:C.accent}}>Current: ৳{p.currentPrice} · Gain: ৳{p.pl.toFixed(0)}</div>
                </div>
              ))}
              {enriched.filter(p=>p.isTSLActive).length===0&&<div style={{color:C.muted,fontSize:13}}>কোনো position T1 touch করেনি এখনো</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:10,fontSize:14}}>🎯 Target Hit</div>
              {enriched.filter(p=>p.currentPrice>=(str=>str.t1||p.target1)(p.str)).map(p=>(
                <div key={p.id} style={{background:C.accent+"12",border:"1px solid "+C.accent+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.accent}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>৳{p.currentPrice} · T1: ৳{p.str.t1||p.target1}</div>
                  <div style={{fontSize:12,color:C.accent,fontWeight:700}}>+৳{p.pl.toFixed(0)} সম্ভব</div>
                </div>
              ))}
              {enriched.filter(p=>p.currentPrice>=(p.str.t1||p.target1)).length===0&&<div style={{color:C.muted,fontSize:13}}>Target hit হয়নি</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.yellow,marginBottom:10,fontSize:14}}>🧮 Tax + Commission</div>
              {[["Realized","৳"+summ.tr.toFixed(0)],["Tax 10%","৳"+(summ.tr*0.1).toFixed(0)],["Net","৳"+(summ.tr*0.9).toFixed(0)],["Commission","৳"+enriched.reduce((a,p)=>a+p.cost*COMM,0).toFixed(0)]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5,padding:"4px 0",borderBottom:"1px solid "+C.border}}><span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700}}>{v}</span></div>
              ))}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:10,fontSize:14}}>📊 Portfolio Overview</div>
              <div style={{fontSize:13,marginBottom:5,color:C.muted}}>P&L: <span style={{color:summ.tpl>=0?C.accent:C.red,fontWeight:700}}>{summ.tpl>=0?"+":""}৳{summ.tpl.toFixed(0)}</span></div>
              <div style={{fontSize:13,marginBottom:5,color:C.muted}}>Return: <span style={{color:summ.tpl>=0?C.accent:C.red,fontWeight:700}}>{summ.tc>0?((summ.tpl/summ.tc)*100).toFixed(1):0}%</span></div>
              <div style={{fontSize:13,color:C.muted}}>Loss এ: <span style={{color:C.red,fontWeight:700}}>{enriched.filter(p=>p.pl<0).length} pos</span></div>
              <div style={{fontSize:13,color:C.muted,marginTop:4}}>Profit এ: <span style={{color:C.accent,fontWeight:700}}>{enriched.filter(p=>p.pl>=0).length} pos</span></div>
              <div style={{fontSize:13,color:C.muted,marginTop:4}}>TSL Active: <span style={{color:C.orange,fontWeight:700}}>{enriched.filter(p=>p.isTSLActive).length} pos</span></div>
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:10,fontSize:14}}>⏱️ Update Status</div>
              {stocks.map(s=>{const st=staleness(s.updatedAt);return(
                <div key={s.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                  <span style={{color:C.text,fontWeight:600}}>{s.name}</span>
                  <span style={{color:st.color}}>{st.label}</span>
                </div>
              );})}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
