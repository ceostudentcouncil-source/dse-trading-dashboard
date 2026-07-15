import { useState, useMemo } from "react";
import { C } from "../constants.js";
import { card, btn } from "../utils/styleHelpers.js";
import { calcScore, generateStrategy } from "../utils/strategyEngine.js";

function ProfitDashboard({trades,portfolio,stocks}){
  const [period,setPeriod]=useState("week");
  const filtered=useMemo(()=>{const cutoff=new Date();if(period==="day")cutoff.setDate(cutoff.getDate()-1);else if(period==="week")cutoff.setDate(cutoff.getDate()-7);else if(period==="fortnight")cutoff.setDate(cutoff.getDate()-14);else if(period==="month")cutoff.setMonth(cutoff.getMonth()-1);else cutoff.setFullYear(2000);return trades.filter(t=>new Date(t.date)>=cutoff);},[trades,period]);
  const totalRealized=trades.reduce((a,t)=>a+(t.profit||0),0);
  const totalWithdrawn=trades.reduce((a,t)=>a+(t.withdrawals||[]).reduce((x,w)=>x+(w.amount||0),0),0);
  const periodProfit=filtered.reduce((a,t)=>a+(t.profit||0),0);
  const daily=useMemo(()=>{const map={};trades.forEach(t=>{const d=t.date?t.date.split("T")[0]:null;if(d)map[d]=(map[d]||0)+(t.profit||0);});const days=[];for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];days.push({date:k.slice(5),profit:map[k]||0});}return days;},[trades]);
  const maxP=Math.max(...daily.map(d=>Math.abs(d.profit)),1);
  const portMap={};portfolio.forEach(p=>{portMap[p.stock]=(portMap[p.stock]||0)+p.shares;});
  const top3=[...stocks].map(s=>({...s,score:calcScore(s,7),str:generateStrategy(s,7,portMap[s.name]||0)})).filter(s=>s.score>=60&&s.str&&s.str.priority<=2).sort((a,b)=>b.score-a.score).slice(0,3);
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:14}}>
        {[["Total Realized","৳"+totalRealized.toFixed(0),C.accent],["Broker Balance","৳"+Math.max(0,totalRealized-totalWithdrawn).toFixed(0),C.blue],["Withdrawn","৳"+totalWithdrawn.toFixed(0),C.yellow],["Period P&L","৳"+periodProfit.toFixed(0),periodProfit>=0?C.accent:C.red]].map(([l,v,cl])=>(
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
          {daily.map((d,i)=>{const h=Math.max(2,Math.abs(d.profit)/maxP*70);return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:"80%",height:h,background:d.profit>=0?"#00C896":"#F44336",borderRadius:"2px 2px 0 0"}}/>
              {i%5===0&&<div style={{fontSize:7,color:C.muted,transform:"rotate(-45deg)",whiteSpace:"nowrap",marginTop:2}}>{d.date}</div>}
            </div>
          );})}
        </div>
      </div>
      <div style={{...card(),padding:14,marginBottom:14}}>
        <div style={{fontWeight:700,color:C.accent,marginBottom:10}}>💰 {period==="all"?"সব":period==="day"?"আজ":period==="week"?"সাপ্তাহিক":period==="fortnight"?"পাক্ষিক":"মাসিক"}: <span style={{color:periodProfit>=0?C.accent:C.red}}>৳{periodProfit.toFixed(0)}</span></div>
        {filtered.length===0?<div style={{color:C.muted,fontSize:12}}>এই period এ trade নেই।</div>:filtered.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border}}>
            <div><div style={{fontWeight:700,color:"#fff",fontSize:13}}>{t.stock} <span style={{color:C.muted,fontSize:11}}>{t.broker}</span></div><div style={{fontSize:10,color:C.muted}}>{t.date}</div></div>
            <div style={{fontWeight:800,color:t.profit>=0?C.accent:C.red}}>{t.profit>=0?"+":""}৳{t.profit.toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div style={{...card(),padding:14}}>
        <div style={{fontWeight:700,color:"#FFD700",marginBottom:10}}>🏆 Top 3 Buy — এখন</div>
        {top3.length===0?<div style={{color:C.muted,fontSize:12}}>Strong signal নেই।</div>:top3.map((s,i)=>(
          <div key={s.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(i===0?"#FFD700":i===1?"#C0C0C0":"#CD7F32")+"44"}}>
            <div style={{display:"flex",gap:10,marginBottom:4}}>
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

export default ProfitDashboard;
