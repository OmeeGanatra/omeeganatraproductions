import { prisma } from "@ogp/db";
import { env } from "../config/env.js";
import { sendEmail } from "./email.service.js";

export async function sendGalleryReadyNotification(
  clientId: string,
  projectId: string
): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, email: true, fullName: true },
  });

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, slug: true },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Create in-app notification
  await prisma.notification.create({
    data: {
      recipientClientId: clientId,
      type: "GALLERY_READY",
      title: "Your gallery is ready!",
      body: `Your photos from "${project.title}" are now available to view.`,
      data: {
        projectId: project.id,
        projectSlug: project.slug,
        projectTitle: project.title,
      },
      channel: "IN_APP",
      sentAt: new Date(),
    },
  });

  // Send email via AWS SES
  const loginUrl = `${env.CORS_ORIGIN}/login`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Gallery is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #1a1a1a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                Omee Ganatra Productions
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 22px; font-weight: 600;">
                Your gallery is ready, ${client.fullName}!
              </h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                We are excited to let you know that your photos from <strong>${project.title}</strong> are now available for viewing.
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
                Log in to your client portal to browse, favorite, and download your photos.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1a1a; border-radius: 8px;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      View Your Gallery
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #999; font-size: 14px; line-height: 1.5; margin: 32px 0 0; text-align: center;">
                Log in with your email: ${client.email}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Omee Ganatra Productions
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `Hi ${client.fullName},

Your photos from "${project.title}" are now available!

Log in to your client portal to browse, favorite, and download your photos:
${loginUrl}

Your login email: ${client.email}

- Omee Ganatra Productions`;

  try {
    await sendEmail({
      to: client.email,
      subject: `Your "${project.title}" gallery is ready!`,
      html: htmlBody,
      text: textBody,
    });

    await prisma.notification.create({
      data: {
        recipientClientId: clientId,
        type: "GALLERY_READY",
        title: "Your gallery is ready!",
        body: `Email sent about "${project.title}"`,
        data: { projectId: project.id },
        channel: "EMAIL",
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`Failed to send email to ${client.email}:`, err);
    // Don't throw — in-app notification was already created
  }
}
