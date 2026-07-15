import { useState } from "react";
import { C } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";

function TradeLogItem({t,profile,onWithdraw}){
  const [showW,setShowW]=useState(false);
  const [wAmt,setWAmt]=useState("");
  const [wBank,setWBank]=useState("");
  const [wDate,setWDate]=useState(new Date().toISOString().split("T")[0]);
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
          <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>💸 Withdraw করুন</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Amount ৳</div><input type="number" value={wAmt} onChange={e=>setWAmt(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
            <div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Date</div><input type="date" value={wDate} onChange={e=>setWDate(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:C.muted,marginBottom:2}}>Bank Account</div>
              <select value={wBank} onChange={e=>setWBank(e.target.value)} style={inp({width:"100%"})}>
                <option value="">Select...</option>
                {(profile&&profile.bankAccounts||[]).map(b=><option key={b.id} value={b.name}>{b.name} {b.accountNo?"("+b.accountNo+")":""}</option>)}
              </select></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addW} style={btn(C.yellow,true,true)}>✅ Confirm</button>
            <button onClick={()=>setShowW(false)} style={btn(C.muted,false,true)}>বাতিল</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setShowW(true)} style={btn(C.yellow,false,true)}>💸 Withdraw করুন</button>
      )}
    </div>
  );
}

export default TradeLogItem;
