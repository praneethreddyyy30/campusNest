import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - Student submits a review
export async function POST(request: Request) {
  try {
    const { pgId, studentName, rating, comment } = await request.json();

    if (!pgId || !rating || !comment) {
      return NextResponse.json(
        { error: "pgId, rating, and comment are required." },
        { status: 400 }
      );
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    const review = await db.review.create({
      data: {
        pgId,
        studentName: studentName || "Anonymous Senior",
        rating: ratingVal,
        comment,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Reviews API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
