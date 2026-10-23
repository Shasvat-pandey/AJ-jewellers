import React, { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Compass,
  FileText,
  Info,
  Pencil
} from "lucide-react";

export interface GoogleDeliveryMapProps {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number, formattedAddress?: string) => void;
  landmark?: string;
  onLandmarkChange?: (landmark: string) => void;
  addressDetails?: string;
  readOnly?: boolean;
  className?: string;
  height?: string;
  zoom?: number;
}

// Leaflet Fallback Click & Recenter Handlers
function LeafletClickHandler({ onPick, enabled }: { onPick: (lat: number, lng: number) => void; enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function LeafletRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Custom Marker for Leaflet matching the design mock (Concentric ring + Burgundy Pin + Tooltip badge)
const customDeliveryPinIcon = L.divIcon({
  className: "custom-delivery-pin",
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
      <div style="background: white; color: #4A0E1B; font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 600; font-size: 11px; padding: 3px 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); border: 1px solid #E5D7B7; white-space: nowrap; margin-bottom: 4px;">
        Your Delivery Location
      </div>
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(74, 14, 27, 0.15); border: 1px solid rgba(74, 14, 27, 0.3);"></div>
        <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(74, 14, 27, 0.25);"></div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#4A0E1B" stroke="#C9A24B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 2; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.25));">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" fill="#FFFDF9" stroke="#C9A24B" />
        </svg>
      </div>
    </div>
  `,
  iconSize: [44, 76],
  iconAnchor: [22, 76],
  popupAnchor: [0, -76]
});

export default function GoogleDeliveryMap({
  lat,
  lng,
  onChange,
  landmark = "",
  onLandmarkChange,
  addressDetails = "",
  readOnly = false,
  className = "",
  height = "380px",
  zoom = 15
}: GoogleDeliveryMapProps) {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
  const hasValidApiKey = typeof apiKey === "string" && apiKey.trim().length > 10;

  const [copied, setCopied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const directMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleCopyCoordinates = () => {
    const text = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click High-Accuracy GPS Geolocation
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setIsLocating(false);

        if (onChange) {
          onChange(userLat, userLng);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsLocating(false);
        alert("Could not fetch GPS. Please tap or drag the pin on the map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onChange]);

  const handleEditLocation = () => {
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className={`space-y-4 font-jost ${className}`}>
      {/* 1. CONTROLS BAR: PINPOINT EXACT DOORSTEP LOCATION */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A24B] shrink-0" />
          <span className="font-jost text-[11px] font-semibold uppercase tracking-[0.15em] text-[#4A0E1B]">
            PINPOINT EXACT DOORSTEP LOCATION
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Action 1: Use My Current Location */}
          {!readOnly && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="bg-white border border-[#C9A24B]/60 hover:bg-[#FDFBF4] text-[#4A0E1B] px-4 py-2.5 rounded-lg text-xs font-jost font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Navigation size={14} className={isLocating ? "animate-spin text-[#9B783E]" : "text-[#9B783E]"} />
              <span>{isLocating ? "Locating..." : "Use My Current Location"}</span>
            </button>
          )}

          {/* Action 2: Coordinates Box with Copy */}
          <button
            type="button"
            onClick={handleCopyCoordinates}
            className="bg-white border border-gray-200 hover:border-[#C9A24B]/50 text-[#4A0E1B] px-4 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Click to copy coordinates"
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} className="text-[#7A6A5C]" />
            )}
            <span>{copied ? "Copied!" : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span>
          </button>

          {/* Action 3: View in Google Maps */}
          <a
            href={directMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#4A0E1B] hover:bg-[#3B0A14] text-[#F3E9D8] px-4 py-2.5 rounded-lg text-xs font-jost font-medium tracking-wide flex items-center gap-2 shadow-xs transition-colors"
          >
            <MapPin size={14} className="text-[#C9A24B]" />
            <span>View in Google Maps</span>
            <ExternalLink size={12} className="opacity-80" />
          </a>
        </div>
      </div>

      {/* 2. MAP CONTAINER WITH FLOATING SELECTED LOCATION CARD */}
      <div
        ref={mapContainerRef}
        className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-[#FDFBF4]"
        style={{ height, minHeight: "360px" }}
      >
        {/* Map / Satellite Toggle Pill (Top Left) */}
        <div className="absolute top-3.5 left-3.5 z-[500] bg-white rounded-full p-0.5 shadow-md border border-gray-200 flex items-center text-xs font-jost">
          <button
            type="button"
            onClick={() => setMapType("standard")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              mapType === "standard"
                ? "bg-gray-100 text-[#4A0E1B] font-semibold shadow-xs"
                : "text-[#7A6A5C] hover:text-[#4A0E1B]"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              mapType === "satellite"
                ? "bg-gray-100 text-[#4A0E1B] font-semibold shadow-xs"
                : "text-[#7A6A5C] hover:text-[#4A0E1B]"
            }`}
          >
            Satellite
          </button>
        </div>

        {/* FLOATING SELECTED LOCATION OVERLAY (Right Side - exact match to user mockup) */}
        <div className="absolute top-3.5 right-3.5 z-[500] bg-white/95 backdrop-blur-xs border border-gray-200 rounded-xl p-3.5 sm:p-4 shadow-xl w-[230px] sm:w-[260px] pointer-events-auto space-y-2.5 text-left">
          {/* Header */}
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#4A0E1B] fill-[#4A0E1B] shrink-0" />
            <span className="text-xs font-bold text-[#4A0E1B] font-jost">Selected Location</span>
          </div>

          {/* Address / Landmark preview */}
          <div className="text-[11px] font-jost text-[#4A0E1B] leading-relaxed">
            {landmark ? (
              <p className="line-clamp-3 font-medium">{landmark}</p>
            ) : addressDetails ? (
              <p className="line-clamp-3">{addressDetails}</p>
            ) : (
              <p className="text-[#7A6A5C] italic">Click or drag pin to choose exact doorstep</p>
            )}
          </div>

          {/* Coordinates row */}
          <div className="pt-2 border-t border-gray-100 flex items-start gap-1.5">
            <Compass size={13} className="text-[#C9A24B] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#7A6A5C] font-jost block">
                Coordinates
              </span>
              <span className="text-xs font-mono font-medium text-[#4A0E1B]">
                {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </span>
            </div>
          </div>

          {/* Edit Location button */}
          {!readOnly && (
            <button
              type="button"
              onClick={handleEditLocation}
              className="w-full bg-[#FDFBF4] border border-[#E5D7B7] hover:bg-[#F5EEDC] text-[#4A0E1B] text-xs font-jost py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs font-medium"
            >
              <Pencil size={12} className="text-[#4A0E1B]" />
              <span>Edit Location</span>
            </button>
          )}
        </div>

        {/* MAP RENDERING: GOOGLE MAPS PLATFORM OR LEAFLET HYBRID */}
        {hasValidApiKey ? (
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              defaultCenter={{ lat, lng }}
              center={{ lat, lng }}
              defaultZoom={zoom}
              mapTypeId={mapType === "satellite" ? "hybrid" : "roadmap"}
              gestureHandling={readOnly ? "none" : "auto"}
              disableDefaultUI={false}
              style={{ width: "100%", height: "100%" }}
              onClick={(e) => {
                if (!readOnly && e.detail.latLng && onChange) {
                  onChange(e.detail.latLng.lat, e.detail.latLng.lng);
                }
              }}
            >
              <AdvancedMarker
                position={{ lat, lng }}
                draggable={!readOnly}
                onDragEnd={(e) => {
                  if (!readOnly && e.latLng && onChange) {
                    onChange(e.latLng.lat(), e.latLng.lng());
                  }
                }}
              >
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", transform: "translate(-50%, -100%)" }}>
                  <div style={{ background: "white", color: "#4A0E1B", fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "11px", padding: "3px 10px", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: "1px solid #E5D7B7", whiteSpace: "nowrap", marginBottom: "4px" }}>
                    Your Delivery Location
                  </div>
                  <div style={{ position: "relative", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", width: "40px", height: "40px", borderRadius: "50%", background: "rgba(74, 14, 27, 0.15)", border: "1px solid rgba(74, 14, 27, 0.3)" }} />
                    <MapPin size={28} className="text-[#4A0E1B] fill-[#4A0E1B] relative z-10" />
                  </div>
                </div>
              </AdvancedMarker>
            </GoogleMap>
          </APIProvider>
        ) : (
          <MapContainer
            center={[lat, lng]}
            zoom={zoom}
            scrollWheelZoom={!readOnly}
            dragging={!readOnly}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
          >
            <LeafletClickHandler
              enabled={!readOnly}
              onPick={(newLat, newLng) => {
                if (onChange) onChange(newLat, newLng);
              }}
            />
            <LeafletRecenter lat={lat} lng={lng} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={
                mapType === "satellite"
                  ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
            />
            <Marker
              position={[lat, lng]}
              icon={customDeliveryPinIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  if (onChange) onChange(position.lat, position.lng);
                }
              }}
            />
          </MapContainer>
        )}
      </div>

      {/* 3. BOTTOM LANDMARK & DOORSTEP INSTRUCTIONS BOX (Exact match to user mockup) */}
      {!readOnly && onLandmarkChange && (
        <div className="bg-[#FDFBF4] border border-[#C9A24B]/30 rounded-xl p-4 sm:p-5 space-y-2.5">
          <label
            htmlFor="checkout-landmark-input"
            className="flex items-center gap-2 text-xs font-semibold text-[#4A0E1B] font-jost uppercase tracking-[0.12em]"
          >
            <FileText size={18} className="text-[#C9A24B] shrink-0" />
            <span>DELIVERY LANDMARK &amp; DOORSTEP INSTRUCTIONS (HELPS DELIVERY PARTNER)</span>
          </label>
          <input
            id="checkout-landmark-input"
            type="text"
            value={landmark}
            onChange={(e) => onLandmarkChange(e.target.value)}
            placeholder="e.g. Opposite City Hospital Gate 2, Tower B, 4th Floor Flat 402, Ring Bell #2"
            className="w-full bg-white border border-gray-200 focus:border-[#C9A24B] px-4 py-3 text-xs sm:text-sm font-jost text-[#4A0E1B] outline-none rounded-lg shadow-xs transition-colors placeholder:text-gray-400"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-[#7A6A5C] font-jost pt-0.5">
            <Info size={13} className="shrink-0 text-[#7A6A5C]" />
            <span>Our courier will use these pinpoint coordinates + landmark to guarantee direct, hand-delivered arrival.</span>
          </div>
        </div>
      )}

      {/* Read-only view for Admin / Invoice */}
      {readOnly && landmark && (
        <div className="bg-[#FDFBF4] border border-[#C9A24B]/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#4A0E1B]">
          <FileText size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#7A6A5C] block">
              Rider Doorstep &amp; Landmark Instructions
            </span>
            <p className="font-medium text-sm text-[#4A0E1B] mt-0.5">{landmark}</p>
          </div>
        </div>
      )}
    </div>
  );
}
