import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { card, btn } from "../utils/styleHelpers.js";
import { listenToBroadcasts, respondToBroadcast, getMyResponse } from "../services/broadcastService.js";

// ══════════════════════════════════════════════════════════════
// BROADCAST HISTORY (follow-up to #4)
// Lives permanently in the user's Dashboard tab — unlike the popup
// NotificationBanner, this never disappears when dismissed, so users
// can always scroll back and see every admin suggestion with its
// exact date/time, and mark seen/followed at their own pace.
// ══════════════════════════════════════════════════════════════

const ACTION_META = {
  buy:           { label: "📥 BUY",          color: C.accent },
  sell:          { label: "📤 SELL",         color: C.red },
  partial_sell:  { label: "🔶 PARTIAL SELL", color: C.orange },
};

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
  const timePart = d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  return datePart + " · " + timePart;
}

export default function BroadcastHistory({ user }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [myResponses, setMyResponses] = useState({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsub = listenToBroadcasts(setBroadcasts);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    broadcasts.forEach((b) => {
      if (myResponses[b.id] !== undefined) return;
      getMyResponse(b.id, user.uid).then((r) => {
        setMyResponses((prev) => ({ ...prev, [b.id]: r ? r.status : null }));
      });
    });
  }, [broadcasts, user]);

  const handleRespond = async (id, status) => {
    if (!user) return;
    await respondToBroadcast(id, user.uid, user.displayName || user.email, status);
    setMyResponses((prev) => ({ ...prev, [id]: status }));
  };

  const visible = showAll ? broadcasts : broadcasts.slice(0, 5);

  return (
    <div style={{ ...card(), padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: C.accent, fontSize: 14 }}>👑 Admin Suggestions ({broadcasts.length})</div>
        {broadcasts.length > 5 && (
          <button onClick={() => setShowAll((s) => !s)} style={btn(C.blue, false, true)}>
            {showAll ? "কম দেখান" : "সব দেখান"}
          </button>
        )}
      </div>
      {broadcasts.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 12 }}>এখনো কোনো admin suggestion আসেনি।</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((b) => {
            const meta = ACTION_META[b.action] || ACTION_META.buy;
            const myStatus = myResponses[b.id];
            return (
              <div key={b.id} style={{ background: "#070D1A", borderRadius: 10, padding: 12, border: "1px solid " + meta.color + "44" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ background: meta.color + "22", color: meta.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{meta.label}</span>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{b.stock}</span>
                  {b.targetPrice != null && <span style={{ fontSize: 11, color: C.muted }}>@ ৳{b.targetPrice}</span>}
                  {b.percentage != null && <span style={{ fontSize: 11, color: C.muted }}>({b.percentage}%)</span>}
                </div>
                {b.message && <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{b.message}</div>}
                <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <button onClick={() => handleRespond(b.id, "seen")} disabled={myStatus === "seen" || myStatus === "followed"}
                    style={{ ...btn(C.blue, myStatus === "seen", true), opacity: myStatus === "followed" ? 0.5 : 1 }}>
                    {myStatus === "seen" || myStatus === "followed" ? "✅ দেখেছি" : "👁️ দেখেছি"}
                  </button>
                  <button onClick={() => handleRespond(b.id, "followed")} disabled={myStatus === "followed"}
                    style={btn(C.accent, myStatus === "followed", true)}>
                    {myStatus === "followed" ? "✅ Follow করেছি" : "📌 Follow করলাম"}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>👑 {b.createdBy || "Admin"} · {formatDateTime(b.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
