import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get("token") || "";
    const headerToken = request.headers.get("x-webhook-token") || "";
    const expectedToken = process.env.SMS_WEBHOOK_SECRET || "CAMPUSNEST_SMS_SECRET_2026";

    // Security Token check to prevent unauthorized spoofing
    if (headerToken !== expectedToken && queryToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let smsText = "";
    const contentType = request.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        const body = await request.json();
        smsText = body.message || body.text || body.body || body.content || "";
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        smsText = (formData.get("message") as string) || (formData.get("text") as string) || (formData.get("body") as string) || (formData.get("content") as string) || "";
      } else {
        smsText = await request.text();
      }
    } catch (parseErr) {
      try {
        smsText = await request.text();
      } catch (e) {
        smsText = "";
      }
    }

    if (!smsText) {
      return NextResponse.json({ error: "Empty SMS message text" }, { status: 400 });
    }

    // 1. Check if the SMS is a deposit/credit (to ignore outgoing payment debits)
    const isCredit = /credit|received|credited|deposit|add/i.test(smsText);
    if (!isCredit) {
      return NextResponse.json({ success: false, message: "Transaction is not a deposit/credit notification." }, { status: 200 });
    }

    // 2. Extract 12-digit UTR/Transaction Reference
    const utrRegex = /\b\d{12}\b/;
    const utrMatch = smsText.match(utrRegex);
    const utr = utrMatch ? utrMatch[0] : null;

    if (!utr) {
      return NextResponse.json({ success: false, message: "No valid 12-digit UTR reference found in SMS text." }, { status: 200 });
    }

    // 3. Find booking matching the UTR that is currently awaiting payment verification
    const booking = await db.booking.findFirst({
      where: {
        utr: utr,
        status: "Payment_Submitted",
      },
    });

    if (!booking) {
      return NextResponse.json({
        success: false,
        message: `No payment_submitted booking found matching UTR ${utr}. Student might not have submitted checkout details yet.`,
      }, { status: 200 });
    }

    // 4. Update the booking status to "Pending" (meaning payment is verified, awaiting Landlord confirmation)
    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: "Pending",
      },
    });

    console.log(`[SMS Gateway] Verified payment automatically for booking Ref: CN-${booking.id.slice(0, 8).toUpperCase()} with UTR: ${utr}`);

    return NextResponse.json({
      success: true,
      message: `Automatically verified booking Ref: CN-${booking.id.slice(0, 8).toUpperCase()}`,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error("SMS Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
