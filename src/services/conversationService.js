import { fsSet, fsGet, fsGetAll, fsListen } from "../firebase.js";

// A regular user needs the ADMIN'S UID to compute the shared
// conversation ID — but all they have is the admin's *email*
// (from constants/adminService). We resolve it by reading the
// admins/{email} doc, which stores the admin's uid once they've
// logged in at least once (see recordAdminUid below).
export async function getAdminUidByEmail(email) {
  if (!email) return null;
  const rec = await fsGet("admins/" + email);
  return rec?.uid || null;
}

// Called once when an admin logs in (wired from App.jsx) so their
// uid becomes discoverable via their email for the lookup above.
export async function recordAdminUid(email, uid) {
  if (!email || !uid) return;
  await fsSet("admins/" + email, { uid }, true);
}

// ══════════════════════════════════════════════════════════════
// CONVERSATION SERVICE (5B — 1-on-1 DMs, user <-> admin only)
// Conversation ID is deterministic: sort the two participant UIDs
// and join with "_". Both sides compute the exact same ID without
// any lookup, and the Firestore rule enforces that only the two
// named participants (or any admin) can touch that path — so even
// though the ID format is generic, only user<->admin conversations
// actually get created from the UI (5B never lets a user pick
// another regular user to DM).
//
// conversations/{id} = {
//   participants: [uidA, uidB],
//   participantNames: { [uid]: name },
//   participantPhotos: { [uid]: photoURL },
//   lastMessage, lastMessageAt (ISO), lastSenderId
// }
// conversations/{id}/messages/{msgId} = {
//   text, senderId, senderName, senderPhoto, createdAt (ISO)
// }
// ══════════════════════════════════════════════════════════════

let _counter = 0;
const genId = () => {
  _counter += 1;
  return "msg_" + Date.now() + "_" + (_counter % 1000);
};

// Deterministic conversation ID from two UIDs — order-independent.
export function getConversationId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

// Ensure the conversation "shell" document exists with up-to-date
// participant info (safe to call every time a chat screen opens —
// it just merges, never resets messages).
export async function ensureConversation(uidA, nameA, photoA, uidB, nameB, photoB) {
  const id = getConversationId(uidA, uidB);
  await fsSet("conversations/" + id, {
    participants: [uidA, uidB],
    participantNames: { [uidA]: nameA || "User", [uidB]: nameB || "User" },
    participantPhotos: { [uidA]: photoA || "", [uidB]: photoB || "" },
  });
  return id;
}

export async function sendConversationMessage(conversationId, senderId, senderName, senderPhoto, text) {
  if (!text || !text.trim()) return null;
  const id = genId();
  const trimmed = text.trim();
  const ok = await fsSet("conversations/" + conversationId + "/messages/" + id, {
    text: trimmed,
    senderId,
    senderName: senderName || "User",
    senderPhoto: senderPhoto || "",
    createdAt: new Date().toISOString(),
  });
  // Update the conversation's "last message" preview for the list view.
  await fsSet("conversations/" + conversationId, {
    lastMessage: trimmed,
    lastMessageAt: new Date().toISOString(),
    lastSenderId: senderId,
  });
  return ok ? id : null;
}

export function listenToConversationMessages(conversationId, cb) {
  return fsListen("conversations/" + conversationId + "/messages", cb, "createdAt");
}

// Admin: list every conversation (for the Admin's DM inbox).
export async function listAllConversations() {
  const all = await fsGetAll("conversations");
  // Only real conversations have participants; filter out anything malformed.
  return all.filter((c) => Array.isArray(c.participants) && c.participants.length === 2)
             .sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""));
}

// A regular user only ever has ONE conversation (with the admin),
// so this just resolves it directly rather than listing everything.
export async function getMyConversationWithAdmin(userId, adminUid) {
  const id = getConversationId(userId, adminUid);
  const doc = await fsGet("conversations/" + id);
  return { id, exists: !!doc, data: doc };
}
