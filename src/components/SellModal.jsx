import { useState } from "react";

function SellModal({pos,onSell,brokerComm}){
  const [open,setOpen]=useState(false);
  const [sp,setSp]=useState(pos.currentPrice);
  const [ss,setSs]=useState(Math.floor(pos.shares*0.4));
  const [tab,setTab]=useState("custom"); // custom | t1 | t2
  const commRate=(brokerComm!==undefined?brokerComm:0.3)/100;

  const handleOpen=()=>{
    setSp(pos.currentPrice);
    setSs(Math.floor(pos.shares*0.4));
    setTab("custom");
    setOpen(true);
  };

  if(!open) return(
    <button onClick={handleOpen}
      style={{background:"#00C89622",color:"#00C896",border:"1px solid #00C89644",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
      💰 Sell
    </button>
  );

  const profit=(sp-pos.buyRate)*ss;
  const comm=(ss*pos.buyRate+ss*sp)*commRate;
  const netPL=profit-comm;
  const str=pos.str||{};
  const t1=str.t1||pos.target1;
  const t2=str.t2||pos.target2;
  const sellT1Pct=str.sellT1||40;
  const sellT2Pct=str.sellT2||40;

  const setPreset=(price,pct)=>{
    setSp(price);
    setSs(Math.round(pos.shares*pct/100));
    setTab("custom");
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0F1923",border:"1px solid #00C896",borderRadius:16,padding:20,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#fff"}}>💰 {pos.stock} Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>{pos.broker} · {pos.shares.toLocaleString()} shares · Buy ৳{pos.buyRate}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:700,color:pos.pl>=0?"#00C896":"#F44336"}}>{pos.pl>=0?"+":""}৳{pos.pl.toFixed(0)}</div>
            <div style={{fontSize:11,color:"#4A6080"}}>Current ৳{pos.currentPrice}</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <button onClick={()=>setPreset(t1,sellT1Pct)}
            style={{padding:"8px",background:"#00C89622",border:"1px solid #00C89644",borderRadius:8,color:"#00C896",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🎯 T1 এ Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{t1} · {sellT1Pct}% ({Math.round(pos.shares*sellT1Pct/100)} shares)</div>
          </button>
          <button onClick={()=>setPreset(t2,sellT2Pct)}
            style={{padding:"8px",background:"#FFC10722",border:"1px solid #FFC10744",borderRadius:8,color:"#FFC107",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🚀 T2 এ Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{t2} · {sellT2Pct}% ({Math.round(pos.shares*sellT2Pct/100)} shares)</div>
          </button>
          <button onClick={()=>setPreset(pos.currentPrice,100)}
            style={{padding:"8px",background:"#F4433622",border:"1px solid #F4433644",borderRadius:8,color:"#F44336",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>🔴 সব Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{pos.currentPrice} · সব {pos.shares.toLocaleString()} shares</div>
          </button>
          <button onClick={()=>setPreset(pos.currentPrice,50)}
            style={{padding:"8px",background:"#FF980022",border:"1px solid #FF980044",borderRadius:8,color:"#FF9800",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            <div>⚡ ৫০% Sell</div>
            <div style={{fontSize:11,color:"#4A6080"}}>৳{pos.currentPrice} · {Math.round(pos.shares*0.5)} shares</div>
          </button>
        </div>

        <div style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{fontSize:11,color:"#4A6080",marginBottom:8,fontWeight:700}}>✏️ Custom পরিমাণ:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Sell Price (৳)",sp,setSp],["Shares",ss,setSs]].map(([l,v,set])=>(
              <div key={l}>
                <div style={{fontSize:11,color:"#4A6080",marginBottom:3}}>{l}</div>
                <input type="number" value={v} onChange={e=>set(+e.target.value)}
                  style={{width:"100%",background:"#1A2D4A",border:"none",borderRadius:8,color:"#E8EAF0",padding:"8px 10px",fontSize:14,boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"#070D1A",borderRadius:8,padding:12,marginBottom:12}}>
          {[
            ["Gross P&L","৳"+profit.toFixed(0),profit>=0?"#00C896":"#F44336"],
            ["Commission","-৳"+comm.toFixed(0),"#FF9800"],
            ["Net P&L","৳"+netPL.toFixed(0),netPL>=0?"#00C896":"#F44336"],
            ["Remaining",ss>=pos.shares?"শেষ ✅":(pos.shares-ss).toLocaleString()+" shares","#4A6080"],
          ].map(([l,v,cl])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
              <span style={{color:"#4A6080"}}>{l}</span>
              <span style={{fontWeight:700,color:cl}}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{onSell(pos,sp,ss,comm);setOpen(false);}}
            style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#00C896,#0080FF)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>
            ✅ Confirm Sell
          </button>
          <button onClick={()=>setOpen(false)}
            style={{padding:"11px 16px",background:"#1A2D4A",border:"none",borderRadius:8,color:"#4A6080",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}

export default SellModal;
