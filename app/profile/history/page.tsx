"use client";

import { useEffect, useState } from "react";
import { History, ArrowLeft, MapPin, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/superbase";

interface ContributionReport {
  id: string;
  title: string;          // Maps to location name
  category: string;
  location: string;       // GPS coords
  description: string;
  ai_confidence: string;
  points: number;
  status: string;         // 'Approved & Fixed' or 'Under Verification'
  image_url: string;
  created_at: string;
}

export default function HistoryPage() {
  const [reports, setReports] = useState<ContributionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistoryReports() {
      try {
        setLoading(true);
        // Fetching real pothole contributions from Supabase for STU-104 (Arulkani)
        const { data, error } = await supabase
          .from("contributions")
          .select("*")
          .eq("user_id", "STU-104")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching reports:", error.message);
        } else if (data) {
          setReports(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistoryReports();
  }, []);

  return (
    <main className="min-h-screen bg-[#050b18] font-body text-white p-6 md:p-10 flex flex-col items-center">
      
      {/* Header Row */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Link href="/profile" className="flex items-center gap-2 text-slate-300 hover:text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <div className="flex items-center gap-2 text-blue-400 font-bold bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">
          <History className="h-5 w-5" /> Contribution History ({reports.length})
        </div>
      </div>

      {/* History Feed List */}
      <div className="w-full max-w-3xl space-y-4">
        <h2 className="text-xl font-bold mb-4">Your Reported Potholes & Status</h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading your reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-black/40 border border-white/10 rounded-2xl">
            No pothole reports found.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-lg">
              
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-xl overflow-hidden relative bg-gray-900 shrink-0 border border-white/10">
                  <img 
                    src={report.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=300"} 
                    alt="Reported Pothole" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                      {report.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                      AI: {report.ai_confidence || "94%"}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">{report.title}</h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" /> {report.location}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 italic">&quot;{report.description}&quot;</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Submitted on: {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10 gap-2">
                {report.status === "Approved & Fixed" ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Approved & Fixed
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30 text-xs font-bold">
                    <Clock className="h-4 w-4" /> Under Verification
                  </div>
                )}
                <span className="text-[10px] text-gray-400">+{report.points} Chitti Credits</span>
              </div>

            </div>
          ))
        )}
      </div>

    </main>
  );
}