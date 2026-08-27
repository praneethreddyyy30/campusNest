import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Retrieves booking details for fast-approve preview (accessible via WhatsApp link)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId") || "";
    const phone = searchParams.get("phone") || "";

    if (!bookingId || !phone) {
      return NextResponse.json(
        { error: "bookingId and phone parameters are required" },
        { status: 400 }
      );
    }

    const sanitizedPhone = phone.replace(/\D/g, "");

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            pg: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Reservation request not found" }, { status: 404 });
    }

    // Verify ownership by checking owner phone
    if (booking.room.pg.owner.phone !== sanitizedPhone) {
      return NextResponse.json({ error: "Access Denied: Phone mismatch" }, { status: 403 });
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
    console.error("Fast Action GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Executes approval/rejection without requiring full password login session
export async function POST(request: Request) {
  try {
    const { bookingId, phone, action } = await request.json(); // action: "Approved" | "Rejected"

    if (!bookingId || !phone || !action) {
      return NextResponse.json(
        { error: "bookingId, phone, and action are required" },
        { status: 400 }
      );
    }

    const sanitizedPhone = phone.replace(/\D/g, "");

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: {
            pg: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
    }

    // Verify ownership
    if (booking.room.pg.owner.phone !== sanitizedPhone) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const oldStatus = booking.status;
    const newStatus = action; // "Approved" or "Rejected"

    if (oldStatus === newStatus) {
      return NextResponse.json({ success: true, message: "Status already set" });
    }

    const updatedBooking = await db.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      // Update vacancies count accordingly
      if (oldStatus === "Pending" && newStatus === "Approved") {
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            availableBeds: {
              decrement: 1,
            },
          },
        });
      } else if (oldStatus === "Approved" && newStatus === "Rejected") {
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            availableBeds: {
              increment: 1,
            },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error("Fast Action POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
