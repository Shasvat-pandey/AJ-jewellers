import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaClock } from "react-icons/fa";
import { API_URL } from "../../../../utils/api";

export default function GoldRatePage() {
  // --- LIVE DATA STATES ---
  const [marketRates, setMarketRates] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("TODAY, 10:00 AM");
  const [isLoading, setIsLoading] = useState(true);

  // State for calculator
  const [selectedRateId, setSelectedRateId] = useState("24k");
  const [weight, setWeight] = useState(20);
  const [makingChargesPercent, setMakingChargesPercent] = useState(6);

  // --- FETCH LIVE RATES FROM ADMIN SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.data) {
          setMarketRates(data.data.marketRates);
          
          // Format the exact time it was updated in the Admin panel
          if (data.data.updatedAt) {
            const dateObj = new Date(data.data.updatedAt);
            const formattedDate = `${dateObj.toLocaleDateString('en-US', {
              month: 'short', day: '2-digit', year: 'numeric'
            })}, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`;
            setLastUpdated(formattedDate.toUpperCase());
          }
        }
      } catch (error) {
        console.error("Error fetching market rates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // --- BUILD DYNAMIC RATES ARRAY ---
  // If loading or API fails, fallback to 0 safely so the page doesn't crash
  const dynamicRates = [
    { id: "22k", name: "22K", price: marketRates?.rate22k || 0, unit: "GRAM" },
    { id: "24k", name: "24K", price: marketRates?.rate24k || 0, unit: "GRAM" },
    { id: "18k", name: "18K", price: marketRates?.rate18k || 0, unit: "GRAM" },
    { id: "silver", name: "Silver", price: marketRates?.silver || 0, unit: "GRAM" },
  ];

  // Active metal selection
  const selectedMetal = dynamicRates.find((rate) => rate.id === selectedRateId) || dynamicRates[1];

  // Calculations
  const metalValue = selectedMetal.price * weight;
  const makingCharges = metalValue * (makingChargesPercent / 100);
  const gstAmount = (metalValue + makingCharges) * 0.03;
  const totalEstimate = metalValue + makingCharges + gstAmount;

  // Currency formatter
  const formatINR = (amount: number, showDecimals: boolean = false) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  };

  // Calculate percentages for the slider fill effect
  const weightFillPercentage = ((weight - 1) / 99) * 100;
  const makingChargesFillPercentage = (makingChargesPercent / 30) * 100;

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF4] pt-36 text-center text-[#7A6A5C] font-jost animate-pulse">Loading live market rates...</div>;
  }

  return (
    <div className="bg-[#FDFBF4] min-h-screen pt-28 md:pt-36 pb-20 px-6 md:px-12 lg:px-20 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
        <p className="font-jost text-[10px] md:text-xs tracking-[0.24em] text-[#C9A24B] uppercase mb-4 font-semibold">
          LIVE MARKET RATES
        </p>
        <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl text-[#4A0E1B] mb-5">
          Today's Gold & Silver Rate
        </h1>
        <p className="font-jost text-sm md:text-base text-[#7A6A5C] leading-relaxed max-w-[50ch] mx-auto font-medium">
          Rates are indicative for retail purchase at our boutique and exclude
          making charges and GST.
        </p>
      </div>

      {/* --- RATE CARDS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-6">
        {dynamicRates.map((rate) => (
          <div
            key={rate.id}
            className="bg-[#4A0E1B] py-8 px-4 flex flex-col items-center justify-center text-center shadow-md"
          >
            <p className="font-cormorant text-3xl md:text-4xl text-[#F3E9D8] mb-2">
              {formatINR(rate.price, false)}
            </p>
            <p className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#C9A24B] uppercase font-medium">
              {rate.name} / {rate.unit}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-[#7A6A5C] mb-16">
        <FaClock size={13} />
        <span className="font-jost text-[10px] md:text-xs tracking-[0.14em] uppercase font-semibold">
          LAST UPDATED: {lastUpdated}
        </span>
      </div>

      {/* --- PRICE CALCULATOR --- */}
      <div className="max-w-md mx-auto bg-[#FDFBF4] border-t border-b border-[#EAE3D5] py-10">
        <h2 className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B] mb-10">
          Price calculator
        </h2>

        {/* Dropdown */}
        <div className="mb-8">
          <label className="block font-jost text-[11px] tracking-[0.2em] text-[#7A6A5C] uppercase mb-3">
            PURITY
          </label>
          <div className="relative">
            <select
              value={selectedRateId}
              onChange={(e) => setSelectedRateId(e.target.value)}
              className="w-full appearance-none bg-[#FDFBF4] border border-[#EAE3D5] font-jost text-base md:text-lg text-[#4A0E1B] py-3.5 px-4 focus:outline-none focus:border-[#C9A24B] cursor-pointer rounded-none outline-none shadow-sm"
            >
              {dynamicRates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name} / {rate.unit.toLowerCase()} — {formatINR(rate.price, false)}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#4A0E1B]">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Weight Slider */}
        <div className="mb-8">
          <label className="flex gap-2 font-jost text-[11px] tracking-[0.2em] uppercase mb-4">
            <span className="text-[#7A6A5C]">WEIGHT IN GRAMS:</span>
            <span className="text-[#4A0E1B] font-medium">{weight} G</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:border-none"
            style={{
              background: `linear-gradient(to right, #D4AF37 ${weightFillPercentage}%, #4A0E1B ${weightFillPercentage}%)`
            }}
          />
        </div>

        {/* Making Charges Slider */}
        <div className="mb-12">
          <label className="flex gap-2 font-jost text-[11px] tracking-[0.2em] uppercase mb-4">
            <span className="text-[#7A6A5C]">MAKING CHARGES:</span>
            <span className="text-[#4A0E1B] font-medium">{makingChargesPercent}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="30"
            value={makingChargesPercent}
            onChange={(e) => setMakingChargesPercent(Number(e.target.value))}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:border-none"
            style={{
              background: `linear-gradient(to right, #D4AF37 ${makingChargesFillPercentage}%, #4A0E1B ${makingChargesFillPercentage}%)`
            }}
          />
        </div>

        {/* Breakdown */}
        <div className="border-t border-[#EAE3D5] pt-8 space-y-4 font-jost text-[15px]">
          <div className="flex justify-between items-center">
            <span className="text-[#7A6A5C]">Metal value</span>
            <span className="text-[#4A0E1B] font-medium">{formatINR(metalValue, true)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#7A6A5C]">Making charges</span>
            <span className="text-[#4A0E1B] font-medium">{formatINR(makingCharges, true)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#7A6A5C]">GST (3%)</span>
            <span className="text-[#4A0E1B] font-medium">{formatINR(gstAmount, true)}</span>
          </div>
        </div>

        {/* Total Estimate */}
        <div className="flex justify-between items-baseline mt-10 pt-8 border-t border-[#EAE3D5]">
          <span className="font-cormorant text-2xl md:text-3xl text-[#4A0E1B]">Estimate</span>
          <span className="font-cormorant text-3xl md:text-4xl text-[#4A0E1B]">
            {formatINR(totalEstimate, true)}
          </span>
        </div>
      </div>

      <div className="text-center mt-16">
        <Link
          to="/collections"
          onClick={() => window.scrollTo(0, 0)}
          className="inline-block font-jost text-xs md:text-sm tracking-[0.14em] text-[#4A0E1B] border border-[#4A0E1B]/40 px-10 py-4 hover:bg-[#4A0E1B] hover:text-[#FDFBF4] transition-colors"
        >
          SHOP THE COLLECTIONS
        </Link>
      </div>
    </div>
  );
}