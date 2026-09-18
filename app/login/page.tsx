"use client";

import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/superbase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
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

      // Clear any stale admin role on student login
      sessionStorage.removeItem("chitti_role");
      router.push("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy-950 font-body text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl relative">

        <div className="text-center mb-8">
          <Image src="/chitti_mother_square-min.png" alt="Chitti Logo" width={48} height={48} className="mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold">Student Portal Login</h1>
          <p className="text-xs text-chitti-mist mt-1">Access Chitti Map and report potholes.</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-chitti-mist block mb-1">Email ID</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="student@chitti.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-chitti-mist block mb-1">Passcode</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Login to Chitti Map"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-xs">
          <p className="text-chitti-mist">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:underline font-semibold">
              Register here
            </Link>
          </p>

          <div className="pt-2 border-t border-white/10">
            <Link href="/admin/login" className="text-red-400 hover:text-red-300 font-semibold flex items-center justify-center gap-1.5 transition-colors">
              <ShieldAlert className="h-3.5 w-3.5" /> Switch to Admin Portal Login
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
