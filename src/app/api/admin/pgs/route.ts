import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Fetches complete details of all PGs registered on the platform.
// Restricted strictly to Super Admins.
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pgs = await db.pg.findMany({
      include: {
        owner: {
          select: { name: true, phone: true },
        },
        rooms: {
          include: {
            bookings: true,
          },
        },
        college: {
          select: { name: true, city: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(pgs);
  } catch (error) {
    console.error("Admin PGs API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
