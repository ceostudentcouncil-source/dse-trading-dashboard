import { useState } from "react";
import { C } from "../constants.js";
import { inp } from "../utils/styleHelpers.js";
import { daysSince, staleness } from "../utils/dateHelpers.js";
import { calcScore, getRec } from "../utils/strategyEngine.js";

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

export default StockSearch;
