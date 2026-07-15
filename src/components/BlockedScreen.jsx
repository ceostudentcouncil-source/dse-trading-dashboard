import { C } from "../constants.js";
import { card, btn } from "../utils/styleHelpers.js";

function BlockedScreen({profile,onSignOut}){
  return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{...card(),padding:32,width:"100%",maxWidth:380,textAlign:"center",border:"2px solid "+C.red}}>
        <div style={{fontSize:56,marginBottom:12}}>🔒</div>
        <div style={{fontWeight:800,fontSize:20,color:C.red,marginBottom:8}}>Account Blocked</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.8}}>
          আপনার মাসিক subscription মেয়াদ শেষ হয়েছে।<br/>
          Admin এর সাথে যোগাযোগ করুন।
        </div>
        {profile&&profile.lastPaymentDate&&(
          <div style={{background:"#070D1A",borderRadius:8,padding:12,marginBottom:16,fontSize:12}}>
            <div style={{color:C.muted}}>শেষ payment: <span style={{color:C.yellow}}>{profile.lastPaymentDate}</span></div>
            <div style={{color:C.muted}}>Amount: <span style={{color:C.accent}}>৳{profile.lastPaymentAmount||0}</span></div>
          </div>
        )}
        <div style={{fontSize:12,color:C.muted,marginBottom:16}}>
          📱 WhatsApp: Admin এর সাথে যোগাযোগ করুন
        </div>
        <button onClick={onSignOut} style={{...btn(C.red,true),width:"100%",padding:12}}>🚪 Sign Out</button>
      </div>
    </div>
  );
}

export default BlockedScreen;
