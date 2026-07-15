import { useState } from "react";
import { C } from "../constants.js";
import { inp, btn } from "../utils/styleHelpers.js";

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

export default DeleteConfirm;
