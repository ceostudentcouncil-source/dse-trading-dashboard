import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";
import { listenToBroadcasts, getDismissedIds, dismissBroadcast } from "../services/broadcastService.js";

// ══════════════════════════════════════════════════════════════
// NOTIFICATION BANNER (#4 fix)
// Subscribes to live broadcasts and shows any that this user
// hasn't dismissed yet. Stacks multiple active broadcasts.
// ══════════════════════════════════════════════════════════════

const ACTION_META = {
  buy:           { label: "📥 BUY",          color: C.accent },
  sell:          { label: "📤 SELL",         color: C.red },
  partial_sell:  { label: "🔶 PARTIAL SELL", color: C.orange },
};

export default function NotificationBanner() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissedIds());

  useEffect(() => {
    const unsub = listenToBroadcasts((docs) => {
      // Newest first, only keep the last 20 to avoid unbounded growth
      setBroadcasts(docs.slice(0, 20));
    });
    return unsub;
  }, []);

  const visible = broadcasts.filter((b) => !dismissed.includes(b.id));

  const handleDismiss = (id) => {
    dismissBroadcast(id);
    setDismissed((prev) => [...prev, id]);
  };

  if (visible.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10002, width: "100%", maxWidth: 480, padding: "0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {visible.map((b) => {
        const meta = ACTION_META[b.action] || ACTION_META.buy;
        return (
          <div key={b.id} style={{ background: "#0F1923", border: "1px solid " + meta.color + "66", borderRadius: 12, padding: "12px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ background: meta.color + "22", color: meta.color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{meta.label}</span>
              <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{b.stock}</span>
              {b.targetPrice != null && <span style={{ fontSize: 12, color: C.muted }}>@ ৳{b.targetPrice}</span>}
              {b.percentage != null && <span style={{ fontSize: 12, color: C.muted }}>({b.percentage}%)</span>}
              <button onClick={() => handleDismiss(b.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>
            {b.message && <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{b.message}</div>}
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>👑 Admin · {b.createdAt ? new Date(b.createdAt).toLocaleString("bn-BD") : ""}</div>
          </div>
        );
      })}
    </div>
  );
}
