/**
 * Shared in-memory OTP store.
 *
 * Both `/api/send-otp` and `/api/verify-otp` import from here so they
 * reference the exact same Map instance within a single Node.js process.
 *
 * Fields:
 *   code      — 6-digit string
 *   expires   — Unix ms timestamp after which the entry is stale
 *   attempts  — number of failed verify attempts so far
 */
export interface OtpRecord {
  code: string;
  expires: number;
  attempts: number;
}

// Global-scope singleton — survives HMR reloads in dev via Next.js global cache trick
const globalForOtp = globalThis as unknown as { _chittiOtpStore?: Map<string, OtpRecord> };

if (!globalForOtp._chittiOtpStore) {
  globalForOtp._chittiOtpStore = new Map<string, OtpRecord>();
}

export const otpStore: Map<string, OtpRecord> = globalForOtp._chittiOtpStore;
