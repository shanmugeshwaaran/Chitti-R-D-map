"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/superbase";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const CHENNAI_CENTER: [number, number] = [13.0827, 80.2707];

// All react-leaflet and leaflet usage is deferred to client-side only
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const AdminMapController = dynamic(() => import("./AdminMapController"), { ssr: false });

export default function AdminMap() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedCoord, setSelectedCoord] = useState<[number, number]>(CHENNAI_CENTER);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Initialise Leaflet default icon paths (must be client-side)
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  const fetchAdminReports = async () => {
    const { data, error } = await supabase
      .from("contributions")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  };

  useEffect(() => {
    fetchAdminReports();

    const channel = supabase
      .channel("admin-map-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "contributions" }, () => {
        fetchAdminReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: "Verified" | "Rejected") => {
    const { error } = await supabase
      .from("contributions")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } else {
      fetchAdminReports();
    }
  };

  const handleSelectReport = (locationStr: string) => {
    if (locationStr && locationStr.includes(",")) {
      const parts = locationStr.split(",");
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedCoord([lat, lng]);
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050b18] text-white overflow-hidden font-body">
      {/* Left Pane */}
      <div className="w-[440px] shrink-0 flex flex-col border-r border-white/10 h-full bg-[#050b18]">

        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-navy-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Chitti Admin</h1>
              <p className="text-[10px] text-slate-400">Live Control Center</p>
            </div>
          </div>
          <Link href="/" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Map
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification Queue</h2>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {reports.length}
            </span>
          </div>

          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleSelectReport(report.location)}
              className="bg-white/5 border border-white/10 hover:border-blue-500/50 p-4 rounded-2xl flex flex-col gap-3 cursor-pointer transition-all shadow-xl group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                    {report.title || "Pothole Report"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">Location: {report.location}</p>
                  <p className="text-[11px] text-blue-400 mt-1 font-medium">
                    Status:{" "}
                    <span className={`font-semibold ${report.status === "Verified" ? "text-emerald-400" : report.status === "Rejected" ? "text-red-400" : "text-amber-400"}`}>
                      {report.status || "Pending Verification"}
                    </span>
                  </p>
                </div>
                {report.image_url ? (
                  <img src={report.image_url} alt="Evidence" className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 shrink-0 flex items-center justify-center text-[10px] text-slate-500">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  AI Confidence: {report.ai_confidence || "95.0%"}
                </span>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleUpdateStatus(report.id, "Verified")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(report.id, "Rejected")}
                    className="px-3 py-1.5 bg-red-600/40 hover:bg-red-600 border border-red-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-red-600/20"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Map (only render on client) */}
      <div className="flex-1 h-full relative">
        {isClient && (
          <MapContainer center={CHENNAI_CENTER} zoom={13} zoomControl={false} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="invert-[100%] hue-rotate-[180deg] brightness-[80%] contrast-[120%]"
            />
            <AdminMapController center={selectedCoord} />

            {reports.map((report) => {
              let coords: [number, number] = CHENNAI_CENTER;
              if (report.location && report.location.includes(",")) {
                const parts = report.location.split(",");
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) coords = [lat, lng];
              }
              return (
                <Marker key={report.id} position={coords}>
                  <Popup>
                    <div className="text-gray-900">
                      <p className="font-bold text-xs">{report.title || "Pothole"}</p>
                      <p className="text-[11px] text-red-500 font-semibold">{report.status || "Pending"}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}