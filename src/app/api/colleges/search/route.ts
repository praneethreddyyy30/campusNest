import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    if (!query) {
      // Return first 5 colleges by default if no query
      const colleges = await db.college.findMany({
        take: 5,
        orderBy: { name: "asc" },
      });
      return NextResponse.json(colleges);
    }

    const colleges = await db.college.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { city: { contains: query } },
        ],
      },
      take: 10,
    });

    return NextResponse.json(colleges);
  } catch (error) {
    console.error("Colleges Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
