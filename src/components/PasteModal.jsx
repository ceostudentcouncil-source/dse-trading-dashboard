import { useState } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";

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

export default PasteModal;
