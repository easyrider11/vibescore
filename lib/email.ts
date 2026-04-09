import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) {
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Buildscore <noreply@buildscore.dev>";

export async function sendMagicLinkEmail(to: string, magicUrl: string): Promise<{ sent: boolean; error?: string }> {
  const resend = getResendClient();

  if (!resend) {
    // No API key — log to console in dev, warn in production
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n✉️  Magic link for ${to}:\n${magicUrl}\n`);
      return { sent: true };
    }
    return { sent: false, error: "Email provider not configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Sign in to Buildscore",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #0d1117; margin-bottom: 8px;">
          Sign in to Buildscore
        </h1>
        <p style="color: #656d76; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to sign in to your Buildscore account.
          This link will expire in 15 minutes.
        </p>
        <a href="${magicUrl}"
           style="display: inline-block; background: #0d1117; color: #ffffff; padding: 12px 32px;
                  border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Sign in
        </a>
        <p style="color: #8b949e; font-size: 12px; margin-top: 32px; line-height: 1.5;">
          If you didn't request this email, you can safely ignore it.<br>
          This link can only be used once.
        </p>
        <hr style="border: none; border-top: 1px solid #d0d7de; margin: 24px 0;" />
        <p style="color: #8b949e; font-size: 11px;">
          Buildscore — Technical Interviews for the AI Era
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send magic link email:", error);
    return { sent: false, error: error.message };
  }

  return { sent: true };
}
