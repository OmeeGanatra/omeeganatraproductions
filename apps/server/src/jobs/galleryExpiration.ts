import { prisma } from "@ogp/db";

/**
 * Checks for galleries that have passed their expiration date and are still
 * PUBLISHED. Sets them to EXPIRED and sends expiry notifications to all
 * clients assigned to the gallery's project.
 *
 * Designed to be called from a cron job or setInterval — not a queue worker.
 */
export async function checkAndExpireGalleries(): Promise<{
  expiredCount: number;
  notificationsSent: number;
}> {
  const now = new Date();

  // Find all published galleries whose expiresAt is in the past
  const expiredGalleries = await prisma.gallery.findMany({
    where: {
      status: "PUBLISHED",
      expiresAt: {
        lt: now,
        not: null,
      },
    },
    include: {
      project: {
        include: {
          projectClients: {
            select: {
              clientId: true,
              client: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (expiredGalleries.length === 0) {
    return { expiredCount: 0, notificationsSent: 0 };
  }

  let notificationsSent = 0;

  for (const gallery of expiredGalleries) {
    // Mark gallery as EXPIRED
    await prisma.gallery.update({
      where: { id: gallery.id },
      data: { status: "EXPIRED" },
    });

    console.log(
      `[gallery-expiration] Gallery "${gallery.title}" (${gallery.id}) expired`
    );

    // Notify all project clients about the expiry
    const notifications = gallery.project.projectClients.map((pc) => ({
      recipientClientId: pc.clientId,
      type: "EXPIRY_WARNING" as const,
      title: "Gallery expired",
      body: `The gallery "${gallery.title}" from "${gallery.project.title}" has expired and is no longer available for viewing or download.`,
      data: {
        galleryId: gallery.id,
        galleryTitle: gallery.title,
        projectId: gallery.project.id,
        projectTitle: gallery.project.title,
        expiredAt: now.toISOString(),
      },
      channel: "IN_APP" as const,
      sentAt: now,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
      notificationsSent += notifications.length;
    }
  }

  console.log(
    `[gallery-expiration] Expired ${expiredGalleries.length} galleries, sent ${notificationsSent} notifications`
  );

  return {
    expiredCount: expiredGalleries.length,
    notificationsSent,
  };
}
