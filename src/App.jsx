import { useState, useMemo, useCallback, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

const SK="dse-v7-local";
const TODAY=new Date().toISOString().split("T")[0];
const COMM=0.003;

const DEFAULT_BROKERS=[
  {id:"Ecosoft",name:"Ecosoft",commission:0.30,withdrawFee:0},
  {id:"Lankabangla",name:"Lankabangla",commission:0.30,withdrawFee:0},
  {id:"অন্য",name:"অন্য",commission:0.35,withdrawFee:0},
  {id:"BRAC",name:"BRAC",commission:0.30,withdrawFee:0},
  {id:"EBL",name:"EBL",commission:0.30,withdrawFee:0},
];
const DEFAULT_PROFILE={
  displayName:"",email:"",photoURL:"",phone:"",
  defaultBroker:"Ecosoft",
  brokers:DEFAULT_BROKERS,
  bankAccounts:[{id:"b1",name:"BRAC Bank",accountNo:"",branch:""}],
  joinDate:TODAY,
};

const load=()=>{try{const r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch{return null;}};
const save=(d)=>{try{localStorage.setItem(SK,JSON.stringify(d));}catch{}};
const fmtDate=(d)=>d?new Date(d).toLocaleDateString("bn-BD"):"—";
const daysBetween=(a,b)=>Math.floor((new Date(b)-new Date(a))/86400000);
const daysSince=(d)=>d?Math.floor((Date.now()-new Date(d))/86400000):null;
function staleness(d){const n=daysSince(d);if(n===null)return{label:"N/A",color:"#4A6080"};if(n===0)return{label:"আজ ✅",color:"#00C896"};if(n<=3)return{label:n+" দিন আগে",color:"#FFC107"};if(n<=7)return{label:n+" দিন আগে ⚠️",color:"#FF9800"};return{label:n+" দিন আগে 🔴",color:"#F44336"};}

const INIT_STOCKS=[
  {id:1,name:"SIMTEX",sector:"Textile",cat:"A",price:27.5,eps:1.28,pe:20.94,nav:22.39,div:10,rsi:65.85,macd:0.8,vol:3460000,vma20:2800000,ema20:26.8,sma50:25.4,ret6m:20,inst:7.57,circuit:29.5,totalShares:7960000,updatedAt:"2026-07-02"},
  {id:2,name:"MONOSPOOL",sector:"Engineering",cat:"A",price:114.3,eps:4.12,pe:27.74,nav:41.83,div:15,rsi:64.55,macd:2.5,vol:771667,vma20:600000,ema20:110.5,sma50:105.2,ret6m:21,inst:4.13,circuit:123.3,totalShares:3920000,updatedAt:"2026-07-02"},
  {id:3,name:"SAPORTL",sector:"Services & Real Estate",cat:"A",price:52.5,eps:2.85,pe:24.31,nav:35.37,div:18,rsi:53.51,macd:-0.2,vol:5143123,vma20:3381708,ema20:52.4,sma50:50.8,ret6m:23,inst:10.23,circuit:56.3,totalShares:23690000,updatedAt:"2026-07-15",bb_upper:58.6,bb_lower:46.3,support1:46.3,resistance1:56.3,analysisNote:{trend:"২০২৪-২০২৫ uptrend (৳২০→৳৬৪), এখন ৳৪৬-৳৫৩ consolidation।",bb:"BB Upper ৳৫৮.৬, Lower ৳৪৬.৩ — Median এ আছে।",rsiNote:"RSI ৫৩.৫১ neutral।",macdNote:"MACD -০.২ সামান্য bearish।",volumeNote:"Volume VMA ১.৫x।",fundamental:"EPS ২.৮৫, P/E ২৪.৩১, NAV ৳৩৫.৩৭, Div ১৮%।",strategy:"৳৪৮-৪৯ এ কিনুন। Target ৳৫৬.৩।",chartPeriod:"2024-2026 Daily"}},
  {id:4,name:"PROVATIINS",sector:"Insurance",cat:"A",price:58.9,eps:2.8,pe:21.0,nav:32.1,div:8,rsi:76.66,macd:4.4,vol:2511187,vma20:1800000,ema20:55.3,sma50:51.6,ret6m:35,inst:6.2,circuit:64.8,totalShares:5000000,updatedAt:"2026-07-02"},
  {id:5,name:"BRACBANK",sector:"Bank",cat:"A",price:65.3,eps:5.8,pe:11.3,nav:42.5,div:20,rsi:52.0,macd:0.3,vol:4624118,vma20:3500000,ema20:64.1,sma50:62.5,ret6m:18,inst:28.5,circuit:71.8,totalShares:12000000,updatedAt:"2026-07-02"},
  {id:6,name:"CVOPRL",sector:"Fuel & Power",cat:"A",price:167.1,eps:6.77,pe:24.68,nav:31.9,div:20,rsi:56.92,macd:1.3,vol:154363,vma20:120000,ema20:162.4,sma50:158.9,ret6m:13,inst:19.23,circuit:181.7,totalShares:3030000,updatedAt:"2026-07-02"},
  {id:7,name:"EPGL",sector:"Fuel & Power",cat:"B",price:19.6,eps:1.1,pe:17.8,nav:14.2,div:5,rsi:55.12,macd:0.4,vol:673551,vma20:500000,ema20:19.1,sma50:18.6,ret6m:12,inst:8.3,circuit:21.6,totalShares:5000000,updatedAt:"2026-07-02"},
  {id:8,name:"LOVELLO",sector:"Food",cat:"A",price:71.9,eps:3.5,pe:20.5,nav:38.2,div:15,rsi:41.98,macd:-1.9,vol:1330933,vma20:1500000,ema20:73.8,sma50:76.2,ret6m:-5,inst:5.1,circuit:79.1,totalShares:4000000,updatedAt:"2026-07-02"},
  {id:9,name:"JAMUNABANK",sector:"Bank",cat:"A",price:24.2,eps:2.1,pe:11.5,nav:18.9,div:10,rsi:49.53,macd:-0.2,vol:2304420,vma20:1900000,ema20:24.5,sma50:25.1,ret6m:8,inst:15.2,circuit:26.6,totalShares:19000000,updatedAt:"2026-07-02"},
  {id:10,name:"KPPL",sector:"Engineering",cat:"A",price:16.2,eps:1.1,pe:14.7,nav:12.5,div:8,rsi:58.39,macd:0.0,vol:654750,vma20:500000,ema20:15.8,sma50:15.2,ret6m:10,inst:6.8,circuit:17.8,totalShares:6000000,updatedAt:"2026-07-02"},
  {id:11,name:"DESHBANDHU",sector:"Engineering",cat:"B",price:21.3,eps:-3.85,pe:-5.43,nav:11.66,div:0,rsi:57.89,macd:0.5,vol:773817,vma20:600000,ema20:20.6,sma50:19.8,ret6m:24,inst:21.34,circuit:22.8,totalShares:6140000,updatedAt:"2026-07-02"},
  {id:12,name:"ACMEPL",sector:"Pharma",cat:"A",price:23.3,eps:1.8,pe:12.9,nav:19.5,div:8,rsi:45.44,macd:-0.1,vol:1430000,vma20:1200000,ema20:23.8,sma50:24.5,ret6m:5,inst:9.8,circuit:25.6,totalShares:7000000,updatedAt:"2026-07-02"},
  {id:13,name:"MONNOFABR",sector:"Textile",cat:"A",price:22.4,eps:0.9,pe:24.9,nav:18.2,div:5,rsi:48.33,macd:-0.2,vol:1010000,vma20:900000,ema20:22.8,sma50:23.4,ret6m:-3,inst:3.2,circuit:24.6,totalShares:8000000,updatedAt:"2026-07-02"},
  {id:14,name:"HAKKANIPUL",sector:"NBFI",cat:"A",price:80.0,eps:0.41,pe:195.1,nav:24.32,div:5,rsi:47.54,macd:-0.2,vol:155061,vma20:140000,ema20:80.5,sma50:79.2,ret6m:15,inst:4.58,circuit:85.4,totalShares:1900000,updatedAt:"2026-07-02"},
  {id:15,name:"MALEKSPIN",sector:"Textile",cat:"A",price:34.0,eps:5.39,pe:6.31,nav:64.15,div:10,rsi:76.38,macd:0.7,vol:8895183,vma20:4000000,ema20:30.2,sma50:27.8,ret6m:46,inst:15.45,circuit:35.4,totalShares:19360000,updatedAt:"2026-07-02"},
  {id:16,name:"SQURPHARMA",sector:"Pharma",cat:"A",price:224.1,eps:18.5,pe:12.1,nav:98.2,div:30,rsi:58.0,macd:1.2,vol:765549,vma20:600000,ema20:220.5,sma50:215.8,ret6m:12,inst:22.1,circuit:246.5,totalShares:4000000,updatedAt:"2026-07-02"},
];

const INIT_PORT=[
  {id:1,stock:"EPGL",broker:"Ecosoft",shares:7300,buyRate:19.26,currentPrice:19.6,target1:20.5,target2:20.7,stopLoss:18.0,trailingSL:18.0,realized:0,buyDate:"2026-06-15",customSellTarget:null},
  {id:2,stock:"EPGL",broker:"Lankabangla",shares:12000,buyRate:19.26,currentPrice:19.6,target1:20.5,target2:20.7,stopLoss:18.0,trailingSL:18.0,realized:0,buyDate:"2026-06-15",customSellTarget:null},
  {id:3,stock:"HAKKANIPUL",broker:"Ecosoft",shares:2500,buyRate:80.24,currentPrice:80.0,target1:82.0,target2:84.0,stopLoss:76.5,trailingSL:76.5,realized:0,buyDate:"2026-06-20",customSellTarget:null},
  {id:4,stock:"HAKKANIPUL",broker:"অন্য",shares:5000,buyRate:81.24,currentPrice:80.0,target1:82.0,target2:84.0,stopLoss:76.5,trailingSL:76.5,realized:0,buyDate:"2026-06-20",customSellTarget:null},
  {id:5,stock:"LOVELLO",broker:"Ecosoft",shares:9630,buyRate:71.54,currentPrice:71.9,target1:75.5,target2:78.0,stopLoss:67.5,trailingSL:67.5,realized:0,buyDate:"2026-06-10",customSellTarget:null},
  {id:6,stock:"LOVELLO",broker:"Lankabangla",shares:5087,buyRate:75.17,currentPrice:71.9,target1:75.5,target2:78.0,stopLoss:67.5,trailingSL:67.5,realized:0,buyDate:"2026-06-10",customSellTarget:null},
  {id:7,stock:"MONNOFABR",broker:"Ecosoft",shares:23526,buyRate:21.77,currentPrice:22.4,target1:23.9,target2:25.0,stopLoss:21.0,trailingSL:21.0,realized:0,buyDate:"2026-05-28",customSellTarget:null},
  {id:8,stock:"KPPL",broker:"অন্য",shares:10000,buyRate:16.25,currentPrice:16.2,target1:17.0,target2:18.0,stopLoss:14.8,trailingSL:14.8,realized:0,buyDate:"2026-06-05",customSellTarget:null},
  {id:9,stock:"DESHBANDHU",broker:"Lankabangla",shares:10000,buyRate:20.86,currentPrice:21.3,target1:21.8,target2:22.5,stopLoss:19.8,trailingSL:19.8,realized:0,buyDate:"2026-06-18",customSellTarget:null},
  {id:10,stock:"ACMEPL",broker:"Lankabangla",shares:6400,buyRate:26.28,currentPrice:23.3,target1:24.1,target2:25.6,stopLoss:22.0,trailingSL:22.0,realized:0,buyDate:"2026-06-01",customSellTarget:null},
  {id:11,stock:"JAMUNABANK",broker:"Lankabangla",shares:19500,buyRate:24.13,currentPrice:24.2,target1:25.0,target2:25.9,stopLoss:22.5,trailingSL:22.5,realized:0,buyDate:"2026-06-22",customSellTarget:null},
];

const C={bg:"#070D1A",card:"#0F1923",border:"#1A2D4A",text:"#E8EAF0",muted:"#4A6080",accent:"#00C896",blue:"#0080FF",yellow:"#FFC107",red:"#F44336",orange:"#FF9800",purple:"#9C27B0",gold:"#FFD700"};
const inp=(ex={})=>({background:"#0A1628",border:"1px solid #1A2D4A",borderRadius:6,color:"#E8EAF0",padding:"6px 10px",fontSize:13,fontFamily:"inherit",outline:"none",...ex});
const card=(ex={})=>({background:"#0F1923",border:"1px solid #1A2D4A",borderRadius:12,...ex});
const btn=(color,active,small)=>{color=color||"#00C896";return{padding:small?"4px 10px":"8px 16px",borderRadius:8,border:"none",cursor:"pointer",background:active?color:color+"20",color:active?"#fff":color,fontWeight:700,fontSize:small?11:13,fontFamily:"inherit"};};
function generateStrategy(s,days,portShares){
  portShares=portShares||0;
  const p=s.price,rsi=s.rsi||50,macd=s.macd||0;
  const vma20=s.vma20||1000000,ema20=s.ema20||p,sma50=s.sma50||p;
  const isAboveEMA=p>ema20,isAboveSMA=p>sma50;
  const isBreakoutVol=s.vol>vma20*2;
  const isOversold=rsi<35,isOverbought=rsi>68;
  const isBullMACD=macd>0.3,isBearMACD=macd<-0.3;
  const isPump=s.vol>5000000&&rsi>70&&s.ret6m>40;
  const isFundStrong=s.eps>3&&s.pe>0&&s.pe<20;
  const isUnderval=s.nav>0&&p<s.nav*1.5;
  const holdNote=portShares>0?"আপনার "+portShares.toLocaleString()+" shares":"";
  const maSignal=(isAboveEMA&&isAboveSMA)?"🟢 EMA+SMA উপরে":isAboveEMA?"🟡 EMA উপরে":"🔴 MA এর নিচে";
  const rsiSaysBuy=rsi<40,rsiSaysSell=rsi>65;
  const hasConflict=(rsiSaysBuy&&isBearMACD)||(rsiSaysSell&&isBullMACD);
  let conflictNote="";
  if(rsiSaysBuy&&isBearMACD)conflictNote="⚠️ RSI "+rsi.toFixed(0)+" (buy zone) কিন্তু MACD Bearish — Volume বাড়লে তবেই কিনুন।";
  if(rsiSaysSell&&isBullMACD)conflictNote="⚠️ RSI "+rsi.toFixed(0)+" (sell zone) কিন্তু MACD Bullish — Trailing SL tight রাখুন।";

  if(days===0){
    const sl=+(p*0.93).toFixed(2);
    let t1,t2,t3,sellT1=40,sellT2=40,sellT3=20,buySignal,buyZone,buyStr,sellStr,risk,priority;
    if(hasConflict){t1=+(p*1.04).toFixed(2);t2=+(p*1.09).toFixed(2);t3=null;risk="🟡 MEDIUM";priority=3;buySignal="⚠️ Mixed Signal";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;buyStr=conflictNote;sellStr="Mixed — নিশ্চিত হলে enter করুন।";}
    else if(isOversold&&(isBullMACD||isBreakoutVol)){t1=+(p*1.06).toFixed(2);t2=+(p*1.12).toFixed(2);t3=s.nav&&s.nav>p*1.15?+(s.nav*0.85).toFixed(2):null;risk="🟢 LOW";priority=1;buySignal="🚀 Strong Natural Buy";buyZone="৳"+(p*0.98).toFixed(2)+"-৳"+p;buyStr="RSI "+rsi.toFixed(0)+" Oversold+"+(isBullMACD?"MACD Bullish":"Volume Breakout")+".";sellStr="T1 এ 40% sell।";}
    else if(isOverbought){t1=+(p*1.03).toFixed(2);t2=+(p*1.06).toFixed(2);t3=null;sellT1=60;sellT2=35;risk="🔴 HIGH";priority=5;buySignal="🔴 Overbought — কিনবেন না";buyZone="RSI "+(rsi-15).toFixed(0)+" নামলে";buyStr="RSI "+rsi.toFixed(0)+" — Overbought। "+conflictNote;sellStr="Position থাকলে sell করুন।";}
    else if(isAboveEMA&&isAboveSMA&&isBullMACD){t1=+(p*1.06).toFixed(2);t2=+(p*1.12).toFixed(2);t3=+(p*1.18).toFixed(2);risk="🟢 LOW-MED";priority=2;buySignal="✅ Natural Buy";buyZone="৳"+ema20.toFixed(2)+"-৳"+p;buyStr="Price>EMA20(৳"+ema20.toFixed(2)+")>SMA50. MACD "+macd.toFixed(2)+" bullish।";sellStr="RSI 68+ বা EMA20 ভাঙলে sell।";}
    else{t1=+(p*1.05).toFixed(2);t2=+(p*1.10).toFixed(2);t3=null;risk="🟡 MEDIUM";priority=3;buySignal="🟡 Sideways — অপেক্ষা";buyZone="৳"+(p*0.96).toFixed(2)+"-৳"+(p*0.98).toFixed(2);buyStr="RSI "+rsi.toFixed(0)+" neutral। BB Lower এ কিনুন।";sellStr="BB Upper বা Resistance এ sell।";}
    t1=Math.max(+(p*1.025).toFixed(2),t1);t2=Math.max(+(t1*1.04).toFixed(2),t2);if(t3)t3=Math.max(+(t2*1.04).toFixed(2),t3);
    if(s.circuit){if(t1>=s.circuit*0.97)t1=+(s.circuit*0.92).toFixed(2);if(t2>=s.circuit)t2=+(s.circuit*0.97).toFixed(2);if(t2<=t1)t2=+(t1*1.04).toFixed(2);}
    return{t1,t2,t3,sl,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,holding:"Natural",holdNote,priority,maSignal,isBreakoutVol,isAboveEMA,isAboveSMA,hasConflict,conflictNote};
  }

  days=days||7;
  const dayMult=days<=5?0.04:days<=10?0.07:days<=21?0.12:0.20;
  const sl=+(p*0.93).toFixed(2);
  let t1,t2,t3,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,priority;

  if(isPump){t1=+(p*(1+dayMult*0.6)).toFixed(2);t2=+(p*(1+dayMult)).toFixed(2);t3=null;sellT1=60;sellT2=35;sellT3=5;risk="🔴 HIGH";priority=5;buySignal="🔴 কিনবেন না";buyZone="—";buyStr="Pump! RSI "+rsi.toFixed(0)+". এখন কিনলে আটকে যাবেন।";sellStr="এখনই sell।";}
  else if(hasConflict){t1=+(p*(1+dayMult*0.7)).toFixed(2);t2=+(p*(1+dayMult*1.2)).toFixed(2);t3=null;sellT1=40;sellT2=50;sellT3=10;risk="🟡 MEDIUM";priority=3;buySignal="⚠️ Mixed Signal";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;buyStr=conflictNote;sellStr="T1 এ 40% নিন।";}
  else if(isOversold&&isBullMACD){t1=+(p*(1+dayMult*1.1)).toFixed(2);t2=+(p*(1+dayMult*1.7)).toFixed(2);t3=+(p*(1+dayMult*2.5)).toFixed(2);sellT1=25;sellT2=45;sellT3=30;risk="🟢 LOW";priority=1;buySignal="🚀 এখনই কিনুন";buyZone="৳"+(p*0.98).toFixed(2)+"-৳"+p;buyStr="RSI "+rsi.toFixed(0)+" Oversold+MACD "+macd.toFixed(2)+" Bullish"+(isBreakoutVol?" +Volume!":"")+".";sellStr="T2 এ 45% রাখুন। T1 hit হলে SL buyRate এ।";}
  else if(isFundStrong&&isUnderval&&days>10){t1=+(p*(1+dayMult*0.9)).toFixed(2);t2=+(p*(1+dayMult*1.5)).toFixed(2);t3=+(s.nav*0.75).toFixed(2);sellT1=20;sellT2=35;sellT3=45;risk="🟢 LOW";priority=2;buySignal="✅ Long term Buy";buyZone="৳"+(p*0.97).toFixed(2)+"-৳"+p;buyStr="P/E "+s.pe+" NAV "+s.nav+". "+days+"d এর জন্য excellent।";sellStr="T3 (NAV ৳"+(s.nav*0.75).toFixed(2)+") পর্যন্ত ধরুন।";}
  else if(isOverbought){t1=+(p*(1+dayMult*0.5)).toFixed(2);t2=s.circuit?+(s.circuit*0.97).toFixed(2):+(p*(1+dayMult*0.9)).toFixed(2);t3=null;sellT1=60;sellT2=35;sellT3=5;risk="🟠 MED-HIGH";priority=4;buySignal="🟡 অপেক্ষা করুন";buyZone="RSI "+(rsi-15).toFixed(0)+" নামলে";buyStr="RSI "+rsi.toFixed(0)+" Overbought। EMA20 support এ কিনুন।";sellStr="T1 এ 60% নিন।"+(s.circuit?" Circuit ৳"+s.circuit+" এর আগেই!":"");}
  else if(isBreakoutVol&&isBullMACD){t1=+(p*(1+dayMult*1.0)).toFixed(2);t2=+(p*(1+dayMult*1.6)).toFixed(2);t3=+(p*(1+dayMult*2.2)).toFixed(2);sellT1=30;sellT2=45;sellT3=25;risk="🟢 LOW-MED";priority=1;buySignal="🚀 Volume Breakout";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;buyStr="Vol "+(s.vol/1000000).toFixed(1)+"M vs VMA "+(vma20/1000000).toFixed(1)+"M! MACD bullish.";sellStr="T2 সম্ভব। T1 hit হলে SL buyRate এ।";}
  else if(isBullMACD&&isAboveEMA){t1=+(p*(1+dayMult*0.85)).toFixed(2);t2=+(p*(1+dayMult*1.4)).toFixed(2);t3=+(p*(1+dayMult*1.9)).toFixed(2);sellT1=35;sellT2=40;sellT3=25;risk="🟢 LOW-MED";priority=2;buySignal="✅ কিনতে পারেন";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;buyStr="MACD "+macd.toFixed(2)+" + Price>EMA20(৳"+ema20.toFixed(2)+").";sellStr="RSI 68+ হলে বের হন।";}
  else if(isBullMACD){t1=+(p*(1+dayMult*0.8)).toFixed(2);t2=+(p*(1+dayMult*1.3)).toFixed(2);t3=+(p*(1+dayMult*1.8)).toFixed(2);sellT1=35;sellT2=40;sellT3=25;risk="🟡 MEDIUM";priority=2;buySignal="✅ কিনতে পারেন";buyZone="৳"+(p*0.99).toFixed(2)+"-৳"+p;buyStr="MACD "+macd.toFixed(2)+" bullish। EMA20(৳"+ema20.toFixed(2)+") support।";sellStr="T1 এ 35% নিন।";}
  else{t1=+(p*(1+dayMult*0.8)).toFixed(2);t2=+(p*(1+dayMult*1.3)).toFixed(2);t3=null;sellT1=40;sellT2=45;sellT3=15;risk="🟡 MEDIUM";priority=3;buySignal="🟡 অপেক্ষা করুন";buyZone="৳"+(p*0.95).toFixed(2)+"-৳"+(p*0.98).toFixed(2);buyStr="Sideways। EMA20:৳"+ema20.toFixed(2)+" Breakout এর জন্য অপেক্ষা।";sellStr="T1 এ 40% নিন।";}

  const minT1=+(p*1.025).toFixed(2),minT2=+(p*1.06).toFixed(2);
  t1=Math.max(minT1,t1);t2=Math.max(Math.max(minT2,+(t1*1.04).toFixed(2)),t2);
  if(t3)t3=Math.max(+(t2*1.04).toFixed(2),t3);
  if(s.circuit){if(t1>=s.circuit*0.97)t1=+(s.circuit*0.92).toFixed(2);if(t2>=s.circuit)t2=+(s.circuit*0.97).toFixed(2);if(t2<=t1)t2=+(t1*1.04).toFixed(2);if(t3&&t3>=s.circuit)t3=+(t2*1.04).toFixed(2);if(t2>=s.circuit)sellStr+=" | Circuit ৳"+s.circuit+" এর আগেই!";}
  return{t1,t2,t3,sl,sellT1,sellT2,sellT3,buySignal,buyZone,buyStr,sellStr,risk,holding:days+" দিন",holdNote,priority,maSignal,isBreakoutVol,isAboveEMA,isAboveSMA,hasConflict,conflictNote};
}

function calcScore(s,days){
  days=days||7;let sc=0;
  if(s.eps>5)sc+=20;else if(s.eps>2)sc+=15;else if(s.eps>0)sc+=8;else sc-=15;
  if(s.pe>0&&s.pe<15)sc+=20;else if(s.pe>0&&s.pe<25)sc+=12;else if(s.pe>0&&s.pe<35)sc+=5;else if(s.pe<0)sc-=20;else sc-=10;
  if(days<=10){if(s.rsi>=45&&s.rsi<=65)sc+=20;else if(s.rsi>65&&s.rsi<=70)sc+=8;else if(s.rsi>70)sc-=15;else sc+=5;}
  else{if(s.rsi>=40&&s.rsi<=60)sc+=15;else if(s.rsi<40)sc+=10;else if(s.rsi>70)sc-=5;}
  if(s.macd>0.5)sc+=15;else if(s.macd>0)sc+=8;else if(s.macd<-0.5)sc-=15;else sc-=5;
  const vma=s.vma20||1000000;
  if(s.vol>vma*2)sc+=15;else if(s.vol>vma*1.2)sc+=10;else if(s.vol>vma*0.8)sc+=5;else sc-=5;
  if(s.div>=20)sc+=10;else if(s.div>=10)sc+=6;else if(s.div>0)sc+=3;else sc-=5;
  if(s.nav>0){const nr=s.price/s.nav;if(nr<2)sc+=10;else if(nr<4)sc+=5;else sc-=5;}
  if(s.inst>15)sc+=10;else if(s.inst>8)sc+=5;
  if(s.ret6m>20)sc+=8;else if(s.ret6m>0)sc+=4;else sc-=5;
  if(s.cat==="A")sc+=5;else sc-=5;
  if(s.ema20){if(s.price>s.ema20)sc+=10;else sc-=5;}
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

function calcTrailingSL(p){
  const t1=p.target1,t2=p.target2,base=p.trailingSL||p.stopLoss;
  if(p.currentPrice>=t2)return Math.max(base,t1||p.buyRate);
  if(p.currentPrice>=t1)return Math.max(base,p.buyRate);
  return base;
}

function TradeItem({t,profile,onWithdraw}){
  const [showW,setShowW]=useState(false);
  const [wAmt,setWAmt]=useState("");
  const [wBank,setWBank]=useState("");
  const [wDate,setWDate]=useState(TODAY);
  const withdrawn=(t.withdrawals||[]).reduce((a,w)=>a+(w.amount||0),0);
  const balance=(t.profit||0)-withdrawn;
  const addW=()=>{if(!wAmt||+wAmt<=0)return;onWithdraw(t.id,{id:Date.now(),amount:+wAmt,bank:wBank,date:wDate});setShowW(false);setWAmt("");setWBank("");};
  return(
    <div style={{...card(),padding:14,marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:"#fff",fontSize:14}}>{t.stock} <span style={{background:C.blue+"22",color:C.blue,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>{t.broker}</span></div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Buy ৳{t.buyRate} → Sell ৳{t.sellPrice} · {t.sellShares} shares · {t.date}</div>
          {t.commission>0&&<div style={{fontSize:10,color:C.orange}}>Commission: ৳{t.commission.toFixed(0)}</div>}
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:800,fontSize:15,color:t.profit>=0?C.accent:C.red}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
          <div style={{fontSize:11,color:C.yellow}}>Balance: ৳{balance.toFixed(0)}</div>
        </div>
      </div>
      {(t.withdrawals||[]).length>0&&(
        <div style={{marginBottom:8}}>
          {t.withdrawals.map(w=>(
            <div key={w.id} style={{background:"#070D1A",borderRadius:6,padding:"5px 10px",marginBottom:4,fontSize:11,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:C.yellow}}>💸 ৳{w.amount} → {w.bank||"Bank"}</span>
              <span style={{color:C.muted}}>{w.date}</span>
            </div>
          ))}
        </div>
      )}
      {showW?(
        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginTop:4}}>
          <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>💸 Withdraw</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Amount ৳</div><input type="number" value={wAmt} onChange={e=>setWAmt(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
            <div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Date</div><input type="date" value={wDate} onChange={e=>setWDate(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Bank</div>
              <select value={wBank} onChange={e=>setWBank(e.target.value)} style={inp({width:"100%"})}>
                <option value="">Select...</option>
                {(profile&&profile.bankAccounts||[]).map(b=><option key={b.id} value={b.name}>{b.name}{b.accountNo?" ("+b.accountNo+")":""}</option>)}
              </select></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addW} style={btn(C.yellow,true,true)}>✅ Confirm</button>
            <button onClick={()=>setShowW(false)} style={btn(C.muted,false,true)}>বাতিল</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setShowW(true)} style={btn(C.yellow,false,true)}>💸 Withdraw</button>
      )}
    </div>
  );
}

function LoginScreen({onLogin}){
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const go=async()=>{setLoading(true);setErr("");try{await onLogin();}catch(e){setErr("Login ব্যর্থ: "+e.message);}setLoading(false);};
  return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{...card(),padding:32,width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:12}}>📊</div>
        <div style={{fontWeight:800,fontSize:24,color:"#fff",marginBottom:4}}>DSE Trading Dashboard</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:32}}>v7 · Enterprise · Cloud Sync</div>
        <button onClick={go} disabled={loading} style={{width:"100%",padding:14,background:"#fff",border:"none",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,fontSize:15,fontWeight:700,color:"#1A1A1A",marginBottom:12,fontFamily:"inherit"}}>
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {loading?"লোড হচ্ছে...":"Google দিয়ে Login করুন"}
        </button>
        {err&&<div style={{color:C.red,fontSize:12,marginTop:8}}>{err}</div>}
        <div style={{fontSize:11,color:C.muted,marginTop:16}}>📊 Firebase এ সুরক্ষিত</div>
      </div>
    </div>
  );
}

function SettingsPage({profile,user,onSave,onClose,onSignOut}){
  const [tab,setTab]=useState("profile");
  const [lp,setLp]=useState({...DEFAULT_PROFILE,...profile});
  const [saving,setSaving]=useState(false);
  const upd=(k,v)=>setLp(p=>({...p,[k]:v}));
  const updBroker=(id,k,v)=>setLp(p=>({...p,brokers:p.brokers.map(b=>b.id===id?{...b,[k]:v}:b)}));
  const updBank=(id,k,v)=>setLp(p=>({...p,bankAccounts:p.bankAccounts.map(b=>b.id===id?{...b,[k]:v}:b)}));
  const save=async()=>{setSaving(true);await onSave(lp);setSaving(false);};
  const TS=(t)=>({padding:"8px 14px",border:"none",cursor:"pointer",background:tab===t?C.accent:"transparent",color:tab===t?"#fff":C.muted,fontWeight:700,fontSize:12,fontFamily:"inherit",borderRadius:8});
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"0 0 80px"}}>
      <div style={{background:"linear-gradient(135deg,#070D1A,#0F2040)",padding:"20px 20px 0",borderBottom:"1px solid "+C.border}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <img src={user.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(user.displayName||"U")+"&background=00C896&color=fff"} style={{width:64,height:64,borderRadius:32,border:"3px solid "+C.accent}} alt="profile"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>{lp.displayName||user.displayName}</div>
              <div style={{fontSize:12,color:C.muted}}>{user.email}</div>
              <div style={{fontSize:11,color:C.accent,marginTop:2}}>DSE Trader Enterprise</div>
            </div>
            <button onClick={onClose} style={btn(C.muted,false,true)}>✕ বন্ধ</button>
          </div>
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
            {[["profile","👤 Profile"],["brokers","🏦 Brokers"],["banks","🏧 Banks"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={TS(t)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:680,margin:"20px auto",padding:"0 20px"}}>
        {tab==="profile"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:14}}>👤 Profile</div>
            {[["displayName","নাম"],["phone","ফোন"]].map(([k,l])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div>
                <input value={lp[k]||""} onChange={e=>upd(k,e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
              </div>
            ))}
            <div style={{marginTop:20,padding:14,background:"#070D1A",borderRadius:10,border:"1px solid "+C.red+"44"}}>
              <div style={{fontWeight:700,color:C.red,marginBottom:8}}>⚠️ Account</div>
              <button onClick={onSignOut} style={{...btn(C.red,true),width:"100%",padding:12}}>🚪 Sign Out</button>
            </div>
          </div>
        )}
        {tab==="brokers"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:6}}>🏦 Broker Commission</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>প্রতিটি broker এর আলাদা commission % সেট করুন।</div>
            {(lp.brokers||DEFAULT_BROKERS).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+C.border}}>
                <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:8}}>{b.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Commission %</div>
                    <input type="number" value={b.commission} step="0.01" min="0" max="2" onChange={e=>updBroker(b.id,"commission",+e.target.value)} style={{...inp({width:90,textAlign:"center"})}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Withdraw Fee ৳</div>
                    <input type="number" value={b.withdrawFee||0} min="0" onChange={e=>updBroker(b.id,"withdrawFee",+e.target.value)} style={{...inp({width:90,textAlign:"center"})}}/>
                  </div>
                </div>
                <div style={{marginTop:6,fontSize:11,color:C.yellow}}>৳১০,০০০ trade এ ≈ ৳{(10000*b.commission/100).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="banks"&&(
          <div style={{...card(),padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.accent}}>🏧 Bank Accounts</div>
              <button onClick={()=>setLp(p=>({...p,bankAccounts:[...p.bankAccounts,{id:Date.now()+"",name:"",accountNo:"",branch:""}]}))} style={btn(C.blue,true,true)}>+ Add</button>
            </div>
            {(lp.bankAccounts||[]).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+C.border}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                  {[["name","Bank Name"],["accountNo","Account No"],["branch","Branch"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div><input value={b[k]||""} onChange={e=>updBank(b.id,k,e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box",fontSize:12})}}/></div>
                  ))}
                </div>
                <button onClick={()=>setLp(p=>({...p,bankAccounts:p.bankAccounts.filter(x=>x.id!==b.id)}))} style={btn(C.red,false,true)}>🗑️ Remove</button>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:14}}>
          <button onClick={save} disabled={saving} style={{...btn(C.accent,true),width:"100%",padding:14}}>{saving?"💾 Saving...":"✅ Save Settings"}</button>
        </div>
      </div>
    </div>
  );
}

function ProfitDashboard({trades,portfolio,stocks}){
  const [period,setPeriod]=useState("week");
  const filtered=useMemo(()=>{const cutoff=new Date();if(period==="day")cutoff.setDate(cutoff.getDate()-1);else if(period==="week")cutoff.setDate(cutoff.getDate()-7);else if(period==="fortnight")cutoff.setDate(cutoff.getDate()-14);else if(period==="month")cutoff.setMonth(cutoff.getMonth()-1);else cutoff.setFullYear(2000);return trades.filter(t=>new Date(t.date)>=cutoff);},[trades,period]);
  const totalRealized=trades.reduce((a,t)=>a+(t.profit||0),0);
  const totalWithdrawn=trades.reduce((a,t)=>a+(t.withdrawals||[]).reduce((x,w)=>x+(w.amount||0),0),0);
  const inBroker=totalRealized-totalWithdrawn;
  const periodProfit=filtered.reduce((a,t)=>a+(t.profit||0),0);
  const daily=useMemo(()=>{const map={};trades.forEach(t=>{const d=t.date?t.date.split("T")[0]:null;if(d)map[d]=(map[d]||0)+(t.profit||0);});const days=[];for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];days.push({date:k.slice(5),profit:map[k]||0});}return days;},[trades]);
  const maxP=Math.max(...daily.map(d=>Math.abs(d.profit)),1);
  const portMap={};portfolio.forEach(p=>{portMap[p.stock]=(portMap[p.stock]||0)+p.shares;});
  const top3=[...stocks].map(s=>({...s,score:calcScore(s,7),str:generateStrategy(s,7,portMap[s.name]||0)})).filter(s=>s.score>=60&&s.str&&s.str.priority<=2).sort((a,b)=>b.score-a.score).slice(0,3);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        {[["Total Realized","৳"+totalRealized.toFixed(0),C.accent],["Broker Balance","৳"+Math.max(0,inBroker).toFixed(0),C.blue],["Withdrawn","৳"+totalWithdrawn.toFixed(0),C.yellow],["Period P&L","৳"+periodProfit.toFixed(0),periodProfit>=0?C.accent:C.red]].map(([l,v,cl])=>(
          <div key={l} style={{...card(),padding:12,textAlign:"center"}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:cl}}>{v}</div></div>
        ))}
      </div>
      <div style={{...card(),padding:12,marginBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
        {[["day","আজ"],["week","সাপ্তাহিক"],["fortnight","পাক্ষিক"],["month","মাসিক"],["all","সব"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} style={btn(C.accent,period===k,true)}>{l}</button>
        ))}
      </div>
      <div style={{...card(),padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:C.accent,marginBottom:10}}>📈 Daily P&L (30 days)</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:80}}>
          {daily.map((d,i)=>{const h=Math.max(2,Math.abs(d.profit)/maxP*70);const color=d.profit>=0?"#00C896":"#F44336";return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:"80%",height:h,background:color,borderRadius:"2px 2px 0 0"}}/>
              {i%5===0&&<div style={{fontSize:7,color:C.muted,transform:"rotate(-45deg)",whiteSpace:"nowrap",marginTop:2}}>{d.date}</div>}
            </div>
          );})}
        </div>
      </div>
      <div style={{...card(),padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:C.accent,marginBottom:10}}>💰 {period==="day"?"আজ":period==="week"?"সাপ্তাহিক":period==="fortnight"?"পাক্ষিক":period==="month"?"মাসিক":"সব"}: <span style={{color:periodProfit>=0?C.accent:C.red}}>৳{periodProfit.toFixed(0)}</span></div>
        {filtered.length===0?<div style={{color:C.muted,fontSize:12}}>এই period এ trade নেই।</div>:filtered.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}>
            <div><div style={{fontWeight:700,color:"#fff",fontSize:13}}>{t.stock} <span style={{color:C.muted,fontSize:11}}>{t.broker}</span></div><div style={{fontSize:10,color:C.muted}}>{t.date}</div></div>
            <div style={{fontWeight:800,color:t.profit>=0?C.accent:C.red}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div style={{...card(),padding:14}}>
        <div style={{fontWeight:700,color:"#FFD700",marginBottom:10}}>🏆 Top 3 Buy — এখন কিনুন</div>
        {top3.length===0?<div style={{color:C.muted,fontSize:12}}>এখন strong signal নেই।</div>:top3.map((s,i)=>(
          <div key={s.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32")+"44"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:26,height:26,background:i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:"#000"}}>#{i+1}</div>
              <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff"}}>{s.name} <span style={{fontSize:11,color:C.muted}}>৳{s.price}</span></div><div style={{fontSize:10,color:C.accent}}>Score: {s.score} · {s.str.risk}</div></div>
            </div>
            <div style={{fontSize:12,color:"#E8EAF0",lineHeight:1.5,marginBottom:4}}>{s.str.buyStr}</div>
            <div style={{display:"flex",gap:10,fontSize:11}}><span style={{color:C.accent}}>T1: ৳{s.str.t1}</span><span style={{color:C.yellow}}>T2: ৳{s.str.t2}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
} 
function SellModal({pos,str,brokerComm,onSell}){
  const [open,setOpen]=useState(false);
  const [sp,setSp]=useState(pos.currentPrice);
  const [ss,setSs]=useState(Math.floor(pos.shares*0.4));
  const commRate=(brokerComm||0.3)/100;
  if(!open)return <button onClick={()=>{setSp(pos.currentPrice);setSs(Math.floor(pos.shares*0.4));setOpen(true);}} style={{background:C.accent+"22",color:C.accent,border:"1px solid "+C.accent+"44",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>💰 Sell</button>;
  const t1=str&&str.t1||pos.target1,t2=str&&str.t2||pos.target2;
  const sellT1=str&&str.sellT1||40,sellT2=str&&str.sellT2||40;
  const profit=(sp-pos.buyRate)*ss,comm=(ss*pos.buyRate+ss*sp)*commRate,netPL=profit-comm;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...card(),border:"1px solid "+C.accent,padding:20,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div><div style={{fontWeight:800,fontSize:16,color:"#fff"}}>💰 {pos.stock} Sell</div><div style={{fontSize:11,color:C.muted}}>{pos.broker} · {pos.shares.toLocaleString()} shares</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:C.accent}}>৳{pos.currentPrice}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={()=>{setSp(t1);setSs(Math.round(pos.shares*sellT1/100));}} style={{padding:8,background:C.accent+"22",border:"1px solid "+C.accent+"44",borderRadius:8,color:C.accent,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🎯 T1 Sell</div><div style={{fontSize:10,color:C.muted}}>৳{t1} · {sellT1}%</div>
          </button>
          <button onClick={()=>{setSp(t2);setSs(Math.round(pos.shares*sellT2/100));}} style={{padding:8,background:C.yellow+"22",border:"1px solid "+C.yellow+"44",borderRadius:8,color:C.yellow,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🚀 T2 Sell</div><div style={{fontSize:10,color:C.muted}}>৳{t2} · {sellT2}%</div>
          </button>
          <button onClick={()=>{setSp(pos.currentPrice);setSs(pos.shares);}} style={{padding:8,background:C.red+"22",border:"1px solid "+C.red+"44",borderRadius:8,color:C.red,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🔴 All Sell</div><div style={{fontSize:10,color:C.muted}}>সব {pos.shares.toLocaleString()}</div>
          </button>
          <button onClick={()=>{setSp(pos.customSellTarget||pos.currentPrice);setSs(Math.floor(pos.shares*0.5));}} style={{padding:8,background:C.purple+"22",border:"1px solid "+C.purple+"44",borderRadius:8,color:C.purple,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🎯 Custom</div><div style={{fontSize:10,color:C.muted}}>৳{pos.customSellTarget||pos.currentPrice}</div>
          </button>
        </div>
        <div style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Sell Price",sp,setSp],["Shares",ss,setSs]].map(([l,v,set])=>(
              <div key={l}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div>
                <input type="number" value={v} onChange={e=>set(+e.target.value)} style={{width:"100%",background:"#1A2D4A",border:"none",borderRadius:8,color:C.text,padding:"8px 10px",fontSize:14,boxSizing:"border-box",fontFamily:"inherit"}}/></div>
            ))}
          </div>
        </div>
        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginBottom:12}}>
          {[["Gross P&L","৳"+profit.toFixed(0),profit>=0?C.accent:C.red],["Commission","−৳"+comm.toFixed(0),C.orange],["Net P&L","৳"+netPL.toFixed(0),netPL>=0?C.accent:C.red]].map(([l,v,cl])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}><span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:cl}}>{v}</span></div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onSell(pos,sp,ss,comm);setOpen(false);}} style={{flex:1,padding:11,background:"linear-gradient(135deg,"+C.accent+","+C.blue+")",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>✅ Confirm</button>
          <button onClick={()=>setOpen(false)} style={{padding:"11px 16px",background:"#1A2D4A",border:"none",borderRadius:8,color:C.muted,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>বাতিল</button>
        </div>
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
  const [sigF,setSigF]=useState("সব");
  const [nameFilter,setNameFilter]=useState("");
  const [sortBy,setSortBy]=useState("score");
  const [expanded,setExpanded]=useState(null);
  const [editMode,setEditMode]=useState(null);
  const [editPort,setEditPort]=useState(null);
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
  const [liveStatus,setLiveStatus]=useState(null);
  const [liveUpdatedAt,setLiveUpdatedAt]=useState(null);
  const [ns,setNs]=useState({name:"",sector:"Bank",cat:"A",price:"",eps:"",pe:"",nav:"",div:"",rsi:"50",macd:"0",vol:"",vma20:"",ema20:"",sma50:"",ret6m:"",inst:"",circuit:""});
  const [np,setNp]=useState({stock:"",broker:"Ecosoft",shares:"",buyRate:"",target1:"",target2:"",stopLoss:"",buyDate:TODAY,customSellTarget:""});

  useEffect(()=>{
    const unsub=onAuthStateChanged(_auth,async(u)=>{
      setUser(u);
      if(u){
        try{
          const [pData,appData]=await Promise.all([_getProfile(u.uid),_getData(u.uid)]);
          if(pData)setProfile(p=>({...DEFAULT_PROFILE,...pData}));
          if(appData){if(appData.stocks&&appData.stocks.length>0)setStocks(appData.stocks);if(appData.port&&appData.port.length>0)setPort(appData.port);if(appData.trades)setTrades(appData.trades);}
          if(!pData)await _saveProfile(u.uid,{email:u.email,displayName:u.displayName,photoURL:u.photoURL,...DEFAULT_PROFILE});
        }catch(e){console.log("Load error:",e);}
      }
      setAuthLoading(false);
    });
    return unsub;
  },[]);

  const getBrokerComm=(brokerId)=>{const b=(profile.brokers||DEFAULT_BROKERS).find(x=>x.id===brokerId||x.name===brokerId);return b?b.commission:0.3;};
  const showToast=(msg,type)=>{setToast({msg,type:type||"ok"});setTimeout(()=>setToast(null),4000);};
  const persist=useCallback((s,p,t)=>{const data={stocks:s||stocks,port:p||port,trades:t||trades};save(data);if(user){_saveData(user.uid,data).catch(e=>console.log(e));}},[stocks,port,trades,user]);
  const portMap=useMemo(()=>{const m={};port.forEach(p=>{m[p.stock]=(m[p.stock]||0)+p.shares;});return m;},[port]);

  const scored=useMemo(()=>stocks.map(s=>{const score=calcScore(s,days);const rec=getRec(score);const str=generateStrategy(s,days,portMap[s.name]||0);return{...s,score,rec,str};}),[stocks,days,portMap]);
  const filtered=useMemo(()=>{let list=[...scored];if(nameFilter.trim())list=list.filter(s=>s.name.toUpperCase().includes(nameFilter.toUpperCase()));if(sigF!=="সব"){const m={"STRONG BUY":s=>s.score>=75,"BUY":s=>s.score>=60&&s.score<75,"WATCH":s=>s.score>=45&&s.score<60,"WEAK":s=>s.score>=30&&s.score<45,"AVOID":s=>s.score<30};list=list.filter(m[sigF]||(_=>true));}list.sort((a,b)=>sortBy==="score"?b.score-a.score:sortBy==="vol"?b.vol-a.vol:b.eps-a.eps);return list;},[scored,sigF,sortBy,nameFilter]);
  const sigC=useMemo(()=>{const c={"STRONG BUY":0,"BUY":0,"WATCH":0,"WEAK":0,"AVOID":0};scored.forEach(s=>{if(s.score>=75)c["STRONG BUY"]++;else if(s.score>=60)c["BUY"]++;else if(s.score>=45)c["WATCH"]++;else if(s.score>=30)c["WEAK"]++;else c["AVOID"]++;});return c;},[scored]);

  const enriched=useMemo(()=>port.map(p=>{
    const sData=stocks.find(s=>s.name===p.stock);
    const cp=sData&&sData.price>0?sData.price:p.currentPrice;
    const cost=p.shares*p.buyRate,val=p.shares*cp,pl=val-cost,plp=cost!==0?(pl/cost)*100:0;
    const str=sData?generateStrategy(sData,days,p.shares):{t1:p.target1,t2:p.target2,t3:null,sl:p.stopLoss,sellT1:40,sellT2:40,sellT3:20,risk:"🟡 MEDIUM",sellStr:"Screener এ নেই।",maSignal:"—",isBreakoutVol:false};
    const tsl=calcTrailingSL({...p,currentPrice:cp,str});
    const isTSLActive=tsl>(p.trailingSL||p.stopLoss);
    let sig="⏳ HOLD";const effectiveSL=Math.max(tsl,p.stopLoss);
    if(cp<=effectiveSL)sig="🔴 STOP LOSS!";else if(cp>=str.t2)sig="🚀 T2 SELL";else if(cp>=str.t1)sig="✅ T1 SELL";
    const holdDays=p.buyDate?Math.floor((Date.now()-new Date(p.buyDate))/86400000):null;
    const liveChangePct=sData&&sData.liveChangePct!==undefined?sData.liveChangePct:null;
    return{...p,currentPrice:cp,cost,val,pl,plp,sig,str,sData,tsl,isTSLActive,effectiveSL,holdDays,liveChangePct};
  }),[port,stocks,days]);

  const summ=useMemo(()=>{
    const tc=enriched.reduce((a,p)=>a+p.cost,0),tv=enriched.reduce((a,p)=>a+p.val,0),tr=trades.reduce((a,t)=>a+(t.profit||0),0);
    const byB={};enriched.forEach(p=>{if(!byB[p.broker])byB[p.broker]={cost:0,val:0,n:0};byB[p.broker].cost+=p.cost;byB[p.broker].val+=p.val;byB[p.broker].n++;});
    return{tc,tv,tpl:tv-tc,tr,byB};
  },[enriched,trades]);

  const updateStock=(id,f,v)=>{const u=stocks.map(s=>s.id===id?{...s,[f]:v}:s);setStocks(u);persist(u,null,null);};
  const updatePort=(id,f,v)=>{const u=port.map(p=>p.id===id?{...p,[f]:+v}:p);setPort(u);persist(null,u,null);};
  const removeStock=(id)=>{const u=stocks.filter(s=>s.id!==id);setStocks(u);persist(u,null,null);showToast("Stock সরানো হয়েছে।");};

  const applyPaste=(data)=>{
    if(!data.name){showToast("❌ name দরকার","err");return;}
    const nm=data.name.toUpperCase();
    const ud={...data,name:nm,updatedAt:TODAY};
    const exists=stocks.find(s=>s.name.toUpperCase()===nm);
    if(exists){const u=stocks.map(s=>s.name.toUpperCase()===nm?{...s,...ud,id:s.id}:s);setStocks(u);persist(u,null,null);showToast("✅ "+nm+" আপডেট!");}
    else{const s={id:Date.now(),cat:"A",sector:"অন্যান্য",eps:0,pe:0,nav:1,div:0,rsi:50,macd:0,vol:0,vma20:500000,ema20:0,sma50:0,ret6m:0,inst:0,circuit:0,totalShares:5000000,...ud};const u=[...stocks,s];setStocks(u);persist(u,null,null);showToast("✅ "+nm+" যোগ হয়েছে!");}
  };

  const addPosition=()=>{
    if(!np.stock||!np.shares||!np.buyRate)return;
    const br=+np.buyRate;
    const p={...np,id:Date.now(),shares:+np.shares,buyRate:br,currentPrice:br,target1:+np.target1||(+(br*1.07).toFixed(2)),target2:+np.target2||(+(br*1.15).toFixed(2)),stopLoss:+np.stopLoss||(+(br*0.92).toFixed(2)),trailingSL:+np.stopLoss||(+(br*0.92).toFixed(2)),realized:0,buyDate:np.buyDate||TODAY,customSellTarget:+np.customSellTarget||null};
    const u=[...port,p];setPort(u);persist(null,u,null);
    setNp({stock:"",broker:"Ecosoft",shares:"",buyRate:"",target1:"",target2:"",stopLoss:"",buyDate:TODAY,customSellTarget:""});
    setShowAddP(false);showToast("✅ "+p.stock+" যোগ হয়েছে!");
  };

  const recordSell=(p,sp,ss,customComm)=>{
    const commRate=(customComm!==undefined?customComm:getBrokerComm(p.broker))/100;
    const grossProfit=(sp-p.buyRate)*ss;
    const comm=(ss*p.buyRate+ss*sp)*commRate;
    const profit=grossProfit-comm;
    const t={id:Date.now(),stock:p.stock,broker:p.broker,buyRate:p.buyRate,sellPrice:sp,sellShares:ss,profit,commission:comm,date:TODAY,withdrawals:[]};
    const ut=[...trades,t];
    const up=port.map(x=>x.id===p.id?{...x,shares:x.shares-ss,realized:(x.realized||0)+profit}:x).filter(x=>x.shares>0);
    setTrades(ut);setPort(up);persist(null,up,ut);
    showToast("✅ "+p.stock+" — ৳"+profit.toFixed(0)+" রেকর্ড!");
  };

  const applyPortPaste=()=>{
    setPortPasteErr("");
    try{
      const raw=JSON.parse(portPasteCode.trim());
      const items=Array.isArray(raw)?raw:[raw];
      if(!items.length){setPortPasteErr("❌ কোনো data নেই।");return;}
      let added=0,updated=0,newPort=[...port];
      items.forEach(item=>{
        if(!item.stock||!item.buyRate)return;
        const broker=item.broker||portPasteBroker;
        const br=+item.buyRate;
        const idx=newPort.findIndex(p=>p.stock.toUpperCase()===item.stock.toUpperCase()&&p.broker===broker);
        if(idx>=0){newPort[idx]={...newPort[idx],shares:item.shares!==undefined?+item.shares:newPort[idx].shares,buyRate:br||newPort[idx].buyRate,target1:item.target1?+item.target1:newPort[idx].target1,target2:item.target2?+item.target2:newPort[idx].target2,stopLoss:item.stopLoss?+item.stopLoss:newPort[idx].stopLoss};updated++;}
        else{newPort.push({id:Date.now()+Math.random(),stock:item.stock.toUpperCase(),broker,shares:+item.shares||0,buyRate:br,currentPrice:br,target1:item.target1?+item.target1:+(br*1.07).toFixed(2),target2:item.target2?+item.target2:+(br*1.15).toFixed(2),stopLoss:item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2),trailingSL:item.stopLoss?+item.stopLoss:+(br*0.92).toFixed(2),realized:0,buyDate:item.buyDate||TODAY,customSellTarget:null});added++;}
      });
      setPort(newPort);persist(null,newPort,null);
      setPortPasteCode("");setShowPortPaste(false);
      showToast("✅ "+added+"টি নতুন, "+updated+"টি আপডেট!");
    }catch(e){setPortPasteErr("❌ JSON format ভুল।");}
  };

  const TS=(t)=>({padding:"10px 18px",borderRadius:"8px 8px 0 0",border:"none",cursor:"pointer",background:tab===t?C.card:"transparent",color:tab===t?C.accent:C.muted,fontWeight:700,fontSize:13,fontFamily:"inherit",borderBottom:tab===t?"2px solid "+C.accent:"2px solid transparent"});

  if(authLoading)return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:48}}>📊</div><div style={{color:C.accent,fontWeight:700,marginTop:12}}>Loading...</div></div></div>);
  if(!user)return <LoginScreen onLogin={async()=>{await _signIn();}}/>;
  if(showSettings)return <SettingsPage profile={profile} user={user} onSave={async(p)=>{setProfile(p);if(user)await _saveProfile(user.uid,p);showToast("✅ Saved!");setShowSettings(false);}} onClose={()=>setShowSettings(false)} onSignOut={async()=>{await _signOut();setUser(null);setProfile(DEFAULT_PROFILE);}}/>;

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"Inter,-apple-system,sans-serif",color:C.text}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,zIndex:10001,background:toast.type==="err"?C.red:toast.type==="warn"?C.orange:C.accent,color:"#fff",borderRadius:10,padding:"12px 20px",fontWeight:700,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:340}}>{toast.msg}</div>}
      {undoItem&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"#1A2D4A",border:"1px solid "+C.yellow,borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <div style={{fontSize:13,color:C.text}}><span style={{color:C.yellow,fontWeight:700}}>{undoItem.stock}</span> সরানো হয়েছে</div>
          <button onClick={()=>{const u=[...port,{...undoItem}];delete u[u.length-1].deleteReason;setPort(u);persist(null,u,null);setUndoItem(null);showToast("✅ ফিরিয়ে আনা হয়েছে!");}} style={btn(C.yellow,true,true)}>↩️ Undo</button>
          <button onClick={()=>setUndoItem(null)} style={btn(C.muted,false,true)}>✕</button>
        </div>
      )}

      <div style={{background:"linear-gradient(135deg,#070D1A,#0F2040,#070D1A)",borderBottom:"1px solid "+C.border,padding:"14px 20px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#00C896,#0080FF)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📊</div>
            <div><div style={{fontWeight:800,fontSize:20,color:"#fff"}}>DSE Trading <span style={{fontSize:13,color:C.accent}}>v7</span></div><div style={{fontSize:11,color:C.muted}}>EMA · SMA · VMA · Firebase · Enterprise</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>{setDays(0);setCustomDays("");}} style={{...btn("#9C27B0",days===0,true),position:"relative"}}>0d<span style={{fontSize:9,position:"absolute",top:-4,right:-4,background:C.red,borderRadius:8,padding:"1px 4px",color:"#fff"}}>AI</span></button>
            {[3,5,7,10,14,21,30].map(d=><button key={d} onClick={()=>{setDays(d);setCustomDays("");}} style={btn(C.accent,days===d,true)}>{d}d</button>)}
            <div style={{display:"flex",gap:4}}>
              <input type="number" value={customDays} onChange={e=>setCustomDays(e.target.value)} placeholder="Custom" style={{...inp({width:65,padding:"4px 8px",fontSize:12}),border:"1px solid "+(customDays?C.yellow:C.border)}}/>
              {customDays&&<button onClick={()=>{const d=parseInt(customDays,10);if(d>0){setDays(d);setCustomDays("");}}} style={btn(C.yellow,true,true)}>✅</button>}
            </div>
            <button onClick={()=>setShowSettings(true)} style={{background:"none",border:"none",cursor:"pointer",padding:0,marginLeft:4}}>
              <img src={user.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(user.displayName||"U")+"&background=00C896&color=fff"} style={{width:38,height:38,borderRadius:19,border:"2px solid "+C.accent}} alt="settings"/>
            </button>
          </div>
        </div>
        <div style={{maxWidth:1140,margin:"4px auto 0",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:days===0?C.purple:C.yellow,fontWeight:600}}>{days===0?"🔮 Natural Mode":"📅 "+days+"d strategy · EMA20/SMA50/VMA20"}</span>
          {liveUpdatedAt&&<span style={{fontSize:11,color:C.accent}}>🟢 {liveUpdatedAt}</span>}
        </div>
      </div>

      <div style={{background:C.bg,borderBottom:"1px solid "+C.border,padding:"0 20px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",gap:4,overflowX:"auto"}}>
          {[["screener","📊 Screener"],["portfolio","💼 Portfolio"],["trades","📋 Trade Log"],["dashboard","🏆 Dashboard"],["risk","⚠️ Risk"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={TS(t)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1140,margin:"0 auto",padding:"16px 20px"}}>

        {tab==="screener"&&(
          <div>
            <div style={{...card(),padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:11,color:C.muted}}>মোট: {stocks.length} · {days===0?"Natural":days+"d"}</div>
                <div style={{position:"relative",minWidth:180}}>
                  <input value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="🔍 Stock খুঁজুন..." style={{...inp({width:"100%",boxSizing:"border-box",fontSize:12}),border:"1px solid "+(nameFilter?C.accent:C.border)}}/>
                  {nameFilter&&<button onClick={()=>setNameFilter("")} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,fontWeight:700}}>✕</button>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["সব",stocks.length,"#4A6080"],["STRONG BUY",sigC["STRONG BUY"],"#00C896"],["BUY",sigC["BUY"],"#4CAF50"],["WATCH",sigC["WATCH"],"#FFC107"],["WEAK",sigC["WEAK"],"#FF9800"],["AVOID",sigC["AVOID"],"#F44336"]].map(([lb,ct,cl])=>(
                  <button key={lb} onClick={()=>setSigF(lb)} style={{padding:"7px 14px",borderRadius:8,border:"2px solid "+(sigF===lb?cl:"transparent"),background:sigF===lb?cl+"28":cl+"0e",color:cl,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                    {lb} <span style={{background:cl+"30",borderRadius:20,padding:"1px 7px",fontSize:11}}>{ct}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{...card(),padding:12,marginBottom:12,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={inp()}><option value="score">Score</option><option value="vol">Volume</option><option value="eps">EPS</option></select>
              <button onClick={()=>{setShowPaste(true);}} style={btn(C.purple)}>📋 Code Paste</button>
              <button onClick={()=>setShowAddP(!showAddP)} style={btn(C.blue,showAddP)}>+ Stock যোগ</button>
            </div>

            {showAddP&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:14}}>Stock যোগ / আপডেট</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(125px,1fr))",gap:10,marginBottom:14}}>
                  {[["name","Name*"],["price","Price*"],["eps","EPS"],["pe","P/E"],["nav","NAV"],["div","Div%"],["rsi","RSI"],["macd","MACD"],["vol","Volume"],["vma20","VMA20"],["ema20","EMA20"],["sma50","SMA50"],["ret6m","6M Ret%"],["inst","Inst%"],["circuit","Circuit"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div>
                      <input type={k==="name"?"text":"number"} value={ns[k]} onChange={e=>setNs(p=>({...p,[k]:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Cat</div><select value={ns.cat} onChange={e=>setNs(p=>({...p,cat:e.target.value}))} style={inp({width:"100%"})}><option>A</option><option>B</option><option>Z</option></select></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{if(!ns.name||!ns.price)return;const nm=ns.name.toUpperCase();const fields={price:+ns.price,eps:+ns.eps||0,pe:+ns.pe||0,nav:+ns.nav||0,div:+ns.div||0,rsi:+ns.rsi||50,macd:+ns.macd||0,vol:+ns.vol||0,vma20:+ns.vma20||500000,ema20:+ns.ema20||0,sma50:+ns.sma50||0,ret6m:+ns.ret6m||0,inst:+ns.inst||0,circuit:+ns.circuit||0,cat:ns.cat,sector:ns.sector,updatedAt:TODAY};const exists=stocks.find(s=>s.name.toUpperCase()===nm);let u;if(exists){u=stocks.map(s=>s.name.toUpperCase()===nm?{...s,...fields}:s);showToast("✅ "+nm+" আপডেট!");}else{u=[...stocks,{id:Date.now(),name:nm,totalShares:5000000,...fields}];showToast("✅ "+nm+" যোগ!");}setStocks(u);persist(u,null,null);setShowAddP(false);}} style={btn(C.accent,true)}>✅ যোগ/আপডেট</button>
                  <button onClick={()=>setShowAddP(false)} style={btn(C.muted)}>বাতিল</button>
                </div>
              </div>
            )}

            {showPaste&&(
              <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div style={{...card(),border:"1px solid "+C.purple,padding:24,width:"100%",maxWidth:540}}>
                  <div style={{fontWeight:800,fontSize:16,color:"#CE93D8",marginBottom:10}}>📋 Code Paste</div>
                  <div style={{background:"#070D1A",borderRadius:8,padding:10,marginBottom:10,fontFamily:"monospace",fontSize:11,color:"#CE93D8",lineHeight:1.6}}>{"{"}"name":"SAPORTL","price":52.5,"rsi":53.51,"macd":-0.2,"eps":2.85,"pe":24.31,"nav":35.37,"div":18,"vol":5143123,"vma20":3381708,"ema20":52.4,"sma50":50.8,"bb_upper":58.6,"bb_lower":46.3,"support1":46.3,"resistance1":56.3,"circuit":56.3,"ret6m":23,"inst":10.23,"cat":"A","sector":"Services & Real Estate"{"}"}</div>
                  <textarea id="pasteArea" placeholder="এখানে JSON paste করুন..." style={{width:"100%",height:110,background:"#070D1A",border:"1px solid "+C.purple+"44",borderRadius:8,color:"#CE93D8",padding:12,fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button onClick={()=>{try{const code=document.getElementById("pasteArea").value;const d=JSON.parse(code.trim());applyPaste(d);setShowPaste(false);}catch{showToast("❌ JSON format ভুল","err");}}} style={btn(C.purple,true)}>✅ Apply</button>
                    <button onClick={()=>setShowPaste(false)} style={btn(C.muted)}>বাতিল</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map((s,idx)=>{
                const st=staleness(s.updatedAt);const isExp=expanded===s.id;
                return(
                  <div key={s.id} style={{...card(),border:"1px solid "+(isExp?s.rec.color:C.border),transition:"border 0.2s"}}>
                    <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",cursor:"pointer"}} onClick={()=>setExpanded(isExp?null:s.id)}>
                      <div style={{width:28,height:28,background:idx<3?"linear-gradient(135deg,#FFD700,#FFA500)":"#1A2D4A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:idx<3?"#000":C.muted,flexShrink:0}}>{idx+1}</div>
                      <div style={{flex:1,minWidth:100}}>
                        <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{s.name} <span style={{fontSize:10,color:s.cat==="A"?C.accent:C.orange}}>[{s.cat}]</span></div>
                        <div style={{fontSize:10,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                          <span style={{color:st.color}}>{st.label}</span>
                          {portMap[s.name]&&<span style={{color:C.purple}}>👤{portMap[s.name].toLocaleString()}</span>}
                          <span style={{color:s.str.maSignal.includes("🟢")?C.accent:C.yellow,fontSize:10}}>{s.str.maSignal}</span>
                          {s.str.isBreakoutVol&&<span style={{color:C.orange,fontWeight:700}}>🔥 VOL</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"center",minWidth:65}}>
                        <div style={{fontSize:18,fontWeight:800,color:"#4FC3F7"}}>৳{s.price}</div>
                        <div style={{fontSize:9,color:C.muted}}>৳{s.circuit||"—"}</div>
                      </div>
                      <div style={{display:"flex",gap:8,minWidth:80}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.rsi>70?"#F44336":s.rsi<35?"#00C896":"#FFC107"}}>{s.rsi.toFixed(0)}</div><div style={{fontSize:9,color:C.muted}}>RSI</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.macd>0?"#00C896":"#F44336"}}>{s.macd.toFixed(1)}</div><div style={{fontSize:9,color:C.muted}}>MACD</div></div>
                      </div>
                      <div style={{minWidth:110}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:C.muted}}>Score</span><span style={{fontSize:13,fontWeight:800,color:s.rec.color}}>{s.score}</span></div>
                        <div style={{height:5,background:"#1A2D4A",borderRadius:3}}><div style={{height:"100%",width:s.score+"%",background:s.rec.color,borderRadius:3}}/></div>
                      </div>
                      <div style={{background:s.rec.bg,border:"1px solid "+s.rec.color+"44",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,color:s.rec.color,minWidth:110,textAlign:"center"}}>{s.rec.label}</div>
                      <div style={{minWidth:100,textAlign:"center"}}>
                        <div style={{fontSize:12,fontWeight:700,color:s.str.buySignal.includes("🚀")||s.str.buySignal.includes("✅")?C.accent:C.yellow}}>{s.str.buySignal}</div>
                        <div style={{fontSize:9,color:C.muted}}>T1 ৳{s.str.t1} · T2 ৳{s.str.t2}</div>
                      </div>
                      <div style={{display:"flex",gap:5}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{setEditMode(editMode===s.id?null:s.id);setExpanded(s.id);}} style={btn(C.yellow,editMode===s.id,true)}>✏️</button>
                        <button onClick={()=>removeStock(s.id)} style={btn(C.red,false,true)}>✕</button>
                      </div>
                    </div>
                    {editMode===s.id&&(
                      <div style={{padding:"12px 16px",borderTop:"1px solid "+C.border,background:"#070D1A"}}>
                        <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>✏️ Update:</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                          {[["price","Price",78],["rsi","RSI",62],["macd","MACD",62],["ema20","EMA20",70],["sma50","SMA50",70],["vma20","VMA20",90],["vol","Volume",90],["circuit","Circuit",68]].map(([k,l,w])=>(
                            <div key={k} style={{display:"flex",flexDirection:"column",gap:2}}>
                              <span style={{fontSize:10,color:C.muted}}>{l}</span>
                              <input type="number" value={s[k]||0} onChange={e=>updateStock(s.id,k,+e.target.value)} style={{...inp({width:w,textAlign:"center",color:C.yellow,fontWeight:700,background:"#FFF9C412",border:"1px solid "+C.yellow+"44"})}}/>
                            </div>
                          ))}
                          <button onClick={()=>{updateStock(s.id,"updatedAt",TODAY);setEditMode(null);showToast("✅ "+s.name+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅ Save</button>
                        </div>
                      </div>
                    )}
                    {isExp&&editMode!==s.id&&(
                      <div style={{padding:"0 16px 16px",borderTop:"1px solid "+C.border,paddingTop:14}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10}}>
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:8}}>📥 Buy ({days===0?"Natural":days+"d"})</div>
                            <div style={{fontSize:13,fontWeight:700,color:s.str.buySignal.includes("🚀")||s.str.buySignal.includes("✅")?C.accent:C.yellow,marginBottom:4}}>{s.str.buySignal}</div>
                            <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{s.str.buyStr}</div>
                            {s.str.hasConflict&&<div style={{marginTop:6,background:"#FFC10718",borderRadius:4,padding:"4px 8px",fontSize:11,color:"#FFC107"}}>{s.str.conflictNote}</div>}
                          </div>
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.yellow,fontWeight:700,marginBottom:8}}>🎯 Sell ({days===0?"Natural":days+"d"})</div>
                            <div style={{fontSize:12,marginBottom:2}}>T1 ৳{s.str.t1}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT1}%</span></div>
                            <div style={{fontSize:12,marginBottom:2}}>T2 ৳{s.str.t2}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT2}%</span></div>
                            {s.str.t3&&<div style={{fontSize:12,marginBottom:2}}>T3 ৳{s.str.t3}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT3}%</span></div>}
                            <div style={{fontSize:12,color:C.red}}>SL: ৳{s.str.sl}</div>
                            <div style={{marginTop:6,fontSize:11,color:C.text,lineHeight:1.5}}>{s.str.sellStr}</div>
                          </div>
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:"#4FC3F7",fontWeight:700,marginBottom:8}}>💰 Fundamentals</div>
                            {[["EPS",s.eps],["P/E",s.pe>0?s.pe:"Neg"],["NAV",s.nav],["Div",s.div+"%"],["Inst",s.inst+"%"],["6M",s.ret6m+"%"]].map(([l,v])=>(
                              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{l}</span><span style={{color:C.text,fontWeight:600}}>{v}</span></div>
                            ))}
                            {s.bb_upper&&<div style={{marginTop:4,fontSize:11}}>BB: <span style={{color:C.red}}>৳{s.bb_upper}</span>/<span style={{color:C.accent}}>৳{s.bb_lower}</span></div>}
                          </div>
                        </div>
                        {s.analysisNote&&(
                          <div style={{marginTop:10,background:"linear-gradient(135deg,#0A1628,#0D1F35)",borderRadius:10,border:"1px solid #00C89633"}}>
                            <div style={{background:"linear-gradient(90deg,#00C89622,transparent)",padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                              <div style={{fontSize:18}}>🧠</div>
                              <div><div style={{fontWeight:800,color:C.accent,fontSize:13}}>Claude Analysis Note</div><div style={{fontSize:10,color:C.muted}}>{s.analysisNote.chartPeriod}</div></div>
                            </div>
                            <div style={{padding:"0 14px 14px"}}>
                              {[["📈 Trend",s.analysisNote.trend,"#4FC3F7"],["📊 BB",s.analysisNote.bb,"#CE93D8"],["⚡ RSI",s.analysisNote.rsiNote,"#FFC107"],["📉 MACD",s.analysisNote.macdNote,"#FF9800"],["📦 Volume",s.analysisNote.volumeNote,"#64B5F6"],["💰 Fundamentals",s.analysisNote.fundamental,"#FFD54F"],["🎯 Strategy",s.analysisNote.strategy,"#00C896"]].filter(([,v])=>v).map(([label,val,color])=>(
                                <div key={label} style={{borderTop:"1px solid #1A2D4A",paddingTop:8,marginTop:8}}>
                                  <div style={{fontSize:11,color:color,fontWeight:700,marginBottom:2}}>{label}</div>
                                  <div style={{fontSize:12,color:"#B0C4D8",lineHeight:1.6}}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="portfolio"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:14}}>
              {[["মোট Investment","৳"+summ.tc.toLocaleString("en",{maximumFractionDigits:0}),"#4FC3F7"],["Current Value","৳"+summ.tv.toLocaleString("en",{maximumFractionDigits:0}),C.accent],["Unrealized",(summ.tpl>=0?"+":"")+"৳"+summ.tpl.toFixed(0),summ.tpl>=0?C.accent:C.red],["Realized","৳"+summ.tr.toFixed(0),C.yellow]].map(([l,v,cl])=>(
                <div key={l} style={{...card(),padding:12,textAlign:"center"}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:17,fontWeight:800,color:cl}}>{v}</div></div>
              ))}
            </div>
            <div style={{...card(),padding:12,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontWeight:700,color:C.accent,fontSize:13}}>🏦 Broker-wise</div></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(summ.byB).map(([br,d])=>{
                  const brP=(profile.brokers||DEFAULT_BROKERS).find(b=>b.id===br||b.name===br);
                  return(
                    <div key={br} style={{background:"#070D1A",borderRadius:8,padding:"10px 14px",border:"1px solid "+C.border}}>
                      <div style={{fontWeight:700,color:"#4FC3F7",fontSize:12}}>{brP?brP.name:br}</div>
                      <div style={{fontSize:11,color:C.muted}}>{d.n} pos</div>
                      <div style={{fontSize:12,fontWeight:700,color:(d.val-d.cost)>=0?C.accent:C.red}}>{(d.val-d.cost)>=0?"+":""}৳{(d.val-d.cost).toFixed(0)}</div>
                      {brP&&<div style={{fontSize:10,color:C.muted}}>Comm: {brP.commission}%</div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:14}}>💼 Positions ({port.length})</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setShowPortPaste(!showPortPaste);setShowAddP(false);}} style={btn(C.purple,showPortPaste)}>📋 JSON</button>
                <button onClick={()=>{setShowAddP(!showAddP);setShowPortPaste(false);}} style={btn(C.blue,showAddP)}>+ Add</button>
              </div>
            </div>
            {showPortPaste&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.purple}}>
                <div style={{fontWeight:700,color:"#CE93D8",fontSize:15,marginBottom:6}}>📋 Portfolio JSON Import</div>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:12,color:C.muted}}>Broker:</span>
                  <select value={portPasteBroker} onChange={e=>setPortPasteBroker(e.target.value)} style={inp()}>
                    {(profile.brokers||DEFAULT_BROKERS).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <textarea value={portPasteCode} onChange={e=>{setPortPasteCode(e.target.value);setPortPasteErr("");}} placeholder='[{"stock":"EPGL","shares":7300,"buyRate":19.26,"buyDate":"2026-06-15"}]' style={{width:"100%",height:120,background:"#070D1A",border:"1px solid "+(portPasteErr?"#F44336":C.purple+"44"),borderRadius:8,color:"#CE93D8",padding:12,fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
                {portPasteErr&&<div style={{color:C.red,fontSize:12,marginTop:6}}>{portPasteErr}</div>}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={applyPortPaste} style={btn(C.purple,true)}>✅ Apply</button>
                  <button onClick={()=>{setShowPortPaste(false);setPortPasteCode("");}} style={btn(C.muted)}>বাতিল</button>
                </div>
              </div>
            )}
            {showAddP&&(
              <div style={{...card(),padding:16,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:12}}>+ নতুন Position</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:10}}>
                  {[["stock","Stock*"],["shares","Shares*"],["buyRate","Buy Rate*"],["target1","Target 1"],["target2","Target 2"],["stopLoss","Stop Loss"],["customSellTarget","Custom Target"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div><input type={k==="stock"?"text":"number"} value={np[k]} onChange={e=>setNp(p=>({...p,[k]:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Buy Date</div><input type="date" value={np.buyDate||TODAY} onChange={e=>setNp(p=>({...p,buyDate:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Broker</div><select value={np.broker} onChange={e=>setNp(p=>({...p,broker:e.target.value}))} style={inp({width:"100%"})}>{(profile.brokers||DEFAULT_BROKERS).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                </div>
                {np.stock&&np.buyRate&&<div style={{fontSize:12,color:C.muted,marginBottom:10}}>Investment: <span style={{color:C.yellow,fontWeight:700}}>৳{((+np.shares||0)*(+np.buyRate||0)).toLocaleString()}</span></div>}
                <div style={{display:"flex",gap:8}}><button onClick={addPosition} style={btn(C.accent,true)}>✅ যোগ</button><button onClick={()=>setShowAddP(false)} style={btn(C.muted)}>বাতিল</button></div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {enriched.map(p=>{
                const str=p.str;
                return(
                  <div key={p.id} style={{...card(),border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.border)}}>
                    <div style={{padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{p.stock} <span style={{fontSize:11,color:C.muted}}>{(profile.brokers||DEFAULT_BROKERS).find(b=>b.id===p.broker||b.name===p.broker)?.name||p.broker}</span></div>
                          <div style={{fontSize:11,color:C.muted,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                            <span>{p.shares.toLocaleString()} shares · Buy ৳{p.buyRate}</span>
                            {p.buyDate&&<span style={{color:"#CE93D8"}}>📅 {fmtDate(p.buyDate)} ({p.holdDays}d)</span>}
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700}}>🔒 TSL</span>}
                          </div>
                          {p.customSellTarget&&<div style={{fontSize:11,color:C.purple,marginTop:2}}>🎯 Custom: ৳{p.customSellTarget}</div>}
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:13,color:"#4FC3F7",fontWeight:700}}>৳{p.currentPrice}</div>
                          {p.liveChangePct!==null&&p.liveChangePct!==undefined&&<div style={{fontSize:10,color:p.liveChangePct>=0?C.accent:C.red,fontWeight:700}}>{p.liveChangePct>=0?"+":""}{p.liveChangePct.toFixed(2)}%</div>}
                          <div style={{fontWeight:800,fontSize:15,color:p.pl>=0?C.accent:C.red}}>{p.pl>=0?"+":""}৳{p.pl.toFixed(0)}</div>
                          <div style={{fontSize:11,color:p.pl>=0?C.accent:C.red}}>{p.plp.toFixed(1)}%</div>
                        </div>
                        <div style={{background:p.sig.includes("STOP")?C.red+"22":p.sig.includes("SELL")?C.accent+"22":C.muted+"22",border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted)+"44",borderRadius:8,padding:"5px 10px",fontWeight:700,fontSize:12,color:p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted}}>{p.sig}</div>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>setEditPort(editPort===p.id?null:p.id)} style={btn(C.yellow,editPort===p.id,true)}>✏️</button>
                          <SellModal pos={p} str={str} brokerComm={getBrokerComm(p.broker)} onSell={recordSell}/>
                          <button onClick={()=>{setUndoItem({...p,deleteReason:"removed"});const u=port.filter(x=>x.id!==p.id);setPort(u);persist(null,u,null);}} style={btn(C.red,false,true)}>✕</button>
                        </div>
                      </div>
                      {editPort===p.id?(
                        <div style={{background:"#070D1A",borderRadius:8,padding:10}}>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                            {[["currentPrice","Current Price",88],["target1","Target 1",78],["target2","Target 2",78],["stopLoss","Stop Loss",78],["customSellTarget","Custom Target",90]].map(([k,l,w])=>(
                              <div key={k} style={{display:"flex",flexDirection:"column",gap:2}}>
                                <span style={{fontSize:10,color:C.muted}}>{l}</span>
                                <input type="number" value={p[k]||""} onChange={e=>updatePort(p.id,k,e.target.value)} style={{...inp({width:w,textAlign:"center",color:C.yellow,fontWeight:700,background:"#FFF9C412",border:"1px solid "+C.yellow+"44"})}}/>
                              </div>
                            ))}
                            <button onClick={()=>{setEditPort(null);showToast("✅ "+p.stock+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅</button>
                          </div>
                        </div>
                      ):(
                        <div>
                          <div style={{display:"flex",gap:12,fontSize:12,marginBottom:4,flexWrap:"wrap"}}>
                            <span>T1: <span style={{color:C.accent,fontWeight:700}}>৳{str.t1||p.target1}</span></span>
                            <span>T2: <span style={{color:C.accent,fontWeight:700}}>৳{str.t2||p.target2}</span></span>
                            {str.t3&&<span>T3: <span style={{color:C.accent,fontWeight:700}}>৳{str.t3}</span></span>}
                            <span>SL: <span style={{color:C.red,fontWeight:700}}>৳{p.stopLoss}</span></span>
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700}}>🔒 TSL: ৳{p.tsl.toFixed(2)}</span>}
                          </div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{str.sellStr}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="trades"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {(()=>{const tr=trades.reduce((a,t)=>a+(t.profit||0),0);const tw=trades.reduce((a,t)=>a+(t.withdrawals||[]).reduce((x,w)=>x+(w.amount||0),0),0);return[["Total Realized","৳"+tr.toFixed(0),C.accent],["Broker Balance","৳"+Math.max(0,tr-tw).toFixed(0),C.blue],["Withdrawn","৳"+tw.toFixed(0),C.yellow]].map(([l,v,cl])=>(
                <div key={l} style={{...card(),padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div><div style={{fontSize:15,fontWeight:800,color:cl}}>{v}</div></div>
              ));})()}
            </div>
            {(()=>{const bSum={};trades.forEach(t=>{if(!bSum[t.broker])bSum[t.broker]={profit:0,withdrawn:0};bSum[t.broker].profit+=(t.profit||0);bSum[t.broker].withdrawn+=(t.withdrawals||[]).reduce((a,w)=>a+(w.amount||0),0);});return Object.keys(bSum).length>0?(
              <div style={{...card(),padding:12,marginBottom:12}}>
                <div style={{fontWeight:700,color:C.accent,marginBottom:8,fontSize:13}}>🏦 Broker Balance</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {Object.entries(bSum).map(([br,d])=>(
                    <div key={br} style={{background:"#070D1A",borderRadius:8,padding:"10px 14px",border:"1px solid "+C.border}}>
                      <div style={{fontWeight:700,color:"#4FC3F7",fontSize:12}}>{br}</div>
                      <div style={{fontSize:13,color:C.accent,fontWeight:700}}>+৳{d.profit.toFixed(0)}</div>
                      <div style={{fontSize:11,color:C.yellow}}>Out: ৳{d.withdrawn.toFixed(0)}</div>
                      <div style={{fontSize:12,fontWeight:700,color:d.profit-d.withdrawn>=0?C.accent:C.red}}>Bal: ৳{(d.profit-d.withdrawn).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ):null;})()}
            {trades.length===0?<div style={{...card(),padding:60,textAlign:"center",color:C.muted}}>Portfolio থেকে sell করলে এখানে দেখাবে।</div>:(
              <div>
                {[...trades].reverse().map(t=>(
                  <TradeItem key={t.id} t={t} profile={profile} onWithdraw={(tradeId,w)=>{const u=trades.map(x=>x.id===tradeId?{...x,withdrawals:[...(x.withdrawals||[]),w]}:x);setTrades(u);persist(null,null,u);}}/>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="dashboard"&&(
          <ProfitDashboard trades={trades} portfolio={port} stocks={stocks}/>
        )}

        {tab==="risk"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.red,marginBottom:10}}>🚨 Stop Loss Alert</div>
              {enriched.filter(p=>p.currentPrice<=p.effectiveSL*1.05).map(p=>(
                <div key={p.id} style={{background:C.red+"12",border:"1px solid "+C.red+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.red}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>৳{p.currentPrice} · SL: ৳{p.stopLoss} {p.isTSLActive&&"· TSL: ৳"+p.tsl.toFixed(2)}</div>
                </div>
              ))}
              {enriched.filter(p=>p.currentPrice<=p.effectiveSL*1.05).length===0&&<div style={{color:C.accent,fontSize:13}}>✅ সব নিরাপদ</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.orange,marginBottom:10}}>🔒 Trailing SL Active</div>
              {enriched.filter(p=>p.isTSLActive).map(p=>(
                <div key={p.id} style={{background:C.orange+"12",border:"1px solid "+C.orange+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.orange}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>TSL: ৳{p.tsl.toFixed(2)} · Current: ৳{p.currentPrice}</div>
                </div>
              ))}
              {enriched.filter(p=>p.isTSLActive).length===0&&<div style={{color:C.muted,fontSize:13}}>T1 touch হয়নি</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:10}}>🎯 Target Hit</div>
              {enriched.filter(p=>p.currentPrice>=(p.str.t1||p.target1)).map(p=>(
                <div key={p.id} style={{background:C.accent+"12",border:"1px solid "+C.accent+"30",borderRadius:8,padding:10,marginBottom:8}}>
                  <div style={{fontWeight:700,color:C.accent}}>{p.stock} — {p.broker}</div>
                  <div style={{fontSize:12,color:C.muted}}>৳{p.currentPrice} ≥ T1 ৳{p.str.t1||p.target1}</div>
                </div>
              ))}
              {enriched.filter(p=>p.currentPrice>=(p.str.t1||p.target1)).length===0&&<div style={{color:C.muted,fontSize:13}}>Target hit হয়নি</div>}
            </div>
            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.yellow,marginBottom:10}}>📊 Overview</div>
              <div style={{fontSize:13,marginBottom:4}}>P&L: <span style={{color:summ.tpl>=0?C.accent:C.red,fontWeight:700}}>{summ.tpl>=0?"+":""}৳{summ.tpl.toFixed(0)}</span></div>
              <div style={{fontSize:13,marginBottom:4}}>Return: <span style={{color:summ.tpl>=0?C.accent:C.red,fontWeight:700}}>{summ.tc>0?((summ.tpl/summ.tc)*100).toFixed(1):0}%</span></div>
              <div style={{fontSize:13,marginBottom:4}}>Loss এ: <span style={{color:C.red,fontWeight:700}}>{enriched.filter(p=>p.pl<0).length} pos</span></div>
              <div style={{fontSize:13}}>TSL Active: <span style={{color:C.orange,fontWeight:700}}>{enriched.filter(p=>p.isTSLActive).length} pos</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
