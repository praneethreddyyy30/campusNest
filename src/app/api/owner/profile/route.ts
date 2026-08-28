import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// PUT - Updates landlord profile (phone number and/or password)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("campus_user_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    const { name, phone, password } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone Number are required" },
        { status: 400 }
      );
    }

    const sanitizedPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Must be a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Verify if phone is already taken by another user
    const existingUser = await db.user.findUnique({
      where: { phone: sanitizedPhone },
    });

    if (existingUser && existingUser.id !== session.id) {
      return NextResponse.json(
        { error: "This phone number is already registered under another account." },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      phone: sanitizedPhone,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      const { hashPassword } = await import("@/lib/auth");
      updateData.passwordHash = hashPassword(password);
    }

    // Update DB
    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: updateData,
    });

    // Update Session Cookie
    const updatedSession = {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      role: updatedUser.role,
    };

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
      },
    });

    response.cookies.set("campus_user_session", JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Owner Profile Update API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
