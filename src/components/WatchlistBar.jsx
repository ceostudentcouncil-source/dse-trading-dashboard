import { useState } from "react";
import { C } from "../constants.js";
import { btn, inp } from "../utils/styleHelpers.js";
import { createWatchlist, deleteWatchlist, renameWatchlist } from "../services/watchlistService.js";

// ══════════════════════════════════════════════════════════════
// WATCHLIST BAR
// Renders the row of watchlist tabs ("Favorites", "June 26", ...)
// plus a "+ New Watchlist" button. Favorites is always first and
// can't be renamed or deleted (isDefault: true).
// ══════════════════════════════════════════════════════════════

export default function WatchlistBar({ uid, watchlists, activeId, onSelect, showToast }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createWatchlist(uid, newName.trim());
    if (id) {
      onSelect(id);
      showToast?.("✅ নতুন Watchlist তৈরি হয়েছে!");
    }
    setNewName("");
    setCreating(false);
  };

  const startRename = (w) => {
    setRenamingId(w.id);
    setRenameValue(w.name);
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await renameWatchlist(uid, id, renameValue.trim());
    setRenamingId(null);
  };

  const handleDelete = async (w) => {
    if (w.isDefault) return; // Favorites can never be deleted
    await deleteWatchlist(uid, w.id);
    if (activeId === w.id) onSelect(null); // fall back to "all stocks" view
    showToast?.("🗑️ Watchlist মুছে ফেলা হয়েছে।");
  };

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
      {watchlists.map((w) => (
        <div key={w.id} style={{ position: "relative" }}>
          {renamingId === w.id ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(w.id); if (e.key === "Escape") setRenamingId(null); }}
                autoFocus
                style={{ ...inp({ width: 110, padding: "5px 8px", fontSize: 12 }) }}
              />
              <button onClick={() => handleRename(w.id)} style={btn(C.accent, true, true)}>✓</button>
            </div>
          ) : (
            <button
              onClick={() => onSelect(w.id)}
              onDoubleClick={() => !w.isDefault && startRename(w)}
              title={w.isDefault ? "Favorites" : "ডাবল-ক্লিক করে নাম পরিবর্তন করুন"}
              style={{
                padding: "7px 14px", borderRadius: 20, border: "1px solid " + (activeId === w.id ? C.accent : C.border),
                background: activeId === w.id ? C.accent + "22" : "transparent",
                color: activeId === w.id ? C.accent : C.muted, fontWeight: 700, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              {w.isDefault && "❤️"} {w.name}
              {!w.isDefault && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleDelete(w); }}
                  style={{ marginLeft: 2, fontSize: 11, opacity: 0.6 }}
                >
                  ✕
                </span>
              )}
            </button>
          )}
        </div>
      ))}

      {creating ? (
        <div style={{ display: "flex", gap: 4 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Watchlist নাম..."
            autoFocus
            style={{ ...inp({ width: 130, padding: "5px 8px", fontSize: 12 }) }}
          />
          <button onClick={handleCreate} style={btn(C.accent, true, true)}>✓</button>
          <button onClick={() => { setCreating(false); setNewName(""); }} style={btn(C.muted, false, true)}>✕</button>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} style={{ ...btn(C.blue, false, true), display: "flex", alignItems: "center", gap: 4 }}>
          + New Watchlist
        </button>
      )}
    </div>
  );
}
