import { useState, useEffect } from "react";
import { FaClock } from "react-icons/fa";
import { API_URL } from "../../utils/api";
import CountingRate from "./CountingRate";

export default function GoldRateBanner() {
  const [rates, setRates] = useState({
    rate24k: 0,
    rate22k: 0,
    rate18k: 0,
    silver: 0,
  });
  const [lastUpdated, setLastUpdated] = useState("FETCHING LIVE RATES...");

  // --- FETCH LIVE RATES FROM ADMIN SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.data) {
          setRates(data.data.marketRates);
          
          if (data.data.updatedAt) {
            const dateObj = new Date(data.data.updatedAt);
            const formattedDate = `UPDATED: ${dateObj.toLocaleDateString('en-US', {
              month: 'short', day: '2-digit', year: 'numeric'})}, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' })}`;
            setLastUpdated(formattedDate.toUpperCase());
          }
        }
      } catch (error) {
        console.error("Error fetching market rates:", error);
        setLastUpdated("COULD NOT FETCH LIVE RATES");
      }
    };

    fetchSettings();
  }, []);

  // Currency formatter
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section
      className="py-10 md:py-14 px-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse at center, #5A0F1D 0%, #3B0A14 70%, #2A0710 100%)",
      }}
    >
      <p className="font-jost text-[11px] md:text-xs tracking-[0.24em] text-[#C9A24B] mb-8 md:mb-10">
        LIVE MARKET RATES
      </p>

      {/* Grid for mobile (2x2), Flex row for desktop (4 in a line) */}
      <div className="grid grid-cols-2 md:flex md:flex-row md:justify-center md:items-center gap-y-8 gap-x-4 md:gap-8 max-w-5xl mx-auto">
        
        {/* 24K GOLD */}
        <div className="flex flex-col items-center">
          <p className="font-cormorant text-3xl md:text-5xl text-[#F3E9D8]">
            <CountingRate value={rates.rate24k} formatter={formatINR} duration={1600} />
          </p>
          <p className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#E7C9B8]/80 mt-2">
            24K / GRAM
          </p>
        </div>

        {/* Desktop Divider */}
        <div className="hidden md:block w-px h-10 md:h-14 bg-[#C9A24B]/40" />

        {/* 22K GOLD */}
        <div className="flex flex-col items-center">
          <p className="font-cormorant text-3xl md:text-5xl text-[#F3E9D8]">
            <CountingRate value={rates.rate22k} formatter={formatINR} duration={1600} />
          </p>
          <p className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#E7C9B8]/80 mt-2">
            22K / GRAM
          </p>
        </div>

        {/* Desktop Divider */}
        <div className="hidden md:block w-px h-10 md:h-14 bg-[#C9A24B]/40" />

        {/* 18K GOLD */}
        <div className="flex flex-col items-center">
          <p className="font-cormorant text-3xl md:text-5xl text-[#F3E9D8]">
            <CountingRate value={rates.rate18k} formatter={formatINR} duration={1600} />
          </p>
          <p className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#E7C9B8]/80 mt-2">
            18K / GRAM
          </p>
        </div>

        {/* Desktop Divider */}
        <div className="hidden md:block w-px h-10 md:h-14 bg-[#C9A24B]/40" />

        {/* SILVER */}
        <div className="flex flex-col items-center">
          <p className="font-cormorant text-3xl md:text-5xl text-[#F3E9D8]">
            <CountingRate value={rates.silver} formatter={formatINR} duration={1600} />
          </p>
          <p className="font-jost text-[10px] md:text-xs tracking-[0.16em] text-[#E7C9B8]/80 mt-2">
            SILVER / GRAM
          </p>
        </div>

      </div>

      <div className="flex items-center justify-center gap-2 mt-8 md:mt-10 text-[#C9A24B]/80">
        <FaClock size={14} />
        <span className="font-jost text-[10px] md:text-xs tracking-[0.14em]">
          {lastUpdated}
        </span>
      </div>
    </section>
  );
}