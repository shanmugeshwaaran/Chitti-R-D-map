"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ArrowUpDown, Clock, X, Search } from "lucide-react";
import NavigationOverlay from "./NavigationOverlay";

type SearchOverlayProps = {
  start: string;
  destination: string;
  onStartChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSwap: () => void;
  alertCount?: number;
};

const RECENT_LOCATIONS = ["Guindy National Park", "T. Nagar Bus Terminus"];
const SUGGESTED_LOCATIONS = [
  "Anna Nagar West",
  "SRM Adyar Campus",
  "Velachery MRTS",
  "Tambaram Sanatorium",
  "Marina Beach",
  "Egmore Railway Station",
  "Kodambakkam"
];

export default function SearchOverlay({
  start,
  destination,
  onStartChange,
  onDestinationChange,
  onSwap,
}: SearchOverlayProps) {
  const [activeField, setActiveField] = useState<"start" | "destination" | null>(null);
  const [query, setQuery] = useState("");
  const [isNavActive, setIsNavActive] = useState(false);
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
    if (activeField === "start") {
      onStartChange(location);
    } else if (activeField === "destination") {
      onDestinationChange(location);
    }
    setActiveField(null);
    setQuery("");
  };

  const handleSearchRoute = () => {
    setActiveField(null);
    setIsNavActive(true); // Triggers the live walk-through navigation overlay
  };

  const displayLocations = query 
    ? SUGGESTED_LOCATIONS.filter(loc => loc.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED_LOCATIONS;

  return (
    <div className="w-full max-w-md mx-auto pt-10 px-4 pointer-events-auto" ref={overlayRef}>
      {/* Live Navigation Overlay Component */}
      {isNavActive && (
        <NavigationOverlay 
          start={start} 
          destination={destination} 
          onClose={() => setIsNavActive(false)} 
        />
      )}
      
      <div className="bg-navy-950/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Input Fields Container */}
        <div className="p-4 flex gap-3 relative items-center">
          {/* Visual Route Timeline */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2 gap-1 w-6">
            <div className="w-2.5 h-2.5 rounded-full bg-chitti-cyan border-2 border-navy-950 z-10" />
            <div className="flex-1 w-[2px] bg-white/10 my-0.5 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-navy-950 z-10" />
          </div>
          
          <div className="flex-1 space-y-3">
            {/* Start Input */}
            <div className="relative">
              <input
                type="text"
                value={activeField === "start" ? query : start}
                onChange={(e) => {
                  if (activeField !== "start") setActiveField("start");
                  setQuery(e.target.value);
                }}
                onFocus={() => {
                  setActiveField("start");
                  setQuery("");
                }}
                placeholder="Choose starting point"
                className={`w-full bg-black/40 border ${activeField === "start" ? "border-chitti-cyan ring-1 ring-chitti-cyan/50" : "border-white/5"} rounded-lg py-2.5 pl-3 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
              />
              {activeField === "start" && (
                <button onClick={() => { setActiveField(null); setQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Destination Input */}
            <div className="relative">
              <input
                type="text"
                value={activeField === "destination" ? query : destination}
                onChange={(e) => {
                  if (activeField !== "destination") setActiveField("destination");
                  setQuery(e.target.value);
                }}
                onFocus={() => {
                  setActiveField("destination");
                  setQuery(""); 
                }}
                placeholder="Choose destination"
                className={`w-full bg-black/40 border ${activeField === "destination" ? "border-blue-500 ring-1 ring-blue-500/50" : "border-white/5"} rounded-lg py-2.5 pl-3 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none transition-all`}
              />
              {activeField === "destination" && (
                <button onClick={() => { setActiveField(null); setQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Right Side Action Buttons */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onSwap();
              }}
              className="bg-black/50 p-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
              title="Swap Locations"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-chitti-mist" />
            </button>

            <button 
              onClick={handleSearchRoute}
              className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center active:scale-95"
              title="Search Route"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expandable Dropdown List */}
        {activeField && (
          <div className="border-t border-white/10 bg-black/60 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
            {!query && (
              <>
                <div className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/40">
                  Recent History
                </div>
                {RECENT_LOCATIONS.map((loc, idx) => (
                  <button 
                    key={`recent-${idx}`} 
                    onClick={() => handleSelect(loc)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{loc}</span>
                  </button>
                ))}
              </>
            )}

            <div className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-black/40 mt-1">
              {query ? "Search Results" : "Suggestions"}
            </div>
            {displayLocations.length > 0 ? (
              displayLocations.map((loc, idx) => (
                <button 
                  key={`suggest-${idx}`} 
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white">{loc}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center flex flex-col items-center text-sm text-gray-500">
                <MapPin className="h-6 w-6 text-gray-600 mb-2" />
                No locations found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}