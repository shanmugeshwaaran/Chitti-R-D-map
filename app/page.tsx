"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import SearchOverlay, { type RouteResult } from "@/components/SearchOverlay";
import RouteSafetySheet from "@/components/RouteSafetySheet";
import BottomNav, { NavTab } from "@/components/BottomNav";
import ReportModal from "@/components/ReportModal";
import { ShieldAlert, Car, Bike, Play, Pause, RotateCcw, Clock, Ruler } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/superbase";
import type { VehicleMode, NavState } from "@/components/ChittiMap";

const ChittiMap = dynamic(() => import("@/components/ChittiMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-chitti-gradient">
      <p className="font-body text-sm text-chitti-mist">Loading map…</p>
    </div>
  ),
});

export default function Home() {
  const [start, setStart] = useState("Anna Nagar West");
  const [destination, setDestination] = useState("Velachery MRTS");
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  // Route + vehicle state
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [vehicleMode, setVehicleMode] = useState<VehicleMode>("car");
  const [navState, setNavState] = useState<NavState>("idle");

  // Dynamic route safety states
  const [routeAlerts, setRouteAlerts] = useState<any[]>([]);
  const [routeScore, setRouteScore] = useState(82);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setIsAuthenticated(true);
      setUserId(session.user.id);
      if (sessionStorage.getItem("chitti_role") === "admin") setIsAdmin(true);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => { subscription.unsubscribe(); };
  }, [router]);

  // ── Live pothole feed for Route Safety Sheet ────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLiveRouteAlerts = async () => {
      const { data, error } = await supabase.from("contributions").select("*");
      if (!error && data && data.length > 0) {
        const mappedAlerts = data.map((item: any, idx: number) => ({
          id: item.id || idx + 1,
          location: item.title || item.location || "Reported Pothole",
          distance: `${(idx * 0.7 + 0.3).toFixed(1)} km ahead`,
          severity: item.ai_confidence && parseInt(item.ai_confidence) > 90 ? "High" : "Medium",
        }));
        setRouteAlerts(mappedAlerts);

        const penalty = mappedAlerts.reduce((acc: number, curr: any) => {
          if (curr.severity === "High") return acc + 15;
          if (curr.severity === "Medium") return acc + 8;
          return acc + 3;
        }, 0);
        setRouteScore(Math.max(35, 100 - penalty));
      }
    };

    fetchLiveRouteAlerts();
    const channel = supabase
      .channel("home-safety-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contributions" }, () => {
        fetchLiveRouteAlerts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSwap = () => {
    setStart(destination);
    setDestination(start);
    setRouteResult(null);
    setNavState("idle");
  };

  const handleRouteFound = (result: RouteResult | null) => {
    setRouteResult(result);
    setNavState("idle"); // reset any prior animation
  };

  const handleStartNav = () => setNavState("playing");
  const handlePauseNav = () => setNavState("paused");
  const handleResumeNav = () => setNavState("playing");
  const handleResetNav = () => {
    setNavState("idle");
    // Re-trigger route re-mount by briefly clearing and restoring
    const saved = routeResult;
    setRouteResult(null);
    setTimeout(() => setRouteResult(saved), 50);
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-navy-950">
        <p className="font-body text-sm text-chitti-mist animate-pulse">Verifying session…</p>
      </div>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-navy-950 font-body">
      {/* ── Map layer ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <ChittiMap
          routePolyline={routeResult?.polyline ?? null}
          vehicleMode={vehicleMode}
          navState={navState}
          onNavStateChange={setNavState}
        />
      </div>

      {/* Radial vignette */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-chitti-radial opacity-70" />

      {/* ── Search overlay (top) ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <SearchOverlay
          start={start}
          destination={destination}
          onStartChange={setStart}
          onDestinationChange={setDestination}
          onSwap={handleSwap}
          alertCount={routeAlerts.length}
          onRouteFound={handleRouteFound}
        />
      </div>

      {/* ── Admin shortcut ───────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="absolute top-32 right-4 z-40 pointer-events-auto">
          <Link
            href="/admin"
            className="bg-red-600/90 hover:bg-red-500 backdrop-blur-md text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500/50 transition-all"
          >
            <ShieldAlert className="h-5 w-5" />
            Admin Dashboard
          </Link>
        </div>
      )}

      {/* ── Vehicle Navigation Controls ──────────────────────────────────── */}
      {routeResult && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[calc(100%-2rem)] max-w-md">
          <div className="bg-navy-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden">

            {/* Route summary */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs text-chitti-mist">
              <span className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-blue-400" />
                {routeResult.distance}
              </span>
              <span className="font-bold text-white text-[11px] truncate px-2">
                {start} → {destination}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-chitti-cyan" />
                {routeResult.duration}
              </span>
            </div>

            <div className="px-4 py-3 flex items-center gap-3">
              {/* Vehicle toggle */}
              <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
                <button
                  onClick={() => setVehicleMode("car")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
                    vehicleMode === "car"
                      ? "bg-blue-600 text-white shadow-inner"
                      : "bg-black/40 text-gray-400 hover:text-white"
                  }`}
                >
                  <Car className="h-4 w-4" />
                  Car
                </button>
                <button
                  onClick={() => setVehicleMode("bike")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all ${
                    vehicleMode === "bike"
                      ? "bg-cyan-600 text-white shadow-inner"
                      : "bg-black/40 text-gray-400 hover:text-white"
                  }`}
                >
                  <Bike className="h-4 w-4" />
                  Bike
                </button>
              </div>

              {/* Nav buttons */}
              <div className="flex gap-2 flex-1">
                {navState === "idle" && (
                  <button
                    onClick={handleStartNav}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                  >
                    <Play className="h-4 w-4" /> Start Navigation
                  </button>
                )}

                {navState === "playing" && (
                  <>
                    <button
                      onClick={handlePauseNav}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      <Pause className="h-4 w-4" /> Pause
                    </button>
                    <button
                      onClick={handleResetNav}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl border border-white/10 transition-all"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                )}

                {navState === "paused" && (
                  <>
                    <button
                      onClick={handleResumeNav}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      <Play className="h-4 w-4" /> Resume
                    </button>
                    <button
                      onClick={handleResetNav}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl border border-white/10 transition-all"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom sheet + nav ───────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col">
        <RouteSafetySheet
          score={routeScore}
          alerts={routeAlerts.length > 0 ? routeAlerts : undefined}
        />
        <div className="pointer-events-auto">
          <BottomNav
            active={activeTab}
            onChange={(tab) => {
              if (tab === "report") setIsReportModalOpen(true);
              else setActiveTab(tab);
            }}
          />
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userId={userId}
      />
    </main>
  );
}