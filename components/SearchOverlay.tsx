"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ArrowUpDown, Clock, X, Search, Loader2, AlertCircle } from "lucide-react";
import NavigationOverlay from "./NavigationOverlay";
import { fetchOsrmRoute, type LatLng } from "@/lib/osrm";

// ── Chennai locations dataset ──────────────────────────────────────────────
export interface ChennaiLocation {
  name: string;
  lat: number;
  lng: number;
}

export const CHENNAI_LOCATIONS: ChennaiLocation[] = [
  { name: "Anna Nagar West",          lat: 13.0856, lng: 80.2101 },
  { name: "T. Nagar Bus Terminus",    lat: 13.0418, lng: 80.2341 },
  { name: "Guindy Industrial Estate", lat: 13.0067, lng: 80.2206 },
  { name: "Velachery MRTS",           lat: 12.9815, lng: 80.2180 },
  { name: "OMR IT Corridor",          lat: 12.9010, lng: 80.2279 },
  { name: "Tambaram Sanatorium",      lat: 12.9249, lng: 80.1000 },
  { name: "Marina Beach",             lat: 13.0523, lng: 80.2824 },
  { name: "Egmore Railway Station",   lat: 13.0785, lng: 80.2624 },
  { name: "Koyambedu CMBT",           lat: 13.0694, lng: 80.1948 },
  { name: "Adyar",                    lat: 13.0012, lng: 80.2565 },
  { name: "Porur Junction",           lat: 13.0337, lng: 80.1569 },
  { name: "Chromepet",                lat: 12.9516, lng: 80.1462 },
  { name: "Kodambakkam",              lat: 13.0520, lng: 80.2219 },
  { name: "Central Railway Station",  lat: 13.0827, lng: 80.2754 },
  { name: "Besant Nagar",             lat: 12.9990, lng: 80.2697 },
  { name: "Perambur",                 lat: 13.1149, lng: 80.2453 },
  { name: "Sholinganallur",           lat: 12.9010, lng: 80.2279 },
  { name: "SRM Adyar Campus",         lat: 13.0067, lng: 80.2571 },
  { name: "Guindy National Park",     lat: 13.0050, lng: 80.2200 },
  { name: "Nungambakkam",             lat: 13.0604, lng: 80.2450 },
];

const RECENT_LOCATIONS = [
  "Guindy National Park",
  "T. Nagar Bus Terminus",
];

// ── Types ──────────────────────────────────────────────────────────────────
export interface RouteResult {
  polyline: [number, number][];
  distance: string;
  duration: string;
  src: LatLng;
  dst: LatLng;
}

type SearchOverlayProps = {
  start: string;
  destination: string;
  onStartChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSwap: () => void;
  alertCount?: number;
  onRouteFound?: (result: RouteResult | null) => void;
};

function findLocation(name: string): ChennaiLocation | undefined {
  return CHENNAI_LOCATIONS.find(
    (l) => l.name.toLowerCase() === name.toLowerCase()
  );
}

export default function SearchOverlay({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  onSwap,
  onRouteFound,
}: SearchOverlayProps) {
  const [activeField, setActiveField] = useState<"start" | "destination" | null>(null);
  const [query, setQuery] = useState("");
  const [isNavActive, setIsNavActive] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (location: string) => {
    if (activeField === "start") onStartChange(location);
    else if (activeField === "destination") onDestinationChange(location);
    setActiveField(null);
    setQuery("");
    setRouteError(null);
  };

  const handleSearchRoute = async () => {
    setActiveField(null);
    setRouteError(null);

    const srcLoc = findLocation(start);
    const dstLoc = findLocation(destination);

    if (!srcLoc || !dstLoc) {
      setRouteError("Please select valid locations from the dropdown list.");
      return;
    }

    setRouteLoading(true);
    try {
      const result = await fetchOsrmRoute(
        { lat: srcLoc.lat, lng: srcLoc.lng },
        { lat: dstLoc.lat, lng: dstLoc.lng }
      );
      onRouteFound?.({
        ...result,
        src: { lat: srcLoc.lat, lng: srcLoc.lng },
        dst: { lat: dstLoc.lat, lng: dstLoc.lng },
      });
      setIsNavActive(true);
    } catch (err) {
      console.error(err);
      setRouteError("Could not fetch route. Check your internet connection.");
      onRouteFound?.(null);
    } finally {
      setRouteLoading(false);
    }
  };

  // Filter suggestions based on query
  const displayLocations = query
    ? CHENNAI_LOCATIONS.filter((loc) =>
        loc.name.toLowerCase().includes(query.toLowerCase())
      )
    : CHENNAI_LOCATIONS;

  const recentLocs = CHENNAI_LOCATIONS.filter((l) =>
    RECENT_LOCATIONS.includes(l.name)
  );

  return (
    <div className="w-full max-w-md mx-auto pt-10 px-4 pointer-events-auto" ref={overlayRef}>
      {/* Live Navigation Overlay */}
      {isNavActive && (
        <NavigationOverlay
          start={start}
          destination={destination}
          onClose={() => setIsNavActive(false)}
        />
      )}

      <div className="bg-navy-950/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">

        {/* Input Fields */}
        <div className="p-4 flex gap-3 relative items-center">
          {/* Route timeline dots */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2 gap-1 w-6 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-chitti-cyan border-2 border-navy-950 z-10" />
            <div className="flex-1 w-[2px] bg-white/10 my-0.5 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-navy-950 z-10" />
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            {/* Source input */}
            <div className="relative">
              <input
                type="text"
                value={activeField === "start" ? query : start}
                onChange={(e) => {
                  if (activeField !== "start") setActiveField("start");
                  setQuery(e.target.value);
                }}
                onFocus={() => { setActiveField("start"); setQuery(""); }}
                placeholder="Choose starting point"
                className={`w-full bg-black/40 border ${
                  activeField === "start"
                    ? "border-chitti-cyan ring-1 ring-chitti-cyan/50"
                    : "border-white/5"
                } rounded-lg py-2.5 pl-3 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
              />
              {activeField === "start" && (
                <button
                  onClick={() => { setActiveField(null); setQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Destination input */}
            <div className="relative">
              <input
                type="text"
                value={activeField === "destination" ? query : destination}
                onChange={(e) => {
                  if (activeField !== "destination") setActiveField("destination");
                  setQuery(e.target.value);
                }}
                onFocus={() => { setActiveField("destination"); setQuery(""); }}
                placeholder="Choose destination"
                className={`w-full bg-black/40 border ${
                  activeField === "destination"
                    ? "border-blue-500 ring-1 ring-blue-500/50"
                    : "border-white/5"
                } rounded-lg py-2.5 pl-3 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
              />
              {activeField === "destination" && (
                <button
                  onClick={() => { setActiveField(null); setQuery(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); onSwap(); }}
              className="bg-black/50 p-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
              title="Swap Locations"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-chitti-mist" />
            </button>

            <button
              onClick={handleSearchRoute}
              disabled={routeLoading}
              className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Search Route"
            >
              {routeLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />
              }
            </button>
          </div>
        </div>

        {/* Route error */}
        {routeError && (
          <div className="mx-4 mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {routeError}
          </div>
        )}

        {/* Dropdown list */}
        {activeField && (
          <div className="border-t border-white/10 bg-black/60 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
            {!query && (
              <>
                <div className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/40">
                  Recent History
                </div>
                {recentLocs.map((loc) => (
                  <button
                    key={`recent-${loc.name}`}
                    onClick={() => handleSelect(loc.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
                  >
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-300">{loc.name}</span>
                  </button>
                ))}
              </>
            )}

            <div className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/40 mt-1">
              {query ? "Search Results" : "Chennai Hubs"}
            </div>

            {displayLocations.length > 0 ? (
              displayLocations.map((loc) => (
                <button
                  key={`suggest-${loc.name}`}
                  onClick={() => handleSelect(loc.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-sm text-white">{loc.name}</span>
                    <span className="block text-[10px] text-gray-500 font-mono">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center flex flex-col items-center text-sm text-gray-500">
                <MapPin className="h-6 w-6 text-gray-600 mb-2" />
                No locations found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}