import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "../config/aws.js";
import { env } from "../config/env.js";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Provider abstraction lets us swap between AWS SES (for AWS-native deploys)
// and Resend (the default for the Vercel/Railway/R2 deploy story). Choice is
// driven by EMAIL_PROVIDER; both providers expect EMAIL_FROM to be a verified
// sender on their respective dashboards.

async function sendViaSes(email: OutgoingEmail): Promise<void> {
  const command = new SendEmailCommand({
    Source: env.EMAIL_FROM,
    Destination: { ToAddresses: [email.to] },
    Message: {
      Subject: { Data: email.subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: email.html, Charset: "UTF-8" },
        Text: { Data: email.text, Charset: "UTF-8" },
      },
    },
  });
  await sesClient.send(command);
}

async function sendViaResend(email: OutgoingEmail): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API ${res.status}: ${detail.slice(0, 200)}`);
  }
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  switch (env.EMAIL_PROVIDER) {
    case "resend":
      return sendViaResend(email);
    case "ses":
      return sendViaSes(email);
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${env.EMAIL_PROVIDER}`);
  }
}
