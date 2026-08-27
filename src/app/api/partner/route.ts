import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// POST - Submitted by Campus Ambassadors or PG Owners (Public endpoint)
export async function POST(request: Request) {
  try {
    const { 
      hostelName, 
      address, 
      collegeName, 
      ownerName, 
      ownerPhone, 
      sharingTypes, 
      priceRange, 
      description, 
      locationUrl, 
      amenities, 
      imageUrl, 
      images, 
      distanceKm 
    } = await request.json();

    if (!hostelName || !address || !collegeName || !ownerName || !ownerPhone || !sharingTypes || !priceRange) {
      return NextResponse.json(
        { error: "All form fields are required to submit" },
        { status: 400 }
      );
    }

    const sanitizedPhone = ownerPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian phone number (starting with 6-9) for the owner" },
        { status: 400 }
      );
    }

    const submission = await db.pgFormSubmission.create({
      data: {
        hostelName,
        address,
        collegeName,
        ownerName,
        ownerPhone: sanitizedPhone,
        sharingTypes,
        priceRange,
        description: description || "In-depth details provided by Campus Ambassador.",
        locationUrl: locationUrl || "",
        amenities: amenities || "WiFi, Meals, Security",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
        images: images || "",
        distanceKm: distanceKm ? parseFloat(distanceKm) : 0.5,
        status: "Pending",
      },
    });

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    console.error("PG Submission Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetches all forms for Super Admin (Restricted endpoint)
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

    const submissions = await db.pgFormSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Updates status of the submission (Approved / Rejected) (Restricted)
export async function PUT(request: Request) {
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

    const { submissionId, status } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "submissionId and status are required" },
        { status: 400 }
      );
    }

    const updated = await db.pgFormSubmission.update({
      where: { id: submissionId },
      data: { status },
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
