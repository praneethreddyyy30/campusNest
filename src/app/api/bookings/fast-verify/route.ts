import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Retrieves booking info for admin fast-verify preview (requires token)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId") || "";
    const token = searchParams.get("token") || "";

    const expectedToken = process.env.SMS_WEBHOOK_SECRET || "CAMPUSNEST_SMS_SECRET_2026";
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized access token" }, { status: 401 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            pg: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: booking.id,
      studentName: booking.studentName,
      studentPhone: booking.studentPhone,
      amountPaid: booking.amountPaid,
      status: booking.status,
      checkInDate: booking.checkInDate,
      utr: booking.utr,
      pgName: booking.room.pg.name,
      sharingType: booking.room.sharingType,
    });
  } catch (error) {
    console.error("Fast Verify GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Verifies payment or rejects it (requires token)
export async function POST(request: Request) {
  try {
    const { bookingId, token, action } = await request.json(); // action: "Pending" (Verify) or "Rejected" (Invalid UTR)

    const expectedToken = process.env.SMS_WEBHOOK_SECRET || "CAMPUSNEST_SMS_SECRET_2026";
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized access token" }, { status: 401 });
    }

    if (!bookingId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update status. If action is Pending, payment is verified.
    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: action, // "Pending" or "Rejected"
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Fast Verify POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
