import { C, COMM } from "../constants.js";
import { card } from "../utils/styleHelpers.js";
import { staleness } from "../utils/dateHelpers.js";

export default function RiskTab({ enriched, summ, stocks }) {
  return (
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
  );
}
