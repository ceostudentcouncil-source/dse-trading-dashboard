import { useState, useEffect, useRef } from "react";
import { C } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { sendMessage, listenToMessages, deleteMessage, listenToChatSettings } from "../services/chatService.js";

// ══════════════════════════════════════════════════════════════
// CHAT PANEL (5A — group chat foundation)
// One shared group room. Respects the global chat mode:
//   "open"     — active, non-blocked users can post; admin too
//   "readonly" — only admin can post; everyone else just reads
//   "closed"   — nobody can read (panel shows a closed notice)
// A blocked account (profile.isActive === false) never reaches
// this screen at all — App.jsx's BlockedScreen gate catches that
// earlier, so this component only has to handle the chat-specific
// restrictions (mode + per-user chatEnabled flag).
// ══════════════════════════════════════════════════════════════

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  return datePart + " · " + timePart;
}

const MODE_LABEL = {
  open: { text: "🟢 সবার জন্য খোলা", color: C.accent },
  readonly: { text: "🟡 শুধু Admin লিখতে পারবে", color: C.yellow },
  closed: { text: "🔴 চ্যাট বন্ধ", color: C.red },
};

export default function ChatPanel({ user, profile, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [chatSettings, setChatSettings] = useState({ mode: "open" });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const unsub = listenToMessages((docs) => {
      setMessages([...docs].reverse()); // oldest first, natural chat order
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = listenToChatSettings(setChatSettings);
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const mode = chatSettings?.mode || "open";
  const individuallyBlocked = profile?.chatEnabled === false;

  // Can this user post right now, given mode + their own flag?
  const canWrite = isAdmin
    ? mode !== "closed"
    : mode === "open" && !individuallyBlocked;

  const canRead = mode !== "closed";

  const handleSend = async () => {
    if (!text.trim() || !canWrite) return;
    setSending(true);
    await sendMessage(user.uid, user.displayName || user.email, user.photoURL, text);
    setText("");
    setSending(false);
  };

  const handleDelete = async (id) => {
    await deleteMessage(id);
  };

  if (!canRead) {
    return (
      <div style={{ ...card(), padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
        <div style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>চ্যাট এখন বন্ধ আছে</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Admin চ্যাট বন্ধ করে রেখেছেন। পরে আবার চেষ্টা করুন।</div>
      </div>
    );
  }

  const modeLabel = MODE_LABEL[mode] || MODE_LABEL.open;

  return (
    <div style={{ ...card(), padding: 16, display: "flex", flexDirection: "column", height: 480 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: C.accent, fontSize: 14 }}>💬 Group Chat</div>
        <span style={{ fontSize: 10, color: modeLabel.color, fontWeight: 700 }}>{modeLabel.text}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10, paddingRight: 4 }}>
        {messages.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 20 }}>এখনো কোনো মেসেজ নেই। প্রথম মেসেজ পাঠান!</div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === user.uid;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  {!isMine && <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{m.senderName}</span>}
                  <span style={{ fontSize: 9, color: C.muted }}>{formatDateTime(m.createdAt)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {(isMine || isAdmin) && (
                    <button onClick={() => handleDelete(m.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 11, order: isMine ? 0 : 1 }}>🗑️</button>
                  )}
                  <div style={{
                    background: isMine ? C.accent + "22" : "#070D1A",
                    border: "1px solid " + (isMine ? C.accent + "44" : C.border),
                    borderRadius: 10,
                    padding: "8px 12px",
                    maxWidth: 260,
                    fontSize: 13,
                    color: C.text,
                    wordBreak: "break-word",
                  }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canWrite ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSend(); }}
            placeholder="মেসেজ লিখুন..."
            style={{ ...inp({ flex: 1, boxSizing: "border-box" }) }}
          />
          <button onClick={handleSend} disabled={sending || !text.trim()} style={btn(C.accent, true)}>
            {sending ? "..." : "পাঠান"}
          </button>
        </div>
      ) : (
        <div style={{ background: C.red + "18", border: "1px solid " + C.red + "44", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.red, textAlign: "center" }}>
          {mode === "readonly"
            ? "🚫 এখন শুধু Admin মেসেজ পাঠাতে পারবেন — আপনি শুধু পড়তে পারবেন।"
            : "🚫 Admin আপনার chat access বন্ধ করে দিয়েছেন।"}
        </div>
      )}
    </div>
  );
}
