import { fsSet, fsGet, fsDelete, fsListen, fsListenDoc } from "../firebase.js";

// ══════════════════════════════════════════════════════════════
// CHAT SERVICE (5A — group chat foundation)
// One shared group room ("general"). Behavior is controlled by a
// global mode stored at settings/chat:
//   "open"     — everyone (active, not chat-disabled) can read+post
//   "readonly" — everyone can read, only admin can post
//   "closed"   — nobody can read or post (fully disabled)
// Enforced server-side by Firestore rules — this file just calls
// through, so the UI and the rule always agree.
//
// Document shape: chats/general/messages/{id} = {
//   text, senderId, senderName, senderPhoto, createdAt (ISO string)
// }
// Global settings: settings/chat = { mode, updatedBy, updatedAt }
// Per-user override: users/{uid}.chatEnabled (true by default)
// ══════════════════════════════════════════════════════════════

const ROOM = "general";

let _counter = 0;
const genId = () => {
  _counter += 1;
  return "msg_" + Date.now() + "_" + (_counter % 1000);
};

// ── Messages ─────────────────────────────────────────────────────
export async function sendMessage(senderId, senderName, senderPhoto, text) {
  if (!text || !text.trim()) return null;
  const id = genId();
  const ok = await fsSet("chats/" + ROOM + "/messages/" + id, {
    text: text.trim(),
    senderId,
    senderName: senderName || "User",
    senderPhoto: senderPhoto || "",
    createdAt: new Date().toISOString(),
  });
  return ok ? id : null;
}

export function listenToMessages(cb) {
  return fsListen("chats/" + ROOM + "/messages", cb, "createdAt");
}

export async function deleteMessage(messageId) {
  return await fsDelete("chats/" + ROOM + "/messages/" + messageId);
}

// ── Global chat mode (admin-controlled) ───────────────────────────
export async function getChatSettings() {
  const s = await fsGet("settings/chat");
  return s || { mode: "open" }; // matches the rules' safe default
}

export function listenToChatSettings(cb) {
  return fsListenDoc("settings/chat", (data) => {
    cb(data || { mode: "open" });
  });
}

export async function setChatMode(mode, updatedBy) {
  return await fsSet("settings/chat", {
    mode, // "open" | "readonly" | "closed"
    updatedBy: updatedBy || "unknown",
    updatedAt: new Date().toISOString(),
  });
}

// ── Per-user chat block (independent of the global mode) ─────────
export async function setChatEnabled(uid, enabled) {
  return await fsSet("users/" + uid, { chatEnabled: enabled });
}
