import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@omeeganatra.com" },
    update: {},
    create: {
      email: "admin@omeeganatra.com",
      passwordHash: adminPassword,
      fullName: "Omee Ganatra",
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create demo client
  const clientPassword = await bcrypt.hash("client123", 12);
  const client = await prisma.client.upsert({
    where: { email: "riya.arjun@example.com" },
    update: {},
    create: {
      email: "riya.arjun@example.com",
      passwordHash: clientPassword,
      fullName: "Riya & Arjun Mehta",
      phone: "+91 98765 43210",
      createdById: admin.id,
    },
  });
  console.log("✅ Demo client created:", client.email);

  // Create demo project
  const project = await prisma.project.upsert({
    where: { slug: "riya-arjun-wedding" },
    update: {},
    create: {
      title: "Riya & Arjun Wedding",
      slug: "riya-arjun-wedding",
      description:
        "A beautiful destination wedding at Taj Falaknuma Palace, Hyderabad",
      eventDate: new Date("2025-02-14"),
      eventType: "WEDDING",
      venue: "Taj Falaknuma Palace",
      city: "Hyderabad",
      status: "ACTIVE",
      createdById: admin.id,
    },
  });
  console.log("✅ Demo project created:", project.title);

  // Assign client to project
  await prisma.projectClient.upsert({
    where: {
      projectId_clientId: {
        projectId: project.id,
        clientId: client.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      clientId: client.id,
      role: "PRIMARY",
    },
  });
  console.log("✅ Client assigned to project");

  // Create galleries
  const galleries = [
    {
      title: "Getting Ready",
      slug: "getting-ready",
      description:
        "Behind the scenes as the bride and groom prepare for their big day",
      sortOrder: 1,
      status: "PUBLISHED" as const,
    },
    {
      title: "Ceremony",
      slug: "ceremony",
      description: "The wedding ceremony at Taj Falaknuma Palace",
      sortOrder: 2,
      status: "PUBLISHED" as const,
    },
    {
      title: "Reception",
      slug: "reception",
      description: "An evening of celebration, dance, and joy",
      sortOrder: 3,
      status: "PUBLISHED" as const,
    },
    {
      title: "Couple Portraits",
      slug: "couple-portraits",
      description: "Intimate portraits of the couple",
      sortOrder: 4,
      status: "PUBLISHED" as const,
    },
  ];

  for (const galleryData of galleries) {
    await prisma.gallery.upsert({
      where: {
        projectId_slug: {
          projectId: project.id,
          slug: galleryData.slug,
        },
      },
      update: {},
      create: {
        ...galleryData,
        projectId: project.id,
        downloadEnabled: true,
        watermarkEnabled: true,
        isPublic: false,
      },
    });
  }
  console.log("✅ Demo galleries created:", galleries.length);

  // Create wedding timeline
  const timelineEvents = [
    {
      title: "Bride Getting Ready",
      description: "Makeup, jewelry, and final preparations",
      eventTime: new Date("2025-02-14T08:00:00"),
      endTime: new Date("2025-02-14T10:00:00"),
      location: "Bridal Suite",
      icon: "flower",
      sortOrder: 1,
    },
    {
      title: "Baraat Arrival",
      description: "The groom's grand wedding procession",
      eventTime: new Date("2025-02-14T10:30:00"),
      endTime: new Date("2025-02-14T11:30:00"),
      location: "Palace Entrance",
      icon: "music",
      sortOrder: 2,
    },
    {
      title: "Wedding Ceremony",
      description: "Traditional vows and pheras",
      eventTime: new Date("2025-02-14T12:00:00"),
      endTime: new Date("2025-02-14T14:00:00"),
      location: "Main Mandap",
      icon: "ring",
      sortOrder: 3,
    },
    {
      title: "Reception & Dinner",
      description: "Celebration dinner with family and friends",
      eventTime: new Date("2025-02-14T19:00:00"),
      endTime: new Date("2025-02-14T23:00:00"),
      location: "Grand Ballroom",
      icon: "food",
      sortOrder: 4,
    },
  ];

  for (const event of timelineEvents) {
    const existing = await prisma.weddingTimelineEvent.findFirst({
      where: { projectId: project.id, title: event.title },
    });
    if (!existing) {
      await prisma.weddingTimelineEvent.create({
        data: { ...event, projectId: project.id },
      });
    }
  }
  console.log("✅ Wedding timeline events created:", timelineEvents.length);

  // Create a second client and project
  const client2Password = await bcrypt.hash("client456", 12);
  const client2 = await prisma.client.upsert({
    where: { email: "priya.shah@example.com" },
    update: {},
    create: {
      email: "priya.shah@example.com",
      passwordHash: client2Password,
      fullName: "Priya Shah",
      phone: "+91 98123 45678",
      createdById: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { slug: "priya-engagement-shoot" },
    update: {},
    create: {
      title: "Priya Shah — Pre-Wedding Shoot",
      slug: "priya-engagement-shoot",
      description: "A romantic pre-wedding shoot in Udaipur",
      eventDate: new Date("2025-03-01"),
      eventType: "ENGAGEMENT",
      venue: "Lake Pichola",
      city: "Udaipur",
      status: "DELIVERED",
      createdById: admin.id,
    },
  });

  await prisma.projectClient.upsert({
    where: {
      projectId_clientId: {
        projectId: project2.id,
        clientId: client2.id,
      },
    },
    update: {},
    create: {
      projectId: project2.id,
      clientId: client2.id,
      role: "PRIMARY",
    },
  });

  await prisma.gallery.upsert({
    where: {
      projectId_slug: {
        projectId: project2.id,
        slug: "lake-pichola-session",
      },
    },
    update: {},
    create: {
      title: "Lake Pichola Session",
      slug: "lake-pichola-session",
      description: "Sunset shoot at Lake Pichola",
      sortOrder: 1,
      status: "PUBLISHED",
      projectId: project2.id,
      downloadEnabled: true,
      watermarkEnabled: true,
    },
  });

  console.log("✅ Second demo client & project created");

  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │   🌱  Seed Complete!                                │
  │                                                     │
  │   Admin Login:                                      │
  │   Email:  admin@omeeganatra.com                     │
  │   Pass:   admin123                                  │
  │                                                     │
  │   Client Login #1:                                  │
  │   Email:  riya.arjun@example.com                    │
  │   Pass:   client123                                 │
  │                                                     │
  │   Client Login #2:                                  │
  │   Email:  priya.shah@example.com                    │
  │   Pass:   client456                                 │
  │                                                     │
  └─────────────────────────────────────────────────────┘
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
