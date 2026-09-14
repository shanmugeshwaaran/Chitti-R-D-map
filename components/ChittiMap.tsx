"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/lib/superbase";
import ReportModal from "./ReportModal";

export type PotholeSpot = {
  id: number;
  position: [number, number];
  location: string;
  severity: "High" | "Medium" | "Low";
  reports: number;
  status: "active" | "verification";
};

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

// Navigation route — only shown when user explicitly requests routing
const DEFAULT_ROUTE: [number, number][] = [
  [13.0993, 80.2209],
  [13.085, 80.2101],
  [13.0604, 80.2205],
  [13.0418, 80.2341],
  [13.0189, 80.2432],
  [13.0012, 80.2565],
];

function severityFill(severity: PotholeSpot["severity"]) {
  switch (severity) {
    case "High":   return "#FF5A5F";
    case "Medium": return "#FF8A5C";
    default:       return "#FBBF24";
  }
}

function buildPotholeIcon(severity: PotholeSpot["severity"]) {
  const fill = severityFill(severity);
  return L.divIcon({
    className: "chitti-pothole-icon",
    html: `
      <div class="chitti-pothole-marker" style="width:34px;height:34px;">
        <span class="ring" style="background:${fill}66;animation:pulse-ring 2.2s infinite;"></span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="position:relative;filter:drop-shadow(0 2px 6px rgba(5,11,24,0.6));">
          <path d="M12 2.5 L22.5 21H1.5Z" fill="${fill}" stroke="#050B18" stroke-width="1.4"/>
          <rect x="11.1" y="9" width="1.8" height="6" rx="0.9" fill="#050B18"/>
          <circle cx="12" cy="17.3" r="1.1" fill="#050B18"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 20],
  });
}

function buildVerificationIcon() {
  return L.divIcon({
    className: "chitti-verification-icon",
    html: `
      <div class="chitti-pothole-marker" style="width:34px;height:34px;">
        <span class="ring" style="background:#3B7BF666;animation:pulse-ring 3s infinite;"></span>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="position:relative;">
          <circle cx="12" cy="12" r="10" fill="#3B7BF6" stroke="#050B18" stroke-width="1.4"/>
          <path d="M12 6v6l4 2" stroke="#050B18" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 20],
  });
}

function buildUserIcon() {
  return L.divIcon({
    className: "chitti-nav-pointer",
    html: `
      <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.5));">
        <div style="width:24px;height:24px;background:#3B7BF6;clip-path:polygon(50% 0%, 0% 100%, 50% 75%, 100% 100%);transform:rotate(45deg);border:2px solid white;"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function ChittiMap({ potholes = [] }: { potholes?: PotholeSpot[] }) {
  const [activePotholes, setActivePotholes] = useState<PotholeSpot[]>(potholes);
  const [currentPos, setCurrentPos] = useState<[number, number]>(CHENNAI_CENTER);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Fetch real GPS position once on mount; fall back to Chennai centre
  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        // GPS unavailable — keep Chennai centre default
        setCurrentPos(CHENNAI_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch pothole contributions from Supabase (memoised callback to avoid stale closure)
  const fetchContributions = useCallback(async () => {
    const { data, error } = await supabase.from("contributions").select("*");
    if (!error && data) {
      const formattedSpots: PotholeSpot[] = data.map((item: any) => {
        let coords: [number, number] = [13.0827, 80.2707];
        if (item.location && item.location.includes(",")) {
          const parts = item.location.split(",");
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            coords = [parsedLat, parsedLng];
          }
        }
        return {
          id: item.id,
          position: coords,
          location: item.title || item.location || "Reported Pothole",
          severity: item.ai_confidence && parseInt(item.ai_confidence) > 90 ? "High" : "Medium",
          reports: item.points ? item.points / 10 : 1,
          status: item.status === "Verified" ? "active" : "verification",
        };
      });
      setActivePotholes(formattedSpots);
    }
  }, []);

  useEffect(() => {
    fetchContributions();

    const channel = supabase
      .channel("map-realtime-contributions")
      .on("postgres_changes", { event: "*", schema: "public", table: "contributions" }, () => {
        fetchContributions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContributions]);

  const potholeIcons = useMemo(
    () => ({
      High: buildPotholeIcon("High"),
      Medium: buildPotholeIcon("Medium"),
      Low: buildPotholeIcon("Low"),
    }),
    []
  );

  const verificationIcon = useMemo(() => buildVerificationIcon(), []);
  const userIcon = useMemo(() => buildUserIcon(), []);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={currentPos} zoom={13} zoomControl={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="invert-[100%] hue-rotate-[180deg] brightness-[80%] contrast-[120%]"
        />
        <ZoomControl position="bottomright" />

        {/* Live user GPS marker */}
        <Marker position={currentPos} icon={userIcon}>
          <Popup>
            <p className="font-bold text-xs text-blue-600">Your Current Location 📍</p>
          </Popup>
        </Marker>

        {/* Route polyline — visible but not auto-animating. Only rendered when a route is set. */}
        <Polyline positions={DEFAULT_ROUTE} pathOptions={{ color: "#3B7BF6", weight: 6, opacity: 0.7, lineCap: "round" }} />
        <Polyline positions={DEFAULT_ROUTE} pathOptions={{ color: "#35D1E0", weight: 2, opacity: 0.8, dashArray: "1, 8" }} />

        {activePotholes.map((spot) => (
          <Marker
            key={spot.id}
            position={spot.position}
            icon={spot.status === "active" ? potholeIcons[spot.severity] : verificationIcon}
          >
            <Popup className="chitti-custom-popup">
              <p className="font-bold text-gray-800 text-sm">{spot.location}</p>
              <p className="text-xs text-red-500 font-semibold">{spot.severity} Risk Pothole</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}