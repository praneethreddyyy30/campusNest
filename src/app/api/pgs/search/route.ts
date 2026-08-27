import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");
    const gender = searchParams.get("gender") || ""; // "Boys", "Girls", "Co-ed"
    const sharing = searchParams.get("sharing") || ""; // "Single", "Double", "Triple"
    const maxPriceVal = searchParams.get("maxPrice");
    const maxPrice = maxPriceVal ? parseFloat(maxPriceVal) : NaN;

    if (!collegeId) {
      return NextResponse.json(
        { error: "collegeId parameter is required" },
        { status: 400 }
      );
    }

    // Build the room query filters
    const roomFilter: any = {};
    if (gender) {
      roomFilter.genderPreference = gender;
    }
    if (sharing) {
      roomFilter.sharingType = sharing;
    }
    if (!isNaN(maxPrice)) {
      roomFilter.priceMonthly = { lte: maxPrice };
    }

    // Fetch PGs near the college, including their rooms matching the criteria
    const pgs = await db.pg.findMany({
      where: {
        collegeId: collegeId,
        // Only return PGs that have rooms matching our filter
        rooms: {
          some: roomFilter,
        },
      },
      include: {
        rooms: {
          where: roomFilter,
          orderBy: { priceMonthly: "asc" },
        },
      },
      orderBy: {
        distanceKm: "asc", // Sort by proximity!
      },
    });

    return NextResponse.json(pgs);
  } catch (error) {
    console.error("PGs Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
