import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pg = await db.pg.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { priceMonthly: "asc" },
        },
        college: true,
        queries: {
          where: { status: "Answered" },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pg) {
      return NextResponse.json({ error: "PG not found" }, { status: 404 });
    }

    // Increment PG view counter traffic on detail load
    await db.pg.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(pg);
  } catch (error) {
    console.error("PG Detail API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
