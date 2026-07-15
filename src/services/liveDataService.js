import { TODAY } from "../constants.js";

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ গিটহাব ক্লাউড থেকে লাইভ ডাটা আনছি...");

  // গিটহাবের ফিক্সড গ্লোবাল লাইভ ডাটা লিংক (Vercel ফ্রেন্ডলি)
  const apiUrl = "https://gist.githubusercontent.com/varsityos-dev/ad4180e0c9bd34fae2394a504a79df2f/raw/dse_live.json";

  try {
    // প্রতিবার ফ্রেশ ডাটা নিশ্চিত করতে টাইমস্ট্যাম্প যোগ করা হয়েছে
    const resp = await fetch(`${apiUrl}?t=${new Date().getTime()}`);
    if (!resp.ok) throw new Error("সার্ভার থেকে ডাটা পাওয়া যায়নি");
    
    const pythonStocks = await resp.json();

    if (pythonStocks && Array.isArray(pythonStocks) && pythonStocks.length > 0) {
      
      const updatedStocks = stocks.map(currentStock => {
        const newLiveStock = pythonStocks.find(ps => ps.name.toUpperCase() === currentStock.name.toUpperCase());
        
        if (newLiveStock) {
          return {
            ...currentStock,
            ...newLiveStock,
            updatedAt: TODAY
          };
        }
        return currentStock; 
      });

      setStocks(updatedStocks);
      persist(updatedStocks, null, null);
      
      setLiveStatus("ok");
      setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
      showToast("✅ পাইথন লাইভ ডাটা সফলভাবে সিঙ্ক হয়েছে!");
      
    } else {
      throw new Error("ফাঁকা ডাটা এসেছে");
    }
  } catch (e) {
    console.error("Live fetch error:", e);
    await fetchLiveDataFallback(ctx);
  }
  setLiveLoading(false);
}
