"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/superbase";
import Link from "next/link";

interface Contribution {
  id: string;
  title: string;
  category: string;
  points: number;
  status: string;
  created_at: string;
}

export default function ContributionHistory() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("contributions")
          .select("*")
          .eq("user_id", "STU-104")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching contributions:", error.message);
        } else if (data) {
          setContributions(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchContributions();
  }, []);

  return (
    <main className="min-h-screen bg-[#050b18] text-white p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        {/* Top Header Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/profile"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Contribution History
          </h1>
        </div>

        {/* Contributions Card Container */}
        <div className="bg-[#0b132b] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Verified STEM Contributions</h2>
              <p className="text-xs text-slate-400">Track all your submitted projects and datasets</p>
            </div>
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/20">
              Total: {contributions.length} Items
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading contributions...</div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No contributions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                    <th className="py-3 px-4">Project / Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {contributions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-4 font-medium text-slate-200">{item.title}</td>
                      <td className="py-4 px-4 text-slate-400">{item.category}</td>
                      <td className="py-4 px-4 font-semibold text-cyan-400">+{item.points} pts</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20 font-medium">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}