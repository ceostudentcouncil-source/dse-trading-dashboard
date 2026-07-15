import { TODAY } from "../constants.js";

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  setLiveLoading(true);
  setLiveStatus(null);
  showToast("⏳ ওপেন ক্লাউড থেকে লাইভ ডাটা লোড হচ্ছে...");

  // কোনো টোকেন ছাড়া ওপেন রিড লিংক (Vercel ও ব্রাউজার ফ্রেন্ডলি)
  const apiUrl = "https://api.jsonbin.io/v3/b/66183610ad19ca34f8582d90";

  try {
    const resp = await fetch(apiUrl, {
      headers: { "X-Bin-Meta": "false" }
    });
    if (!resp.ok) throw new Error("সার্ভার থেকে ডাটা রেসপন্স করেনি");
    
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
      showToast("✅ পাইথন লাইভ ডাটা সফলভাবে ড্যাশবোর্ডে সিঙ্ক হয়েছে!");
      
    } else {
      throw new Error("ফাঁকা ডাটা এসেছে");
    }
  } catch (e) {
    console.error("Live fetch error:", e);
    await fetchLiveDataFallback(ctx);
  }
  setLiveLoading(false);
}
