import { C } from "../constants.js";
import { card } from "../utils/styleHelpers.js";
import TradeLogItem from "../components/TradeLogItem.jsx";

export default function TradesTab({ trades, profile, setTrades, persist, summ }) {
  return (
    <div>
      <div style={{...card(),padding:14,marginBottom:14,display:"flex",gap:20,flexWrap:"wrap"}}>
        {[["Trades",trades.length,"#4FC3F7"],["Realized","৳"+summ.tr.toFixed(0),summ.tr>=0?C.accent:C.red],["✅",trades.filter(t=>t.profit>0).length,C.accent],["🔴",trades.filter(t=>t.profit<0).length,C.red]].map(([l,v,cl])=>(
          <div key={l} style={{textAlign:"center"}}><div style={{fontSize:11,color:C.muted}}>{l}</div><div style={{fontSize:22,fontWeight:800,color:cl}}>{v}</div></div>
        ))}
      </div>
      {(()=>{
        const bSum={};
        trades.forEach(t=>{if(!bSum[t.broker])bSum[t.broker]={profit:0,withdrawn:0};bSum[t.broker].profit+=(t.profit||0);bSum[t.broker].withdrawn+=(t.withdrawals||[]).reduce((a,w)=>a+(w.amount||0),0);});
        return Object.keys(bSum).length>0?(
          <div style={{...card(),padding:14,marginBottom:14}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:8,fontSize:13}}>🏦 Broker Balance (Realized থেকে কত broker এ আছে)</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {Object.entries(bSum).map(([br,d])=>(
                <div key={br} style={{background:"#070D1A",borderRadius:8,padding:"10px 14px",border:"1px solid "+C.border}}>
                  <div style={{fontWeight:700,color:"#4FC3F7",fontSize:12}}>{br}</div>
                  <div style={{fontSize:13,color:C.accent,fontWeight:700}}>+৳{d.profit.toFixed(0)}</div>
                  <div style={{fontSize:11,color:C.yellow}}>Withdrawn: ৳{d.withdrawn.toFixed(0)}</div>
                  <div style={{fontSize:12,fontWeight:700,color:d.profit-d.withdrawn>=0?C.accent:C.red}}>Balance: ৳{(d.profit-d.withdrawn).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        ):null;
      })()}
      {trades.length===0?<div style={{...card(),padding:60,textAlign:"center"}}><div style={{fontSize:40}}>📋</div><div style={{color:C.muted,marginTop:12}}>Portfolio থেকে sell করলে এখানে দেখাবে।</div></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[...trades].reverse().map(t=>(
            <TradeLogItem key={t.id} t={t} profile={profile}
              onWithdraw={(tradeId,w)=>{const u=trades.map(x=>x.id===tradeId?Object.assign({},x,{withdrawals:[...(x.withdrawals||[]),w]}):x);setTrades(u);persist(null,null,u);}}/>
          ))}
        </div>
      )}
    </div>
  );
}
