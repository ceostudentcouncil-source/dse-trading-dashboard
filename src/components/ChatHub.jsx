import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";
import ChatPanel from "./ChatPanel.jsx";
import ConversationThread from "./ConversationThread.jsx";
import { SUPER_ADMIN_EMAIL } from "../services/adminService.js";
import { getAdminUidByEmail, ensureConversation, getConversationId } from "../services/conversationService.js";

// ══════════════════════════════════════════════════════════════
// CHAT HUB (5B)
// Regular-user-facing wrapper: lets them switch between the shared
// Group Chat (5A) and a private 1-on-1 DM with the admin (5B).
// Admins use a different view (AdminDashboard's own Chat Control +
// Conversations tabs), so this component is only mounted for
// non-admin users from App.jsx.
// ══════════════════════════════════════════════════════════════

export default function ChatHub({ user, profile, isAdmin }) {
  const [subTab, setSubTab] = useState("group");
  const [conversationId, setConversationId] = useState(null);
  const [loadingConv, setLoadingConv] = useState(true);

  useEffect(() => {
    if (isAdmin) { setLoadingConv(false); return; }
    let cancelled = false;
    async function setup() {
      setLoadingConv(true);
      const adminUid = await getAdminUidByEmail(SUPER_ADMIN_EMAIL);
      if (!adminUid || cancelled) { setLoadingConv(false); return; }
      const id = getConversationId(user.uid, adminUid);
      await ensureConversation(
        user.uid, user.displayName || user.email, user.photoURL,
        adminUid, "Admin", ""
      );
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
        loadingConv ? (
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
        )
      )}
    </div>
  );
}
