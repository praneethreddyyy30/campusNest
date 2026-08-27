import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Helper to hash passwords using built-in SHA256 (Zero external packages needed!)
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

  // 2. Create Admin and PG Owners
  const admin = await prisma.user.create({
    data: {
      name: "Admin Support",
      phone: "9999999999",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      name: "Ramesh Kumar",
      phone: "9876543210",
      passwordHash: hashPassword("password123"),
      role: "owner",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      name: "Lakshmi Devi",
      phone: "8765432109",
      passwordHash: hashPassword("password123"),
      role: "owner",
    },
  });

  const owner3 = await prisma.user.create({
    data: {
      name: "Hari Prasad",
      phone: "7654321098",
      passwordHash: hashPassword("password123"),
      role: "owner",
    },
  });

  const owner4 = await prisma.user.create({
    data: {
      name: "Revathi Reddy",
      phone: "6543210987",
      passwordHash: hashPassword("password123"),
      role: "owner",
    },
  });

  // 3. Create Colleges (Nandyal and Kurnool)
  const rgmcet = await prisma.college.create({
    data: {
      name: "Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)",
      city: "Nandyal",
      state: "Andhra Pradesh",
      latitude: 15.4842,
      longitude: 78.4878,
    },
  });

  const santhiram = await prisma.college.create({
    data: {
      name: "Santhiram Engineering College",
      city: "Nandyal",
      state: "Andhra Pradesh",
      latitude: 15.4880,
      longitude: 78.4900,
    },
  });

  const gprec = await prisma.college.create({
    data: {
      name: "G. Pulla Reddy Engineering College (GPREC)",
      city: "Kurnool",
      state: "Andhra Pradesh",
      latitude: 15.7983,
      longitude: 78.0375,
    },
  });

  // 4. Create PGs
  // PGs near RGMCET
  const pg1 = await prisma.pg.create({
    data: {
      name: "Raja Reddy P.G. & Boys Hostel",
      address: "Near Sanjeeva Nagar Gate, Nandyal Road",
      description: "Conveniently located 100 meters from Sanjeeva Nagar gate. We provide high-quality Telugu homestyle meals, purified RO water, 24/7 security guard, and power backup.",
      ownerId: owner1.id,
      collegeId: rgmcet.id,
      distanceKm: 0.1,
      amenities: "WiFi, Meals, Laundry, PowerBackup, RO Water, Security",
      isVerified: true,
      imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      images: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    },
  });

  const pg2 = await prisma.pg.create({
    data: {
      name: "Murari Prime PG Hostel",
      address: "Haneef Nagar, Sanjeeva Nagar Outskirts, Nandyal",
      description: "Premium rooms with modern amenities. Includes attached bathrooms, high-speed Wi-Fi, laundry service, and delicious veg & non-veg meals. Perfect for studious RGMCET students.",
      ownerId: owner2.id,
      collegeId: rgmcet.id,
      distanceKm: 0.5,
      amenities: "WiFi, Meals, AC, PowerBackup, RO Water, Laundry, Attached Bathroom",
      isVerified: true,
      imageUrl: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
      images: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1620626011761-996317b6979a?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    },
  });

  // PGs near GPREC
  const pg3 = await prisma.pg.create({
    data: {
      name: "Sri Hari Krishna Boys Hostel",
      address: "Near Nandyal Check Post, Kurnool",
      description: "Located very close to GPREC and Pulla Reddy Dental College. Offers comfortable budget rooms with Wi-Fi, daily housekeeping, hot water geysers, and three home-cooked meals a day.",
      ownerId: owner3.id,
      collegeId: gprec.id,
      distanceKm: 0.8,
      amenities: "WiFi, Meals, Laundry, RO Water, Geyser",
      isVerified: true,
      imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      images: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&w=800&q=80",
    },
  });

  const pg4 = await prisma.pg.create({
    data: {
      name: "Shresta Women's Hostel",
      address: "Behind Bekkam Complex, Nandyal Road, Sri Nagar Colony, Kurnool",
      description: "Extremely secure girls' hostel with 24/7 CCTV surveillance, biometric entry, and resident warden. Fully furnished rooms with optional AC. Excellent study environment.",
      ownerId: owner4.id,
      collegeId: gprec.id,
      distanceKm: 0.6,
      amenities: "WiFi, Meals, CCTV, Warden, AC, PowerBackup, RO Water, Biometric Gate",
      isVerified: true,
      imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      images: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1620626011761-996317b6979a?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
    },
  });

  // 5. Create Rooms
  // Rooms for Raja Reddy Boys Hostel (PG1)
  await prisma.room.create({
    data: {
      pgId: pg1.id,
      sharingType: "Double",
      priceMonthly: 5000,
      genderPreference: "Boys",
      availableBeds: 4,
      imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    }
  });
  await prisma.room.create({
    data: {
      pgId: pg1.id,
      sharingType: "Triple",
      priceMonthly: 4200,
      genderPreference: "Boys",
      availableBeds: 6,
      imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80",
    }
  });

  // Rooms for Murari Prime PG (PG2)
  await prisma.room.create({
    data: {
      pgId: pg2.id,
      sharingType: "Single",
      priceMonthly: 8500,
      genderPreference: "Boys",
      availableBeds: 1,
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    }
  });
  await prisma.room.create({
    data: {
      pgId: pg2.id,
      sharingType: "Double",
      priceMonthly: 6000,
      genderPreference: "Boys",
      availableBeds: 3,
      imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1620626011761-996317b6979a?auto=format&fit=crop&w=600&q=80",
    }
  });

  // Rooms for Sri Hari Krishna Boys Hostel (PG3)
  const room3 = await prisma.room.create({
    data: {
      pgId: pg3.id,
      sharingType: "Triple",
      priceMonthly: 4500,
      genderPreference: "Boys",
      availableBeds: 2,
      imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80",
    }
  });

  // Rooms for Shresta Women's Hostel (PG4)
  const room4 = await prisma.room.create({
    data: {
      pgId: pg4.id,
      sharingType: "Double",
      priceMonthly: 6500,
      genderPreference: "Girls",
      availableBeds: 4,
      imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1620626011761-996317b6979a?auto=format&fit=crop&w=600&q=80",
    }
  });
  await prisma.room.create({
    data: {
      pgId: pg4.id,
      sharingType: "Double",
      priceMonthly: 8000,
      genderPreference: "Girls",
      availableBeds: 2,
      imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80",
      images: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
    } // AC room
  });

  // 6. Create Mock Queries (Admin-mediated)
  await prisma.query.create({
    data: {
      pgId: pg1.id,
      studentName: "Amit Kumar",
      studentPhone: "9898989898",
      question: "Is non-veg food served on Sundays, or is it completely veg?",
      status: "Pending",
    },
  });

  await prisma.query.create({
    data: {
      pgId: pg2.id,
      studentName: "Vijay Prasad",
      studentPhone: "9797979797",
      question: "Is there a washing machine available for students to do laundry?",
      status: "Answered",
      answer: "Yes, there is a dedicated washing machine section on the top floor and washing is allowed twice a week.",
    },
  });

  // 7. Create Mock Bookings (Pending/Approved)
  await prisma.booking.create({
    data: {
      roomId: room4.id, // Shresta Girls Hostel Double Sharing
      studentName: "Divya Reddy",
      studentPhone: "9000100020",
      amountPaid: 2200, // ₹200 platform + ₹2000 token
      status: "Pending",
      checkInDate: new Date("2026-09-20T00:00:00Z"),
      utr: "UTR98321471049",
    },
  });

  // 8. Create Mock Reviews
  await prisma.review.create({
    data: {
      pgId: pg1.id,
      studentName: "Sandeep (RGMCET Senior)",
      rating: 4,
      comment: "Raja Reddy PG has really good food. Aunty prepares proper Andhra style meals. Wifi is okay near the lobby, but slightly slow in back rooms. Security is solid.",
    },
  });

  await prisma.review.create({
    data: {
      pgId: pg1.id,
      studentName: "Anil (RGMCET 3rd Year)",
      rating: 5,
      comment: "Lived here for 2 years. Very close to the college gate, only 2 minutes walk. Owner Ramesh uncle is friendly and resolves issues fast.",
    },
  });

  await prisma.review.create({
    data: {
      pgId: pg4.id,
      studentName: "Sushma (GPREC Senior)",
      rating: 5,
      comment: "Highly secure girls hostel. Resident warden is helpful and strict about curfew timings. Daily cleaning is done, so washrooms are hygienic.",
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
