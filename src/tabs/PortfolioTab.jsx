import { C, TODAY, DEFAULT_BROKERS } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { staleness } from "../utils/dateHelpers.js";
import StockSearch from "../components/StockSearch.jsx";
import Field from "../components/Field.jsx";
import SellModal from "../components/SellModal.jsx";

// ══════════════════════════════════════════════════════════════
// PORTFOLIO TAB
// Presentational — all state/handlers owned by App.jsx.
// ══════════════════════════════════════════════════════════════
export default function PortfolioTab({
  summ, port, stocks, enriched, days, profile, isAdmin,
  showPortPaste, setShowPortPaste, portPasteCode, setPortPasteCode, portPasteErr, setPortPasteErr,
  portPasteBroker, setPortPasteBroker, applyPortPaste,
  showAddP, setShowAddP, np, setNp, npSearch, setNpSearch, selectStockForPort, addPosition,
  editPort, setEditPort, updatePort, recordSell, getBrokerComm, confirmDelete, showToast,
}) {
  // Bug fix: this used to read the static BROKERS constant, so a
  // broker the user (or admin) added in Settings never showed up
  // here — now it reads the user's actual, live broker list.
  const myBrokers = (profile && profile.brokers && profile.brokers.length > 0) ? profile.brokers : DEFAULT_BROKERS;
  return (
          <div>
            {/* Summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:14}}>
              {[["মোট Investment","৳"+summ.tc.toLocaleString("en",{maximumFractionDigits:0}),"#4FC3F7"],["Current Value","৳"+summ.tv.toLocaleString("en",{maximumFractionDigits:0}),C.accent],["Unrealized",(summ.tpl>=0?"+":"")+"৳"+summ.tpl.toFixed(0),summ.tpl>=0?C.accent:C.red],["Realized","৳"+summ.tr.toFixed(0),C.yellow]].map(([l,v,cl])=>(
                <div key={l} style={{...card(),padding:12,textAlign:"center"}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:17,fontWeight:800,color:cl}}>{v}</div></div>
              ))}
            </div>

            {/* Broker */}
            <div style={{...card(),padding:12,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                <div style={{fontWeight:700,color:C.accent,fontSize:13}}>🏦 Broker-wise</div>
                <div style={{fontSize:11,color:C.muted}}>📤 Export → Claude এ paste → update → Import</div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(summ.byB).map(([br,d])=>{
                  const brPos=port.filter(p=>p.broker===br);
                  const exportJ=JSON.stringify(brPos.map(p=>({stock:p.stock,broker:p.broker,shares:p.shares,buyRate:p.buyRate,currentPrice:p.currentPrice,target1:p.target1,target2:p.target2,stopLoss:p.stopLoss})),null,2);
                  return(
                    <div key={br} style={{background:"#070D1A",borderRadius:8,padding:"10px 14px",border:"1px solid "+C.border}}>
                      <div style={{fontWeight:700,color:"#4FC3F7",fontSize:12}}>{br}</div>
                      <div style={{fontSize:11,color:C.muted}}>{d.n} pos</div>
                      <div style={{fontSize:12,fontWeight:700,color:(d.val-d.cost)>=0?C.accent:C.red,marginBottom:6}}>{(d.val-d.cost)>=0?"+":""}৳{(d.val-d.cost).toFixed(0)}</div>
                      <button onClick={()=>{if(navigator.clipboard){navigator.clipboard.writeText(exportJ).then(()=>showToast("✅ "+br+" JSON copied!")).catch(()=>{setPortPasteCode(exportJ);setShowPortPaste(true);});}else{setPortPasteCode(exportJ);setShowPortPaste(true);}}}
                        style={{padding:"3px 8px",background:C.purple+"22",color:C.purple,border:"none",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",width:"100%"}}>📤 Export</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:14}}>💼 Positions ({port.length}) · {days}d strategy</div>
              <div style={{display:"flex",gap:8}}>
                {isAdmin&&<button onClick={()=>{setShowPortPaste(!showPortPaste);setShowAddP(false);}} style={btn(C.purple,showPortPaste)}>📋 JSON Import</button>}
                <button onClick={()=>{setShowAddP(!showAddP);setShowPortPaste(false);}} style={btn(C.blue,showAddP)}>+ Manual যোগ</button>
              </div>
            </div>

            {/* Port Paste */}
            {isAdmin&&showPortPaste&&(
              <div style={{...card(),padding:20,marginBottom:12,border:"1px solid "+C.purple}}>
                <div style={{fontWeight:700,color:"#CE93D8",fontSize:15,marginBottom:6}}>📋 Portfolio JSON Import</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>
                  Claude কে বলুন: <span style={{color:"#CE93D8",fontWeight:700}}>"আমার Ecosoft এ EPGL ৭৩০০ শেয়ার ১৯.২৬ টাকায় — JSON দাও"</span>
                </div>
                <div style={{background:"#070D1A",borderRadius:8,padding:10,marginBottom:12,fontSize:11}}>
                  <div style={{color:C.yellow,fontWeight:700,marginBottom:4}}>📌 Single:</div>
                  <div style={{color:"#CE93D8",fontFamily:"monospace"}}>{"{"}"stock":"EPGL","broker":"Ecosoft","shares":7300,"buyRate":19.26{"}"}</div>
                  <div style={{color:C.yellow,fontWeight:700,marginTop:8,marginBottom:4}}>📌 Batch:</div>
                  <div style={{color:"#CE93D8",fontFamily:"monospace"}}>[{"{"}"stock":"EPGL","shares":7300,"buyRate":19.26{"}"},{"{"}"stock":"LOVELLO","shares":9630{"}"} ]</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:12,color:C.muted}}>Default Broker:</span>
                  <select value={portPasteBroker} onChange={e=>setPortPasteBroker(e.target.value)} style={inp()}>
                    {myBrokers.map(b=><option key={b.id||b} value={b.id||b}>{b.name||b}</option>)}
                  </select>
                </div>
                <textarea value={portPasteCode} onChange={e=>{setPortPasteCode(e.target.value);setPortPasteErr("");}}
                  placeholder="এখানে JSON paste করুন..."
                  style={{width:"100%",height:130,background:"#070D1A",border:"1px solid "+(portPasteErr?"#F44336":C.purple+"44"),borderRadius:8,color:"#CE93D8",padding:12,fontSize:13,fontFamily:"monospace",resize:"vertical",boxSizing:"border-box",outline:"none"}}/>
                {portPasteErr&&<div style={{color:C.red,fontSize:12,marginTop:6,fontWeight:600}}>{portPasteErr}</div>}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={applyPortPaste} style={btn(C.purple,true)}>✅ Apply</button>
                  <button onClick={()=>{setShowPortPaste(false);setPortPasteCode("");setPortPasteErr("");}} style={btn(C.muted)}>বাতিল</button>
                </div>
              </div>
            )}

            {/* Manual Add */}
            {showAddP&&(
              <div style={{...card(),padding:16,marginBottom:12,border:"1px solid "+C.blue}}>
                <div style={{fontWeight:700,color:C.blue,marginBottom:12,fontSize:14}}>নতুন Position</div>
                <div style={{marginBottom:12}}><StockSearch stocks={stocks} value={npSearch} onChange={v=>{setNpSearch(v);setNp(p=>Object.assign({},p,{stock:v}));}} onSelect={selectStockForPort}/></div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:10}}>
                  {[["shares","Shares*"],["buyRate","Buy Rate*"],["target1","Target 1"],["target2","Target 2"],["stopLoss","Stop Loss"],["customSellTarget","Custom Target"]].map(([k,l])=>(
                    <div key={k}><div style={{fontSize:11,color:C.muted,marginBottom:3}}>{l}</div><input type="number" value={np[k]} onChange={e=>setNp(p=>Object.assign({},p,{[k]:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  ))}
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Buy Date</div><input type="date" value={np.buyDate||TODAY} onChange={e=>setNp(p=>Object.assign({},p,{buyDate:e.target.value}))} style={{...inp({width:"100%",boxSizing:"border-box"})}}/></div>
                  <div><div style={{fontSize:11,color:C.muted,marginBottom:3}}>Broker</div><select value={np.broker} onChange={e=>setNp(p=>Object.assign({},p,{broker:e.target.value}))} style={inp({width:"100%"})}>{myBrokers.map(b=><option key={b.id||b} value={b.id||b}>{b.name||b}</option>)}</select></div>
                </div>
                {np.stock&&np.buyRate&&<div style={{fontSize:12,color:C.muted,marginBottom:10}}>Investment: <span style={{color:C.yellow,fontWeight:700}}>৳{((+np.shares||0)*(+np.buyRate||0)).toLocaleString()}</span></div>}
                <div style={{display:"flex",gap:8}}><button onClick={addPosition} style={btn(C.accent,true)}>✅ যোগ</button><button onClick={()=>{setShowAddP(false);setNpSearch("");}} style={btn(C.muted)}>বাতিল</button></div>
              </div>
            )}

            {/* Portfolio List */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {enriched.map(p=>{
                const sData=p.sData;const str=p.str;
                return(
                  <div key={p.id} style={{...card(),border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.border)}}>
                    <div style={{padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{p.stock} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{p.broker}</span></div>
                          <div style={{fontSize:11,color:C.muted,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:2}}>
                            <span>{p.shares.toLocaleString()} shares · Buy ৳{p.buyRate}</span>
                            {p.buyDate&&<span style={{color:"#CE93D8"}}>📅 {new Date(p.buyDate).toLocaleDateString("bn-BD")} ({p.holdDays}d)</span>}
                            {sData&&(()=>{const st=staleness(sData.updatedAt);return <span style={{color:st.color,fontWeight:600}}>· {st.label}</span>;})()}
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700,fontSize:10}}>🔒 TSL Active</span>}
                            {sData&&sData.str&&<span style={{color:sData.str.maSignal.includes("🟢")?C.accent:C.yellow,fontSize:10}}>{sData.str.maSignal}</span>}
                          </div>
                          {p.customSellTarget&&<div style={{fontSize:11,color:C.purple,marginTop:2}}>🎯 Custom Target: ৳{p.customSellTarget}</div>}
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:12,color:"#4FC3F7",fontWeight:700}}>৳{p.currentPrice}</div>
                          {p.liveChangePct!==null&&p.liveChangePct!==undefined&&<div style={{fontSize:10,color:p.liveChangePct>=0?C.accent:C.red,fontWeight:700}}>{p.liveChangePct>=0?"+":""}{p.liveChangePct.toFixed(2)}%</div>}
                          <div style={{fontWeight:800,fontSize:15,color:p.pl>=0?C.accent:C.red}}>{p.pl>=0?"+":""}৳{p.pl.toFixed(0)}</div>
                          <div style={{fontSize:11,color:p.pl>=0?C.accent:C.red}}>{p.plp.toFixed(1)}%</div>
                        </div>
                        <div style={{background:p.sig.includes("STOP")?C.red+"22":p.sig.includes("SELL")?C.accent+"22":C.muted+"22",border:"1px solid "+(p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted)+"44",borderRadius:8,padding:"5px 10px",fontWeight:700,fontSize:12,color:p.sig.includes("STOP")?C.red:p.sig.includes("SELL")?C.accent:C.muted}}>{p.sig}</div>
                        <div style={{fontSize:11,fontWeight:700,color:str.risk.includes("LOW")?C.accent:str.risk.includes("HIGH")?C.red:C.yellow}}>{str.risk}</div>
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>setEditPort(editPort===p.id?null:p.id)} style={btn(C.yellow,editPort===p.id,true)}>✏️</button>
                          <SellModal pos={Object.assign({},p,{str:str})} onSell={recordSell} brokerComm={getBrokerComm(p.broker)}/>
                          <button onClick={()=>confirmDelete(p)} style={btn(C.red,false,true)}>✕</button>
                        </div>
                      </div>
                      {editPort===p.id?(
                        <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:4}}>
                          <div style={{fontSize:11,color:C.yellow,fontWeight:700,marginBottom:8}}>✏️ Update:</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
                            <Field label="Current Price" value={p.currentPrice} onChange={v=>updatePort(p.id,"currentPrice",v)} width={88}/>
                            <Field label="Target 1" value={p.target1} onChange={v=>updatePort(p.id,"target1",v)} width={78}/>
                            <Field label="Target 2" value={p.target2} onChange={v=>updatePort(p.id,"target2",v)} width={78}/>
                            <Field label="Stop Loss" value={p.stopLoss} onChange={v=>updatePort(p.id,"stopLoss",v)} width={78}/>
                            <Field label="Custom Target" value={p.customSellTarget||0} onChange={v=>updatePort(p.id,"customSellTarget",v)} width={90}/>
                            <button onClick={()=>{setEditPort(null);showToast("✅ "+p.stock+" saved!");}} style={{...btn(C.accent,true),marginBottom:2}}>✅ Save</button>
                          </div>
                        </div>
                      ):(
                        <div>
                          <div style={{display:"flex",gap:12,fontSize:12,marginBottom:4,flexWrap:"wrap"}}>
                            <span style={{color:C.muted}}>T1: <span style={{color:C.accent,fontWeight:700}}>৳{str.t1||p.target1}</span> <span style={{color:C.muted,fontSize:10}}>({str.sellT1}%)</span></span>
                            <span style={{color:C.muted}}>T2: <span style={{color:C.accent,fontWeight:700}}>৳{str.t2||p.target2}</span> <span style={{color:C.muted,fontSize:10}}>({str.sellT2}%)</span></span>
                            {str.t3&&<span style={{color:C.muted}}>T3: <span style={{color:C.accent,fontWeight:700}}>৳{str.t3}</span></span>}
                            <span style={{color:C.muted}}>SL: <span style={{color:C.red,fontWeight:700}}>৳{p.stopLoss}</span></span>
                            {p.isTSLActive&&<span style={{color:C.orange,fontWeight:700}}>🔒 TSL: ৳{p.tsl.toFixed(2)} (profit locked!)</span>}
                            <span style={{color:C.muted}}>Cost: ৳{p.cost.toFixed(0)}</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}><span style={{color:C.orange,fontWeight:600}}>💡 </span>{str.sellStr}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
  );
}
