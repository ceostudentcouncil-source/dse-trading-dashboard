import { TODAY } from "../constants.js";

export async function fetchLiveData(ctx) {
  const { stocks, setStocks, persist, showToast, setLiveLoading, setLiveStatus, setLiveUpdatedAt } = ctx;

  // ব্রাউজারে ফাইল ইনপুট তৈরি করা (CORS বাইপাস ও লোকাল ইমপোর্টের জন্য)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLiveLoading(true);
    setLiveStatus(null);
    showToast("⏳ লোকাল ফাইল থেকে ৩৮৭টি স্টক ইমপোর্ট করা হচ্ছে...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const pythonStocks = JSON.parse(event.target.result);

        if (pythonStocks && Array.isArray(pythonStocks) && pythonStocks.length > 0) {
          
          // নতুন স্টকগুলো যুক্ত করা এবং পুরনো স্টকগুলোর ডাটা আপডেট করার স্মার্ট কম্বিনেশন
          const updatedStocks = [...stocks];

          pythonStocks.forEach(newStock => {
            const existingIndex = updatedStocks.findIndex(s => s.name.toUpperCase() === newStock.name.toUpperCase());
            
            if (existingIndex !== -1) {
              // স্টক অলরেডি থাকলে ডাটা আপডেট করো
              updatedStocks[existingIndex] = {
                ...updatedStocks[existingIndex],
                ...newStock,
                updatedAt: TODAY
              };
            } else {
              // স্টক না থাকলে পুরো ৩৮৭টির নতুন মেম্বার হিসেবে অ্যাপে পুশ করো
              updatedStocks.push({
                ...newStock,
                updatedAt: TODAY
              });
            }
          });

          // ড্যাশবোর্ড স্টেট ও পারসিস্ট্যান্স আপডেট
          setStocks(updatedStocks);
          persist(updatedStocks, null, null);
          
          setLiveStatus("ok");
          setLiveUpdatedAt(new Date().toLocaleTimeString("bn-BD"));
          showToast(`✅ সফলভাবে ${pythonStocks.length}টি স্টক সিঙ্ক ও যুক্ত হয়েছে!`);
          
        } else {
          throw new Error("ফাইলটি খালি অথবা ইনভ্যালিড ফরম্যাট");
        }
      } catch (err) {
        console.error(err);
        showToast("❌ ফাইল রিড করতে সমস্যা হয়েছে!", "err");
        setLiveStatus("error");
      }
      setLiveLoading(false);
    };
    reader.readAsText(file);
  };

  // ফাইল ডায়ালগ বক্সটি ওপেন করা
  fileInput.click();
}
