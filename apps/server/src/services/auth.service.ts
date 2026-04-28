import { env } from "../config/env.js";
import { sendEmail } from "./email.service.js";

interface EmailRecipient {
  email: string;
  fullName: string;
}

function brandedHtml(opts: {
  heading: string;
  intro: string;
  primaryAction?: { url: string; label: string };
  details?: string;
  footer?: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background-color: #1a1a1a; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Omee Ganatra Productions</h1>
        </td></tr>
        <tr><td style="padding: 40px 32px;">
          <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 22px; font-weight: 600;">${opts.heading}</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${opts.intro}</p>
          ${
            opts.primaryAction
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                  <tr><td style="background-color: #1a1a1a; border-radius: 8px;">
                    <a href="${opts.primaryAction.url}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">${opts.primaryAction.label}</a>
                  </td></tr>
                </table>`
              : ""
          }
          ${
            opts.details
              ? `<p style="color: #4a4a4a; font-size: 14px; line-height: 1.6; margin: 32px 0 0;">${opts.details}</p>`
              : ""
          }
        </td></tr>
        <tr><td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">${opts.footer ?? "Omee Ganatra Productions"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(
  recipient: EmailRecipient,
  resetToken: string
): Promise<void> {
  const resetUrl = `${env.APP_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const html = brandedHtml({
    heading: `Reset your password, ${recipient.fullName}`,
    intro:
      "We received a request to reset the password for your account. The link below will be valid for the next hour.",
    primaryAction: { url: resetUrl, label: "Reset Password" },
    details:
      "If you didn't request this, you can safely ignore this email — your password will not change.",
  });

  const text = `Reset your password

We received a request to reset the password for your account.

Open this link within 1 hour to choose a new password:
${resetUrl}

If you didn't request this, you can safely ignore this email.

— Omee Ganatra Productions`;

  await sendEmail({
    to: recipient.email,
    subject: "Reset your Omee Ganatra Productions password",
    html,
    text,
  });
}

export async function sendOtpEmail(
  recipient: EmailRecipient,
  code: string
): Promise<void> {
  const html = brandedHtml({
    heading: `Your verification code`,
    intro: `Hi ${recipient.fullName}, use the code below to finish signing in. It expires in 10 minutes.`,
    details: `<div style="text-align: center; padding: 24px; background-color: #f7f7f7; border-radius: 8px; margin: 16px 0;">
      <span style="font-family: 'SF Mono', Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
    </div>If you didn't try to sign in, you can ignore this email.`,
  });

  const text = `Hi ${recipient.fullName},

Your verification code is: ${code}

It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.

— Omee Ganatra Productions`;

  await sendEmail({
    to: recipient.email,
    subject: "Your verification code",
    html,
    text,
  });
}
