import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - Simulates secure payment gateway callback/webhook.
// Marks booking as Approved automatically once payment is verified.
export async function POST(request: Request) {
  try {
    const { bookingId, transactionId } = await request.json();

    if (!bookingId || !transactionId) {
      return NextResponse.json(
        { error: "bookingId and transactionId are required" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "Pending_Payment") {
      return NextResponse.json(
        { error: "Booking is not in pending payment state" },
        { status: 400 }
      );
    }

    if (booking.room.availableBeds <= 0) {
      return NextResponse.json(
        { error: "Sorry, this room type has run out of beds since you started payment." },
        { status: 400 }
      );
    }

    const updated = await db.$transaction(async (tx) => {
      // 1. Update booking status to Approved
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "Approved",
          utr: transactionId,
        },
      });

      // 2. Decrement bed count
      await tx.room.update({
        where: { id: booking.roomId },
        data: {
          availableBeds: {
            decrement: 1,
          },
        },
      });

      return b;
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Payment Callback API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
