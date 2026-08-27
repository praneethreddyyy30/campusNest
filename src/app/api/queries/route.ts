import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Retrieve queries (Public can see answered queries for a PG; Admin can see all)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pgId = searchParams.get("pgId");

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;
    let isAdmin = false;

    if (sessionCookie) {
      const session = JSON.parse(sessionCookie);
      if (session.role === "admin") {
        isAdmin = true;
      }
    }

    if (isAdmin && !pgId) {
      // Admin dashboard: return all queries
      const queries = await db.query.findMany({
        include: {
          pg: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(queries);
    }

    if (!pgId) {
      return NextResponse.json(
        { error: "pgId is required for public query list" },
        { status: 400 }
      );
    }

    // Public list for a PG: only show answered queries
    const queries = await db.query.findMany({
      where: {
        pgId: pgId,
        status: "Answered",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Queries GET API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Student submits a new question (No login required)
export async function POST(request: Request) {
  try {
    const { pgId, studentName, studentPhone, question } = await request.json();

    if (!pgId || !studentName || !studentPhone || !question) {
      return NextResponse.json(
        { error: "All fields (pgId, name, phone, question) are required" },
        { status: 400 }
      );
    }

    const query = await db.query.create({
      data: {
        pgId,
        studentName,
        studentPhone,
        question,
        status: "Pending",
      },
    });

    return NextResponse.json({ success: true, query });
  } catch (error) {
    console.error("Queries POST API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Admin answers a question
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access only" },
        { status: 403 }
      );
    }

    const { queryId, answer } = await request.json();

    if (!queryId || !answer) {
      return NextResponse.json(
        { error: "queryId and answer are required" },
        { status: 400 }
      );
    }

    const updatedQuery = await db.query.update({
      where: { id: queryId },
      data: {
        answer,
        status: "Answered",
      },
    });

    return NextResponse.json({ success: true, query: updatedQuery });
  } catch (error) {
    console.error("Queries PUT API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
