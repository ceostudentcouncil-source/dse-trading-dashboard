import { C } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// FAVORITE HEART BUTTON
// Small heart icon for a stock card/row — toggles the stock in/out
// of the user's "Favorites" watchlist. Stops click propagation so
// tapping the heart doesn't also trigger the card's own expand/click.
// ══════════════════════════════════════════════════════════════

export default function FavoriteHeart({ isFavorite, onToggle }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title={isFavorite ? "Favorites থেকে সরান" : "Favorites এ যোগ করুন"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 18, padding: 2, lineHeight: 1,
        filter: isFavorite ? "none" : "grayscale(1) opacity(0.5)",
        transition: "filter 0.15s",
      }}
    >
      {isFavorite ? "❤️" : "🤍"}
    </button>
  );
}
