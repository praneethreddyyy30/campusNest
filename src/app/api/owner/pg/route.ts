import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Retrieve the PG owned by the logged-in owner
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);

    const pg = await db.pg.findFirst({
      where: { ownerId: session.id },
    });

    if (!pg) {
      return NextResponse.json({ error: "PG listing not found for this owner" }, { status: 404 });
    }

    return NextResponse.json(pg);
  } catch (error) {
    console.error("Owner PG GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Submit pending updates for the PG (requires Admin approval)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const { 
      name, 
      address, 
      description, 
      distanceKm, 
      amenities, 
      imageUrl, 
      images, 
      reservationFee 
    } = await request.json();

    if (!name || !address || !description) {
      return NextResponse.json(
        { error: "Name, address, and description are required" },
        { status: 400 }
      );
    }

    const pg = await db.pg.findFirst({
      where: { ownerId: session.id },
    });

    if (!pg) {
      return NextResponse.json({ error: "PG listing not found for this owner" }, { status: 404 });
    }

    // Set pending updates
    await db.pg.update({
      where: { id: pg.id },
      data: {
        pendingName: name,
        pendingAddress: address,
        pendingDescription: description,
        pendingDistanceKm: distanceKm ? parseFloat(distanceKm) : pg.distanceKm,
        pendingAmenities: amenities || pg.amenities,
        pendingImageUrl: imageUrl || pg.imageUrl,
        pendingImages: images || pg.images,
        pendingReservationFee: reservationFee ? parseFloat(reservationFee) : pg.reservationFee,
        hasPendingUpdates: true,
      },
    });

    return NextResponse.json({ success: true, message: "Updates submitted for admin approval" });
  } catch (error) {
    console.error("Owner PG PUT Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
