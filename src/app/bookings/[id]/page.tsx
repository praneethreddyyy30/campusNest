"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PG {
  name: string;
  address: string;
  description: string;
  distanceKm: number;
  owner: {
    name: string;
    phone: string;
  };
}

interface Room {
  sharingType: string;
  priceMonthly: number;
  genderPreference: string;
  pg: PG;
}

interface Booking {
  id: string;
  studentName: string;
  studentPhone: string;
  amountPaid: number;
  status: string;
  checkInDate: string;
  createdAt: string;
  utr: string;
  room: Room;
}

function BookingTrackingContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get("phone") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchBookingStatus = async () => {
    if (!phone) {
      setError("Phone number search parameter is missing.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/bookings?bookingId=${id}&phone=${encodeURIComponent(phone)}`
      );
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load booking details.");
      }
    } catch (err) {
      setError("Failed to communicate with database server.");
    } finally {
      setLoading(false);
    }
  };

  const paidParam = searchParams.get("paid") === "true";

  useEffect(() => {
    fetchBookingStatus();
  }, [id, phone]);

  useEffect(() => {
    if (booking && paidParam && typeof window !== "undefined") {
      // Clear query param so it doesn't trigger on reload
      const cleanUrl = window.location.pathname + `?phone=${encodeURIComponent(phone)}`;
      window.history.replaceState({}, document.title, cleanUrl);

      // 1. Show the receipt save modal for the student
      setShowSuccessModal(true);

      // 2. Launch WhatsApp notification automatically to notify the Landlord for instant approval
      const pg = booking.room.pg;
      const refCode = id.slice(0, 8).toUpperCase();
      const landlordText = `Hi ${pg.owner.name}, I have reserved a bed at ${pg.name} (${booking.room.sharingType} sharing) via CampusNest. Ref: CN-${refCode}. Amount Paid: ₹${booking.amountPaid}. Please approve my booking by clicking here: ${origin}/owner/fast-approve?bookingId=${id}&phone=${pg.owner.phone}`;
      
      const whatsappUrl = `https://wa.me/91${pg.owner.phone}?text=${encodeURIComponent(landlordText)}`;
      window.open(whatsappUrl, "_blank");
    }
  }, [booking, paidParam, id, phone, origin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Fetching booking status...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200 text-sm font-semibold">
          {error || "Booking details could not be loaded."}
        </div>
        <p className="text-sm text-gray-500">
          Make sure your booking link is correct, or go back to lookup page.
        </p>
        <Link
          href="/track"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors cursor-pointer"
        >
          Go to Lookup Page
        </Link>
      </div>
    );
  }

  const { status, room, studentName, studentPhone, checkInDate, utr } = booking;
  const pg = room.pg;

  // Custom step statuses based on booking state
  const isPendingPayment = status === "Pending_Payment";
  const isPending = status === "Pending";
  const isApproved = status === "Approved";
  const isRejected = status === "Rejected";
  const isNoShow = status === "No-Show";

  // Pre-filled WhatsApp support message
  const whatsappUrl = `https://wa.me/919999999999?text=${encodeURIComponent(
    `Hi Support, I am checking status of my booking Ref: CN-${id.slice(
      0,
      4
    ).toUpperCase()} for student ${studentName}.`
  )}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Booking Reference
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase">
            CN-{id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-gray-500">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isPendingPayment && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-sm font-extrabold px-3 py-1.5 rounded-full animate-pulse">
              Awaiting Payment
            </span>
          )}
          {isPending && (
            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-sm font-extrabold px-3 py-1.5 rounded-full">
              Pending Approval
            </span>
          )}
          {isApproved && (
            <span className="bg-green-100 text-green-800 border border-green-200 text-sm font-extrabold px-3 py-1.5 rounded-full">
              ✓ Confirmed
            </span>
          )}
          {isRejected && (
            <span className="bg-red-100 text-red-800 border border-red-200 text-sm font-extrabold px-3 py-1.5 rounded-full">
              Rejected
            </span>
          )}
          {isNoShow && (
            <span className="bg-slate-100 text-slate-800 border border-slate-200 text-sm font-extrabold px-3 py-1.5 rounded-full">
              Forfeited (No Show)
            </span>
          )}
        </div>
      </div>

      {/* Stepper Tracking Visual */}
      <div className="bg-white border rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="font-extrabold text-gray-900 mb-6 text-sm">Booking Progress</h2>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Step 1: Paid */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isPendingPayment ? "bg-amber-500 text-white animate-pulse" : "bg-green-500 text-white"
              }`}
            >
              1
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isPendingPayment ? "Awaiting Payment" : "Payment Submitted"}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {isPendingPayment ? "Action required" : `Ref: ${utr}`}
              </p>
            </div>
          </div>

          {/* Stepper Line 1 */}
          <div className="hidden md:block flex-grow h-0.5 bg-gray-200"></div>

          {/* Step 2: Verification / Escrow */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isApproved || isNoShow
                  ? "bg-green-500 text-white"
                  : isRejected
                  ? "bg-red-500 text-white"
                  : isPendingPayment
                  ? "bg-gray-200 text-gray-400"
                  : "bg-amber-500 text-white animate-pulse"
              }`}
            >
              2
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isApproved
                  ? "Deposit Verified"
                  : isRejected
                  ? "Rejected"
                  : "Verifying Gateway Deposit"}
              </p>
              <p className="text-xs text-gray-500">₹2,000 held safely by CampusNest</p>
            </div>
          </div>

          {/* Stepper Line 2 */}
          <div className="hidden md:block flex-grow h-0.5 bg-gray-200"></div>

          {/* Step 3: Owner Approval */}
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                isApproved
                  ? "bg-green-500 text-white"
                  : isRejected
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              3
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isApproved
                  ? "Landlord Approved"
                  : isRejected
                  ? "Booking Canceled"
                  : "Awaiting Landlord Confirmation"}
              </p>
              <p className="text-xs text-gray-500">Hostel bed allocated</p>
            </div>
          </div>
        </div>
      </div>

      {isPendingPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm space-y-3">
          <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
            ⚠️ Reservation Payment Pending
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            Your bed reservation request has been registered, but payment of the ₹2,200 escrow deposit has not been completed yet. Click the secure payment link below to complete your checkout and confirm your booking.
          </p>
          <Link
            href={`/checkout?bookingId=${id}&phone=${encodeURIComponent(phone)}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded shadow-sm text-xs transition-colors cursor-pointer"
          >
            Complete Secure Payment (₹2,200)
          </Link>
        </div>
      )}

      {/* Booking Details / Actions */}
      <div className="bg-white border rounded-xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 border-b pb-2 mb-4">
            Reservation Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-400 font-semibold">Student Name</dt>
              <dd className="text-gray-900 font-bold mt-0.5">{studentName}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-semibold">Phone Number</dt>
              <dd className="text-gray-900 font-bold mt-0.5">{studentPhone}</dd>
            </div>
            <div>
              <dt className="text-gray-400 font-semibold">Accommodation Type</dt>
              <dd className="text-gray-900 font-bold mt-0.5">
                {pg.name} — {room.sharingType} Sharing
              </dd>
            </div>
            <div>
              <dt className="text-gray-400 font-semibold">Expected Check-in Date</dt>
              <dd className="text-gray-900 font-bold mt-0.5">
                {new Date(checkInDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2 pt-4 border-t mt-4 print:hidden">
            <a
              href={`https://wa.me/91${studentPhone}?text=${encodeURIComponent(
                `My CampusNest Booking Receipt:\nHostel: ${pg.name}\nRoom: ${room.sharingType} Sharing\nExpected Check-in: ${new Date(checkInDate).toLocaleDateString("en-IN")}\nRef Code: CN-${id.slice(0, 8).toUpperCase()}\nTracking Link: ${origin}/bookings/${id}?phone=${studentPhone}`
              )}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-2 px-3.5 rounded transition-colors shadow-sm cursor-pointer"
            >
              📲 Save Reference to WhatsApp
            </a>
            <button
              onClick={() => typeof window !== "undefined" && window.print()}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs py-2 px-3.5 rounded transition-colors shadow-sm cursor-pointer"
            >
              📄 Print / Save PDF Receipt
            </button>
          </div>
        </div>

        {/* State Conditional Blocks */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-5 text-sm space-y-3 print:hidden">
            <h4 className="font-extrabold">Your reservation is waiting for the Landlord to approve.</h4>
            <p className="leading-relaxed text-xs">
              We have locked ₹2,000 securely. The landlord has been alerted to review this booking. Once the landlord approves, we will unlock their contact numbers and address.
            </p>
            <div className="bg-white border p-3 rounded-lg space-y-2 border-amber-150">
              <span className="font-bold text-[10px] text-amber-800 block uppercase tracking-wider">
                ⚡ Speed up approval:
              </span>
              <p className="text-[11px] text-gray-500 leading-normal">
                If the owner is offline, click below to notify them directly on WhatsApp. They can approve your booking instantly with one click!
              </p>
              <a
                href={`https://wa.me/91${pg.owner.phone}?text=${encodeURIComponent(
                  `Hi ${pg.owner.name}, I have reserved a bed at ${pg.name} (${room.sharingType} sharing) via CampusNest. Ref: CN-${id.slice(0, 8).toUpperCase()}. Amount Paid: ₹${booking.amountPaid}. Please approve my booking by clicking here: ${origin}/owner/fast-approve?bookingId=${id}&phone=${pg.owner.phone}`
                )}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-[11px] py-2 px-3.5 rounded transition-colors shadow-sm cursor-pointer mt-1"
              >
                📲 Notify Landlord on WhatsApp
              </a>
            </div>
            <p className="text-[10px] font-semibold text-amber-600">
              * Bookmark this page. You can also track this anytime on our home page by entering your phone number under "Track Booking".
            </p>
          </div>
        )}

        {isApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-green-900 text-lg">✓ Booking Approved!</h4>
              <p className="text-sm text-green-800 leading-normal">
                Your bed is secured. The ₹2,000 Token Advance is held in escrow and will be credited to the landlord 24 hours after check-in.
              </p>
            </div>

            {/* Owner contact details card */}
            <div className="bg-white border border-green-150 rounded-lg p-4 space-y-3">
              <h5 className="font-extrabold text-sm text-gray-800">Check-in Details & Contact Info</h5>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-400 font-semibold">Hostel Address</dt>
                  <dd className="text-gray-900 font-bold mt-0.5">{pg.address}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-semibold">PG Owner Name</dt>
                  <dd className="text-gray-900 font-bold mt-0.5">{pg.owner.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-semibold">Owner Mobile Number</dt>
                  <dd className="text-indigo-600 font-extrabold mt-0.5 font-mono text-lg">
                    {pg.owner.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-semibold">Remaining Rent to Pay</dt>
                  <dd className="text-green-700 font-extrabold mt-0.5">
                    ₹{room.priceMonthly - 2000 > 0 ? room.priceMonthly - 2000 : 0} (Pay directly to owner at check-in)
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={`tel:${pg.owner.phone}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded transition-colors"
                >
                  Call Landlord
                </a>
                <a
                  href={`https://wa.me/91${pg.owner.phone}?text=Hi, my booking is approved.`}
                  target="_blank"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-2 px-4 rounded transition-colors"
                >
                  WhatsApp Landlord
                </a>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-5 text-sm space-y-2">
            <h4 className="font-extrabold">Reservation Request Denied.</h4>
            <p className="leading-relaxed">
              Unfortunately, the landlord has rejected the booking (most likely due to offline walk-in occupancies). Your ₹2,000 Token Advance is being automatically refunded.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="bg-red-600 hover:bg-red-750 text-white font-semibold text-xs py-2 px-4 rounded transition-colors inline-block"
              >
                Search Other Hostels
              </Link>
            </div>
          </div>
        )}

        {isNoShow && (
          <div className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-5 text-sm space-y-2">
            <h4 className="font-extrabold">Booking Lapsed (No-Show).</h4>
            <p className="leading-relaxed">
              This reservation was canceled because you did not check in within 48 hours of your expected check-in date. The token deposit of ₹2,000 has been transferred to the PG owner to cover vacancy loss.
            </p>
          </div>
        )}

        {/* WhatsApp Support Help */}
        <div className="flex justify-between items-center bg-gray-50 border border-dashed rounded-lg p-4 flex-col sm:flex-row gap-3">
          <div>
            <h4 className="font-bold text-sm text-gray-800">Need help or want to request date changes?</h4>
            <p className="text-xs text-gray-500">Contact CampusPG support directly on WhatsApp.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-2.5 px-4 rounded transition-colors shadow-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-whatsapp"
              viewBox="0 0 16 16"
            >
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.977h.004c4.368 0 7.927-3.559 7.93-7.93a7.897 7.897 0 0 0-2.317-5.592zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.69-4.98c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
            <span>Message Support</span>
          </a>
        </div>
      </div>

      {/* CHECKOUT SUCCESS RECEIPT OVERLAY MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border text-center space-y-5 text-gray-900 relative">
            
            {/* Green Check Animation Circle */}
            <div className="mx-auto h-16 w-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl font-black shadow-inner border border-green-200">
              ✓
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-950">Payment Successful!</h3>
              <p className="text-[11px] text-gray-500 leading-normal">
                Your booking advance is verified and secured in escrow. We have automatically opened a WhatsApp tab to alert the landlord for instant approval.
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-gray-50 border p-3 rounded-xl space-y-2.5 text-left">
              <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block">
                Your Next Receipt Actions:
              </span>
              <div className="space-y-2 text-xs">
                {/* Action 1: Save reference to WhatsApp */}
                <a
                  href={`https://wa.me/91${studentPhone}?text=${encodeURIComponent(
                    `My CampusNest Booking Receipt:\nHostel: ${pg.name}\nRoom: ${room.sharingType} Sharing\nExpected Check-in: ${new Date(checkInDate).toLocaleDateString("en-IN")}\nRef Code: CN-${id.slice(0, 8).toUpperCase()}\nTracking Link: ${origin}/bookings/${id}?phone=${studentPhone}`
                  )}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-extrabold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  📲 Save Receipt to My WhatsApp
                </a>
                
                {/* Action 2: Print / Save PDF */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  📄 Download Receipt PDF
                </button>
              </div>
            </div>

            {/* Close trigger */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 cursor-pointer block mx-auto pt-2"
            >
              Continue to Tracking Dashboard
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 text-sm font-medium mt-2">Loading tracking dashboard...</p>
        </div>
      }
    >
      <BookingTrackingContent id={id} />
    </Suspense>
  );
}
