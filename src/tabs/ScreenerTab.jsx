import { C, SECTORS, CATEGORIES, TODAY } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { daysSince, staleness } from "../utils/dateHelpers.js";
import { findSRLevels } from "../utils/taIndicators.js";
import StockSearch from "../components/StockSearch.jsx";
import Field from "../components/Field.jsx";
import WatchlistBar from "../components/WatchlistBar.jsx";
import FavoriteHeart from "../components/FavoriteHeart.jsx";

// ══════════════════════════════════════════════════════════════
// SCREENER TAB
// Presentational — all state and handlers are owned by App.jsx
// and passed down as props.
// ══════════════════════════════════════════════════════════════
export default function ScreenerTab({
  stocks, filtered, sigC, portMap, days, chartData, isAdmin,
  nameFilter, setNameFilter, sector, setSector, catFilter, setCatFilter, sigF, setSigF, sortBy, setSortBy,
  liveLoading,
  showAddS, setShowAddS, showPaste, setShowPaste,
  ns, setNs, nsSearch, setNsSearch, selectStockForNS, addStock,
  expanded, setExpanded, editMode, setEditMode,
  updateStock, removeStock, showToast,
  setChartStock, fetchChartDataForSymbol, setStockPaste,
  user, watchlists, activeWatchlistId, setActiveWatchlistId, favoriteNames, onToggleFavorite,
  onAddToWatchlist, onRemoveFromWatchlist,
}) {
  const customWatchlists = (watchlists||[]).filter(w=>!w.isDefault);
  return (
    <div>
            {user && (
              <WatchlistBar
                uid={user.uid}
                watchlists={watchlists}
                activeId={activeWatchlistId}
                onSelect={setActiveWatchlistId}
                showToast={showToast}
              />
            )}

            {/* Filter bar */}
            <div style={{...card(),padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:600}}>মোট: {stocks.length} · {days} দিনের Signal</div>
                <div style={{position:"relative",minWidth:180}}>
                  <input value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="🔍 Stock নাম খুঁজুন..."
                    style={{...inp({width:"100%",boxSizing:"border-box",border:"1px solid "+(nameFilter?C.accent:C.border),fontSize:12,padding:"6px 10px"})}}/>
                  {nameFilter&&<button onClick={()=>setNameFilter("")} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,fontWeight:700}}>✕</button>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["সব",stocks.length,"#4A6080"],["STRONG BUY",sigC["STRONG BUY"],"#00C896"],["BUY",sigC["BUY"],"#4CAF50"],["WATCH",sigC["WATCH"],"#FFC107"],["WEAK",sigC["WEAK"],"#FF9800"],["AVOID",sigC["AVOID"],"#F44336"]].map(([lb,ct,cl])=>(
                  <button key={lb} onClick={()=>setSigF(lb)} style={{padding:"7px 14px",borderRadius:8,border:"2px solid "+(sigF===lb?cl:"transparent"),background:sigF===lb?cl+"28":cl+"0e",color:cl,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                    {lb} <span style={{background:cl+"30",borderRadius:20,padding:"1px 7px",fontSize:11}}>{ct}</span>
                  </button>
                ))}
              </div>
              {(nameFilter||sector!=="সব"||catFilter!=="সব"||sigF!=="সব")&&<div style={{marginTop:8,fontSize:11,color:C.yellow}}>দেখাচ্ছে: {filtered.length}টি <button onClick={()=>{setNameFilter("");setSector("সব");setCatFilter("সব");setSigF("সব");}} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontWeight:700,textDecoration:"underline"}}>সব ফিল্টার মুছুন</button></div>}
              {isAdmin&&(
                <div style={{marginTop:10,padding:"8px 12px",background:C.blue+"11",borderRadius:8,border:"1px solid "+C.blue+"33",fontSize:11,color:C.muted,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span>💡 বাজার বন্ধের পর</span><span style={{color:C.blue,fontWeight:700}}>📡 DSE Sync</span><span>চাপুন — closing price auto-update হবে।</span>
                  {liveLoading&&<span style={{color:C.yellow,fontWeight:700}}>⏳ Data আনছি...</span>}
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{...card(),padding:12,marginBottom:12,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <select value={sector} onChange={e=>setSector(e.target.value)} style={inp()}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={inp()}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={inp()}>
                <option value="score">Score</option><option value="name">নাম (A-Z)</option><option value="vol">Volume</option><option value="eps">EPS</option><option value="rsi">RSI</option>
              </select>
              {isAdmin&&(
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  <button onClick={()=>{setShowPaste(true);setShowAddS(false);}} style={btn(C.purple)}>📋 Code Paste</button>
                  <button onClick={()=>setShowAddS(!showAddS)} style={btn(C.blue,showAddS)}>+ Manual যোগ</button>
                </div>
              )}
            </div>

            {/* Manual Add / Edit */}
            {isAdmin&&showAddS&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:10,fontSize:15}}>Stock যোগ / আপডেট (Manual)</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:10}}>💡 আগের stock বেছে নিলে data auto-fill হবে</div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:3}}>Stock Name (suggestion):</div>
                  <StockSearch stocks={stocks} value={nsSearch} onChange={v=>{setNsSearch(v);setNs(p=>Object.assign({},p,{name:v}));}} onSelect={selectStockForNS}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(125px,1fr))",gap:10,marginBottom:14}}>
                  {[["price","Price*"],["eps","EPS"],["pe","P/E"],["nav","NAV"],["div","Div%"],["rsi","RSI"],["macd","MACD"],["vol","Volume"],["vma20","VMA20 (avg vol)"],["ema20","EMA 20"],["sma50","SMA 50"],["ret6m","6M Ret%"],["inst","Inst%"],["circuit","Circuit Up"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div>
                      <input type="number" value={ns[k]} onChange={e=>setNs(p=>Object.assign({},p,{[k]:e.target.value}))}
                        style={{...inp({width:"100%",boxSizing:"border-box",border:"1px solid "+(ns[k]?C.accent:C.border)})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Category</div><select value={ns.cat} onChange={e=>setNs(p=>Object.assign({},p,{cat:e.target.value}))} style={inp({width:"100%"})}><option>A</option><option>B</option><option>Z</option></select></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Sector</div><select value={ns.sector} onChange={e=>setNs(p=>Object.assign({},p,{sector:e.target.value}))} style={inp({width:"100%"})}>{SECTORS.filter(s=>s!=="সব").map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{display:"flex",gap:8}}><button onClick={addStock} style={btn(C.accent,true)}>✅ যোগ/আপডেট</button><button onClick={()=>{setShowAddS(false);setNsSearch("");}} style={btn(C.muted)}>বাতিল</button></div>
              </div>
            )}

            {/* Stock List */}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map((s,idx)=>{
                const st=staleness(s.updatedAt);const isExp=s.id!=null&&expanded===s.id;
                const dCount=daysSince(s.updatedAt);
                const vmaRatio=s.vma20?s.vol/s.vma20:0;
                return(
                  <div key={s.id} style={{...card(),border:"1px solid "+(isExp?s.rec.color:(dCount&&dCount>7)?"#F4433640":C.border),transition:"border 0.2s"}}>
                    <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",cursor:"pointer"}} onClick={()=>{setExpanded(isExp?null:s.id);setEditMode(null);}}>
                      <div style={{width:28,height:28,background:idx<3?"linear-gradient(135deg,#FFD700,#FFA500)":"#1A2D4A",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:idx<3?"#000":C.muted,flexShrink:0}}>{idx+1}</div>
                      <div style={{flex:1,minWidth:100}}>
                        <div style={{fontWeight:800,fontSize:15,color:"#fff",display:"flex",alignItems:"center",gap:6}}>
                          {user&&<FavoriteHeart isFavorite={favoriteNames.includes(s.name)} onToggle={()=>onToggleFavorite(s.name)}/>}
                          {s.name} <span style={{fontSize:10,color:s.cat==="A"?C.accent:C.orange,fontWeight:700}}>[{s.cat}]</span>
                        </div>
                        <div style={{fontSize:10,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}>
                          <span style={{color:st.color,fontWeight:600}}>{st.label}</span>
                          {portMap[s.name]&&<span style={{color:C.purple}}>👤{portMap[s.name].toLocaleString()}</span>}
                          <span style={{color:s.str.maSignal.includes("🟢")?C.accent:C.yellow,fontSize:10}}>{s.str.maSignal}</span>
                          {s.str.isBreakoutVol&&<span style={{color:C.orange,fontWeight:700,fontSize:10}}>🔥 VOL BREAKOUT</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"center",minWidth:65}}>
                        <div style={{fontSize:18,fontWeight:800,color:"#4FC3F7"}}>৳{s.price}</div>
                        <div style={{fontSize:9,color:C.muted}}>circ ৳{s.circuit||"—"}</div>
                      </div>
                      <div style={{display:"flex",gap:8,minWidth:70}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.rsi>70?"#F44336":s.rsi<35?"#00C896":"#FFC107"}}>{s.rsi.toFixed(0)}</div><div style={{fontSize:9,color:C.muted}}>RSI</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:s.macd>0?"#00C896":"#F44336"}}>{s.macd.toFixed(1)}</div><div style={{fontSize:9,color:C.muted}}>MACD</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:12,fontWeight:700,color:s.price>s.ema20?C.accent:"#FF6B6B"}}>{s.ema20||"—"}</div><div style={{fontSize:9,color:C.muted}}>EMA20</div></div>
                      </div>
                      <div style={{minWidth:110}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:C.muted}}>Score/{days}d</span><span style={{fontSize:13,fontWeight:800,color:s.rec.color}}>{s.score}</span></div>
                        <div style={{height:5,background:"#1A2D4A",borderRadius:3}}><div style={{height:"100%",width:s.score+"%",background:s.rec.color,borderRadius:3}}/></div>
                      </div>
                      <div style={{background:s.rec.bg,border:"1px solid "+s.rec.color+"44",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,color:s.rec.color,minWidth:110,textAlign:"center"}}>{s.rec.label}</div>
                      <div style={{minWidth:100,textAlign:"center"}}>
                        <div style={{fontSize:12,fontWeight:700,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow}}>{s.str.buySignal}</div>
                        <div style={{fontSize:9,color:C.muted}}>T1 ৳{s.str.t1} · T2 ৳{s.str.t2}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{
                        setChartStock(s);
                        if(!chartData[s.name]){fetchChartDataForSymbol(s.name);}
                      }} style={btn("#4FC3F7",false,true)} title="Chart দেখুন">📊</button>
                      {user&&customWatchlists.length>0&&(
                        <select
                          value=""
                          onChange={e=>{
                            if(!e.target.value)return;
                            const wl=customWatchlists.find(w=>w.id===e.target.value);
                            if(wl&&wl.stockNames.includes(s.name)){
                              onRemoveFromWatchlist(wl.id,s.name,wl.stockNames);
                              showToast("✅ "+wl.name+" থেকে সরানো হয়েছে।");
                            }else if(wl){
                              onAddToWatchlist(wl.id,s.name,wl.stockNames);
                              showToast("✅ "+wl.name+" এ যোগ হয়েছে!");
                            }
                          }}
                          style={{...inp({fontSize:11,padding:"5px 6px",width:34}),cursor:"pointer"}}
                          title="Watchlist এ যোগ করুন"
                        >
                          <option value="">➕</option>
                          {customWatchlists.map(w=>(
                            <option key={w.id} value={w.id}>{w.stockNames.includes(s.name)?"✓ ":""}{w.name}</option>
                          ))}
                        </select>
                      )}
                      {isAdmin&&<button onClick={()=>setStockPaste(s)} style={btn(C.purple,false,true)} title="JSON paste update">📋</button>}
                        {isAdmin&&<button onClick={()=>{setEditMode(editMode===s.id?null:s.id);setExpanded(s.id);}} style={btn(C.yellow,editMode===s.id,true)}>✏️</button>}
                        {isAdmin&&<button onClick={()=>removeStock(s.id)} style={btn(C.red,false,true)}>✕</button>}
                      </div>
                    </div>

                    {/* Edit Mode — EMA20, SMA50, VMA20 সহ */}
                    {isAdmin&&editMode===s.id&&(
                      <div style={{padding:"12px 16px",borderTop:"1px solid "+C.border,background:"#070D1A"}}>
                        <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>✏️ Chart দেখে update করুন (EMA20, SMA50, VMA20 সহ):</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                          <Field label="Price" value={s.price} onChange={v=>updateStock(s.id,"price",v)} width={78}/>
                          <Field label="RSI" value={s.rsi} onChange={v=>updateStock(s.id,"rsi",v)} width={62}/>
                          <Field label="MACD" value={s.macd} onChange={v=>updateStock(s.id,"macd",v)} width={62}/>
                          <Field label="EMA 20" value={s.ema20||0} onChange={v=>updateStock(s.id,"ema20",v)} width={70}/>
                          <Field label="SMA 50" value={s.sma50||0} onChange={v=>updateStock(s.id,"sma50",v)} width={70}/>
                          <Field label="VMA 20" value={s.vma20||0} onChange={v=>updateStock(s.id,"vma20",v)} width={90}/>
                          <Field label="Volume" value={s.vol} onChange={v=>updateStock(s.id,"vol",v)} width={90}/>
                          <Field label="EPS" value={s.eps} onChange={v=>updateStock(s.id,"eps",v)} width={62}/>
                          <Field label="Circuit" value={s.circuit||0} onChange={v=>updateStock(s.id,"circuit",v)} width={68}/>
                          <button onClick={()=>{updateStock(s.id,"updatedAt",TODAY);setEditMode(null);showToast("✅ "+s.name+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅ Save</button>
                        </div>
                        {s.vma20&&s.vol&&(
                          <div style={{marginTop:8,fontSize:11,color:C.muted}}>
                            Volume/VMA ratio: <span style={{color:s.vol>s.vma20*2?C.orange:s.vol>s.vma20?C.accent:C.muted,fontWeight:700}}>{(s.vol/s.vma20).toFixed(2)}x</span>
                            {s.vol>s.vma20*2&&<span style={{color:C.orange,fontWeight:700,marginLeft:8}}>🔥 BREAKOUT VOLUME!</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {isExp&&editMode!==s.id&&(
                      <div style={{padding:"0 16px 16px",borderTop:"1px solid "+C.border,paddingTop:14}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10}}>
                          {/* Buy Strategy */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.accent,fontWeight:700,marginBottom:8}}>📥 Buy Strategy ({days===0?"🔮 Natural":days+"d"})</div>
                            <div style={{fontSize:13,fontWeight:700,color:s.str.buySignal.includes("🚀")?C.accent:s.str.buySignal.includes("✅")?C.accent:C.yellow,marginBottom:4}}>{s.str.buySignal}</div>
                            <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Zone: <span style={{color:C.text}}>{s.str.buyZone}</span></div>
                            <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{s.str.buyStr}</div>
                            <div style={{marginTop:6,fontSize:11,fontWeight:700,color:s.str.risk.includes("LOW")?C.accent:s.str.risk.includes("HIGH")?C.red:C.yellow}}>{s.str.risk}</div>
                            {chartData[s.name]&&(()=>{const sr=findSRLevels(chartData[s.name]);return sr.sellSignal?<div style={{marginTop:4,fontSize:11,color:C.red,fontWeight:700}}>{sr.sellSignal}</div>:null;})()}
                            <div style={{marginTop:4,fontSize:11,color:s.str.maSignal.includes("🟢")?C.accent:C.yellow}}>{s.str.maSignal}</div>
                          </div>
                          {/* Sell Strategy */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.yellow,fontWeight:700,marginBottom:8}}>🎯 Dynamic Sell ({days}d)</div>
                            <div style={{fontSize:12,marginBottom:3}}>T1 ৳{s.str.t1}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT1}% sell</span></div>
                            <div style={{fontSize:12,marginBottom:3}}>T2 ৳{s.str.t2}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT2}% sell</span></div>
                            {s.str.t3&&<div style={{fontSize:12,marginBottom:3}}>T3 ৳{s.str.t3}: <span style={{color:C.accent,fontWeight:700}}>{s.str.sellT3}% sell</span></div>}
                            <div style={{fontSize:12,color:C.red,marginBottom:6}}>SL: ৳{s.str.sl}</div>
                            {s.str.hasConflict&&s.str.conflictNote&&(
                              <div style={{background:"#FFC10718",border:"1px solid #FFC10744",borderRadius:6,padding:"6px 10px",marginBottom:6,fontSize:11,color:"#FFC107",lineHeight:1.6}}>{s.str.conflictNote}</div>
                            )}
                            <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{s.str.sellStr}</div>
                          </div>
                          {/* MA + Volume indicators */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:"#4FC3F7",fontWeight:700,marginBottom:8}}>📊 MA + Volume Analysis</div>
                            {[
                              ["EMA 20","৳"+(s.ema20||"N/A"),s.price>s.ema20?C.accent:C.red],
                              ["SMA 50","৳"+(s.sma50||"N/A"),s.price>s.sma50?C.accent:C.red],
                              ["Current Price","৳"+s.price,"#4FC3F7"],
                              ["Volume",(s.vol/1000000).toFixed(2)+"M",C.text],
                              ["VMA 20",(s.vma20?((s.vma20)/1000000).toFixed(2):"N/A")+"M",C.text],
                              ["Vol/VMA Ratio",s.vma20?(s.vol/s.vma20).toFixed(2)+"x":"N/A",s.vma20&&s.vol>s.vma20*2?C.orange:s.vma20&&s.vol>s.vma20?C.accent:C.muted],
                            ].map(([l,v,cl])=>(
                              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:C.muted}}>{l}</span><span style={{color:cl,fontWeight:600}}>{v}</span></div>
                            ))}
                            {s.str.isBreakoutVol&&<div style={{marginTop:6,background:C.orange+"22",borderRadius:4,padding:"3px 8px",fontSize:11,color:C.orange,fontWeight:700}}>🔥 Breakout Volume! VMA x{s.vma20?(s.vol/s.vma20).toFixed(1):""}</div>}
                          </div>
                          {/* Fundamentals */}
                          <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
                            <div style={{fontSize:12,color:C.yellow,fontWeight:700,marginBottom:8}}>💰 Fundamentals</div>
                            {[["EPS",s.eps],["P/E",s.pe>0?s.pe:"Negative"],["NAV",s.nav],["P/NAV",(s.nav>0?s.price/s.nav:0).toFixed(1)+"x"],["Div",s.div+"%"],["Inst",s.inst+"%"],["6M Ret",s.ret6m+"%"]].map(([l,v])=>(
                              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>{l}</span><span style={{color:C.text,fontWeight:600}}>{v}</span></div>
                            ))}
                            {s.str.holdNote&&<div style={{marginTop:6,fontSize:11,color:C.purple,fontWeight:600}}>👤{s.str.holdNote}</div>}
                          </div>
                        </div>

                        {/* ── Claude Analysis Note ── */}
                        {s.analysisNote&&(
                          <div style={{marginTop:10,background:"linear-gradient(135deg,#0A1628,#0D1F35)",borderRadius:10,border:"1px solid #00C89633",overflow:"hidden"}}>
                            <div style={{background:"linear-gradient(90deg,#00C89622,transparent)",padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
                              <div style={{fontSize:18}}>🧠</div>
                              <div>
                                <div style={{fontWeight:800,color:C.accent,fontSize:13}}>Claude Analysis Note</div>
                                <div style={{fontSize:10,color:C.muted}}>{s.analysisNote.chartPeriod||"Chart Analysis"} · {s.analysisNote.updatedBy||"Chart + Fundamental"}</div>
                              </div>
                            </div>
                            <div style={{padding:"0 14px 14px"}}>
                              {[
                                ["📈 Trend & Pattern",s.analysisNote.trend,"#4FC3F7"],
                                ["📊 Bollinger Bands",s.analysisNote.bb,"#CE93D8"],
                                ["⚡ RSI Analysis",s.analysisNote.rsiNote,"#FFC107"],
                                ["📉 MACD Analysis",s.analysisNote.macdNote,"#FF9800"],
                                ["📦 Volume Analysis",s.analysisNote.volumeNote,"#64B5F6"],
                                ["💰 Fundamentals",s.analysisNote.fundamental,"#FFD54F"],
                                ["🎯 Strategy",s.analysisNote.strategy,"#00C896"],
                              ].filter(([,v])=>v).map(([label,val,color])=>(
                                <div key={label} style={{borderTop:"1px solid #1A2D4A",paddingTop:8,marginTop:8}}>
                                  <div style={{fontSize:11,color:color,fontWeight:700,marginBottom:3}}>{label}</div>
                                  <div style={{fontSize:12,color:"#B0C4D8",lineHeight:1.7}}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
  );
}
