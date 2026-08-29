"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check, X, ShieldAlert, Phone, Calendar, User, DollarSign, FileText } from "lucide-react";

interface BookingDetail {
  id: string;
  studentName: string;
  studentPhone: string;
  amountPaid: number;
  status: string;
  checkInDate: string;
  utr: string;
  pgName: string;
  sharingType: string;
}

function FastApproveContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const phone = searchParams.get("phone") || "";

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!bookingId || !phone) {
      setError("Invalid Link: Missing Reference parameters.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/fast-action?bookingId=${bookingId}&phone=${encodeURIComponent(phone)}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to load booking details.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, phone]);

  const handleAction = async (action: "Approved" | "Rejected") => {
    if (!booking) return;
    const confirmText = action === "Approved" 
      ? "Are you sure you want to approve this reservation and allocate 1 bed?" 
      : "Are you sure you want to reject this reservation?";
    if (!confirm(confirmText)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/bookings/fast-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          phone,
          action,
        }),
      });

      if (res.ok) {
        setSuccessMsg(action === "Approved" ? "Reservation Approved Successfully!" : "Reservation Rejected Successfully!");
        setBooking((prev) => prev ? { ...prev, status: action } : null);
      } else {
        const data = await res.json();
        alert(data.error || "Action execution failed.");
      }
    } catch (err) {
      alert("Network timeout. Action could not be processed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Retrieving booking parameters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6 bg-pearl">
        <ShieldAlert className="w-12 h-12 text-midnight/35 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-bold text-midnight">Invalid Request</h2>
          <p className="text-xs text-midnight/60 leading-relaxed">
            {error || "Make sure you opened the complete link shared on your WhatsApp account."}
          </p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const isPending = booking.status === "Pending";
  const isApproved = booking.status === "Approved";
  const isRejected = booking.status === "Rejected";

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-midnight bg-pearl font-sans">
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Top Header Card */}
        <div className="border-b border-beige/25 pb-4 text-center space-y-2">
          <span className="text-[9px] bg-beige/35 text-midnight/80 border border-beige/30 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            WhatsApp Fast Action Portal
          </span>
          <h2 className="text-xl font-sans font-bold text-midnight mt-2">{booking.pgName}</h2>
          <p className="text-xs text-midnight/60">{booking.sharingType} Sharing Accommodation</p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-cream/40 border border-beige/35 text-midnight text-xs font-bold p-3.5 rounded-xl text-center">
            {successMsg}
          </div>
        )}

        {/* Booking Info Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs bg-beige/5 p-4 rounded-xl border border-beige/35 leading-relaxed">
            <div>
              <span className="text-midnight/50 block text-[9px] font-bold uppercase tracking-wider">Guest Student</span>
              <p className="font-bold text-midnight text-sm mt-0.5">{booking.studentName}</p>
            </div>
            <div>
              <span className="text-midnight/50 block text-[9px] font-bold uppercase tracking-wider">Contact Number</span>
              <p className="font-bold text-midnight mt-0.5">{booking.studentPhone}</p>
            </div>
            <div className="border-t border-beige/20 pt-2 mt-1">
              <span className="text-midnight/50 block text-[9px] font-bold uppercase tracking-wider">Check-in Date</span>
              <p className="font-bold text-midnight mt-0.5">{new Date(booking.checkInDate).toLocaleDateString()}</p>
            </div>
            <div className="border-t border-beige/20 pt-2 mt-1">
              <span className="text-midnight/50 block text-[9px] font-bold uppercase tracking-wider">Escrow Advance</span>
              <p className="font-bold text-midnight mt-0.5">₹{booking.amountPaid}</p>
            </div>
            <div className="col-span-2 border-t border-beige/20 pt-2 mt-1">
              <span className="text-midnight/50 block text-[9px] font-bold uppercase tracking-wider">Reference (UTR)</span>
              <p className="font-mono font-bold text-midnight mt-0.5 select-all truncate">{booking.utr || "Verified Gateway Card"}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center bg-beige/10 border border-beige/30 p-3.5 rounded-xl text-xs">
          <span className="font-bold text-midnight/50 uppercase text-[9px] tracking-wider">Current Status:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${
              isPending
                ? "bg-white text-midnight border-beige/65 animate-pulse"
                : isApproved
                ? "bg-white text-midnight border-beige/65"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {booking.status === "Pending" ? "Awaiting Decision" : booking.status === "Approved" ? "Confirmed" : booking.status}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {isPending ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={actionLoading}
                onClick={() => handleAction("Approved")}
                className="bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-center text-xs disabled:bg-beige/35 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1"
              >
                {actionLoading ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                <span>Accept</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("Rejected")}
                className="bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold py-3.5 px-4 rounded-xl transition-colors cursor-pointer text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <div className="text-center bg-beige/10 p-4 rounded-xl border border-dashed border-beige/40">
              <p className="text-xs text-midnight/60 font-medium">
                {isApproved 
                  ? "This reservation has already been approved. The bed is allocated and the student guest is confirmed."
                  : "This reservation request has been rejected."}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-[10px] text-midnight/40 leading-relaxed font-sans">
        CampusNest Operations • Secure Escrow Platform Link
      </p>
    </div>
  );
}

export default function FastApprovePage() {
  return (
    <div className="min-h-screen bg-pearl py-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl">
          <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
          <p className="text-xs text-midnight/60 font-semibold tracking-wide">Initializing fast-approve portal...</p>
        </div>
      }>
        <FastApproveContent />
      </Suspense>
    </div>
  );
}
