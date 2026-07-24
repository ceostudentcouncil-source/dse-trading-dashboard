import { useState } from "react";
import { C } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// SHARE BUTTON
// Uses the native Web Share API (navigator.share) — on mobile this
// opens the OS-level share sheet where WhatsApp, Messenger, SMS,
// Email, Facebook, Telegram, etc. all appear automatically with no
// per-platform integration needed. Falls back to copy-to-clipboard
// on desktop browsers that don't support the API.
// ══════════════════════════════════════════════════════════════

export default function ShareButton({ showToast }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "DSE Trading Dashboard",
      text: "DSE Trading Dashboard — স্টক analysis, portfolio tracking, ও buy/sell signal এক জায়গায়।",
      url: window.location.href,
    };

    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share(shareData);
      } catch (e) {
        // AbortError fires when the user just closes the share sheet —
        // not a real failure, so we don't show an error toast for it.
        if (e?.name !== "AbortError") {
          showToast?.("❌ শেয়ার করা যায়নি।", "err");
        }
      }
      setSharing(false);
    } else if (navigator.clipboard) {
      // Desktop fallback: no native share sheet, so copy the link instead.
      try {
        await navigator.clipboard.writeText(shareData.url);
        showToast?.("✅ লিংক কপি হয়েছে! যেকোনো জায়গায় paste করুন।");
      } catch (e) {
        showToast?.("❌ লিংক কপি করা যায়নি।", "err");
      }
    } else {
      showToast?.("❌ এই ব্রাউজারে শেয়ার সাপোর্ট নেই।", "err");
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      title="শেয়ার করুন"
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
        background: "linear-gradient(135deg,#00C896,#0080FF)",
        color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
        opacity: sharing ? 0.7 : 1,
      }}
    >
      📤 শেয়ার করুন
    </button>
  );
}
