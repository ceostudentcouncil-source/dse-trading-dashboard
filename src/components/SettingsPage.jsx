import { useState } from "react";
import { C, DEFAULT_PROFILE, DEFAULT_BROKERS } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";

function SettingsPage({profile,user,onSave,onClose,onSignOut}){
  const [tab,setTab]=useState("profile");
  const [lp,setLp]=useState({...DEFAULT_PROFILE,...profile});
  const [saving,setSaving]=useState(false);
  const upd=(k,v)=>setLp(p=>({...p,[k]:v}));
  const updBroker=(id,k,v)=>setLp(p=>({...p,brokers:(p.brokers||DEFAULT_BROKERS).map(b=>b.id===id?{...b,[k]:v}:b)}));
  const updBank=(id,k,v)=>setLp(p=>({...p,bankAccounts:(p.bankAccounts||[]).map(b=>b.id===id?{...b,[k]:v}:b)}));
  const save=async()=>{setSaving(true);await onSave(lp);setSaving(false);};
  const TS=(t)=>({padding:"8px 14px",border:"none",cursor:"pointer",background:tab===t?C.accent:"transparent",color:tab===t?"#fff":C.muted,fontWeight:700,fontSize:12,fontFamily:"inherit",borderRadius:8});
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"0 0 80px"}}>
      <div style={{background:"linear-gradient(135deg,#070D1A,#0F2040)",padding:"20px 20px 0",borderBottom:"1px solid "+C.border}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
            <img src={user.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(user.displayName||"U")+"&background=00C896&color=fff"} style={{width:64,height:64,borderRadius:32,border:"3px solid "+C.accent}} alt="profile"/>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>{lp.displayName||user.displayName}</div>
              <div style={{fontSize:12,color:C.muted}}>{user.email}</div>
              <div style={{fontSize:11,color:lp.isActive?C.accent:C.red,marginTop:2}}>{lp.isActive?"✅ Active":"🔴 Blocked"} · যোগদান: {lp.joinDate}</div>
            </div>
            <button onClick={onClose} style={btn(C.muted,false,true)}>✕</button>
          </div>
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
            {[["profile","👤 Profile"],["brokers","🏦 Brokers"],["banks","🏧 Banks"],["payment","💳 Payment"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={TS(t)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:680,margin:"20px auto",padding:"0 20px"}}>
        {tab==="profile"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:14}}>👤 Profile</div>
            {[["displayName","নাম"],["phone","ফোন নম্বর"],["whatsapp","WhatsApp নম্বর"],["bkash","বিকাশ নম্বর"]].map(([k,l])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div>
                <input value={lp[k]||""} onChange={e=>upd(k,e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
              </div>
            ))}
            <div style={{marginTop:20,padding:14,background:"#070D1A",borderRadius:10,border:"1px solid "+C.red+"44"}}>
              <button onClick={onSignOut} style={{...btn(C.red,true),width:"100%",padding:12}}>🚪 Sign Out</button>
            </div>
          </div>
        )}
        {tab==="brokers"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:14}}>🏦 Broker Commission</div>
            {(lp.brokers||DEFAULT_BROKERS).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+C.border}}>
                <div style={{fontWeight:700,color:"#4FC3F7",marginBottom:8}}>{b.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Commission %</div>
                    <input type="number" value={b.commission} step="0.01" min="0" max="2" onChange={e=>updBroker(b.id,"commission",+e.target.value)} style={{...inp({width:90,textAlign:"center"})}}/></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Withdraw Fee ৳</div>
                    <input type="number" value={b.withdrawFee||0} min="0" onChange={e=>updBroker(b.id,"withdrawFee",+e.target.value)} style={{...inp({width:90,textAlign:"center"})}}/></div>
                </div>
                <div style={{marginTop:6,fontSize:11,color:C.yellow}}>৳১০,০০০ trade ≈ ৳{(10000*b.commission/100).toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}
        {tab==="banks"&&(
          <div style={{...card(),padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontWeight:700,color:C.accent}}>🏧 Bank Accounts</div>
              <button onClick={()=>setLp(p=>({...p,bankAccounts:[...(p.bankAccounts||[]),{id:Date.now()+"",name:"",accountNo:"",branch:""}]}))} style={btn(C.blue,true,true)}>+ Add</button>
            </div>
            {(lp.bankAccounts||[]).map(b=>(
              <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+C.border}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                  {[["name","Bank Name"],["accountNo","Account No"],["branch","Branch"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{l}</div>
                      <input value={b[k]||""} onChange={e=>updBank(b.id,k,e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box",fontSize:12})}}/></div>
                  ))}
                </div>
                <button onClick={()=>setLp(p=>({...p,bankAccounts:(p.bankAccounts||[]).filter(x=>x.id!==b.id)}))} style={btn(C.red,false,true)}>🗑️</button>
              </div>
            ))}
          </div>
        )}
        {tab==="payment"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:14}}>💳 Payment Info</div>
            <div style={{background:"#070D1A",borderRadius:10,padding:16,marginBottom:14}}>
              {[["মাসিক ফি","৳"+(lp.monthlyFee||1000),C.yellow],["Status",lp.isActive?"✅ Active":"🔴 Blocked",lp.isActive?C.accent:C.red],["শেষ Payment",lp.lastPaymentDate||"N/A",C.text],["পরিমাণ","৳"+(lp.lastPaymentAmount||0),C.accent]].map(([l,v,cl])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8}}><span style={{color:C.muted}}>{l}</span><span style={{color:cl,fontWeight:700}}>{v}</span></div>
              ))}
            </div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
              💡 Payment করতে admin এর বিকাশ নম্বরে send করুন।<br/>
              Payment confirm হলে admin আপনার account activate করবেন।
            </div>
          </div>
        )}
        <div style={{marginTop:14}}>
          <button onClick={save} disabled={saving} style={{...btn(C.accent,true),width:"100%",padding:14}}>{saving?"💾 Saving...":"✅ Save Settings"}</button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
