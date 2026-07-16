import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";
import { listenToBroadcasts, getDismissedIds, dismissBroadcast, respondToBroadcast, getMyResponse } from "../services/broadcastService.js";

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BANNER (#4 fix + follow-up)
// Subscribes to live broadcasts and shows any that this user
// hasn't dismissed yet. Lets the user mark each one as "seen" or
// "followed" (acted on it) — tracked per-user in Firestore so the
// admin can see live follow counts. Dismissing only hides the popup;
// the broadcast still lives permanently in Dashboard history.
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

export default function NotificationBanner({ user }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissedIds());
  const [myResponses, setMyResponses] = useState({}); // { [broadcastId]: "seen"|"followed" }

  useEffect(() => {
    const unsub = listenToBroadcasts((docs) => {
      // Newest first, only keep the last 20 to avoid unbounded growth
      setBroadcasts(docs.slice(0, 20));
    });
    return unsub;
  }, []);

  // Load this user's existing response status for each visible broadcast,
  // so buttons reflect prior action instead of resetting on every render.
  useEffect(() => {
    if (!user) return;
    broadcasts.forEach((b) => {
      if (myResponses[b.id] !== undefined) return;
      getMyResponse(b.id, user.uid).then((r) => {
        setMyResponses((prev) => ({ ...prev, [b.id]: r ? r.status : null }));
      });
    });
  }, [broadcasts, user]);

  const visible = broadcasts.filter((b) => !dismissed.includes(b.id));

  const handleDismiss = (id) => {
    dismissBroadcast(id);
    setDismissed((prev) => [...prev, id]);
  };

  const handleRespond = async (id, status) => {
    if (!user) return;
    await respondToBroadcast(id, user.uid, user.displayName || user.email, status);
    setMyResponses((prev) => ({ ...prev, [id]: status }));
  };

  if (visible.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10002, width: "100%", maxWidth: 480, padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {visible.map((b) => {
        const meta = ACTION_META[b.action] || ACTION_META.buy;
        const myStatus = myResponses[b.id];
        return (
          <div key={b.id} style={{ background: "#0F1923", border: "1px solid " + meta.color + "66", borderRadius: 12, padding: "12px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: meta.color + "22", color: meta.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{meta.label}</span>
              <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{b.stock}</span>
              {b.targetPrice != null && <span style={{ fontSize: 12, color: C.muted }}>@ ৳{b.targetPrice}</span>}
              {b.percentage != null && <span style={{ fontSize: 12, color: C.muted }}>({b.percentage}%)</span>}
              <button onClick={() => handleDismiss(b.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>
            {b.message && <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{b.message}</div>}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
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
  );
}
