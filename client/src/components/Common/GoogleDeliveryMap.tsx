import React, { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Copy, 
  Check, 
  Compass, 
  Sparkles, 
  AlertCircle,
  Building
} from "lucide-react";

// Fix default Leaflet marker icons if fallback map is rendered
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface GoogleDeliveryMapProps {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number, formattedAddress?: string) => void;
  landmark?: string;
  onLandmarkChange?: (landmark: string) => void;
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

export default function GoogleDeliveryMap({
  lat,
  lng,
  onChange,
  landmark = "",
  onLandmarkChange,
  readOnly = false,
  className = "",
  height = "320px",
  zoom = 15
}: GoogleDeliveryMapProps) {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
  const hasValidApiKey = typeof apiKey === "string" && apiKey.trim().length > 10;

  const [copied, setCopied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("");

  const directMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const directMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleCopyCoordinates = () => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click High-Accuracy GPS Geolocation
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Triangulating GPS doorstep coordinates...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        setGpsAccuracy(accuracy);
        setLocationStatus(`GPS Locked (Accuracy: ±${accuracy}m). Drag pin to fine-tune exact gate.`);
        setIsLocating(false);

        if (onChange) {
          onChange(userLat, userLng, `GPS Pinpoint (±${accuracy}m)`);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsLocating(false);
        setLocationStatus("Could not fetch GPS. Please tap or drag the pin on the map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onChange]);

  return (
    <div className={`space-y-3 font-jost ${className}`}>
      {/* MAP HEADER / ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#4A0E1B]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A24B] animate-pulse shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            {readOnly ? "Verified Delivery Coordinates" : "Pinpoint Exact Doorstep Location"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="bg-[#FDFBF4] border border-[#C9A24B] text-[#4A0E1B] hover:bg-[#C9A24B] hover:text-[#2A0A10] px-3 py-1.5 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium shadow-xs disabled:opacity-50"
              title="Use your phone/laptop GPS to position the delivery pin"
            >
              <Navigation size={13} className={isLocating ? "animate-spin text-[#C9A24B]" : "text-[#C9A24B]"} />
              <span>{isLocating ? "Acquiring GPS..." : "Use My Current GPS"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCoordinates}
            className="bg-white border border-[#EAE3D5] text-[#7A6A5C] hover:text-[#4A0E1B] hover:border-[#C9A24B] px-2.5 py-1.5 rounded-sm transition-colors flex items-center gap-1 cursor-pointer text-xs"
            title="Copy Latitude, Longitude to clipboard"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span>
          </button>

          <a
            href={readOnly ? directMapsUrl : directMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#4A0E1B] text-[#FDFBF4] hover:bg-[#380A14] px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 text-xs font-medium shadow-xs"
            title="Open in Google Maps for turn-by-turn navigation"
          >
            <Compass size={13} className="text-[#C9A24B]" />
            <span>{readOnly ? "Navigate in Google Maps" : "View in Google Maps"}</span>
            <ExternalLink size={11} className="opacity-70" />
          </a>
        </div>
      </div>

      {locationStatus && (
        <p className="text-[11px] text-[#7A6A5C] bg-[#FDFBF4] border border-[#C9A24B]/20 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#C9A24B] shrink-0" />
          <span>{locationStatus}</span>
        </p>
      )}

      {/* MAP CONTAINER */}
      <div 
        className="relative rounded-sm overflow-hidden border-2 border-[#C9A24B]/30 shadow-md bg-[#FDFBF4]"
        style={{ height, minHeight: "280px" }}
      >
        {hasValidApiKey ? (
          /* GOOGLE MAPS PLATFORM (Official modern @vis.gl/react-google-maps) */
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat, lng }}
              center={{ lat, lng }}
              defaultZoom={zoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
              gestureHandling={readOnly ? "none" : "auto"}
              disableDefaultUI={readOnly}
              style={{ width: "100%", height: "100%" }}
              onClick={(e) => {
                if (!readOnly && e.detail.latLng && onChange) {
                  onChange(e.detail.latLng.lat, e.detail.latLng.lng);
                  setLocationStatus("Pin placed at selected location.");
                }
              }}
            >
              <AdvancedMarker
                position={{ lat, lng }}
                draggable={!readOnly}
                onDragEnd={(e) => {
                  if (!readOnly && e.latLng && onChange) {
                    onChange(e.latLng.lat(), e.latLng.lng());
                    setLocationStatus("Delivery pin moved to new spot.");
                  }
                }}
              >
                <Pin 
                  background="#4A0E1B" 
                  borderColor="#C9A24B" 
                  glyphColor="#C9A24B" 
                  scale={1.2}
                />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* RESILIENT LEAFLET / OSM HYBRID MAP (Works out-of-the-box without failing while user mints key) */
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
                setLocationStatus("Pin updated on map.");
              }} 
            />
            <LeafletRecenter lat={lat} lng={lng} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker 
              position={[lat, lng]}
              draggable={!readOnly}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  if (onChange) onChange(position.lat, position.lng);
                  setLocationStatus("Pin fine-tuned via drag.");
                }
              }}
            >
              <Popup>
                <div className="text-xs p-1 font-jost text-[#4A0E1B]">
                  <strong>Exact Delivery Pinpoint</strong>
                  <p className="text-[10px] text-[#7A6A5C]">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        )}

        {/* OVERLAY BADGE FOR PINPOINT ACCURACY */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-xs border border-[#C9A24B]/40 px-3 py-1.5 rounded-sm shadow-md flex items-center gap-2 text-[11px] text-[#4A0E1B]">
          <MapPin size={13} className="text-[#C9A24B] shrink-0" />
          <span className="font-semibold">{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
          {gpsAccuracy && <span className="text-[10px] text-green-700 font-medium">(±{gpsAccuracy}m)</span>}
        </div>
      </div>

      {/* LANDMARK & DOORSTEP INSTRUCTIONS FOR DELIVERY RIDER */}
      {!readOnly && onLandmarkChange && (
        <div className="bg-[#FDFBF4] border border-[#C9A24B]/20 p-3 rounded-sm space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#4A0E1B] uppercase tracking-wider">
            <Building size={14} className="text-[#C9A24B]" />
            <span>Delivery Landmark &amp; Doorstep Instructions (Helps Delivery Partner)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => onLandmarkChange(e.target.value)}
            placeholder="e.g. Opposite City Hospital Gate 2, Tower B, 4th Floor Flat 402, Ring Bell #2"
            className="w-full bg-white border border-[#C9A24B]/30 focus:border-[#C9A24B] px-3 py-2 text-xs font-jost text-[#4A0E1B] outline-none transition-colors rounded-sm"
          />
          <p className="text-[10px] text-[#7A6A5C]">
            Our courier will use these pinpoint coordinates + landmark to guarantee direct, hand-delivered arrival.
          </p>
        </div>
      )}

      {/* READONLY LANDMARK CALLOUT FOR ADMIN & INVOICE */}
      {readOnly && landmark && (
        <div className="bg-[#FDFBF4] border border-[#C9A24B]/30 p-3 rounded-sm flex items-start gap-2.5 text-xs text-[#4A0E1B]">
          <Building size={16} className="text-[#C9A24B] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#7A6A5C] block">
              Rider Doorstep &amp; Landmark Instructions
            </span>
            <p className="font-medium text-sm text-[#4A0E1B]">{landmark}</p>
          </div>
        </div>
      )}
    </div>
  );
}
