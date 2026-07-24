import { fsGetAll, fsSet, fsDelete, fsListen } from "../firebase.js";

// ══════════════════════════════════════════════════════════════
// WATCHLIST SERVICE
// Stock Now–style Favorites + custom watchlist groups.
//
// users/{uid}/watchlists/{watchlistId} = {
//   name: "Favorites" | "June 26" | "MayWatchList" | ...,
//   isDefault: true|false,   // "Favorites" only — can't rename/delete
//   createdAt: ISO string,
//   stockNames: ["EPGL", "LOVELLO", ...]
// }
//
// stockNames is a plain array (not a subcollection): watchlists are
// small (tens of stocks), so one document read/write per watchlist
// is simpler and cheaper than per-stock documents.
// ══════════════════════════════════════════════════════════════

const FAVORITES_ID = "favorites"; // fixed id, so it's trivial to find/recreate

let _counter = 0;
const genId = () => {
  _counter += 1;
  return "wl_" + Date.now() + "_" + (_counter % 1000);
};

// Ensure the user has their default "Favorites" list (call once on
// login, or lazily the first time watchlists are opened).
export async function ensureFavorites(uid) {
  const existing = await fsGetAll("users/" + uid + "/watchlists");
  const hasFavorites = existing.some((w) => w.id === FAVORITES_ID);
  if (!hasFavorites) {
    await fsSet("users/" + uid + "/watchlists/" + FAVORITES_ID, {
      name: "Favorites",
      isDefault: true,
      createdAt: new Date().toISOString(),
      stockNames: [],
    });
  }
  return existing;
}

// Real-time list of all watchlists for this user, "Favorites" always first.
export function listenToWatchlists(uid, cb) {
  return fsListen("users/" + uid + "/watchlists", (docs) => {
    const sorted = [...docs].sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
    cb(sorted);
  });
}

// Create a new custom watchlist group (e.g. "June 26", "MayWatchList").
export async function createWatchlist(uid, name) {
  if (!name || !name.trim()) return null;
  const id = genId();
  await fsSet("users/" + uid + "/watchlists/" + id, {
    name: name.trim(),
    isDefault: false,
    createdAt: new Date().toISOString(),
    stockNames: [],
  });
  return id;
}

// Rename a custom watchlist (Favorites can't be renamed — enforced by caller/UI).
export async function renameWatchlist(uid, watchlistId, newName) {
  if (!newName || !newName.trim()) return false;
  return await fsSet("users/" + uid + "/watchlists/" + watchlistId, { name: newName.trim() });
}

// Delete a custom watchlist (Favorites can't be deleted — enforced by caller/UI).
export async function deleteWatchlist(uid, watchlistId) {
  return await fsDelete("users/" + uid + "/watchlists/" + watchlistId);
}

// Add a stock to a specific watchlist (no-op if already present).
export async function addStockToWatchlist(uid, watchlistId, stockName, currentStockNames) {
  if (currentStockNames.includes(stockName)) return true;
  const updated = [...currentStockNames, stockName];
  return await fsSet("users/" + uid + "/watchlists/" + watchlistId, { stockNames: updated });
}

// Remove a stock from a specific watchlist.
export async function removeStockFromWatchlist(uid, watchlistId, stockName, currentStockNames) {
  const updated = currentStockNames.filter((n) => n !== stockName);
  return await fsSet("users/" + uid + "/watchlists/" + watchlistId, { stockNames: updated });
}

// Toggle a stock's presence in the Favorites list specifically — this
// is what the heart (❤️) icon on a stock card calls directly.
export async function toggleFavorite(uid, stockName, currentFavoriteNames) {
  const isFav = currentFavoriteNames.includes(stockName);
  const updated = isFav
    ? currentFavoriteNames.filter((n) => n !== stockName)
    : [...currentFavoriteNames, stockName];
  await fsSet("users/" + uid + "/watchlists/" + FAVORITES_ID, { stockNames: updated });
  return !isFav; // returns the new "is favorited" state
}

export { FAVORITES_ID };
