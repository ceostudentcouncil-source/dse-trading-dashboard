import { useState, useEffect, useRef } from "react";
import { C } from "../constants.js";
import { card, btn, inp } from "../utils/styleHelpers.js";
import { sendConversationMessage, listenToConversationMessages } from "../services/conversationService.js";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  return datePart + " · " + timePart;
}

export default function ConversationThread({ conversationId, currentUser, otherPartyName, canWrite = true }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenToConversationMessages(conversationId, (docs) => {
      setMessages([...docs].reverse());
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !canWrite || !conversationId) return;
    setSending(true);
    setSendError("");
    try {
      const result = await sendConversationMessage(conversationId, currentUser.uid, currentUser.displayName || currentUser.email, currentUser.photoURL, text);
      if (!result) { setSendError("মেসেজ পাঠানো ব্যর্থ হয়েছে (permission বা network সমস্যা হতে পারে)।"); }
      else { setText(""); }
    } catch (e) {
      setSendError("মেসেজ পাঠাতে ত্রুটি: " + (e?.message || e));
    }
    setSending(false);
  };

  return (
    <div style={{ ...card(), padding: 16, display: "flex", flexDirection: "column", height: 480 }}>
      <div style={{ fontWeight: 700, color: C.accent, fontSize: 14, marginBottom: 4 }}>
        💬 {otherPartyName || "Conversation"}
      </div>
      <div style={{ fontSize: 9, color: C.muted, marginBottom: 8, wordBreak: "break-all" }}>ID: {conversationId}</div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 10, paddingRight: 4 }}>
        {messages.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 20 }}>এখনো কোনো মেসেজ নেই। প্রথম মেসেজ পাঠান!</div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUser.uid;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{formatDateTime(m.createdAt)}</div>
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
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div style={{ background: C.red + "18", border: "1px solid " + C.red + "44", borderRadius: 6, padding: "6px 10px", marginBottom: 6, fontSize: 11, color: C.red }}>
          {sendError}
        </div>
      )}

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
          🚫 আপনার chat access বন্ধ করা হয়েছে।
        </div>
      )}
    </div>
  );
}
