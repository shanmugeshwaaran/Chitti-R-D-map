import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { otpStore } from "@/lib/otp-store";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Resend client (server-side only — key is NOT prefixed NEXT_PUBLIC_) ───
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helper: generate 6-digit numeric code ─────────────────────────────────
function generateOtp(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

// ── POST /api/send-otp ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Rate-limit: don't regenerate if an unexpired code already exists
    const existing = otpStore.get(email);
    if (existing && existing.expires > Date.now()) {
      const remainingSec = Math.ceil((existing.expires - Date.now()) / 1000);
      // Allow re-send only if < 9 min remain (i.e. been at least 1 min)
      if (remainingSec > 9 * 60) {
        return NextResponse.json(
          { error: `Please wait before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    const code = generateOtp();
    otpStore.set(email, { code, expires: Date.now() + OTP_TTL_MS, attempts: 0 });

    // ── Send email via Resend ──────────────────────────────────────────────
    const { error: sendError } = await resend.emails.send({
      from: "Chitti STEM <onboarding@resend.dev>",
      to: [email],
      subject: "Your Chitti STEM Verification Code",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chitti STEM OTP</title>
</head>
<body style="margin:0;padding:0;background:#050B18;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050B18;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0F1C38;border-radius:20px;border:1px solid rgba(59,123,246,0.25);overflow:hidden;max-width:480px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F1C38 0%,#1a2f5a 100%);padding:32px 32px 24px;border-bottom:1px solid rgba(53,209,224,0.15);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#F3F6FD;letter-spacing:-0.3px;">
                      🗺️ Chitti STEM
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:#A9B7D6;letter-spacing:0.5px;text-transform:uppercase;">
                      Safe Route Intelligence
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#A9B7D6;">Hi there 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#F3F6FD;line-height:1.6;">
                Use the verification code below to complete your <strong style="color:#35D1E0;">Chitti STEM</strong> student registration.
                The code expires in <strong style="color:#FBBF24;">10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px 0;">
                    <div style="display:inline-block;background:#050B18;border:2px solid #3B7BF6;border-radius:16px;padding:20px 40px;">
                      <p style="margin:0;font-size:11px;color:#A9B7D6;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
                        Verification Code
                      </p>
                      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#F3F6FD;font-family:'Courier New',monospace;">
                        ${code}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 0;font-size:12px;color:#6B7FA3;text-align:center;">
                Don't share this code with anyone. Chitti STEM will never ask for it by phone or chat.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.3);">
              <p style="margin:0;font-size:11px;color:#4A5A7A;text-align:center;line-height:1.6;">
                This email was sent by Chitti STEM · CEYAL Innovation Club<br/>
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    if (sendError) {
      console.error("[send-otp] Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("[send-otp] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
