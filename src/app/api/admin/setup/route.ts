import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Fetches all Colleges and Landlord Users to populate dropdown fields in Admin Console.
// Restricted strictly to Super Admins.
export async function GET() {
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

    const colleges = await db.college.findMany({
      orderBy: { name: "asc" },
    });

    const owners = await db.user.findMany({
      where: { role: "owner" },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ colleges, owners });
  } catch (error) {
    console.error("Admin Setup API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
