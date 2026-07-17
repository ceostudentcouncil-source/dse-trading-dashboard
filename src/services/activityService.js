import { fsGetAll } from "../firebase.js";
import { listAllConversations } from "./conversationService.js";

// ══════════════════════════════════════════════════════════════
// ACTIVITY SERVICE (5C — who chatted, when)
// Derives an activity log by reading existing message collections
// rather than maintaining a separate log — zero extra writes, zero
// new Firestore rules. At DSE-platform scale (tens of users) this
// is simpler and just as fast as a dedicated log collection.
//
// Two data sources combined into one chronological feed:
//   1. Group chat: chats/general/messages
//   2. Every 1-on-1 conversation: conversations/{id}/messages
// ══════════════════════════════════════════════════════════════

// Fetch every group-chat message (admin-only call site).
async function getAllGroupMessages() {
  return await fsGetAll("chats/general/messages");
}

// Fetch every message from every conversation, tagged with which
// conversation (and therefore which two participants) it belongs to.
async function getAllConversationMessages() {
  const conversations = await listAllConversations();
  const perConvo = await Promise.all(
    conversations.map(async (c) => {
      const msgs = await fsGetAll("conversations/" + c.id + "/messages");
      return msgs.map((m) => ({ ...m, conversationId: c.id, participants: c.participants, participantNames: c.participantNames }));
    })
  );
  return perConvo.flat();
}

function splitDateTime(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }),
    rawDate: iso.split("T")[0], // for grouping/sorting
  };
}

// Build one combined, chronologically-sorted activity feed:
// { senderId, senderName, channel: "group"|"dm", date, time, rawDate, text }
export async function getActivityFeed() {
  const [groupMsgs, dmMsgs] = await Promise.all([
    getAllGroupMessages(),
    getAllConversationMessages(),
  ]);

  const groupEntries = groupMsgs.map((m) => ({
    senderId: m.senderId,
    senderName: m.senderName || "User",
    channel: "group",
    channelLabel: "💬 Group Chat",
    text: m.text,
    createdAt: m.createdAt,
    ...splitDateTime(m.createdAt),
  }));

  const dmEntries = dmMsgs.map((m) => ({
    senderId: m.senderId,
    senderName: m.senderName || "User",
    channel: "dm",
    channelLabel: "✉️ DM",
    text: m.text,
    createdAt: m.createdAt,
    ...splitDateTime(m.createdAt),
  }));

  return [...groupEntries, ...dmEntries].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

// Per-user summary: total messages, first/last activity, broken down
// by channel — useful for a compact "who's active" overview.
export async function getActivitySummaryByUser() {
  const feed = await getActivityFeed();
  const byUser = {};
  feed.forEach((entry) => {
    const key = entry.senderId;
    if (!byUser[key]) {
      byUser[key] = {
        senderId: key,
        senderName: entry.senderName,
        totalMessages: 0,
        groupMessages: 0,
        dmMessages: 0,
        lastActivityAt: entry.createdAt,
        firstActivityAt: entry.createdAt,
      };
    }
    const u = byUser[key];
    u.totalMessages += 1;
    if (entry.channel === "group") u.groupMessages += 1;
    else u.dmMessages += 1;
    if (entry.createdAt > u.lastActivityAt) u.lastActivityAt = entry.createdAt;
    if (entry.createdAt < u.firstActivityAt) u.firstActivityAt = entry.createdAt;
  });
  return Object.values(byUser).sort((a, b) => (b.lastActivityAt || "").localeCompare(a.lastActivityAt || ""));
}
