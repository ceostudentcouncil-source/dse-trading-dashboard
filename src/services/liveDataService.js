import { TODAY } from "../constants.js";

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ ফায়ারবেস ক্লাউড থেকে সব স্টক অটো-সিঙ্ক হচ্ছে...");

  // পাইথনের সাথে ম্যাচ করা ফায়ারবেস ইউআরএল
  const firebaseUrl = "https://dse-trading-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app/dse_live.json";

  try {
    const resp = await fetch(firebaseUrl);
    if (!resp.ok) throw new Error("ক্লাউড ডাটাবেজ থেকে কোনো রেসপন্স পাওয়া যায়নি");
    
    const pythonStocks = await resp.json();

    if (pythonStocks && Array.isArray(pythonStocks) && pythonStocks.length > 0) {
      const updatedStocks = [...stocks];

      pythonStocks.forEach(newStock => {
        const existingIndex = updatedStocks.findIndex(s => s.name.toUpperCase() === newStock.name.toUpperCase());
        
        if (existingIndex !== -1) {
          // স্টকটি অলরেডি লিস্টে থাকলে লেটেস্ট ডাটা দিয়ে আপডেট করো
          updatedStocks[existingIndex] = {
            ...updatedStocks[existingIndex],
            ...newStock,
            updatedAt: TODAY
          };
        } else {
          // নতুন কোনো স্টক স্ক্র্যাপ হয়ে আসলে ড্যাশবোর্ডে পুশ (Append) করো
          updatedStocks.push({
            ...newStock,
            updatedAt: TODAY
          });
        }
      });

      // অ্যাপের গ্লোবাল স্টেট এবং লোকাল স্টোরেজ সিঙ্ক
      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast(`✅ সফলভাবে ${pythonStocks.length}টি স্টক অটো-সিঙ্ক সম্পন্ন হয়েছে!`);
      
    } else {
      throw new Error("ডাটা ফরম্যাট সঠিক নয় অথবা ক্লাউড ডাটাবেজ খালি");
    }
  } catch (e) {
    console.error("Firebase Sync Error:", e);
    showToast("❌ ক্লাউড সিঙ্ক ব্যর্থ হয়েছে!", "err");
    setLiveStatus("error");
  }
  setLiveLoading(false);
}
