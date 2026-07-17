import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";
import ChatPanel from "./ChatPanel.jsx";
import ConversationThread from "./ConversationThread.jsx";
import { SUPER_ADMIN_EMAIL } from "../services/adminService.js";
import { getAdminUidByEmail, ensureConversation, getConversationId } from "../services/conversationService.js";

export default function ChatHub({ user, profile, isAdmin }) {
  const [subTab, setSubTab] = useState("group");
  const [conversationId, setConversationId] = useState(null);
  const [loadingConv, setLoadingConv] = useState(true);
  const [debugInfo, setDebugInfo] = useState(""); // temporary, visible debug trace

  useEffect(() => {
    if (isAdmin) { setLoadingConv(false); return; }
    let cancelled = false;
    async function setup() {
      setLoadingConv(true);
      setDebugInfo("admin uid খোঁজা হচ্ছে...");
      const adminUid = await getAdminUidByEmail(SUPER_ADMIN_EMAIL);
      if (!adminUid) {
        setDebugInfo("❌ Admin UID পাওয়া যায়নি (admins/" + SUPER_ADMIN_EMAIL + " এ uid field নেই)");
        setLoadingConv(false);
        return;
      }
      if (cancelled) return;
      const id = getConversationId(user.uid, adminUid);
      setDebugInfo("conversationId: " + id + " (my uid: " + user.uid + ", admin uid: " + adminUid + ")");
      try {
        await ensureConversation(
          user.uid, user.displayName || user.email, user.photoURL,
          adminUid, "Admin", ""
        );
        setDebugInfo((prev) => prev + " · ensureConversation ✅ সফল");
      } catch (e) {
        setDebugInfo((prev) => prev + " · ❌ ensureConversation ব্যর্থ: " + (e?.message || e));
      }
      if (!cancelled) { setConversationId(id); setLoadingConv(false); }
    }
    setup();
    return () => { cancelled = true; };
  }, [user.uid, isAdmin]);

  const canWrite = isAdmin || profile?.chatEnabled !== false;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setSubTab("group")} style={btn(C.accent, subTab === "group", true)}>💬 Group Chat</button>
        {!isAdmin && (
          <button onClick={() => setSubTab("admin")} style={btn(C.purple, subTab === "admin", true)}>👑 Admin এর সাথে চ্যাট</button>
        )}
      </div>

      {subTab === "group" && (
        <ChatPanel user={user} profile={profile} isAdmin={isAdmin} />
      )}

      {subTab === "admin" && !isAdmin && (
        <>
          <div style={{ background: "#0A1628", border: "1px solid " + C.orange + "66", borderRadius: 8, padding: "8px 10px", marginBottom: 8, fontSize: 10, color: C.orange, wordBreak: "break-all" }}>
            🔧 DEBUG: {debugInfo || "..."}
          </div>
          {loadingConv ? (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 30 }}>লোড হচ্ছে...</div>
          ) : conversationId ? (
            <ConversationThread
              conversationId={conversationId}
              currentUser={user}
              otherPartyName="Admin"
              canWrite={canWrite}
            />
          ) : (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 30 }}>Admin এখনো সেট আপ হয়নি। পরে চেষ্টা করুন।</div>
          )}
        </>
      )}
    </div>
  );
}
