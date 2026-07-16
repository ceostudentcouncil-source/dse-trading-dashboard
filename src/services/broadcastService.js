import { fsSet, fsGet, fsDelete, fsGetAll, fsListen } from "../firebase.js";

// ══════════════════════════════════════════════════════════════
// BROADCAST SERVICE (#4 fix + follow-up: history, timestamps, responses)
// Admin posts a Buy/Sell/Partial-Sell suggestion for a stock; every
// signed-in user sees it live as a notification banner, and it stays
// visible in their Dashboard as permanent history. Each user can mark
// a broadcast as "seen" or "followed" (acted on it) — the admin sees
// live counts of both per broadcast.
//
// Document shape: broadcasts/{id} = {
//   stock, action: "buy"|"sell"|"partial_sell", message,
//   targetPrice, percentage, createdBy, createdAt (ISO string)
// }
// Subcollection: broadcasts/{id}/responses/{userId} = {
//   userId, userName, status: "seen" | "followed", respondedAt (ISO string)
// }
// ══════════════════════════════════════════════════════════════

let _counter = 0;
const genId = () => {
  _counter += 1;
  return "bc_" + Date.now() + "_" + (_counter % 1000);
};

// Admin: post a new broadcast.
export async function sendBroadcast({ stock, action, message, targetPrice, percentage, createdBy }) {
  const id = genId();
  const ok = await fsSet("broadcasts/" + id, {
    stock: stock || "",
    action: action || "buy",
    message: message || "",
    targetPrice: targetPrice ?? null,
    percentage: percentage ?? null,
    createdBy: createdBy || "unknown",
    createdAt: new Date().toISOString(),
  });
  return ok ? id : null;
}

// Admin: remove a broadcast entirely (e.g. it was a mistake).
export async function deleteBroadcast(id) {
  return await fsDelete("broadcasts/" + id);
}

// Any signed-in user: subscribe to live broadcast updates.
// Returns an unsubscribe function.
export function listenToBroadcasts(cb) {
  return fsListen("broadcasts", cb, "createdAt");
}

// ── Response tracking (seen / followed) ─────────────────────────
// A user marks a broadcast as "seen" (read it) or "followed" (acted
// on it — actually bought/sold). Writing again just overwrites their
// own response doc, so re-clicking "seen" then "followed" upgrades it.
export async function respondToBroadcast(broadcastId, userId, userName, status) {
  return await fsSet("broadcasts/" + broadcastId + "/responses/" + userId, {
    userId,
    userName: userName || "User",
    status, // "seen" | "followed"
    respondedAt: new Date().toISOString(),
  });
}

// Get this user's own response to a broadcast (or null if none yet).
export async function getMyResponse(broadcastId, userId) {
  return await fsGet("broadcasts/" + broadcastId + "/responses/" + userId);
}

// Admin: get all responses for a broadcast, split into seen/followed counts.
export async function getResponseSummary(broadcastId) {
  const all = await fsGetAll("broadcasts/" + broadcastId + "/responses");
  const seen = all.filter((r) => r.status === "seen").length;
  const followed = all.filter((r) => r.status === "followed").length;
  return { total: all.length, seen, followed, responses: all };
}

// ── Per-user "dismissed" tracking (kept in localStorage, not Firestore —
// dismissal only hides the popup banner; the broadcast still shows up
// in the user's permanent Dashboard history regardless). ──────────
const DISMISSED_KEY = "dse-dismissed-broadcasts";

export function getDismissedIds() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissBroadcast(id) {
  try {
    const current = getDismissedIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    }
  } catch {}
}
