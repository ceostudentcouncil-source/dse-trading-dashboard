export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("bn-BD") : "—");

export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

export function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

export function staleness(dateStr) {
  const d = daysSince(dateStr);
  if (d === null) return { label: "N/A", color: "#4A6080" };
  if (d === 0) return { label: "আজ ✅", color: "#00C896" };
  if (d === 1) return { label: "গতকাল", color: "#4CAF50" };
  if (d <= 3) return { label: d + " দিন আগে", color: "#FFC107" };
  if (d <= 7) return { label: d + " দিন আগে ⚠️", color: "#FF9800" };
  return { label: d + " দিন আগে 🔴", color: "#F44336" };
}

export const load = (SK) => {
  try {
    const r = localStorage.getItem(SK);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};

export const save = (SK, d) => {
  try {
    localStorage.setItem(SK, JSON.stringify(d));
  } catch {}
};
