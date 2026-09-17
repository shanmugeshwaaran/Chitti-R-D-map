import { NextRequest, NextResponse } from "next/server";

// Re-use the same in-memory store that send-otp populates.
// Next.js hot-module-reloading in dev resets module state, but the store
// lives long enough for a full OTP round-trip.
//
// IMPORTANT: This import must match the exact module path of send-otp/route.ts
// so Node's module cache hands back the same Map instance.
// We expose the store via a shared lib file to make the coupling explicit.
import { otpStore } from "@/lib/otp-store";

const MAX_ATTEMPTS = 5;

// ── POST /api/verify-otp ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").toLowerCase().trim();
    const code = (body.code ?? "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const record = otpStore.get(email);

    // Not found or expired
    if (!record || record.expires < Date.now()) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: "Verification code expired or not found. Please request a new one." },
        { status: 410 }
      );
    }

    // Too many wrong attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Wrong code
    if (record.code !== code) {
      record.attempts += 1;
      const left = MAX_ATTEMPTS - record.attempts;
      return NextResponse.json(
        { error: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` },
        { status: 422 }
      );
    }

    // ✅ Correct — consume the record so it can't be reused
    otpStore.delete(email);
    return NextResponse.json({ ok: true, message: "Email verified." });
  } catch (err) {
    console.error("[verify-otp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
