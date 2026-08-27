import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Helper to hash passwords using built-in SHA256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing data
  await prisma.review.deleteMany({});
  await prisma.query.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.pg.deleteMany({});
  await prisma.college.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.pgFormSubmission.deleteMany({});

  // 2. Create Admin and PG Owners
  const admin = await prisma.user.create({
    data: {
      name: "Admin Support",
      phone: "9999999999",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
  });

  const defaultOwner = await prisma.user.create({
    data: {
      name: "Owner Ramesh",
      phone: "9876543210",
      passwordHash: hashPassword("password123"),
      role: "owner",
    },
  });

  // 3. Create Colleges
  const rgmcet = await prisma.college.create({
    data: {
      id: "dacc0911-a010-4f74-87f5-9ea08168c5a8",
      name: "Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)",
      city: "Nandyal",
      state: "Andhra Pradesh",
      latitude: 15.4842,
      longitude: 78.4878,
    },
  });

  const santhiram = await prisma.college.create({
    data: {
      id: "edf13466-3f01-4b7f-9c00-ee57b7852bd0",
      name: "Santhiram Engineering College",
      city: "Nandyal",
      state: "Andhra Pradesh",
      latitude: 15.4880,
      longitude: 78.4900,
    },
  });

  const gprec = await prisma.college.create({
    data: {
      id: "287294a3-0ff1-40d9-b85a-bfbdeaf05ac4",
      name: "G. Pulla Reddy Engineering College (GPREC)",
      city: "Kurnool",
      state: "Andhra Pradesh",
      latitude: 15.7983,
      longitude: 78.0375,
    },
  });

  // 4. Create SV Chaitanya PG (Only real listing, linked to RGMCET)
  const pg = await prisma.pg.create({
    data: {
      id: "4582ef06-f506-41da-8316-65280eccce73",
      name: "SV CHITHANYA",
      address: "Dongu kompa,nandyal-kurnool highway",
      description: "Dongu Kompa, Nandyal–Kurnool Highway. Student-friendly hostel located close to RGMCET. Regular power backup, drinking water facility, CCTV surveillance, and basic hostel rules. Curfew and visitor timings are managed by the hostel administration.",
      ownerId: defaultOwner.id,
      collegeId: rgmcet.id,
      distanceKm: 0.5,
      amenities: "WiFi, Meals, Laundry, RO Water, Security",
      isVerified: true,
      imageUrl: "https://cdn.corenexis.com/f/eMY6l1VUKbf.png",
      images: "https://cdn.corenexis.com/f/eMY6l1VUKbf.png,https://cdn.corenexis.com/f/j81fIzWSWAv.png,https://cdn.corenexis.com/f/79cbyMtUNVe.png",
    },
  });

  // 5. Create default Double & Triple sharing rooms for SV Chaitanya
  await prisma.room.create({
    data: {
      pgId: pg.id,
      sharingType: "Double",
      priceMonthly: 5000,
      genderPreference: "Boys",
      availableBeds: 4,
      imageUrl: "https://cdn.corenexis.com/f/j81fIzWSWAv.png",
      images: "https://cdn.corenexis.com/f/j81fIzWSWAv.png,https://cdn.corenexis.com/f/79cbyMtUNVe.png",
    },
  });

  await prisma.room.create({
    data: {
      pgId: pg.id,
      sharingType: "Triple",
      priceMonthly: 4200,
      genderPreference: "Boys",
      availableBeds: 6,
      imageUrl: "https://cdn.corenexis.com/f/79cbyMtUNVe.png",
      images: "https://cdn.corenexis.com/f/79cbyMtUNVe.png,https://cdn.corenexis.com/f/eMY6l1VUKbf.png",
    },
  });

  console.log("Seeding completed successfully! Cleaned out mock scrapers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
