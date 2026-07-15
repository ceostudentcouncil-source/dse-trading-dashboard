import { useState } from "react";
import { INDICATOR_EXPLAIN } from "../constants.js";

function IndicatorCards({signals}){
  const [expanded,setExpanded]=useState({});
  const toggle=(i)=>setExpanded(p=>({...p,[i]:!p[i]}));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {signals.map((sig,i)=>{
        const exp=INDICATOR_EXPLAIN[sig.name]||{what:"",dse:"",use:""};
        const isOpen=expanded[i];
        return(
          <div key={i} style={{background:"#070D1A",borderRadius:10,border:"1px solid "+sig.color+"44",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",cursor:"pointer"}} onClick={()=>toggle(i)}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:800,color:"#E8EAF0",fontSize:13}}>{sig.name}</span>
                  <span style={{fontSize:11,fontWeight:700,color:sig.color,background:sig.color+"22",borderRadius:5,padding:"2px 8px"}}>{sig.signal}</span>
                </div>
                <div style={{fontSize:11,color:"#7A8FA0",lineHeight:1.5}}>{sig.detail}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:12,background:isOpen?sig.color+"44":"#1A2D4A",display:"flex",alignItems:"center",justifyContent:"center",color:isOpen?sig.color:"#4A6080",fontWeight:800,fontSize:14,flexShrink:0,transition:"all 0.2s"}}>
                {isOpen?"−":"+"}
              </div>
            </div>
            {isOpen&&(
              <div style={{padding:"0 12px 12px",borderTop:"1px solid "+sig.color+"22"}}>
                {exp.what&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:sig.color,fontWeight:700,marginBottom:2}}>📖 কী এটা?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.what}</div>
                </div>}
                {exp.dse&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"#FFC107",fontWeight:700,marginBottom:2}}>🇧🇩 DSE তে কীভাবে কাজ করে?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.dse}</div>
                </div>}
                {exp.use&&<div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:"#00C896",fontWeight:700,marginBottom:2}}>💡 কীভাবে ব্যবহার করবেন?</div>
                  <div style={{fontSize:11,color:"#B0C0D0",lineHeight:1.6}}>{exp.use}</div>
                </div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default IndicatorCards;
