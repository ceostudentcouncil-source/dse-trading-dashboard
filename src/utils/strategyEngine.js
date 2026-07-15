// ══════════════════════════════════════════════════════════════
// STRATEGY ENGINE — Enterprise v3
// Rules:
//   1. T1 < T2 < T3 — always guaranteed
//   2. 0d = Pure Natural TA (no dayMult)
//   3. Conflicting indicators resolved with clear explanation
//   4. Minimum gaps enforced: T1 min +2.5%, T2 min +6%
// ══════════════════════════════════════════════════════════════

export function calcTrailingSL(p){
  const t1=p.target1||p.str&&p.str.t1;
  const t2=p.target2||p.str&&p.str.t2;
  const base=p.trailingSL||p.stopLoss;
  if(p.currentPrice>=t2) return Math.max(base, t1||p.buyRate);
  if(p.currentPrice>=t1) return Math.max(base, p.buyRate);
  return base;
}

// ── Dynamic Strategy ─────────────────────────────────────────────────
export function generateStrategy(s,days,portShares){
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

export function calcScore(s,days){
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

export function getRec(score){
  if(score>=75)return{label:"🚀 STRONG BUY",color:"#00C896",bg:"#00C89618"};
  if(score>=60)return{label:"✅ BUY",color:"#4CAF50",bg:"#4CAF5018"};
  if(score>=45)return{label:"🟡 WATCH",color:"#FFC107",bg:"#FFC10718"};
  if(score>=30)return{label:"⚠️ WEAK",color:"#FF9800",bg:"#FF980018"};
  return{label:"🔴 AVOID",color:"#F44336",bg:"#F4433618"};
}
