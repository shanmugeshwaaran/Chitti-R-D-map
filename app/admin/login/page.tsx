"use client";

import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/superbase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Mark this session as admin role
      sessionStorage.setItem("chitti_role", "admin");
      router.push("/admin");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050b18] font-body text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-red-900/20 relative">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Chitti Map — Restricted Access</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@ceyal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating…" : "Access Admin Dashboard"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
            ← Back to Student Login
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
          <Image src="/chitti_mother_square-min.png" alt="Chitti" width={14} height={14} className="rounded opacity-50" />
          Chitti Map Admin System — Authorised Personnel Only
        </div>
      </div>
    </main>
  );
}