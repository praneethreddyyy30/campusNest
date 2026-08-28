import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Retrieve rooms owned by the logged-in owner
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);

    const rooms = await db.room.findMany({
      where: {
        pg: { ownerId: session.id },
      },
      include: {
        pg: { select: { name: true } },
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update bed availability counter
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const { roomId, availableBeds, priceMonthly, imageUrl, images } = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { pg: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.pg.ownerId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this PG" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (availableBeds !== undefined) {
      updateData.availableBeds = parseInt(availableBeds);
    }
    if (priceMonthly !== undefined) {
      updateData.priceMonthly = parseFloat(priceMonthly);
    }
    
    // Support either single imageUrl string or images array
    if (images !== undefined && Array.isArray(images)) {
      const filtered = images.filter((img: string) => img.trim() !== "");
      updateData.images = filtered.join(",");
      updateData.imageUrl = filtered[0] || "";
    } else if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
      updateData.images = imageUrl;
    }

    const updatedRoom = await db.room.update({
      where: { id: roomId },
      data: updateData,
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
