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

// POST - Approve or Reject pending edits from landlord
export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { pgId, action } = await request.json(); // action = "approve" | "reject"

    if (!pgId || !action) {
      return NextResponse.json(
        { error: "pgId and action are required" },
        { status: 400 }
      );
    }

    const pg = await db.pg.findUnique({
      where: { id: pgId },
    });

    if (!pg) {
      return NextResponse.json({ error: "PG listing not found" }, { status: 404 });
    }

    if (action === "approve") {
      await db.pg.update({
        where: { id: pgId },
        data: {
          name: pg.pendingName || pg.name,
          address: pg.pendingAddress || pg.address,
          description: pg.pendingDescription || pg.description,
          distanceKm: pg.pendingDistanceKm !== null ? pg.pendingDistanceKm : pg.distanceKm,
          amenities: pg.pendingAmenities || pg.amenities,
          imageUrl: pg.pendingImageUrl || pg.imageUrl,
          images: pg.pendingImages || pg.images,
          reservationFee: pg.pendingReservationFee !== null ? pg.pendingReservationFee : pg.reservationFee,
          // Clear pending states
          pendingName: null,
          pendingAddress: null,
          pendingDescription: null,
          pendingDistanceKm: null,
          pendingAmenities: null,
          pendingImageUrl: null,
          pendingImages: null,
          pendingReservationFee: null,
          hasPendingUpdates: false,
        },
      });

      return NextResponse.json({ success: true, message: "Updates approved and published live!" });
    } else if (action === "reject") {
      await db.pg.update({
        where: { id: pgId },
        data: {
          // Discard pending states
          pendingName: null,
          pendingAddress: null,
          pendingDescription: null,
          pendingDistanceKm: null,
          pendingAmenities: null,
          pendingImageUrl: null,
          pendingImages: null,
          pendingReservationFee: null,
          hasPendingUpdates: false,
        },
      });

      return NextResponse.json({ success: true, message: "Landlord updates rejected and discarded." });
    } else {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'." }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin Approve Updates Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 550 }
    );
  }
}
