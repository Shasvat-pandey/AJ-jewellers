import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Clock, Phone, Mail, ChevronDown, Map, Loader2, Navigation } from "lucide-react";
import { useAuth } from "../../../../components/Common/context/AuthContext";
import { useToast } from "../../../Common/context/ToastContext";
import { API_URL, getAuthToken } from "../../../../utils/api";

export default function VisitUsPage() {
  const { user, requireAuth } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [showForm, setShowForm] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  const [businessInfo, setBusinessInfo] = useState({
    email: "care@ajjewellers.in",
    phone: "+91 90000 00000",
    address: "AJ Jewellers, 24 Gold Souk Lane, Main Bazaar Road, India"
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    location: "",
    message: ""
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetch(`${API_URL}/settings`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.businessInfo) {
          setBusinessInfo(data.data.businessInfo);
        }
      })
      .catch(err => console.error("Using hardcoded fallback for business info", err));
  }, []);

  useEffect(() => {
    if (user && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Deep-Linking Trigger
  useEffect(() => {
    if (searchParams.get("book") === "1") {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [searchParams]);

  // --- LOCATION AUTO-DETECT ---
  const handleDetectLocation = () => {
    setIsDetecting(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setFormData(prev => ({ ...prev, location: data.display_name }));
          }
        } catch (err) {
          setLocationError("Failed to fetch address. Please type it manually.");
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setLocationError("Permission denied. Please type your location manually.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-24 px-6 md:px-12 lg:px-20 animate-in fade-in duration-500 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">
          VISIT US
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">
          Our Boutique
        </h1>
        <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed max-w-[46ch] mx-auto">
          Explore our collections in person, exchange your gold, or sit with our karigars to design a bespoke piece.
        </p>
      </div>

      {/* --- FLEX CONTAINER FOR ANIMATION --- */}
      <div className={`max-w-6xl mx-auto flex flex-col lg:flex-row items-start transition-all duration-700 ease-in-out ${showForm ? "gap-12 lg:gap-20" : "gap-0"}`}>
        
        {/* --- LEFT COLUMN: SHOP DATA & EMBEDDED MAP --- */}
        <div className={`w-full flex flex-col space-y-8 transition-all duration-700 ease-in-out ${showForm ? "lg:w-1/2" : "max-w-3xl mx-auto"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <MapPin className="text-[#C9A24B] shrink-0 mt-0.5" size={20} />
              <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed">
                {businessInfo.address}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <Clock className="text-[#C9A24B] shrink-0 mt-0.5" size={20} />
              <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed">
                Mon — Sat · 10:30 AM — 8:30 PM<br />
                Sunday · by appointment
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <Phone className="text-[#C9A24B] shrink-0 mt-0.5" size={20} />
              <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed">
                {businessInfo.phone}
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <Mail className="text-[#C9A24B] shrink-0 mt-0.5" size={20} />
              <p className="font-jost text-[15px] md:text-base text-[#7A6A5C] leading-relaxed">
                {businessInfo.email}
              </p>
            </div>
          </div>

          <div className="w-full h-[300px] bg-gray-200 border border-[#C9A24B]/30 rounded-sm overflow-hidden shadow-sm">
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src={`https://maps.google.com/maps?q=${encodeURIComponent(businessInfo.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://maps.app.goo.gl/APohzkQzaSbiiYeN9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-2 border border-[#C9A24B]/50 text-[#4A0E1B] font-jost text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#C9A24B] hover:text-[#FDFBF4] transition-colors shadow-sm"
            >
              <Map size={16} /> Open in Maps
            </a>
            
            {!showForm && (
              <button
                onClick={() => {
                  requireAuth(() => {
                    setShowForm(true);
                    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                  }, "Sign in to book a private viewing or boutique visit");
                }}
                className="flex-1 bg-[#4A0E1B] text-[#F3E9D8] font-jost text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#3B0A14] transition-colors shadow-md flex justify-center items-center cursor-pointer"
              >
                Book Appointment
              </button>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: THE FORM (Smoothly reveals like a drawer) --- */}
        <div ref={formRef} className={`w-full transition-all duration-700 ease-in-out overflow-hidden ${showForm ? "lg:w-1/2 opacity-100 max-h-[1500px] mt-12 lg:mt-0" : "lg:w-0 opacity-0 max-h-0"}`}>
          {/* Inner container stays full width so it doesn't crush the inputs while animating */}
          <div className="w-full lg:min-w-[450px] bg-white p-8 md:p-10 border border-[#C9A24B]/30 shadow-sm relative">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#C9A24B]/20">
              <h3 className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Request a Viewing</h3>
              <button onClick={() => setShowForm(false)} className="text-[#7A6A5C] hover:text-[#4A0E1B] transition-colors flex items-center gap-1 font-jost text-xs uppercase tracking-wider cursor-pointer">
                Close <ChevronDown size={14} className="rotate-180" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) {
                  requireAuth(() => {}, "Sign in to confirm your appointment request");
                  return;
                }
                try {
                  const token = getAuthToken();
                  const res = await fetch(`${API_URL}/appointments`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                      customerName: formData.name,
                      phone: formData.phone,
                      userLocation: formData.location,
                      preferredDate: formData.date,
                      interests: formData.message
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast("Appointment request submitted successfully! Our boutique concierge will reach out to confirm your slot.", "success");
                    setShowForm(false);
                    setFormData({ name: user.name || "", phone: user.phone || "", date: "", location: "", message: "" });
                  } else {
                    showToast("Failed to submit request: " + (data.message || "Please check details."), "error");
                  }
                } catch (err: any) {
                  console.error("Appointment error:", err);
                  showToast("Network error. Please try again.", "error");
                }
              }}
              className="space-y-6"
            >
              <div>
                <label className="block font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2">Your Name</label>
                <input type="text" name="customerName" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost transition-colors" />
              </div>
              
              <div>
                <label className="block font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2">Mobile Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} maxLength={10} required className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost transition-colors" />
              </div>

              {/* --- AUTO-DETECT LOCATION FIELD --- */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase">Your Location</label>
                  <button 
                    type="button" 
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="text-[#C9A24B] hover:text-[#4A0E1B] font-jost text-[10px] tracking-wider uppercase flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDetecting ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    {isDetecting ? "Detecting..." : "Auto-Detect"}
                  </button>
                </div>
                <input type="text" name="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required placeholder="City, Area, or full address" className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost transition-colors" />
                {locationError && <p className="text-red-500 text-xs mt-1 font-jost">{locationError}</p>}
              </div>
              
              <div>
                <label className="block font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2">Preferred Date</label>
                <input type="date" name="preferredDate" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost transition-colors cursor-pointer" />
              </div>
              
              <div>
                <label className="block font-jost text-[10px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-2">What would you like to see?</label>
                <textarea rows={3} name="message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required placeholder="Bridal set, solitaire ring, gold exchange..." className="w-full bg-[#FDFBF4] border border-[#C9A24B]/40 p-3.5 outline-none focus:border-[#C9A24B] text-[#4A0E1B] font-jost placeholder:text-[#7A6A5C]/60 resize-none transition-colors"></textarea>
              </div>
              
              <button type="submit" className="w-full bg-[#C9A24B] text-[#FDFBF4] font-jost text-[11px] md:text-xs tracking-[0.2em] uppercase py-4 hover:bg-[#b08d40] transition-colors mt-2 shadow-md cursor-pointer font-semibold">
                Confirm Request
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}