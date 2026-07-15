import { useState, useMemo } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";
import { staleness } from "../utils/dateHelpers.js";
import { generateStrategy, calcScore } from "../utils/strategyEngine.js";

function BuyRankingPanel({stocks,port,days,onClose}){
  const [aiRanks,setAiRanks]=useState(null);const [loading,setLoading]=useState(false);
  const portMap={};port.forEach(p=>{portMap[p.stock]=(portMap[p.stock]||0)+p.shares;});
  const ranked=useMemo(()=>stocks.map(s=>{
    const str=generateStrategy(s,days,portMap[s.name]||0);
    const score=calcScore(s,days);
    return{...s,str,score};
  }).filter(s=>s.str.priority<=3).sort((a,b)=>a.str.priority-b.str.priority||b.score-a.score),[stocks,days]);

  const getAI=async()=>{
    setLoading(true);
    try{
      const summary=stocks.map(s=>({name:s.name,price:s.price,rsi:s.rsi,macd:s.macd,eps:s.eps,pe:s.pe,nav:s.nav,vol:s.vol,vma20:s.vma20,ema20:s.ema20,sma50:s.sma50,ret6m:s.ret6m,inst:s.inst,circuit:s.circuit,cat:s.cat,sector:s.sector,holding:portMap[s.name]||0}));
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:"তুমি DSE expert। EMA20, SMA50, VMA20 সহ সব indicator বিবেচনা করে আগামী "+days+" দিনের জন্য TOP 5 stock বেছে দাও। শুধু JSON array দাও।\n\nStocks: "+JSON.stringify(summary)+"\n\nFormat: [{\"rank\":1,\"name\":\"STOCK\",\"reason\":\"বাংলায় ২ লাইন\",\"buyZone\":\"৳XX-৳YY\",\"target\":\"৳ZZ\",\"urgency\":\"এখনই|আজই|এই সপ্তাহে\"}]"}]})});
      const data=await resp.json();const text=(data.content&&data.content[0]&&data.content[0].text)||"[]";
      setAiRanks(JSON.parse(text.replace(/```json|```/g,"").trim()));
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const rc=["#FFD700","#C0C0C0","#CD7F32","#00C896","#4FC3F7"];
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:C.card,border:"1px solid "+C.accent,borderRadius:16,padding:24,width:"100%",maxWidth:680,marginTop:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontWeight:800,fontSize:18,color:"#fff"}}>🎯 Buy Signal — {days} দিনের Ranking</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>EMA20 + SMA50 + VMA20 + সব indicator</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={getAI} disabled={loading} style={btn(C.purple)}>{loading?"⏳ AI...":"🤖 AI Rank"}</button><button onClick={onClose} style={btn(C.red,false,true)}>✕</button></div>
        </div>
        {aiRanks&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:700,color:C.purple,marginBottom:10,fontSize:14}}>🤖 AI Top 5:</div>
            {aiRanks.map((r,i)=>(
              <div key={i} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+(rc[i]||C.border)+"44",display:"flex",gap:12}}>
                <div style={{width:30,height:30,background:rc[i]||C.muted,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#000",flexShrink:0}}>#{r.rank}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff",fontSize:14}}>{r.name}</div><div style={{fontSize:12,color:C.text,marginTop:3,lineHeight:1.6}}>{r.reason}</div>
                  <div style={{display:"flex",gap:10,marginTop:5,fontSize:12,flexWrap:"wrap"}}><span style={{color:C.accent}}>Zone: {r.buyZone}</span><span style={{color:C.yellow}}>→ {r.target}</span><span style={{background:C.blue+"22",color:C.blue,borderRadius:6,padding:"1px 8px",fontWeight:700}}>{r.urgency}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{fontWeight:700,color:C.accent,marginBottom:10,fontSize:14}}>📊 Auto Ranking ({days} দিন):</div>
        {ranked.length===0?<div style={{color:C.muted,textAlign:"center",padding:20}}>এখন strong buy signal নেই</div>:ranked.map((s,i)=>{
          const st=staleness(s.updatedAt);
          return(
            <div key={s.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+(i<3?C.accent:C.border)+"44"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:28,height:28,background:i<3?"linear-gradient(135deg,#FFD700,#FFA500)":"#1A2D4A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:i<3?"#000":C.muted,flexShrink:0}}>#{i+1}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,color:"#fff",fontSize:14}}>{s.name} <span style={{fontSize:11,color:C.muted}}>৳{s.price}</span></div>
                  <div style={{fontSize:10,display:"flex",gap:8}}><span style={{color:st.color}}>{st.label}</span><span style={{color:s.str.maSignal.includes("🟢")?C.accent:C.yellow}}>{s.str.maSignal}</span></div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:12,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow}}>{s.str.buySignal}</div><div style={{fontSize:11,color:s.str.risk.includes("LOW")?C.accent:s.str.risk.includes("HIGH")?C.red:C.yellow}}>{s.str.risk}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
                <div style={{background:C.accent+"0a",borderRadius:6,padding:8}}><div style={{color:C.accent,fontWeight:700,marginBottom:3}}>📥 Buy</div><div style={{color:C.text}}>{s.str.buyZone}</div><div style={{color:C.muted,marginTop:3,lineHeight:1.5}}>{s.str.buyStr}</div></div>
                <div style={{background:C.yellow+"0a",borderRadius:6,padding:8}}><div style={{color:C.yellow,fontWeight:700,marginBottom:3}}>🎯 Targets</div>
                  <div>T1: ৳{s.str.t1} <span style={{color:C.muted}}>({s.str.sellT1}%)</span></div>
                  <div>T2: ৳{s.str.t2} <span style={{color:C.muted}}>({s.str.sellT2}%)</span></div>
                  {s.str.t3&&<div>T3: ৳{s.str.t3} <span style={{color:C.muted}}>({s.str.sellT3}%)</span></div>}
                  <div style={{color:C.red,marginTop:3}}>SL: ৳{s.str.sl}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BuyRankingPanel;
