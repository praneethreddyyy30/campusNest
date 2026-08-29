"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  Loader2, 
  Check, 
  Printer, 
  MessageSquare, 
  Phone, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  User,
  Building,
  Heart,
  Copy
} from "lucide-react";

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
      const cleanUrl = window.location.pathname + `?phone=${encodeURIComponent(phone)}`;
      window.history.replaceState({}, document.title, cleanUrl);

      setShowSuccessModal(true);

      const pg = booking.room.pg;
      const refCode = id.slice(0, 8).toUpperCase();
      const landlordText = `Hi ${pg.owner.name}, I have reserved a bed at ${pg.name} (${booking.room.sharingType} sharing) via CampusNest. Ref: CN-${refCode}. Amount Paid: ₹${booking.amountPaid}. Please approve my booking by clicking here: ${origin}/owner/fast-approve?bookingId=${id}&phone=${pg.owner.phone}`;
      
      const whatsappUrl = `https://wa.me/91${pg.owner.phone}?text=${encodeURIComponent(landlordText)}`;
      window.open(whatsappUrl, "_blank");
    }
  }, [booking, paidParam, id, phone, origin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Fetching booking status...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6 bg-pearl">
        <ShieldAlert className="w-12 h-12 text-midnight/35 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-bold text-midnight">Verification Failed</h2>
          <p className="text-xs text-midnight/60 leading-relaxed">
            {error || "We could not verify this booking transaction details. Check your phone lookup credentials."}
          </p>
        </div>
        <Link
          href="/track"
          className="inline-flex items-center justify-center bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
        >
          Go to Lookup Page
        </Link>
      </div>
    );
  }

  const { status, room, studentName, studentPhone, checkInDate, utr } = booking;
  const pg = room.pg;

  const isPendingPayment = status === "Pending_Payment";
  const isPaymentSubmitted = status === "Payment_Submitted";
  const isPending = status === "Pending";
  const isApproved = status === "Approved";
  const isRejected = status === "Rejected";
  const isNoShow = status === "No-Show";

  const whatsappUrl = isPaymentSubmitted
    ? `https://wa.me/919391333699?text=${encodeURIComponent(
        `Hi Support, I have paid the escrow deposit and submitted UTR ${utr || ""}. Ref: CN-${id.slice(0, 8).toUpperCase()}. Please verify my payment by clicking this link: ${origin}/admin/fast-verify?bookingId=${id}&token=CAMPUSNEST_SMS_SECRET_2026`
      )}`
    : `https://wa.me/919391333699?text=${encodeURIComponent(
        `Hi Support, I am checking status of my booking Ref: CN-${id.slice(
          0,
          8
        ).toUpperCase()} for student ${studentName}.`
      )}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 bg-pearl font-sans">
      
      {/* Header Info */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-[9px] text-midnight/50 font-bold uppercase tracking-wider block">
            Booking Reference
          </span>
          <h1 className="text-xl sm:text-2xl font-sans font-bold text-midnight uppercase mt-0.5">
            CN-{id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-[10px] text-midnight/40 mt-1">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Status Badge */}
        <div>
          {isPendingPayment && (
            <span className="bg-beige/40 text-midnight border border-beige/65 text-xs font-bold px-3.5 py-1.5 rounded-full animate-pulse uppercase tracking-wider">
              Awaiting Payment
            </span>
          )}
          {isPaymentSubmitted && (
            <span className="bg-yellow-50 text-yellow-800 border border-yellow-250 text-xs font-bold px-3.5 py-1.5 rounded-full animate-pulse uppercase tracking-wider">
              Awaiting Verification
            </span>
          )}
          {isPending && (
            <span className="bg-beige/40 text-midnight border border-beige/65 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Pending Approval
            </span>
          )}
          {isApproved && (
            <span className="bg-white text-midnight border border-beige/40 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Check className="w-3.5 h-3.5 text-midnight" />
              <span>Confirmed</span>
            </span>
          )}
          {isRejected && (
            <span className="bg-red-50 text-red-800 border border-red-200 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Rejected
            </span>
          )}
          {isNoShow && (
            <span className="bg-beige/20 text-midnight/50 border border-beige/30 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              Forfeited (No Show)
            </span>
          )}
        </div>
      </div>

      {/* Stepper Tracking Visual */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="font-bold text-midnight text-xs uppercase tracking-wider border-b border-beige/25 pb-3">Booking Progress</h2>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Step 1 */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isPendingPayment ? "bg-midnight text-pearl animate-pulse" : "bg-midnight text-pearl"
              }`}
            >
              01
            </div>
            <div>
              <p className="text-xs font-bold text-midnight uppercase tracking-wider">
                {isPendingPayment ? "Payment Pending" : "Payment Submitted"}
              </p>
              <p className="text-[10px] text-midnight/50 font-mono mt-0.5">
                {isPendingPayment ? "Action required" : `Ref: ${utr || "Verified"}`}
              </p>
            </div>
          </div>

          <div className="hidden md:block flex-grow h-0.5 bg-beige/40"></div>

          {/* Step 2 */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isApproved || isNoShow || isPending
                  ? "bg-midnight text-pearl"
                  : isRejected
                  ? "bg-red-700 text-white"
                  : isPendingPayment
                  ? "bg-beige/30 text-midnight/40 border border-beige/20"
                  : "bg-midnight text-pearl animate-pulse"
              }`}
            >
              02
            </div>
            <div>
              <p className="text-xs font-bold text-midnight uppercase tracking-wider">
                {isApproved || isPending
                  ? "Deposit Verified"
                  : isRejected
                  ? "Rejected"
                  : "Verifying Escrow"}
              </p>
              <p className="text-[10px] text-midnight/50 mt-0.5">₹2,000 held safely by CampusNest</p>
            </div>
          </div>

          <div className="hidden md:block flex-grow h-0.5 bg-beige/40"></div>

          {/* Step 3 */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isApproved
                  ? "bg-midnight text-pearl"
                  : isRejected
                  ? "bg-red-700 text-white"
                  : isPending
                  ? "bg-midnight text-pearl animate-pulse"
                  : "bg-beige/30 text-midnight/40 border border-beige/20"
              }`}
            >
              03
            </div>
            <div>
              <p className="text-xs font-bold text-midnight uppercase tracking-wider">
                {isApproved
                  ? "Landlord Approved"
                  : isRejected
                  ? "Booking Canceled"
                  : "Awaiting Landlord"}
              </p>
              <p className="text-[10px] text-midnight/50 mt-0.5">Hostel bed allocated</p>
            </div>
          </div>
        </div>
      </div>

      {isPendingPayment && (
        <div className="bg-cream/40 border border-beige/35 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-midnight text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-midnight/80" />
            <span>Reservation Payment Pending</span>
          </h3>
          <p className="text-xs text-midnight/70 leading-relaxed font-sans font-medium">
            Your bed reservation request has been registered, but payment of the ₹2,200 escrow deposit has not been completed. Click the link below to complete payment and lock your vacancy.
          </p>
          <Link
            href={`/checkout?bookingId=${id}&phone=${encodeURIComponent(phone)}`}
            className="inline-flex items-center bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
          >
            Complete Secure Payment (₹2,200)
          </Link>
        </div>
      )}

      {/* Booking Details */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-base font-sans font-bold text-midnight border-b border-beige/20 pb-3 mb-5 uppercase tracking-wider">
            Reservation Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm font-sans">
            <div>
              <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Student Name</dt>
              <dd className="text-midnight font-bold mt-1">{studentName}</dd>
            </div>
            <div>
              <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Phone Number</dt>
              <dd className="text-midnight font-bold mt-1">{studentPhone}</dd>
            </div>
            <div>
              <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Accommodation Type</dt>
              <dd className="text-midnight font-bold mt-1">
                {pg.name} — {room.sharingType} Sharing
              </dd>
            </div>
            <div>
              <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Expected Check-in Date</dt>
              <dd className="text-midnight font-bold mt-1">
                {new Date(checkInDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 pt-6 border-t border-beige/20 mt-6 print:hidden">
            <a
              href={`https://wa.me/91${studentPhone}?text=${encodeURIComponent(
                `My CampusNest Booking Receipt:\nHostel: ${pg.name}\nRoom: ${room.sharingType} Sharing\nExpected Check-in: ${new Date(checkInDate).toLocaleDateString("en-IN")}\nRef Code: CN-${id.slice(0, 8).toUpperCase()}\nTracking Link: ${origin}/bookings/${id}?phone=${studentPhone}`
              )}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
            >
              <span>Save Reference on WhatsApp</span>
            </a>
            
            <button
              onClick={() => typeof window !== "undefined" && window.print()}
              className="inline-flex items-center gap-1.5 bg-white border border-beige/40 hover:bg-beige/10 text-midnight font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF Receipt</span>
            </button>
          </div>
        </div>

        {/* State Conditional Blocks */}
        {isPaymentSubmitted && (
          <div className="bg-yellow-50/50 border border-yellow-250 text-midnight rounded-2xl p-6 space-y-3 print:hidden font-sans">
            <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-900">Awaiting Payment Verification</h4>
            <p className="leading-relaxed text-xs text-midnight/70 font-medium">
              We have received your UTR Reference: <strong className="font-mono text-midnight select-all font-bold">{utr}</strong>.
            </p>
            <p className="leading-relaxed text-xs text-midnight/70 font-medium">
              The CampusNest Super Admin is cross-referencing this transaction in the platform bank statement. Once verified, the booking status will update automatically and notify the landlord to confirm your bed.
            </p>
          </div>
        )}

        {isPending && (
          <div className="bg-cream/40 border border-beige/35 text-midnight rounded-2xl p-6 space-y-4 print:hidden">
            <h4 className="font-bold text-xs uppercase tracking-wider">Awaiting Landlord Confirmation</h4>
            <p className="leading-relaxed text-xs text-midnight/70 font-sans">
              Your deposit of ₹2,200 is verified and secured in escrow. The landlord has been alerted to review your reservation. Once approved, the address and contact details will be fully unlocked.
            </p>
            <div className="bg-white border border-beige/35 p-5 rounded-xl space-y-3 shadow-xs">
              <span className="font-extrabold text-[9px] text-midnight/60 block uppercase tracking-widest">
                Speed up check-in:
              </span>
              <p className="text-[11px] text-midnight/50 leading-relaxed font-sans">
                You can notify the landlord directly on WhatsApp for instant confirmation. They can approve this listing instantly with one tap!
              </p>
              <a
                href={`https://wa.me/91${pg.owner.phone}?text=${encodeURIComponent(
                  `Hi ${pg.owner.name}, I have reserved a bed at ${pg.name} (${room.sharingType} sharing) via CampusNest. Ref: CN-${id.slice(0, 8).toUpperCase()}. Amount Paid: ₹${booking.amountPaid}. Please approve my booking by clicking here: ${origin}/owner/fast-approve?bookingId=${id}&phone=${pg.owner.phone}`
                )}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 bg-midnight hover:bg-midnight-light text-pearl font-bold text-[10px] py-2.5 px-4 rounded-lg transition-colors cursor-pointer mt-1 uppercase tracking-wider"
              >
                Notify Landlord
              </a>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="bg-white border border-beige/45 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-lg text-midnight">✓ Reservation Confirmed</h4>
              <p className="text-xs sm:text-sm text-midnight/70 leading-relaxed font-sans">
                Your bed is secured. The ₹2,000 Advance token is held in escrow and will be credited to the landlord 24 hours after check-in.
              </p>
            </div>

            {/* Check-in details card */}
            <div className="bg-beige/10 border border-beige/35 rounded-xl p-5 space-y-4">
              <h5 className="font-bold text-xs text-midnight uppercase tracking-wider border-b border-beige/25 pb-2">Check-in Details & Contact Info</h5>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-sans">
                <div>
                  <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Hostel Address</dt>
                  <dd className="text-midnight font-bold mt-1">{pg.address}</dd>
                </div>
                <div>
                  <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">PG Owner Name</dt>
                  <dd className="text-midnight font-bold mt-1">{pg.owner.name}</dd>
                </div>
                <div>
                  <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Owner Contact Phone</dt>
                  <dd className="text-midnight font-extrabold mt-1 text-base">{pg.owner.phone}</dd>
                </div>
                <div>
                  <dt className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wider">Remaining Rent to Pay</dt>
                  <dd className="text-midnight font-bold mt-1">
                    ₹{room.priceMonthly - 2000 > 0 ? room.priceMonthly - 2000 : 0} (Pay directly to landlord at hostel)
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <a
                  href={`tel:${pg.owner.phone}`}
                  className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  Call Landlord
                </a>
                <a
                  href={`https://wa.me/91${pg.owner.phone}?text=Hi, my booking is approved.`}
                  target="_blank"
                  className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  WhatsApp Landlord
                </a>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border border-red-100 text-red-900 rounded-2xl p-6 text-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider">Reservation Request Declined</h4>
            <p className="leading-relaxed text-xs">
              The landlord has rejected the booking due to occupancy constraints. Your ₹2,000 escrow advance token is being refunded automatically.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors inline-block uppercase tracking-wider shadow-xs"
              >
                Search Other Hostels
              </Link>
            </div>
          </div>
        )}

        {isNoShow && (
          <div className="bg-beige/10 border border-beige/30 text-midnight/60 rounded-2xl p-6 text-sm space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider">Booking Lapsed (No-Show)</h4>
            <p className="leading-relaxed text-xs font-sans">
              This reservation has lapsed because you did not check in within 48 hours of your expected check-in date. The ₹2,000 token advance is released to the PG owner to cover vacancy loss.
            </p>
          </div>
        )}

        {/* Support Help */}
        <div className="flex justify-between items-center bg-beige/10 border border-dashed border-beige/40 rounded-2xl p-5 flex-col sm:flex-row gap-4">
          <div>
            <h4 className="font-bold text-sm text-midnight">Need assistance or date adjustments?</h4>
            <p className="text-xs text-midnight/55 font-sans">Connect with CampusNest help desk directly on WhatsApp.</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            className="inline-flex items-center bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-xs cursor-pointer uppercase tracking-wider shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message Support</span>
          </a>
        </div>
      </div>

      {/* CHECKOUT SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-beige/40 text-center space-y-6 text-midnight relative">
            
            <div className="mx-auto h-16 w-16 bg-beige/30 text-midnight rounded-full flex items-center justify-center text-2xl font-black border border-beige/35 shadow-xs">
              ✓
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-sans font-bold text-midnight leading-tight">Payment Successful</h3>
              <p className="text-xs text-midnight/60 leading-relaxed font-sans">
                Your booking advance is verified and secured in escrow. We have opened a WhatsApp conversation to notify the landlord for approval.
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-beige/10 border border-beige/45 p-4 rounded-2xl space-y-3 text-left">
              <span className="font-extrabold text-[9px] text-midnight/50 uppercase tracking-widest block">
                Receipt Actions:
              </span>
              <div className="space-y-2 text-xs font-sans">
                <a
                  href={`https://wa.me/91${studentPhone}?text=${encodeURIComponent(
                    `My CampusNest Booking Receipt:\nHostel: ${pg.name}\nRoom: ${room.sharingType} Sharing\nExpected Check-in: ${new Date(checkInDate).toLocaleDateString("en-IN")}\nRef Code: CN-${id.slice(0, 8).toUpperCase()}\nTracking Link: ${origin}/bookings/${id}?phone=${studentPhone}`
                  )}`}
                  target="_blank"
                  className="w-full flex items-center justify-center bg-midnight hover:bg-midnight-light text-pearl font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Save to WhatsApp
                </a>
                
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="w-full flex items-center justify-center bg-white border border-beige/40 hover:bg-beige/10 text-midnight font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Download PDF
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="text-xs font-bold text-midnight/65 hover:text-midnight cursor-pointer block mx-auto pt-2"
            >
              Continue to Dashboard
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
        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
          <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
          <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading tracking dashboard...</p>
        </div>
      }
    >
      <BookingTrackingContent id={id} />
    </Suspense>
  );
}
