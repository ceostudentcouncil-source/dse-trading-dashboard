import { C } from "../constants.js";
import { inp } from "../utils/styleHelpers.js";

function Field({label,value,onChange,width}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:2}}>
      <span style={{fontSize:10,color:C.muted}}>{label}</span>
      <input type="number" value={value} onChange={e=>onChange(+e.target.value)}
        style={{...inp({width:width||80,textAlign:"center",color:C.yellow,fontWeight:700,background:"#FFF9C412",border:"1px solid "+C.yellow+"44"})}}/>
    </div>
  );
}

export default Field;
