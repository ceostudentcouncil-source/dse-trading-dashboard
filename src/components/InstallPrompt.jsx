import { useState, useEffect } from "react";
import { C } from "../constants.js";
import { btn } from "../utils/styleHelpers.js";

// ══════════════════════════════════════════════════════════════
// INSTALL PROMPT
// Shows a "📲 Install করুন" banner every time the app loads in a
// browser tab (not yet installed), using the native
// `beforeinstallprompt` event to trigger the real browser install
// flow when tapped. Once the app is actually installed —
// confirmed via the `appinstalled` event, OR by detecting the app
// is already running in standalone/installed mode — it is
// permanently hidden (localStorage flag), never asking again.
// Dismissing for "this session" only hides it until the next time
// the app is opened; only a real install stops it for good.
// ══════════════════════════════════════════════════════════════

const INSTALLED_KEY = "dse-pwa-installed";

function isStandalone() {
  // Covers Android/desktop Chrome ("standalone") and iOS Safari
  // ("navigator.standalone"), the two ways a PWA reports "already installed".
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  useEffect(() => {
    // If already installed (either flagged before, or detected live
    // via display-mode), never show anything — permanent opt-out.
    if (localStorage.getItem(INSTALLED_KEY) === "true" || isStandalone()) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // stop the default mini-infobar; we show our own banner instead
      setDeferredPrompt(e);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // "accepted" is also caught by the appinstalled event above, which
    // sets the permanent flag — this just hides the banner immediately
    // for a snappier feel instead of waiting for that event to fire.
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Session-only dismissal — intentionally NOT saved anywhere
    // persistent, so the banner comes back next time the app opens,
    // as requested (repeat suggestion until actually installed).
    setDismissedThisSession(true);
  };

  if (!visible || dismissedThisSession || !deferredPrompt) return null;

  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 10003,
      background: "#0F1923", border: "1px solid " + C.accent + "66",
      borderRadius: 12, padding: "14px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 24 }}>📲</div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>App টি Install করুন</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>দ্রুত access ও offline সুবিধার জন্য হোম স্ক্রিনে যোগ করুন।</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleInstallClick} style={btn(C.accent, true)}>Install করুন</button>
        <button onClick={handleDismiss} style={btn(C.muted, false, true)}>✕</button>
      </div>
    </div>
  );
}
