import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Helper to verify admin role
async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("campus_user_session")?.value;
  if (!sessionCookie) return false;
  try {
    const session = JSON.parse(sessionCookie);
    return session.role === "admin";
  } catch {
    return false;
  }
}

// POST - Creates a new PG from scratch (Admin Operation)
export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, address, description, collegeId, ownerId, ownerName, ownerPhone, distanceKm, amenities, imageUrl, images } = await request.json();

    if (!name || !address || !collegeId || !ownerId || !distanceKm) {
      return NextResponse.json(
        { error: "Name, address, college, owner, and distance are required" },
        { status: 400 }
      );
    }

    let finalOwnerId = ownerId;
    if (ownerId === "CREATE_NEW") {
      if (!ownerName || !ownerPhone) {
        return NextResponse.json(
          { error: "Owner name and phone are required to register a new landlord user account." },
          { status: 400 }
        );
      }

      const sanitizedPhone = ownerPhone.replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
        return NextResponse.json(
          { error: "Invalid owner phone number. Must be a 10-digit Indian mobile number." },
          { status: 400 }
        );
      }

      let existingUser = await db.user.findUnique({
        where: { phone: sanitizedPhone },
      });

      if (!existingUser) {
        const { hashPassword } = await import("@/lib/auth");
        existingUser = await db.user.create({
          data: {
            name: ownerName,
            phone: sanitizedPhone,
            passwordHash: hashPassword("password123"),
            role: "owner",
          },
        });
      }
      finalOwnerId = existingUser.id;
    }

    const pg = await db.pg.create({
      data: {
        name,
        address,
        description: description || "Fully furnished student PG hostel accommodation close to college outskirts.",
        collegeId,
        ownerId: finalOwnerId,
        distanceKm: parseFloat(distanceKm),
        amenities: amenities || "WiFi, Meals, RO Water, Security",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        images: images || imageUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        isVerified: true,
      },
    });

    // Create default double sharing and triple sharing rooms for the PG so it is instantly live & bookable!
    await db.room.createMany({
      data: [
        {
          pgId: pg.id,
          sharingType: "Double",
          priceMonthly: 5000,
          genderPreference: "Boys",
          availableBeds: 4,
          imageUrl: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
          images: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80",
        },
        {
          pgId: pg.id,
          sharingType: "Triple",
          priceMonthly: 4200,
          genderPreference: "Boys",
          availableBeds: 6,
          imageUrl: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
          images: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        }
      ]
    });

    return NextResponse.json({ success: true, pg });
  } catch (error) {
    console.error("Admin Create PG API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Updates an existing PG (Admin Operation)
export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, address, description, collegeId, ownerId, distanceKm, amenities, imageUrl, images, isVerified } = await request.json();

    if (!id || !name || !address || !collegeId || !ownerId || !distanceKm) {
      return NextResponse.json(
        { error: "PG id, name, address, college, owner, and distance are required" },
        { status: 400 }
      );
    }

    const updated = await db.pg.update({
      where: { id },
      data: {
        name,
        address,
        description,
        collegeId,
        ownerId,
        distanceKm: parseFloat(distanceKm),
        amenities,
        imageUrl,
        images,
        isVerified: isVerified ?? true,
      },
    });

    return NextResponse.json({ success: true, pg: updated });
  } catch (error) {
    console.error("Admin Update PG API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Removes a PG from database (Admin Operation)
export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "PG id is required" }, { status: 400 });
    }

    await db.pg.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete PG API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
