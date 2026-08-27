import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Retrieve bookings based on authorization role or phone + ref lookup
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const phone = searchParams.get("phone");

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    // Case 1: Student Lookup (Guest mode)
    if (bookingId && phone) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
          room: {
            include: {
              pg: {
                include: {
                  owner: {
                    select: { name: true, phone: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!booking || booking.studentPhone !== phone) {
        return NextResponse.json(
          { error: "Booking not found or phone number mismatch" },
          { status: 404 }
        );
      }

      // Hide owner contact details unless the booking is Approved!
      const isApproved = booking.status === "Approved";
      const sanitizedBooking = {
        id: booking.id,
        studentName: booking.studentName,
        studentPhone: booking.studentPhone,
        amountPaid: booking.amountPaid,
        status: booking.status,
        checkInDate: booking.checkInDate,
        createdAt: booking.createdAt,
        utr: booking.utr,
        room: {
          sharingType: booking.room.sharingType,
          priceMonthly: booking.room.priceMonthly,
          genderPreference: booking.room.genderPreference,
          pg: {
            name: booking.room.pg.name,
            address: isApproved ? booking.room.pg.address : "Hidden until Approved",
            description: booking.room.pg.description,
            distanceKm: booking.room.pg.distanceKm,
            owner: isApproved
              ? booking.room.pg.owner
              : { name: "Hidden", phone: "Hidden" },
          },
        },
      };

      return NextResponse.json(sanitizedBooking);
    }

    // Case 2: Session-based Auth (Owner or Admin)
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);

    if (session.role === "admin") {
      // Admin sees all bookings
      const bookings = await db.booking.findMany({
        include: {
          room: {
            include: { pg: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(bookings);
    } else if (session.role === "owner") {
      // Owner sees only their own PG bookings
      const bookings = await db.booking.findMany({
        where: {
          room: {
            pg: { ownerId: session.id },
          },
        },
        include: {
          room: {
            include: { pg: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Bookings GET API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Student makes a Booking Request (Guest Mode)
export async function POST(request: Request) {
  try {
    const { roomId, studentName, studentPhone, checkInDate } =
      await request.json();

    if (!roomId || !studentName || !studentPhone || !checkInDate) {
      return NextResponse.json(
        { error: "All fields are required to reserve a bed" },
        { status: 400 }
      );
    }

    const sanitizedPhone = studentPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian phone number (starting with 6-9)" },
        { status: 400 }
      );
    }

    // Fetch the room and PG to check availability and reservation fee rate
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        pg: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    if (room.availableBeds <= 0) {
      return NextResponse.json(
        { error: "Sorry, this room type is currently fully booked" },
        { status: 400 }
      );
    }

    // Create the booking in Pending_Payment state
    const booking = await db.booking.create({
      data: {
        roomId,
        studentName,
        studentPhone: sanitizedPhone,
        amountPaid: room.pg.reservationFee + 200, // Landlord custom advance rate + ₹200 commission fee
        status: "Pending_Payment",
        checkInDate: new Date(checkInDate),
        utr: "GATEWAY_PENDING",
      },
    });

    return NextResponse.json({ success: true, bookingId: booking.id });
  } catch (error) {
    console.error("Bookings POST API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Owner or Admin updates booking status (Approved / Rejected / No-Show)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const { bookingId, status } = await request.json(); // status: "Approved" | "Rejected" | "No-Show"

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "bookingId and status are required" },
        { status: 400 }
      );
    }

    // Fetch the booking and room details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: {
          include: { pg: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization check: Admin can do anything; Owner must own the PG
    const isOwner = booking.room.pg.ownerId === session.id;
    const isAdmin = session.role === "admin";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this PG" },
        { status: 403 }
      );
    }

    const oldStatus = booking.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      return NextResponse.json({ success: true, message: "Status unchanged" });
    }

    // Run in a transaction to handle status changes and inventory safety
    const updatedBooking = await db.$transaction(async (tx) => {
      // 1. Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      });

      // 2. Adjust inventory based on state transition
      if (oldStatus === "Pending" && newStatus === "Approved") {
        // Decrease beds
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            availableBeds: {
              decrement: 1,
            },
          },
        });
      } else if (oldStatus === "Approved" && (newStatus === "Rejected" || newStatus === "No-Show")) {
        // Release bed back to pool
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
    console.error("Bookings PUT API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
