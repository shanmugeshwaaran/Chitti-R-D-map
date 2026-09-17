"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Mail, User, Phone, ArrowLeft, Eye, EyeOff, RefreshCw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/superbase";

type Step = "register" | "otp";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function RegisterPage() {
  // ── Step 1: Registration form ──────────────────────────────────────────────
  const [step, setStep] = useState<Step>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 2: OTP verification ───────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  // Kick off resend countdown whenever it's > 0
  useEffect(() => {
    if (resendCooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendCooldown]);

  // ── Step 1: Handle registration ────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            mobile,
            role: "student",
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Supabase sends the OTP/confirmation email automatically
      setResendCooldown(RESEND_COOLDOWN);
      setStep("otp");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1); // only last digit
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...next].join("");
      if (fullOtp.length === OTP_LENGTH) verifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) verifyOtp(pasted);
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const verifyOtp = async (token: string) => {
    setOtpLoading(true);
    setOtpError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (verifyError) {
        setOtpError(verifyError.message);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // Verified — mark student role and go to map
      sessionStorage.setItem("chitti_role", "student");
      router.push("/");
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }
    verifyOtp(token);
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError(null);
    setOtp(Array(OTP_LENGTH).fill(""));

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setOtpError(resendError.message);
    } else {
      setResendCooldown(RESEND_COOLDOWN);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-navy-950 font-body text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl relative">

        {step === "register" ? (
          <>
            <Link href="/" className="absolute top-6 left-6 text-chitti-mist hover:text-white text-xs flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Map
            </Link>

            <div className="text-center mt-4 mb-6">
              <Image src="/chitti_mother_square-min.png" alt="Chitti Logo" width={48} height={48} className="mx-auto mb-3 rounded-xl" />
              <h1 className="text-2xl font-bold">Create Student Account</h1>
              <p className="text-xs text-chitti-mist mt-1">Join CEYAL STEM community for safe routing.</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="text-xs text-chitti-mist block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Karthi Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-chitti-mist block mb-1">Email ID</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="student@ceyal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="text-xs text-chitti-mist block mb-1">Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 98422 12345"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-chitti-mist block mb-1">Secret Passcode</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create secret passcode"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Register Student Account"}
              </button>
            </form>

            <p className="text-center text-xs text-chitti-mist mt-5">
              Already registered?{" "}
              <Link href="/login" className="text-blue-400 hover:underline font-semibold">Login here</Link>
            </p>
          </>
        ) : (
          /* ── OTP STEP ─────────────────────────────────────────────────────── */
          <>
            <button
              onClick={() => { setStep("register"); setOtpError(null); }}
              className="absolute top-6 left-6 text-chitti-mist hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <div className="text-center mt-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold">Verify Your Email</h1>
              <p className="text-xs text-chitti-mist mt-1">
                We sent a 6-digit OTP to{" "}
                <span className="text-blue-400 font-semibold">{email}</span>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* 6-digit OTP boxes */}
              <div className="flex gap-2 justify-center">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border bg-black/50 text-white focus:outline-none transition-all
                      ${digit ? "border-blue-500 ring-2 ring-blue-500/30" : "border-white/15"}
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.join("").length < OTP_LENGTH}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Verify & Continue
                  </>
                )}
              </button>
            </form>

            {/* Resend */}
            <div className="mt-5 text-center text-xs text-chitti-mist">
              Didn&apos;t receive the code?{" "}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-blue-400 font-semibold hover:underline disabled:text-gray-600 disabled:no-underline disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}