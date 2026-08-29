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
    const amenity = searchParams.get("amenity") || "";
    const query = searchParams.get("query") || "";

    if (!collegeId && !query) {
      return NextResponse.json(
        { error: "Either collegeId or query parameter is required" },
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

    const whereClause: any = {
      rooms: {
        some: roomFilter,
      },
    };

    if (collegeId && collegeId !== "SEARCH_BY_NAME") {
      whereClause.collegeId = collegeId;
    }

    if (query) {
      whereClause.name = {
        contains: query,
      };
    }

    if (amenity) {
      whereClause.amenities = {
        contains: amenity,
      };
    }

    // Fetch PGs, including their rooms matching the criteria
    const pgs = await db.pg.findMany({
      where: whereClause,
      include: {
        rooms: {
          where: roomFilter,
          orderBy: { priceMonthly: "asc" },
        },
      },
      orderBy: {
        distanceKm: "asc", // Sort by proximity
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
