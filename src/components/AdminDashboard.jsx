import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { fsGet, fsSet, fsGetAll } from "../firebase.js";
import { listAdmins, addAdmin, revokeAdmin, SUPER_ADMIN_EMAIL } from "../services/adminService.js";
import { sendBroadcast, deleteBroadcast, listenToBroadcasts, getResponseSummary } from "../services/broadcastService.js";
import { setChatEnabled, getChatSettings, setChatMode, listenToChatSettings } from "../services/chatService.js";
import { listAllConversations, getConversationId } from "../services/conversationService.js";
import { getActivityFeed, getActivitySummaryByUser } from "../services/activityService.js";
import ConversationThread from "./ConversationThread.jsx";

function AdminDashboard({adminUser,stocks,onClose}){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const [selectedData,setSelectedData]=useState(null);
  const [tab,setTab]=useState("users");
  const [saving,setSaving]=useState(false);
  const [admins,setAdmins]=useState([]);
  const [adminsLoading,setAdminsLoading]=useState(true);
  const [newAdminEmail,setNewAdminEmail]=useState("");
  const [newAdminRole,setNewAdminRole]=useState("limited");
  const [broadcasts,setBroadcasts]=useState([]);
  const [responseSummaries,setResponseSummaries]=useState({}); // { [broadcastId]: {total,seen,followed} }
  const [bcStock,setBcStock]=useState("");
  const [bcAction,setBcAction]=useState("buy");
  const [bcMessage,setBcMessage]=useState("");
  const [bcTargetPrice,setBcTargetPrice]=useState("");
  const [bcPercentage,setBcPercentage]=useState("");
  const [bcSending,setBcSending]=useState(false);
  const [chatMode,setChatModeState]=useState("open");
  const [chatModeSaving,setChatModeSaving]=useState(false);
  const [conversations,setConversations]=useState([]);
  const [conversationsLoading,setConversationsLoading]=useState(true);
  const [selectedConv,setSelectedConv]=useState(null);
  const [activityFeed,setActivityFeed]=useState([]);
  const [activitySummary,setActivitySummary]=useState([]);
  const [activityLoading,setActivityLoading]=useState(true);
  const [activityView,setActivityView]=useState("summary"); // "summary" | "feed"
  const [activityUserFilter,setActivityUserFilter]=useState("");

  useEffect(()=>{
    loadUsers();
    loadAdmins();
    loadConversations();
    // Real-time: admin sees broadcast list update live too (e.g. if
    // a second admin is also managing broadcasts at the same time).
    const unsub=listenToBroadcasts(setBroadcasts);
    // Real-time: reflect chat mode instantly if changed from another tab/admin.
    const unsubChat=listenToChatSettings(s=>setChatModeState(s?.mode||"open"));
    return ()=>{unsub();unsubChat();};
  },[]);

  // Follow-up fix: load seen/followed counts for each broadcast so
  // the admin can confirm how many users acknowledged each suggestion.
  useEffect(()=>{
    broadcasts.forEach(b=>{
      getResponseSummary(b.id).then(summary=>{
        setResponseSummaries(prev=>({...prev,[b.id]:summary}));
      });
    });
  },[broadcasts]);

  // 5C: lazy-load the activity feed only when the admin actually opens
  // that tab — it scans every message across group chat + all DMs,
  // so no reason to pay that cost unless it's actually being viewed.
  useEffect(()=>{
    if(tab==="activity"&&activityFeed.length===0&&!activityLoading){
      loadActivity();
    }
  },[tab]);

  const loadUsers=async()=>{
    setLoading(true);
    try{
      const allUsers=await fsGetAll("users");
      // #1 fix: never show the logged-in admin's own profile/portfolio
      // in the regular user list — it isn't a "user account" to manage.
      const filtered=allUsers.filter(u=>u.id!==adminUser.uid);
      setUsers(filtered);
    }catch(e){console.log(e);}
    setLoading(false);
  };

  const loadAdmins=async()=>{
    setAdminsLoading(true);
    try{
      const list=await listAdmins();
      setAdmins(list);
    }catch(e){console.log(e);}
    setAdminsLoading(false);
  };

  // 5B: load every 1-on-1 conversation (all are user<->admin, since
  // the client never creates any other kind) for the admin's inbox.
  const loadConversations=async()=>{
    setConversationsLoading(true);
    try{
      const list=await listAllConversations();
      setConversations(list);
    }catch(e){console.log(e);}
    setConversationsLoading(false);
  };

  // 5C: pull the combined group-chat + DM activity feed and the
  // per-user summary in one go — used by the Activity Log tab.
  const loadActivity=async()=>{
    setActivityLoading(true);
    try{
      const [feed,summary]=await Promise.all([getActivityFeed(),getActivitySummaryByUser()]);
      setActivityFeed(feed);
      setActivitySummary(summary);
    }catch(e){console.log(e);}
    setActivityLoading(false);
  };

  const loadUserData=async(uid)=>{
    const data=await fsGet("users/"+uid+"/appdata/main");
    setSelectedData(data);
  };

  const selectUser=async(u)=>{
    setSelected(u);
    await loadUserData(u.id);
  };

  const updateUserProfile=async(uid,updates)=>{
    setSaving(true);
    await fsSet("users/"+uid,updates);
    setUsers(prev=>prev.map(u=>u.id===uid?{...u,...updates}:u));
    if(selected&&selected.id===uid) setSelected(s=>({...s,...updates}));
    setSaving(false);
  };

  const toggleBlock=async(u)=>{
    const newStatus=!u.isActive;
    await updateUserProfile(u.id,{isActive:newStatus});
  };

  // #5 fix: admin can block a specific user's chat participation.
  // Default is enabled (chatEnabled !== false), so this only needs
  // to explicitly set false to block, or true/removed to re-allow.
  const toggleChatAccess=async(u)=>{
    const newStatus=u.chatEnabled===false?true:false;
    setSaving(true);
    await setChatEnabled(u.id,newStatus);
    setUsers(prev=>prev.map(x=>x.id===u.id?{...x,chatEnabled:newStatus}:x));
    if(selected&&selected.id===u.id) setSelected(s=>({...s,chatEnabled:newStatus}));
    setSaving(false); 
};

  const updatePayment=async(u,amount)=>{
    const today=new Date().toISOString().split("T")[0];
    // Next renewal = 1 month from today
    const next=new Date();next.setMonth(next.getMonth()+1);
    const nextDate=next.toISOString().split("T")[0];
    // #7 fix: keep a running history of every payment (not just the
    // latest) so monthly revenue can be reconstructed later.
    const historyEntry={date:today,amount:+amount,recordedBy:adminUser.email};
    const newHistory=[...(u.paymentHistory||[]),historyEntry];
    await updateUserProfile(u.id,{
      lastPaymentDate:today,
      lastPaymentAmount:+amount,
      nextRenewalDate:nextDate,
      isActive:true,
      paymentHistory:newHistory,
    });
  };

  // #6 fix: dynamic admin add/remove — no more code deploys needed.
  const handleAddAdmin=async()=>{
    if(!newAdminEmail.trim())return;
    setSaving(true);
    const ok=await addAdmin(newAdminEmail.trim().toLowerCase(),newAdminRole,adminUser.email);
    if(ok){
      setNewAdminEmail("");
      setNewAdminRole("limited");
      await loadAdmins();
    }
    setSaving(false);
  };

  const handleRevokeAdmin=async(email)=>{
    setSaving(true);
    const result=await revokeAdmin(email);
    if(result.ok){
      await loadAdmins();
    }
    setSaving(false);
    return result;
  };

  // #4 fix: admin posts a Buy/Sell/Partial-Sell suggestion; all
  // signed-in users see it instantly via NotificationBanner's
  // real-time listener — no manual refresh needed on either side.
  const handleSendBroadcast=async()=>{
    if(!bcStock||!bcMessage.trim())return;
    setBcSending(true);
    await sendBroadcast({
      stock:bcStock,
      action:bcAction,
      message:bcMessage.trim(),
      targetPrice:bcTargetPrice?+bcTargetPrice:null,
      percentage:bcAction==="partial_sell"&&bcPercentage?+bcPercentage:null,
      createdBy:adminUser.email,
    });
    setBcStock("");setBcAction("buy");setBcMessage("");setBcTargetPrice("");setBcPercentage("");
    setBcSending(false);
  };

  const handleDeleteBroadcast=async(id)=>{
    await deleteBroadcast(id);
  };

  // 5A: admin flips the global chat mode — open/readonly/closed.
  const handleSetChatMode=async(mode)=>{
    setChatModeSaving(true);
    await setChatMode(mode,adminUser.email);
    setChatModeSaving(false);
  };

  const filtered=users.filter(u=>{
    if(!search)return true;
    const s=search.toLowerCase();
    return (u.displayName||"").toLowerCase().includes(s)||
           (u.email||"").toLowerCase().includes(s)||
           (u.bkash||"").includes(s)||
           (u.whatsapp||"").includes(s);
  });

  const TS=(t)=>({padding:"8px 14px",border:"none",cursor:"pointer",background:tab===t?C.accent:"transparent",color:tab===t?"#fff":C.muted,fontWeight:700,fontSize:12,fontFamily:"inherit",borderRadius:8});

  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"0 0 40px"}}>
      {/* Admin Header */}
      <div style={{background:"linear-gradient(135deg,#0D0A1A,#1A0A2E)",padding:"16px 20px",borderBottom:"1px solid #9C27B033"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:"linear-gradient(135deg,#9C27B0,#673AB7)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👑</div>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>Admin Dashboard</div>
              <div style={{fontSize:11,color:"#CE93D8"}}>{adminUser.email} · DSE Trading Platform</div>
            </div>
          </div>
          <button onClick={onClose} style={btn(C.muted,false,true)}>← App এ ফিরুন</button>
        </div>
        <div style={{maxWidth:1140,margin:"8px auto 0",display:"flex",gap:4}}>
          {[["users","👥 Users"],["stats","📊 Stats"],["broadcast","📢 Broadcast"],["chatctrl","💬 Chat Control"],["conversations","✉️ Conversations"],["activity","🕐 Activity Log"],["permissions","🔑 Permissions"],["settings","⚙️ Settings"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={TS(t)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1140,margin:"0 auto",padding:"16px 20px"}}>
        {tab==="users"&&(
          <div style={{display:"grid",gridTemplateColumns:selected?"1fr 1fr":"1fr",gap:16}}>
            {/* User List */}
            <div>
              <div style={{...card(),padding:12,marginBottom:12}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 নাম, email, বিকাশ নম্বর..." style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,color:C.muted}}>মোট: {users.length} users · Active: {users.filter(u=>u.isActive).length}</div>
                <button onClick={loadUsers} style={btn(C.blue,false,true)}>🔄 Refresh</button>
              </div>
              {loading?<div style={{...card(),padding:40,textAlign:"center",color:C.muted}}>Loading...</div>:
                filtered.map(u=>{
                  const isExpired=u.nextRenewalDate&&new Date(u.nextRenewalDate)<new Date();
                  return(
                    <div key={u.id} onClick={()=>selectUser(u)} style={{...card(),padding:14,marginBottom:8,cursor:"pointer",border:"1px solid "+(selected?.id===u.id?C.purple:u.isActive?C.border:C.red+"44"),transition:"border 0.2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <img src={u.photoURL||"https://ui-avatars.com/api/?name="+encodeURIComponent(u.displayName||"U")+"&background=1A2D4A&color=fff"} style={{width:40,height:40,borderRadius:20,border:"2px solid "+(u.isActive?C.accent:C.red)}} alt=""/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,color:"#fff",fontSize:14}}>{u.displayName||"No name"}</div>
                          <div style={{fontSize:11,color:C.muted}}>{u.email}</div>
                          <div style={{fontSize:10,display:"flex",gap:8,marginTop:2}}>
                            {u.bkash&&<span style={{color:C.yellow}}>💳 {u.bkash}</span>}
                            {u.whatsapp&&<span style={{color:C.accent}}>📱 {u.whatsapp}</span>}
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:12,fontWeight:700,color:u.isActive?C.accent:C.red}}>{u.isActive?"✅ Active":"🔴 Blocked"}</div>
                          {u.lastPaymentDate&&<div style={{fontSize:10,color:C.muted}}>💳 {u.lastPaymentDate}</div>}
                          {isExpired&&<div style={{fontSize:10,color:C.red,fontWeight:700}}>⚠️ Expired</div>}
                          {u.nextRenewalDate&&<div style={{fontSize:10,color:C.yellow}}>🔄 {u.nextRenewalDate}</div>}
                          {u.chatEnabled===false&&<div style={{fontSize:10,color:C.red,fontWeight:700}}>🚫 Chat বন্ধ</div>}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* User Detail */}
            {selected&&(
              <div>
                <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.purple+"44"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>    
<div style={{fontWeight:800,color:"#CE93D8",fontSize:15}}>👤 {selected.displayName||selected.email}</div>
                    <button onClick={()=>{setSelected(null);setSelectedData(null);}} style={btn(C.muted,false,true)}>✕</button>
                  </div>
                  {/* Profile Info */}
                  <div style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:12}}>
                    {[["Email",selected.email],["WhatsApp",selected.whatsapp||"—"],["বিকাশ",selected.bkash||"—"],["Join Date",selected.joinDate||"—"],["Monthly Fee","৳"+(selected.monthlyFee||1000)],["Last Payment",selected.lastPaymentDate||"—"],["Next Renewal",selected.nextRenewalDate||"—"]].map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                        <span style={{color:C.muted}}>{l}</span><span style={{color:C.text,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Update */}
                  <div style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:12}}>
                    <div style={{fontWeight:700,color:C.yellow,marginBottom:8,fontSize:12}}>💳 Payment Update</div>
                    <div style={{display:"flex",gap:8}}>
                      {[500,1000,1500,2000].map(amt=>(
                        <button key={amt} onClick={()=>updatePayment(selected,amt)} disabled={saving}
                          style={{flex:1,padding:"8px 4px",background:C.accent+"22",border:"1px solid "+C.accent+"44",borderRadius:8,color:C.accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                          ৳{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Block/Unblock */}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>toggleBlock(selected)} disabled={saving}
                      style={{...btn(selected.isActive?C.red:C.accent,true),flex:1,padding:10}}>
                      {selected.isActive?"🔴 Block করুন":"✅ Activate করুন"}
                    </button>
                  </div>

                  {/* #5 fix: chat participation toggle */}
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <button onClick={()=>toggleChatAccess(selected)} disabled={saving}
                      style={{...btn(selected.chatEnabled===false?C.accent:C.red,true),flex:1,padding:10}}>
                      {selected.chatEnabled===false?"💬 Chat চালু করুন":"🚫 Chat বন্ধ করুন"}
                    </button>
                  </div>
                </div>

                {/* User Data Preview */}
                {selectedData&&(
                  <div style={{...card(),padding:16}}>
                    <div style={{fontWeight:700,color:C.accent,marginBottom:10,fontSize:13}}>📊 User Portfolio Preview</div>
                    {selectedData.port&&selectedData.port.length>0?(
                      <div>
                        <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Positions: {selectedData.port.length}</div>
                        {selectedData.port.slice(0,5).map((p,i)=>(
                          <div key={i} style={{background:"#070D1A",borderRadius:8,padding:"8px 12px",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                            <div><div style={{fontWeight:700,color:"#fff",fontSize:13}}>{p.stock}</div><div style={{fontSize:11,color:C.muted}}>{p.broker} · {p.shares} shares</div></div>
                            <div style={{textAlign:"right"}}><div style={{fontSize:13,color:"#4FC3F7"}}>৳{p.currentPrice}</div><div style={{fontSize:11,color:C.muted}}>Buy: ৳{p.buyRate}</div></div>
                          </div>
                        ))}
                        {selectedData.port.length>5&&<div style={{fontSize:11,color:C.muted,textAlign:"center"}}>+{selectedData.port.length-5} more</div>}
                      </div>
                    ):<div style={{color:C.muted,fontSize:12}}>Portfolio data নেই।</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab==="stats"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:16}}>
              {[
                ["👥 Total Users",users.length,"#4FC3F7"],
                ["✅ Active",users.filter(u=>u.isActive).length,C.accent],
                ["🔴 Blocked",users.filter(u=>!u.isActive).length,C.red],
                ["💳 This Month",users.filter(u=>u.lastPaymentDate&&u.lastPaymentDate.startsWith(new Date().toISOString().slice(0,7))).length,C.yellow],
                ["⚠️ Expiring Soon",users.filter(u=>{if(!u.nextRenewalDate)return false;const d=new Date(u.nextRenewalDate);const now=new Date();return d>now&&(d-now)<7*86400000;}).length,C.orange],
                ["💰 Total Revenue","৳"+users.reduce((a,u)=>a+(u.lastPaymentAmount||0),0).toLocaleString(),C.gold],
              ].map(([l,v,cl])=>(
                <div key={l} style={{...card(),padding:16,textAlign:"center"}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{l}</div>
                  <div style={{fontSize:24,fontWeight:800,color:cl}}>{v}</div>
                </div>
              ))}
            </div>

            {/* #7 fix: monthly (বিকাশ) revenue breakdown, built from each user's paymentHistory */}
            {(()=>{
              const monthly={};
              users.forEach(u=>{
                (u.paymentHistory||[]).forEach(p=>{
                  const month=p.date?p.date.slice(0,7):null; // "YYYY-MM"
                  if(!month)return;
                  if(!monthly[month])monthly[month]={total:0,count:0,payments:[]};
                  monthly[month].total+=(p.amount||0);
                  monthly[month].count+=1;
                  monthly[month].payments.push({...p,userName:u.displayName||u.email,userEmail:u.email});
                });
              });
              const months=Object.keys(monthly).sort().reverse();
              return(
                <div style={{...card(),padding:16}}>
                  <div style={{fontWeight:700,color:C.accent,marginBottom:12,fontSize:14}}>📅 মাস অনুযায়ী Revenue (বিকাশ Payment History)</div>
                  {months.length===0?(
                    <div style={{color:C.muted,fontSize:12}}>এখনো কোনো payment history নেই। নতুন payment update করলে এখানে দেখাবে।</div>
                  ):months.map(m=>{
                    const d=monthly[m];
                    const label=new Date(m+"-01").toLocaleDateString("bn-BD",{year:"numeric",month:"long"});
                    return(
                      <div key={m} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:10,border:"1px solid "+C.border}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div style={{fontWeight:700,color:"#4FC3F7",fontSize:13}}>{label}</div>
                          <div style={{fontWeight:800,color:C.gold,fontSize:16}}>৳{d.total.toLocaleString()}</div>
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{d.count}টি payment</div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          {d.payments.map((p,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 8px",background:"#0A1628",borderRadius:6}}>
                              <span style={{color:C.text}}>{p.userName}</span>
                              <span style={{color:C.muted}}>{p.date}</span>
                              <span style={{color:C.accent,fontWeight:700}}>৳{p.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {tab==="broadcast"&&(
          <div>
            <div style={{...card(),padding:20,marginBottom:14}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:6}}>📢 নতুন Broadcast পাঠান</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>সব user সাথে সাথে এই notification দেখতে পাবে — কোনো refresh লাগবে না।</div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Stock</div>
                  <select value={bcStock} onChange={e=>setBcStock(e.target.value)} style={{...inp({width:"100%"})}}>
                    <option value="">নির্বাচন করুন</option>
                    {(stocks||[]).map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Action</div>
                  <select value={bcAction} onChange={e=>setBcAction(e.target.value)} style={{...inp({width:"100%"})}}>
                    <option value="buy">📥 Buy</option>
                    <option value="sell">📤 Sell</option>
                    <option value="partial_sell">🔶 Partial Sell</option>       
</select>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Target Price ৳ (ঐচ্ছিক)</div>
                  <input type="number" value={bcTargetPrice} onChange={e=>setBcTargetPrice(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
                </div>
                {bcAction==="partial_sell"&&(
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Percentage % (ঐচ্ছিক)</div>
                    <input type="number" min="1" max="100" value={bcPercentage} onChange={e=>setBcPercentage(e.target.value)} style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
                  </div>
                )}
              </div>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Message</div>
                <textarea value={bcMessage} onChange={e=>setBcMessage(e.target.value)} placeholder="যেমন: RSI oversold, MACD bullish crossover — এখন কেনার ভালো সময়।"
                  style={{width:"100%",height:80,background:"#0A1628",border:"1px solid "+C.border,borderRadius:6,color:C.text,padding:10,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
              </div>

              <button onClick={handleSendBroadcast} disabled={bcSending||!bcStock||!bcMessage.trim()} style={{...btn(C.accent,true),width:"100%",padding:12}}>
                {bcSending?"⏳ পাঠানো হচ্ছে...":"📢 সবাইকে পাঠান"}
              </button>
            </div>

            <div style={{...card(),padding:16}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:10,fontSize:13}}>📋 Broadcast History ({broadcasts.length})</div>
              {broadcasts.length===0?(
                <div style={{color:C.muted,fontSize:12}}>এখনো কোনো broadcast পাঠানো হয়নি।</div>
              ):broadcasts.map(b=>{
                const actionLabel=b.action==="buy"?"📥 BUY":b.action==="sell"?"📤 SELL":"🔶 PARTIAL SELL";
                const actionColor=b.action==="buy"?C.accent:b.action==="sell"?C.red:C.orange;
                const summary=responseSummaries[b.id];
                return(
                  <div key={b.id} style={{background:"#070D1A",borderRadius:10,padding:12,marginBottom:8,border:"1px solid "+C.border}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{background:actionColor+"22",color:actionColor,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:800}}>{actionLabel}</span>
                      <span style={{fontWeight:800,color:"#fff",fontSize:13}}>{b.stock}</span>
                      {b.targetPrice!=null&&<span style={{fontSize:11,color:C.muted}}>@ ৳{b.targetPrice}</span>}
                      {b.percentage!=null&&<span style={{fontSize:11,color:C.muted}}>({b.percentage}%)</span>}
                      <button onClick={()=>handleDeleteBroadcast(b.id)} style={{marginLeft:"auto",...btn(C.red,false,true)}}>🗑️</button>
                    </div>
                    <div style={{fontSize:12,color:C.text,lineHeight:1.6,marginBottom:6}}>{b.message}</div>
                    {/* Follow-up fix: confirm how many users saw/followed this suggestion */}
                    <div style={{display:"flex",gap:10,marginBottom:6,fontSize:11}}>
                      <span style={{color:C.blue,fontWeight:700}}>👁️ {summary?summary.seen:0} জন দেখেছে</span>
                      <span style={{color:C.accent,fontWeight:700}}>📌 {summary?summary.followed:0} জন Follow করেছে</span>
                    </div>
                    <div style={{fontSize:10,color:C.muted}}>{b.createdBy} · {b.createdAt?new Date(b.createdAt).toLocaleDateString("bn-BD",{year:"numeric",month:"long",day:"numeric"})+" · "+new Date(b.createdAt).toLocaleTimeString("bn-BD",{hour:"2-digit",minute:"2-digit"}):""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="chatctrl"&&(
          <div>
            <div style={{...card(),padding:20,marginBottom:14}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:6}}>💬 Global Chat Mode</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:16}}>এখান থেকে পুরো group chat এর জন্য একটা master switch নিয়ন্ত্রণ করুন — সবার জন্য প্রযোজ্য হবে।</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  ["open","🟢 সবার জন্য খোলা","সবাই (active user) মেসেজ পড়তে ও লিখতে পারবে।",C.accent],
                  ["readonly","🟡 শুধু Admin লিখতে পারবে","সবাই পড়তে পারবে, কিন্তু শুধু Admin মেসেজ পাঠাতে পারবে।",C.yellow],
                  ["closed","🔴 সম্পূর্ণ বন্ধ","কেউ চ্যাট দেখতে বা লিখতে পারবে না।",C.red],
                ].map(([value,label,desc,color])=>(
                  <button key={value} onClick={()=>handleSetChatMode(value)} disabled={chatModeSaving}
                    style={{textAlign:"left",padding:14,borderRadius:10,border:"2px solid "+(chatMode===value?color:C.border),background:chatMode===value?color+"18":"#070D1A",cursor:"pointer",fontFamily:"inherit"}}>
                    <div style={{fontWeight:700,color:chatMode===value?color:"#fff",fontSize:13,marginBottom:3}}>{label} {chatMode===value&&"✓"}</div>
                    <div style={{fontSize:11,color:C.muted}}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{...card(),padding:20}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:6,fontSize:13}}>👤 প্রতি-ইউজার Chat Access</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Global mode "🟢 সবার জন্য খোলা" থাকলেও, এখান থেকে নির্দিষ্ট কাউকে আলাদাভাবে ব্লক করা যাবে (Users ট্যাব থেকেও করা যায়)।</div>
              {users.filter(u=>u.chatEnabled===false).length===0?(
                <div style={{color:C.muted,fontSize:12}}>কোনো user কে আলাদাভাবে chat থেকে block করা হয়নি।</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {users.filter(u=>u.chatEnabled===false).map(u=>(
                    <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#070D1A",borderRadius:8,padding:"8px 12px"}}>
                      <span style={{fontSize:12,color:C.text}}>{u.displayName||u.email}</span>
                      <button onClick={()=>toggleChatAccess(u)} disabled={saving} style={btn(C.accent,true,true)}>💬 চালু করুন</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab==="conversations"&&(
          <div style={{display:"grid",gridTemplateColumns:selectedConv?"1fr 1fr":"1fr",gap:16}}>
            {/* Conversation list — WhatsApp-style: name, last message preview, time */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,color:C.muted}}>মোট: {conversations.length}টি conversation</div>
                <button onClick={loadConversations} style={btn(C.blue,false,true)}>🔄 Refresh</button>
              </div>
              {conversationsLoading?(
                <div style={{...card(),padding:40,textAlign:"center",color:C.muted}}>Loading...</div>
              ):conversations.length===0?(
                <div style={{...card(),padding:30,textAlign:"center",color:C.muted,fontSize:12}}>এখনো কেউ DM পাঠায়নি।</div>
              ):conversations.map(c=>{
                const otherUid=c.participants.find(p=>p!==adminUser.uid)||c.participants[0];
                const otherName=c.participantNames?.[otherUid]||"User";
                const otherPhoto=c.participantPhotos?.[otherUid]||"";
                return(
                  <div key={c.id} onClick={()=>setSelectedConv({id:c.id,name:otherName})}
                    style={{...card(),padding:12,marginBottom:8,cursor:"pointer",border:"1px solid "+(selectedConv?.id===c.id?C.purple:C.border)}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <img src={otherPhoto||"https://ui-avatars.com/api/?name="+encodeURIComponent(otherName)+"&background=1A2D4A&color=fff"} style={{width:36,height:36,borderRadius:18}} alt=""/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{otherName}</div>
                        <div style={{fontSize:11,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.lastMessage||"—"}</div>
                      </div>
                      <div style={{fontSize:10,color:C.muted,flexShrink:0}}>{c.lastMessageAt?new Date(c.lastMessageAt).toLocaleDateString("bn-BD",{day:"numeric",month:"short"}):""}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected conversation thread */}
            {selectedConv&&(
              <div>
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                  <button onClick={()=>setSelectedConv(null)} style={btn(C.muted,false,true)}>✕ বন্ধ করুন</button>
                </div>
                <ConversationThread
                  conversationId={selectedConv.id}
                  currentUser={{uid:adminUser.uid,displayName:adminUser.displayName,email:adminUser.email,photoURL:adminUser.photoURL}}
                  otherPartyName={selectedConv.name}
                  canWrite={true}
                />
              </div>
            )}
          </div>
        )}

        {tab==="activity"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setActivityView("summary")} style={btn(C.accent,activityView==="summary",true)}>👤 Per-User সারাংশ</button>
                <button onClick={()=>setActivityView("feed")} style={btn(C.accent,activityView==="feed",true)}>📜 সব Activity (সময়ানুক্রমিক)</button>         
</div>
              <button onClick={loadActivity} disabled={activityLoading} style={btn(C.blue,false,true)}>🔄 Refresh</button>
            </div>

            {activityLoading?(
              <div style={{...card(),padding:40,textAlign:"center",color:C.muted}}>Loading activity...</div>
            ):activityView==="summary"?(
              // Per-user summary: total messages, first/last activity, group vs DM split
              activitySummary.length===0?(
                <div style={{...card(),padding:30,textAlign:"center",color:C.muted,fontSize:12}}>এখনো কোনো চ্যাট activity নেই।</div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {activitySummary.map(u=>(
                    <div key={u.senderId} style={{...card(),padding:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <div style={{fontWeight:700,color:"#fff",fontSize:14}}>{u.senderName}</div>
                        <div style={{fontSize:11,color:C.accent,fontWeight:700}}>মোট {u.totalMessages}টি মেসেজ</div>
                      </div>
                      <div style={{display:"flex",gap:16,fontSize:11,color:C.muted,marginBottom:6}}>
                        <span>💬 Group: {u.groupMessages}</span>
                        <span>✉️ DM: {u.dmMessages}</span>
                      </div>
                      <div style={{fontSize:11,color:C.muted}}>
                        সর্বশেষ: {u.lastActivityAt?new Date(u.lastActivityAt).toLocaleDateString("bn-BD",{day:"numeric",month:"long",year:"numeric"})+" · "+new Date(u.lastActivityAt).toLocaleTimeString("bn-BD",{hour:"2-digit",minute:"2-digit"}):"—"}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ):(
              // Full chronological feed across both channels
              <div>
                <div style={{marginBottom:10}}>
                  <input value={activityUserFilter} onChange={e=>setActivityUserFilter(e.target.value)} placeholder="🔍 নাম দিয়ে ফিল্টার করুন..." style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
                </div>
                {activityFeed.filter(a=>!activityUserFilter||a.senderName.toLowerCase().includes(activityUserFilter.toLowerCase())).length===0?(
                  <div style={{...card(),padding:30,textAlign:"center",color:C.muted,fontSize:12}}>কোনো activity পাওয়া যায়নি।</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {activityFeed.filter(a=>!activityUserFilter||a.senderName.toLowerCase().includes(activityUserFilter.toLowerCase())).slice(0,100).map((a,i)=>(
                      <div key={i} style={{background:"#070D1A",borderRadius:8,padding:"10px 12px",border:"1px solid "+C.border}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,color:"#fff",fontSize:12}}>{a.senderName}</span>
                          <span style={{fontSize:10,color:a.channel==="group"?C.blue:C.purple,background:(a.channel==="group"?C.blue:C.purple)+"22",borderRadius:5,padding:"1px 7px",fontWeight:700}}>{a.channelLabel}</span>
                          <span style={{fontSize:10,color:C.muted,marginLeft:"auto"}}>{a.date} · {a.time}</span>
                        </div>
                        <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{a.text}</div>
                      </div>
                    ))}
                    {activityFeed.filter(a=>!activityUserFilter||a.senderName.toLowerCase().includes(activityUserFilter.toLowerCase())).length>100&&(
                      <div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:6}}>প্রথম ১০০টি দেখানো হচ্ছে</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab==="permissions"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:6}}>🔑 Admin Permissions</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>এখান থেকে dynamically কাউকে Admin বা Limited access দেওয়া যাবে — কোনো code deploy লাগবে না।</div>

            <div style={{background:"#070D1A",borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:C.yellow,marginBottom:10,fontSize:13}}>+ নতুন Admin যোগ করুন</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Gmail Address</div>
                  <input value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} placeholder="example@gmail.com" style={{...inp({width:"100%",boxSizing:"border-box"})}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Access Level</div>
                  <select value={newAdminRole} onChange={e=>setNewAdminRole(e.target.value)} style={inp()}>
                    <option value="limited">Limited</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <button onClick={handleAddAdmin} disabled={saving||!newAdminEmail.trim()} style={{...btn(C.accent,true),padding:"10px 16px"}}>✅ যোগ করুন</button>
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:8}}>Full = সব permission (user block, payment, admin manage)। Limited = শুধু user দেখা ও payment update, admin manage করতে পারবে না।</div>
            </div>

            <div style={{fontWeight:700,color:C.accent,marginBottom:8,fontSize:13}}>বর্তমান Admin তালিকা ({admins.length})</div>
            {adminsLoading?<div style={{color:C.muted,fontSize:12}}>Loading...</div>:
              admins.map(a=>{
                const isSuper=a.id===SUPER_ADMIN_EMAIL;
                return(
                  <div key={a.id} style={{background:"#070D1A",borderRadius:10,padding:14,marginBottom:8,border:"1px solid "+(isSuper?C.gold+"44":C.border),display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:"#fff",fontSize:13}}>{a.id} {isSuper&&<span style={{color:C.gold}}>👑 Super Admin</span>}</div>
                      <div style={{fontSize:11,color:C.muted}}>Role: {a.role||"—"} {a.addedBy?"· Added by "+a.addedBy:""} {a.addedAt?"· "+a.addedAt:""}</div>
                    </div>
                    {!isSuper&&(
                      <button onClick={()=>handleRevokeAdmin(a.id)} disabled={saving} style={btn(C.red,false,true)}>🗑️ Remove</button>
                    )}
                  </div>
                );
              })
            }
            {!adminsLoading&&admins.length===0&&<div style={{color:C.muted,fontSize:12}}>কোনো admin পাওয়া যায়নি — Firestore এ admins collection check করুন।</div>}
          </div>
        )}

        {tab==="settings"&&(
          <div style={{...card(),padding:20}}>
            <div style={{fontWeight:700,color:C.accent,marginBottom:16}}>⚙️ Platform Settings</div>
            <div style={{background:"#070D1A",borderRadius:10,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:C.yellow,marginBottom:10,fontSize:13}}>👑 Admin Access</div>
              <div style={{fontSize:12,color:C.muted}}>Admin manage করতে "🔑 Permissions" ট্যাব ব্যবহার করুন — এখন dynamic, Firestore থেকে চলে।</div>
            </div>
            <div style={{background:"#070D1A",borderRadius:10,padding:16}}>
              <div style={{fontWeight:700,color:C.yellow,marginBottom:10,fontSize:13}}>📋 Instructions</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>
                • নতুন admin যোগ করতে: "🔑 Permissions" ট্যাবে email দিয়ে Add করুন<br/>
                • Default monthly fee পরিবর্তন করতে: DEFAULT_PROFILE.monthlyFee update করুন<br/>
                • User block করলে তারা login করতে পারবে না<br/>
                • Payment update করলে auto 1 মাস renewal হবে
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;                
