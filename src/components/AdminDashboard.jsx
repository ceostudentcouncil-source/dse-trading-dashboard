import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { fsGet, fsSet, fsGetAll } from "../firebase.js";
import { listAdmins, addAdmin, revokeAdmin, SUPER_ADMIN_EMAIL } from "../services/adminService.js";

function AdminDashboard({adminUser,onClose}){
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

  useEffect(()=>{
    loadUsers();
    loadAdmins();
  },[]);

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
          {[["users","👥 Users"],["stats","📊 Stats"],["permissions","🔑 Permissions"],["settings","⚙️ Settings"]].map(([t,l])=>(
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
