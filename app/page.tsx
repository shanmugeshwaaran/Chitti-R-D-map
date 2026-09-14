"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import SearchOverlay from "@/components/SearchOverlay";
import RouteSafetySheet from "@/components/RouteSafetySheet";
import BottomNav, { NavTab } from "@/components/BottomNav";
import ReportModal from "@/components/ReportModal";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/superbase";

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
  const [destination, setDestination] = useState("SRM Adyar Campus");
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Auth state — null = loading, false = unauthenticated, true = authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  // Dynamic route safety states
  const [routeAlerts, setRouteAlerts] = useState<any[]>([]);
  const [routeScore, setRouteScore] = useState(82);

  // Auth guard: check Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setIsAuthenticated(true);
      setUserId(session.user.id);

      // Set admin flag based on sessionStorage role marker
      if (sessionStorage.getItem("chitti_role") === "admin") {
        setIsAdmin(true);
      }
    };

    checkSession();

    // Subscribe to auth state changes (handles token refresh / sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch live contributions from Supabase for Route Safety Sheet
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLiveRouteAlerts = async () => {
      const { data, error } = await supabase.from("contributions").select("*");
      if (!error && data && data.length > 0) {
        const mappedAlerts = data.map((item: any, idx: number) => ({
          id: item.id || idx + 1,
          location: item.title || item.location || "Reported Pothole",
          distance: `${(idx * 0.7 + 0.3).toFixed(1)} km ahead`,
          severity:
            item.ai_confidence && parseInt(item.ai_confidence) > 90
              ? "High"
              : "Medium",
        }));
        setRouteAlerts(mappedAlerts);

        const penalty = mappedAlerts.reduce((acc: number, curr: any) => {
          if (curr.severity === "High") return acc + 15;
          if (curr.severity === "Medium") return acc + 8;
          return acc + 3;
        }, 0);

        const calculatedScore = Math.max(35, 100 - penalty);
        setRouteScore(calculatedScore);
      }
    };

    fetchLiveRouteAlerts();

    const channel = supabase
      .channel("home-safety-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions" },
        () => {
          fetchLiveRouteAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const handleSwap = () => {
    setStart(destination);
    setDestination(start);
  };

  // Show nothing (or a spinner) while we verify the session
  if (isAuthenticated === null) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-navy-950">
        <p className="font-body text-sm text-chitti-mist animate-pulse">Verifying session…</p>
      </div>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-navy-950 font-body">
      <div className="absolute inset-0 z-0">
        <ChittiMap />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-chitti-radial opacity-70" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <SearchOverlay
          start={start}
          destination={destination}
          onStartChange={setStart}
          onDestinationChange={setDestination}
          onSwap={handleSwap}
          alertCount={routeAlerts.length}
        />
      </div>

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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col">
        <RouteSafetySheet
          score={routeScore}
          alerts={routeAlerts.length > 0 ? routeAlerts : undefined}
        />

        <div className="pointer-events-auto">
          <BottomNav
            active={activeTab}
            onChange={(tab) => {
              if (tab === "report") {
                setIsReportModalOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
          />
        </div>
      </div>

      {/* Pass the real authenticated user ID so reports are attributed correctly */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userId={userId}
      />
    </main>
  );
}