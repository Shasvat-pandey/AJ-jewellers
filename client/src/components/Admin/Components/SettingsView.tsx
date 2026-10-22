import { useState, useEffect } from "react";
import { Scale, Store, Bell, Save, Download, Archive } from "lucide-react";
import { useToast } from "../../../components/Common/context/ToastContext";
import { API_URL, getAdminToken, getAuthToken } from "../../../utils/api";

export default function SettingsView() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE ---
  const [marketRates, setMarketRates] = useState({
    rate24k: "7450",
    rate22k: "6830",
    rate18k: "5580",
    silver: "92",       
    diamond: "45000",   
    lastUpdated: "Fetching..."
  });

  const [businessInfo, setBusinessInfo] = useState({
    email: "",
    phone: "",
    address: ""
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    lowStock: true,
    customerMessages: false
  });

  // --- 1. FETCH DATA FROM MONGODB ON LOAD ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.data) {
          const settings = data.data;
          
          // Format date for UI
          const dateObj = new Date(settings.updatedAt);
          const formattedDate = `${dateObj.toLocaleDateString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric'})} - ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`;

          setMarketRates({
            rate24k: settings.marketRates.rate24k.toString(),
            rate22k: settings.marketRates.rate22k.toString(),
            rate18k: settings.marketRates.rate18k.toString(),
            silver: settings.marketRates.silver.toString(),
            diamond: settings.marketRates.diamond.toString(),
            lastUpdated: formattedDate
          });

          setBusinessInfo(settings.businessInfo);
          setNotifications(settings.notifications);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        showToast("Failed to load settings from database.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // --- 2. SAVE ALL DATA TO MONGODB ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Prepare the payload matching our mongoose schema
    const payload = {
      marketRates: {
        rate24k: Number(marketRates.rate24k),
        rate22k: Number(marketRates.rate22k),
        rate18k: Number(marketRates.rate18k),
        silver: Number(marketRates.silver),
        diamond: Number(marketRates.diamond)
      },
      businessInfo,
      notifications
    };

    try {
      const token = getAdminToken() || getAuthToken();
      const response = await fetch(`${API_URL}/settings`, {
        credentials: 'include',
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Update the timestamp in UI
        const dateObj = new Date();
        const formattedDate = `${dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric'})} - ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`;
        setMarketRates(prev => ({ ...prev, lastUpdated: formattedDate }));

        showToast("Settings successfully saved to database!", "success");
      } else {
        showToast("Database Error: " + data.message, "error");
      }
    } catch (error) {
      console.error("Network error saving settings:", error);
      showToast("Failed to connect to the backend server.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. DOWNLOAD ARCHIVE ---
  const handleDownloadArchive = async () => {
    try {
      showToast("Preparing archive... This might take a moment.", "success");
      const token = getAdminToken() || getAuthToken();
      const response = await fetch(`${API_URL}/orders/admin/export-archive${token ? `?token=${token}` : ''}`, {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to download archive");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AJ-Jewellers-Archive-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Download error:", error);
      showToast("Error downloading the archive.", "error");
    }
  };


  if (isLoading) {
    return <div className="p-10 text-center text-[#7A6A5C] font-jost animate-pulse">Loading secure settings...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <header className="mb-6 md:mb-8 mt-2 md:mt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-3xl sm:text-4xl text-[#4A0E1B] mb-1">
            Store Settings
          </h1>
          <p className="text-[#7A6A5C] text-xs sm:text-sm">Manage daily market rates, business details, and platform preferences.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] sm:text-xs tracking-[0.15em] uppercase px-6 py-3 flex items-center justify-center gap-2 hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer whitespace-nowrap rounded-sm disabled:opacity-70"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* SECTION 1: Market Rates (Gold, Silver, Diamond) */}
          <section className="bg-white p-5 sm:p-6 md:p-8 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#C9A24B]/20 pb-4">
              <div className="bg-[#C9A24B]/10 p-2 rounded-sm text-[#C9A24B]">
                <Scale size={20} />
              </div>
              <div>
                <h2 className="font-cormorant text-2xl text-[#4A0E1B]">Daily Market Rates</h2>
                <p className="font-jost text-[10px] sm:text-xs text-[#7A6A5C] mt-0.5">Last updated: {marketRates.lastUpdated}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Gold Rates */}
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">24K Gold (per g)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">₹</span>
                  <input 
                    type="number" 
                    value={marketRates.rate24k}
                    onChange={(e) => setMarketRates({...marketRates, rate24k: e.target.value})}
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">22K Gold (per g)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">₹</span>
                  <input 
                    type="number" 
                    value={marketRates.rate22k}
                    onChange={(e) => setMarketRates({...marketRates, rate22k: e.target.value})}
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">18K Gold (per g)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">₹</span>
                  <input 
                    type="number" 
                    value={marketRates.rate18k}
                    onChange={(e) => setMarketRates({...marketRates, rate18k: e.target.value})}
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                  />
                </div>
              </div>

              {/* Silver & Diamond Rates */}
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">Silver (per g)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">₹</span>
                  <input 
                    type="number" 
                    value={marketRates.silver}
                    onChange={(e) => setMarketRates({...marketRates, silver: e.target.value})}
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">Diamond (per ct)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A5C] font-jost">₹</span>
                  <input 
                    type="number" 
                    value={marketRates.diamond}
                    onChange={(e) => setMarketRates({...marketRates, diamond: e.target.value})}
                    className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 pl-7 pr-4 py-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                  />
                </div>
              </div>
            </div>
            
            <p className="font-jost text-xs text-[#7A6A5C] mt-5 bg-orange-50 p-3 border-l-2 border-orange-300">
              <strong>Warning:</strong> Updating these rates will instantly recalculate the prices of all dynamic Gold, Silver, and Diamond products across the entire website.
            </p>
          </section>

          {/* SECTION 2: Business Info */}
          <section className="bg-white p-5 sm:p-6 md:p-8 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#C9A24B]/20 pb-4">
              <div className="bg-[#4A0E1B]/10 p-2 rounded-sm text-[#4A0E1B]">
                <Store size={20} />
              </div>
              <div>
                <h2 className="font-cormorant text-2xl text-[#4A0E1B]">Business Details</h2>
                <p className="font-jost text-[10px] sm:text-xs text-[#7A6A5C] mt-0.5">Displayed on the customer contact page.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">Support Email</label>
                <input 
                  type="email" 
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                />
              </div>
              
              <div>
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">Support Phone</label>
                <input 
                  type="text" 
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost rounded-sm" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-jost text-[11px] tracking-[0.15em] text-[#7A6A5C] uppercase mb-2">Store Address</label>
                <textarea 
                  rows={2}
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost resize-none rounded-sm" 
                ></textarea>
              </div>
            </div>
          </section>

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="space-y-6 md:space-y-8">
          
          {/* SECTION 3: Notifications */}
          <section className="bg-white p-5 sm:p-6 md:p-8 border border-[#C9A24B]/30 shadow-sm rounded-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-[#C9A24B]/20 pb-4">
              <div className="bg-[#4A0E1B]/10 p-2 rounded-sm text-[#4A0E1B]">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="font-cormorant text-2xl text-[#4A0E1B]">Alerts</h2>
                <p className="font-jost text-[10px] sm:text-xs text-[#7A6A5C] mt-0.5">Admin email notifications.</p>
              </div>
            </div>

            <div className="space-y-5">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-jost text-sm text-[#4A0E1B] font-medium group-hover:text-[#C9A24B] transition-colors">New Orders</p>
                  <p className="font-jost text-[10px] text-[#7A6A5C] mt-0.5">Get emailed when a customer pays.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.newOrders}
                  onChange={(e) => setNotifications({...notifications, newOrders: e.target.checked})}
                  className="w-4 h-4 accent-[#C9A24B] cursor-pointer"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-jost text-sm text-[#4A0E1B] font-medium group-hover:text-[#C9A24B] transition-colors">Low Stock Alerts</p>
                  <p className="font-jost text-[10px] text-[#7A6A5C] mt-0.5">Get emailed when an item hits 0.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.lowStock}
                  onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})}
                  className="w-4 h-4 accent-[#C9A24B] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="font-jost text-sm text-[#4A0E1B] font-medium group-hover:text-[#C9A24B] transition-colors">Customer Messages</p>
                  <p className="font-jost text-[10px] text-[#7A6A5C] mt-0.5">Forward contact form to admin.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifications.customerMessages}
                  onChange={(e) => setNotifications({...notifications, customerMessages: e.target.checked})}
                  className="w-4 h-4 accent-[#C9A24B] cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* SECTION 4: Data Archiving */}
          <section className="bg-white p-5 sm:p-6 md:p-8 border border-[#C9A24B]/30 shadow-sm rounded-sm mt-6 md:mt-8">
            <div className="flex items-center gap-3 mb-6 border-b border-[#C9A24B]/20 pb-4">
              <div className="bg-[#4A0E1B]/10 p-2 rounded-sm text-[#4A0E1B]">
                <Archive size={20} />
              </div>
              <div>
                <h2 className="font-cormorant text-2xl text-[#4A0E1B]">Data Archiving</h2>
                <p className="font-jost text-[10px] sm:text-xs text-[#7A6A5C] mt-0.5">Securely export older orders.</p>
              </div>
            </div>
            
            <p className="font-jost text-sm text-[#7A6A5C] mb-5">
              Download a ZIP file containing a CSV of all orders from the last 4 months, along with their PDF invoices.
            </p>
            
            <button 
              type="button"
              onClick={handleDownloadArchive}
              className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 text-[#4A0E1B] font-jost text-xs tracking-[0.15em] uppercase px-6 py-3 flex items-center justify-center gap-2 hover:bg-[#C9A24B]/10 transition-colors shadow-sm cursor-pointer rounded-sm"
            >
              <Download size={16} />
              Download Customer Data
            </button>
          </section>

        </div>
        
        {/* Mobile Save Button */}
        <div className="sm:hidden col-span-1 mt-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#4A0E1B] text-[#F3E9D8] font-jost text-xs tracking-[0.15em] uppercase px-6 py-4 flex items-center justify-center gap-2 hover:bg-[#3B0A14] transition-colors shadow-sm cursor-pointer rounded-sm disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
}
