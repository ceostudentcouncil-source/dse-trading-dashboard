import IndicatorCards from "./IndicatorCards.jsx";

function ChartModal({ stock, candles, chartType, setChartType, onClose, srLevels, taResult, chartLoading }) {
  const W = Math.min(window.innerWidth - 32, 700);
  const H = 320;
  const PAD = { top: 20, right: 60, bottom: 40, left: 10 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  if (!candles || candles.length === 0) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#0F1923",borderRadius:16,padding:24,width:"100%",maxWidth:400,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>📊</div>
          <div style={{color:"#E8EAF0",fontSize:14,marginBottom:8}}>{stock.name} Chart লোড হচ্ছে...</div>
          <div style={{color:"#4A6080",fontSize:12}}>DSE থেকে ৬০ দিনের data আনছি</div>
          <div style={{marginTop:12,height:4,background:"#1A2D4A",borderRadius:2}}><div style={{height:"100%",width:"60%",background:"#00C896",borderRadius:2,animation:"none"}}/></div>
          <button onClick={onClose} style={{marginTop:16,padding:"8px 20px",background:"#1A2D4A",border:"none",borderRadius:8,color:"#4A6080",cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>বন্ধ করুন</button>
        </div>
      </div>
    );
  }

  const allHighs = candles.map(c => c.high);
  const allLows = candles.map(c => c.low);
  let priceMin = Math.min(...allLows);
  let priceMax = Math.max(...allHighs);

  if (srLevels) {
    srLevels.supports.forEach(s => { priceMin = Math.min(priceMin, s.price); });
    srLevels.resistances.forEach(r => { priceMax = Math.max(priceMax, r.price); });
  }
  const priceRange = priceMax - priceMin || 1;
  const padding = priceRange * 0.05;
  priceMin -= padding; priceMax += padding;

  const toY = (price) => CH - ((price - priceMin) / (priceMax - priceMin)) * CH + PAD.top;
  const toX = (i) => (i / (candles.length - 1)) * CW + PAD.left;
  const barW = Math.max(2, Math.floor(CW / candles.length) - 1);

  const linePath = candles.map((c, i) => (i === 0 ? "M" : "L") + toX(i).toFixed(1) + "," + toY(c.close).toFixed(1)).join(" ");

  const priceTicks = 5;
  const priceLabels = Array.from({length: priceTicks}, (_, i) => {
    const price = priceMin + (priceMax - priceMin) * i / (priceTicks - 1);
    return { price: +price.toFixed(1), y: toY(price) };
  });

  const dateLabels = candles.filter((_, i) => i % Math.ceil(candles.length / 5) === 0).map((c, i, arr) => ({
    date: c.date ? c.date.slice(5) : "",
    x: toX(candles.indexOf(c))
  }));

  const currentPrice = candles[candles.length - 1].close;
  const priceColor = currentPrice >= candles[0].close ? "#00C896" : "#F44336";

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:"#0F1923",borderRadius:16,padding:16,width:"100%",maxWidth:720,marginTop:8}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>{stock.name} <span style={{fontSize:13,color:"#4A6080"}}>[{stock.cat}]</span></div>
            <div style={{fontSize:12,color:"#4A6080"}}>{stock.sector} · ৳{currentPrice} · {candles.length} দিনের data</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {["candlestick","line","ohlc"].map(t => (
              <button key={t} onClick={() => setChartType(t)}
                style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,
                  background: chartType===t ? "#00C896" : "#1A2D4A",
                  color: chartType===t ? "#fff" : "#4A6080",fontFamily:"inherit"}}>
                {t==="candlestick"?"🕯️":t==="line"?"📈":"📊"}
              </button>
            ))}
            <button onClick={onClose} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#F44336",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>✕</button>
          </div>
        </div>

        {taResult && (
          <div style={{background:taResult.masterBg,border:"2px solid "+taResult.masterColor+"88",borderRadius:12,padding:"12px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:17,color:taResult.masterColor}}>{taResult.masterSignal}</div>
                <div style={{fontSize:12,color:"#E8EAF0",marginTop:4,lineHeight:1.6}}>{taResult.actionDetail}</div>
              </div>
              <div style={{textAlign:"center",background:"#070D1A",borderRadius:10,padding:"8px 14px"}}>
                <div style={{fontSize:26,fontWeight:800,color:taResult.compositeScore>=0?"#00C896":"#F44336"}}>{taResult.compositeScore>0?"+":""}{taResult.compositeScore}</div>
                <div style={{fontSize:10,color:"#4A6080"}}>Composite Score</div>
                <div style={{fontSize:10,color:"#4A6080",marginTop:2}}>Buy {taResult.buyScore.toFixed(0)} | Sell {taResult.sellScore.toFixed(0)}</div>
              </div>
            </div>
            {taResult.isSideways&&(
              <div style={{background:"#FFC10718",borderRadius:6,padding:"6px 10px",fontSize:11,color:"#FFC107",fontWeight:700}}>
                📊 Sideways Range: {taResult.rangeWidth.toFixed(1)}% — BB strategy সেরা। Lower এ কিনুন, Upper এ বেচুন।
              </div>
            )}
            {taResult.isTrending&&(
              <div style={{background:"#00C89618",borderRadius:6,padding:"6px 10px",fontSize:11,color:"#00C896",fontWeight:700}}>
                📈 Trending Market — EMA20 ও MACD follow করুন। Trailing SL রাখুন।
              </div>
            )}
            {taResult.signals&&taResult.signals.some(s=>s.signal.includes("SELL")&&s.score>0)&&taResult.signals.some(s=>s.signal.includes("BUY")&&s.score>0)&&(
              <div style={{background:"#FF980018",borderRadius:6,padding:"6px 10px",marginTop:6,fontSize:11,color:"#FF9800"}}> 
⚠️ Mixed Signal — কিছু indicator BUY, কিছু SELL বলছে। নিচে প্রতিটির বিস্তারিত দেখুন।
              </div>
            )}
            <div style={{marginTop:8,fontSize:11,color:"#4A6080"}}>
              📌 Data source: {taResult.indicators&&taResult.indicators.rsi?"আপনার enter করা RSI/MACD/EMA + Bollinger Bands":"Calculated from chart"}
            </div>
          </div>
        )}

        {srLevels && srLevels.sellSignal && (
          <div style={{background:"#F4433622",border:"1px solid #F44336",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:13,color:"#F44336",fontWeight:700,textAlign:"center"}}>
            {srLevels.sellSignal}
          </div>
        )}

        <div style={{background:"#070D1A",borderRadius:10,padding:"4px 0",overflowX:"auto"}}>
          <svg width={W} height={H} style={{display:"block"}}>
            {priceLabels.map((tick, i) => (
              <g key={i}>
                <line x1={PAD.left} y1={tick.y} x2={PAD.left+CW} y2={tick.y} stroke="#1A2D4A" strokeWidth="1" strokeDasharray="3,3"/>
                <text x={PAD.left+CW+4} y={tick.y+4} fontSize="9" fill="#4A6080">{tick.price}</text>
              </g>
            ))}

            {dateLabels.map((dl, i) => (
              <text key={i} x={dl.x} y={H-6} fontSize="9" fill="#4A6080" textAnchor="middle">{dl.date}</text>
            ))}

            {srLevels && srLevels.supports.map((s, i) => {
              const y = toY(s.price);
              const isStrong = srLevels.strongSupport && Math.abs(srLevels.strongSupport.price - s.price) < 0.01;
              return (
                <g key={"sup"+i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left+CW} y2={y} stroke={isStrong?"#00C896":"#00C89666"} strokeWidth={isStrong?2:1} strokeDasharray={isStrong?"":"5,3"}/>
                  <rect x={PAD.left+CW-2} y={y-8} width={58} height={16} fill="#070D1A" rx="3"/>
                  <text x={PAD.left+CW+2} y={y+4} fontSize="9" fill={isStrong?"#00C896":"#00C89699"} fontWeight={isStrong?"bold":"normal"}>
                    {isStrong?"🟢S":"S"} ৳{s.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {srLevels && srLevels.resistances.map((r, i) => {
              const y = toY(r.price);
              const isStrong = srLevels.strongResistance && Math.abs(srLevels.strongResistance.price - r.price) < 0.01;
              return (
                <g key={"res"+i}>
                  <line x1={PAD.left} y1={y} x2={PAD.left+CW} y2={y} stroke={isStrong?"#F44336":"#F4433666"} strokeWidth={isStrong?2:1} strokeDasharray={isStrong?"":"5,3"}/>
                  <rect x={PAD.left+CW-2} y={y-8} width={58} height={16} fill="#070D1A" rx="3"/>
                  <text x={PAD.left+CW+2} y={y+4} fontSize="9" fill={isStrong?"#F44336":"#F4433699"} fontWeight={isStrong?"bold":"normal"}>
                    {isStrong?"🔴R":"R"} ৳{r.price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            <line x1={PAD.left} y1={toY(currentPrice)} x2={PAD.left+CW} y2={toY(currentPrice)} stroke={priceColor} strokeWidth="1" strokeDasharray="4,2" opacity="0.6"/>

            {chartType==="line" && (
              <path d={linePath} fill="none" stroke="#00C896" strokeWidth="2"/>
            )}

            {chartType==="candlestick" && candles.map((c, i) => {
              const x = toX(i);
              const openY = toY(c.open);
              const closeY = toY(c.close);
              const highY = toY(c.high);
              const lowY = toY(c.low);
              const isBull = c.close >= c.open;
              const color = isBull ? "#00C896" : "#F44336";
              const bodyTop = Math.min(openY, closeY);
              const bodyH = Math.max(1, Math.abs(closeY - openY));
              return (
                <g key={i}>
                  <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1"/>
                  <rect x={x-barW/2} y={bodyTop} width={barW} height={bodyH} fill={color} opacity="0.9"/>
                </g>
              );
            })}

            {chartType==="ohlc" && candles.map((c, i) => {
              const x = toX(i);
              const isBull = c.close >= c.open;
              const color = isBull ? "#00C896" : "#F44336";
              return (
                <g key={i}>
                  <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1.5"/>
                  <line x1={x-barW} y1={toY(c.open)} x2={x} y2={toY(c.open)} stroke={color} strokeWidth="1.5"/>
                  <line x1={x} y1={toY(c.close)} x2={x+barW} y2={toY(c.close)} stroke={color} strokeWidth="1.5"/>
                </g>
              );
            })}
          </svg>
        </div>

        {srLevels && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
            <div style={{background:"#070D1A",borderRadius:8,padding:12}}>
              <div style={{fontWeight:700,color:"#00C896",marginBottom:8,fontSize:13}}>🟢 Support Levels</div>
              {srLevels.supports.length===0 && <div style={{color:"#4A6080",fontSize:12}}>কোনো support নেই</div>}
              {srLevels.supports.sort((a,b)=>b.price-a.price).map((s,i)=>{
                const isStrong = srLevels.strongSupport && Math.abs(srLevels.strongSupport.price-s.price)<0.01;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:isStrong?"#00C896":"#4A6080"}}>{isStrong?"⭐ Strong":"·"} ৳{s.price.toFixed(2)}</span>
                    <span style={{color:"#4A6080"}}>{s.touches}x touch</span>
                  </div>
                );
              })}
            </div>
            <div style={{background:"#070D1A",borderRadius:8,padding:12}}> 
<div style={{fontWeight:700,color:"#F44336",marginBottom:8,fontSize:13}}>🔴 Resistance Levels</div>
              {srLevels.resistances.length===0 && <div style={{color:"#4A6080",fontSize:12}}>কোনো resistance নেই</div>}
              {srLevels.resistances.sort((a,b)=>a.price-b.price).map((r,i)=>{
                const isStrong = srLevels.strongResistance && Math.abs(srLevels.strongResistance.price-r.price)<0.01;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:isStrong?"#F44336":"#4A6080"}}>{isStrong?"⭐ Strong":"·"} ৳{r.price.toFixed(2)}</span>
                    <span style={{color:"#4A6080"}}>{r.touches}x touch</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {taResult && taResult.signals && taResult.signals.length > 0 && (
          <div style={{marginTop:12}}>
            <div style={{fontWeight:700,color:"#E8EAF0",marginBottom:8,fontSize:13}}>📊 Technical Indicators Score Card</div>
            <IndicatorCards signals={taResult.signals}/>

            <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:8}}>
              <div style={{fontWeight:700,color:"#FFC107",marginBottom:6,fontSize:12}}>📈 Key Indicator Values</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6}}>
                {[
                  ["RSI",taResult.indicators.rsi,taResult.indicators.rsi>70?"#F44336":taResult.indicators.rsi<30?"#00C896":"#FFC107"],
                  ["EMA 20",taResult.indicators.ema20,"#4FC3F7"],
                  ["EMA 50",taResult.indicators.ema50,"#4FC3F7"],
                  ["BB Upper",taResult.indicators.bb?taResult.indicators.bb.upper:"-","#F44336"],
                  ["BB Lower",taResult.indicators.bb?taResult.indicators.bb.lower:"-","#00C896"],
                  ["Stoch K",taResult.indicators.stoch?taResult.indicators.stoch.k:"-",taResult.indicators.stoch&&taResult.indicators.stoch.k>80?"#F44336":taResult.indicators.stoch&&taResult.indicators.stoch.k<20?"#00C896":"#FFC107"],
                  ["W%R",taResult.indicators.willR,taResult.indicators.willR<-80?"#00C896":taResult.indicators.willR>-20?"#F44336":"#4A6080"],
                  ["CCI",taResult.indicators.cci,taResult.indicators.cci>100?"#F44336":taResult.indicators.cci<-100?"#00C896":"#4A6080"],
                  ["VWAP",taResult.indicators.vwap,"#9C27B0"],
                  ["ADX",taResult.indicators.adxData?taResult.indicators.adxData.adx:"-",taResult.indicators.adxData&&taResult.indicators.adxData.adx>25?"#00C896":"#4A6080"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{background:"#0A1628",borderRadius:6,padding:"5px 8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#4A6080",marginBottom:2}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:color}}>{val!==null&&val!==undefined?val:"-"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"#070D1A",borderRadius:8,padding:10,marginTop:8}}>
              <div style={{fontWeight:700,color:"#E8EAF0",marginBottom:8,fontSize:12}}>⚖️ Buy vs Sell Pressure</div>
              {(()=>{
                const totalPts=(taResult.buyScore||0)+(taResult.sellScore||0)||1;
                const buyPct=Math.round((taResult.buyScore||0)/totalPts*100);
                const sellPct=Math.round((taResult.sellScore||0)/totalPts*100);
                return(
                  <div>
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#00C896",fontWeight:700}}>🟢 Buy Signal</span>
                        <span style={{fontSize:11,color:"#00C896",fontWeight:700}}>{taResult.buyScore.toFixed(0)} pts ({buyPct}%)</span>
                      </div>
                      <div style={{height:10,background:"#1A2D4A",borderRadius:5}}>
                        <div style={{height:"100%",width:buyPct+"%",background:"linear-gradient(90deg,#00C896,#4CAF50)",borderRadius:5,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#F44336",fontWeight:700}}>🔴 Sell Signal</span>
                        <span style={{fontSize:11,color:"#F44336",fontWeight:700}}>{taResult.sellScore.toFixed(0)} pts ({sellPct}%)</span>
                      </div>
                      <div style={{height:10,background:"#1A2D4A",borderRadius:5}}>
                        <div style={{height:"100%",width:sellPct+"%",background:"linear-gradient(90deg,#F44336,#FF9800)",borderRadius:5,transition:"width 0.5s"}}/>
                      </div>
                    </div>
                    <div style={{marginTop:8,textAlign:"center",fontSize:12,fontWeight:700,color:buyPct>sellPct?"#00C896":sellPct>buyPct?"#F44336":"#FFC107"}}>
                      {buyPct>sellPct?"✅ Overall: Buy Dominant":sellPct>buyPct?"🔴 Overall: Sell Dominant":"⚪ Overall: Balanced"}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {srLevels && srLevels.strongResistance && (
          <div style={{marginTop:10,background:"#0A1628",borderRadius:8,padding:12,fontSize:12}}>
            <div style={{fontWeight:700,color:"#FFC107",marginBottom:6}}>📊 Sell Signal Analysis</div>
            <div style={{color:"#E8EAF0",lineHeight:1.8}}>
              <div>Current Price: <span style={{color:"#4FC3F7",fontWeight:700}}>৳{currentPrice}</span></div>
              {srLevels.strongResistance && <div>Strong Resistance: <span style={{color:"#F44336",fontWeight:700}}>৳{srLevels.strongResistance.price.toFixed(2)}</span> ({srLevels.strongResistance.touches}x tested)</div>}
              {srLevels.strongSupport && <div>Strong Support: <span style={{color:"#00C896",fontWeight:700}}>৳{srLevels.strongSupport.price.toFixed(2)}</span> ({srLevels.strongSupport.touches}x tested)</div>}
              {srLevels.strongResistance && <div style={{marginTop:4,color:"#FFC107"}}>Resistance থেকে দূরত্ব: <span style={{fontWeight:700}}>{((srLevels.strongResistance.price-currentPrice)/currentPrice*100).toFixed(1)}%</span></div>}
              {srLevels.strongSupport && <div style={{color:"#00C896"}}>Support থেকে দূরত্ব: <span style={{fontWeight:700}}>{((currentPrice-srLevels.strongSupport.price)/currentPrice*100).toFixed(1)}%</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartModal;              
