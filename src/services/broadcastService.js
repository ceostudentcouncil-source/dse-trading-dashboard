import { fsSet, fsDelete, fsListen } from "../firebase.js";

// ══════════════════════════════════════════════════════════════
// BROADCAST SERVICE (#4 fix)
// Admin posts a Buy/Sell/Partial-Sell suggestion for a stock; every
// signed-in user sees it live as a notification banner. Built on
// Firestore's `broadcasts` collection + a real-time listener, so
// no polling and no manual refresh needed — genuinely dynamic.
//
// Document shape: broadcasts/{id} = {
//   stock, action: "buy"|"sell"|"partial_sell", message,
//   targetPrice, percentage, createdBy, createdAt (ISO string)
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

// ── Per-user "dismissed" tracking (kept in localStorage, not Firestore —
// dismissal is a personal UI preference, not shared data). ──────────
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
