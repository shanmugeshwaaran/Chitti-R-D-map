"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  useMap,
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

export type VehicleMode = "car" | "bike";
export type NavState = "idle" | "playing" | "paused";

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

// ── Pothole icon helpers ───────────────────────────────────────────────────
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

// ── Vehicle icons (car / bike) with bearing rotation ──────────────────────
function buildCarIcon(bearing: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform:rotate(${bearing}deg);filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Body -->
          <rect x="8" y="14" width="24" height="16" rx="4" fill="#3B7BF6" stroke="#fff" stroke-width="1.5"/>
          <!-- Roof -->
          <rect x="11" y="8" width="18" height="10" rx="3" fill="#6CA0FF" stroke="#fff" stroke-width="1.2"/>
          <!-- Windshield -->
          <rect x="12" y="9" width="16" height="7" rx="2" fill="#050B18" fill-opacity="0.7"/>
          <!-- Wheels -->
          <circle cx="12" cy="30" r="4" fill="#050B18" stroke="#fff" stroke-width="1.5"/>
          <circle cx="28" cy="30" r="4" fill="#050B18" stroke="#fff" stroke-width="1.5"/>
          <!-- Front indicator -->
          <circle cx="20" cy="7" r="2" fill="#FBBF24"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function buildBikeIcon(bearing: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;transform:rotate(${bearing}deg);filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Wheels -->
          <circle cx="10" cy="30" r="6" fill="none" stroke="#35D1E0" stroke-width="2.5"/>
          <circle cx="30" cy="30" r="6" fill="none" stroke="#35D1E0" stroke-width="2.5"/>
          <!-- Hub dots -->
          <circle cx="10" cy="30" r="2" fill="#35D1E0"/>
          <circle cx="30" cy="30" r="2" fill="#35D1E0"/>
          <!-- Frame -->
          <polyline points="10,30 20,18 30,30" stroke="#35D1E0" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="20" y1="18" x2="20" y2="10" stroke="#35D1E0" stroke-width="2" stroke-linecap="round"/>
          <!-- Handlebar -->
          <line x1="16" y1="11" x2="24" y2="11" stroke="#35D1E0" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Rider dot -->
          <circle cx="20" cy="8" r="3" fill="#35D1E0" stroke="#fff" stroke-width="1"/>
          <!-- Front indicator -->
          <circle cx="20" cy="5" r="1.5" fill="#FBBF24"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// ── Bearing calculation ────────────────────────────────────────────────────
function calcBearing(from: [number, number], to: [number, number]): number {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const rad = Math.atan2(dLng, dLat);
  return (rad * 180) / Math.PI;
}

// ── Lerp between two route points ─────────────────────────────────────────
function interpolate(
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// ── Sub-component to recenter map when route changes ──────────────────────
function MapFlyTo({ polyline }: { polyline: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!polyline || polyline.length < 2) return;
    const bounds = L.latLngBounds(polyline.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [60, 60], animate: true });
  }, [map, polyline]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────
interface ChittiMapProps {
  potholes?: PotholeSpot[];
  routePolyline?: [number, number][] | null;
  vehicleMode?: VehicleMode;
  navState?: NavState;
  onNavStateChange?: (state: NavState) => void;
}

// ── Main component ────────────────────────────────────────────────────────
export default function ChittiMap({
  potholes = [],
  routePolyline = null,
  vehicleMode = "car",
  navState = "idle",
  onNavStateChange,
}: ChittiMapProps) {
  const [activePotholes, setActivePotholes] = useState<PotholeSpot[]>(potholes);
  const [currentPos, setCurrentPos] = useState<[number, number]>(CHENNAI_CENTER);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Vehicle animation state
  const [vehiclePos, setVehiclePos] = useState<[number, number] | null>(null);
  const [vehicleBearing, setVehicleBearing] = useState(0);

  // Animation internals (stable refs — no re-render)
  const animFrameRef = useRef<number | null>(null);
  const segIndexRef = useRef(0);     // current polyline segment index
  const segProgressRef = useRef(0);  // 0..1 progress within current segment
  const lastTimeRef = useRef<number | null>(null);

  // Speed: metres of route covered per millisecond (~40 km/h ≈ 0.011 m/ms)
  const SPEED_M_PER_MS = 0.011;

  // Approximate distance between two [lat,lng] pairs in metres (haversine approx)
  const segLengthMetres = useCallback(
    (a: [number, number], b: [number, number]) => {
      const R = 6371000;
      const dLat = ((b[0] - a[0]) * Math.PI) / 180;
      const dLng = ((b[1] - a[1]) * Math.PI) / 180;
      const sinDlat = Math.sin(dLat / 2);
      const sinDlng = Math.sin(dLng / 2);
      return (
        2 *
        R *
        Math.asin(
          Math.sqrt(
            sinDlat * sinDlat +
              Math.cos((a[0] * Math.PI) / 180) *
                Math.cos((b[0] * Math.PI) / 180) *
                sinDlng * sinDlng
          )
        )
      );
    },
    []
  );

  // ── Animation loop ────────────────────────────────────────────────────────
  const animate = useCallback(
    (timestamp: number) => {
      if (!routePolyline || routePolyline.length < 2) return;

      const delta = lastTimeRef.current == null ? 0 : timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      let distRemaining = SPEED_M_PER_MS * delta;

      while (distRemaining > 0 && segIndexRef.current < routePolyline.length - 1) {
        const segA = routePolyline[segIndexRef.current];
        const segB = routePolyline[segIndexRef.current + 1];
        const segLen = segLengthMetres(segA, segB);

        const distToEnd = segLen * (1 - segProgressRef.current);

        if (distRemaining >= distToEnd) {
          // Move to next segment
          distRemaining -= distToEnd;
          segIndexRef.current += 1;
          segProgressRef.current = 0;
        } else {
          segProgressRef.current += distRemaining / segLen;
          distRemaining = 0;
        }
      }

      if (segIndexRef.current >= routePolyline.length - 1) {
        // Reached destination
        setVehiclePos(routePolyline[routePolyline.length - 1]);
        onNavStateChange?.("idle");
        return;
      }

      const segA = routePolyline[segIndexRef.current];
      const segB = routePolyline[segIndexRef.current + 1];
      const pos = interpolate(segA, segB, segProgressRef.current);
      const bearing = calcBearing(segA, segB);

      setVehiclePos(pos);
      setVehicleBearing(bearing);

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [routePolyline, segLengthMetres, onNavStateChange]
  );

  // ── Control animation based on navState ───────────────────────────────────
  useEffect(() => {
    if (navState === "playing") {
      lastTimeRef.current = null;
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }

    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [navState, animate]);

  // Reset vehicle when route changes
  useEffect(() => {
    segIndexRef.current = 0;
    segProgressRef.current = 0;
    lastTimeRef.current = null;
    if (routePolyline && routePolyline.length > 0) {
      setVehiclePos(routePolyline[0]);
      setVehicleBearing(
        routePolyline.length > 1
          ? calcBearing(routePolyline[0], routePolyline[1])
          : 0
      );
    } else {
      setVehiclePos(null);
    }
  }, [routePolyline]);

  // ── GPS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!(typeof window !== "undefined" && "geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
      () => setCurrentPos(CHENNAI_CENTER),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ── Supabase pothole feed ─────────────────────────────────────────────────
  const fetchContributions = useCallback(async () => {
    const { data, error } = await supabase.from("contributions").select("*");
    if (!error && data) {
      const formattedSpots: PotholeSpot[] = data.map((item: any) => {
        let coords: [number, number] = [13.0827, 80.2707];
        if (item.location && item.location.includes(",")) {
          const parts = item.location.split(",");
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) coords = [parsedLat, parsedLng];
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
    return () => { supabase.removeChannel(channel); };
  }, [fetchContributions]);

  // ── Memoised icons ────────────────────────────────────────────────────────
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

  // Vehicle icon must be recreated when bearing or mode changes
  const vehicleIcon = useMemo(
    () =>
      vehicleMode === "car"
        ? buildCarIcon(vehicleBearing)
        : buildBikeIcon(vehicleBearing),
    [vehicleMode, vehicleBearing]
  );

  return (
    <div className="relative h-full w-full">
      <MapContainer center={currentPos} zoom={13} zoomControl={false} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="invert-[100%] hue-rotate-[180deg] brightness-[80%] contrast-[120%]"
        />
        <ZoomControl position="bottomright" />

        {/* Auto-fit map to route */}
        <MapFlyTo polyline={routePolyline ?? null} />

        {/* GPS marker */}
        <Marker position={currentPos} icon={userIcon}>
          <Popup>
            <p className="font-bold text-xs text-blue-600">Your Current Location 📍</p>
          </Popup>
        </Marker>

        {/* OSRM route polyline — only shown when route is loaded */}
        {routePolyline && routePolyline.length > 1 && (
          <>
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#3B7BF6", weight: 6, opacity: 0.75, lineCap: "round" }}
            />
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#35D1E0", weight: 2, opacity: 0.85, dashArray: "1, 8" }}
            />
          </>
        )}

        {/* Animated vehicle */}
        {vehiclePos && (
          <Marker position={vehiclePos} icon={vehicleIcon} zIndexOffset={1000}>
            <Popup>
              <p className="font-bold text-xs text-blue-600">
                {vehicleMode === "car" ? "🚗 Your Car" : "🏍️ Your Bike"}
              </p>
            </Popup>
          </Marker>
        )}

        {/* Pothole markers */}
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