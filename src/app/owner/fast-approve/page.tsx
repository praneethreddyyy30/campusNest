"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Retrieving booking parameters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-sm font-semibold">
          {error}
        </div>
        <p className="text-xs text-gray-400">
          Make sure you opened the complete link shared on your WhatsApp account.
        </p>
      </div>
    );
  }

  if (!booking) return null;

  const isPending = booking.status === "Pending";
  const isApproved = booking.status === "Approved";
  const isRejected = booking.status === "Rejected";

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 text-gray-900">
      <div className="bg-white border rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        {/* Top Header Card */}
        <div className="border-b pb-4 text-center space-y-1">
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            WhatsApp Approval Portal
          </span>
          <h2 className="text-lg font-black text-gray-900 mt-2">{booking.pgName}</h2>
          <p className="text-xs text-gray-500">{booking.sharingType} Sharing Accommodation</p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-bold p-3 rounded-lg text-center animate-bounce">
            {successMsg}
          </div>
        )}

        {/* Booking Info Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border">
            <div>
              <span className="text-gray-400 font-medium">Guest Student:</span>
              <p className="font-extrabold text-gray-800 text-sm">{booking.studentName}</p>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Student Contact:</span>
              <p className="font-bold text-gray-700">{booking.studentPhone}</p>
            </div>
            <div className="border-t pt-2 mt-1">
              <span className="text-gray-400 font-medium">Check-in Date:</span>
              <p className="font-bold text-gray-700">{new Date(booking.checkInDate).toLocaleDateString()}</p>
            </div>
            <div className="border-t pt-2 mt-1">
              <span className="text-gray-400 font-medium">Advance Paid:</span>
              <p className="font-black text-green-700">₹{booking.amountPaid}</p>
            </div>
            <div className="col-span-2 border-t pt-2 mt-1">
              <span className="text-gray-400 font-medium">Transaction UTR Reference:</span>
              <p className="font-mono font-bold text-indigo-600 select-all truncate">{booking.utr}</p>
            </div>
          </div>
        </div>

        {/* Stepper Status Badge */}
        <div className="flex justify-between items-center bg-gray-100/50 p-3 rounded-lg text-xs">
          <span className="font-semibold text-gray-500">Current Status:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded-full border ${
              isPending
                ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                : isApproved
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {booking.status === "Pending" ? "Awaiting Decision" : booking.status === "Approved" ? "Confirmed & Booked" : booking.status}
          </span>
        </div>

        {/* Action triggers */}
        <div className="space-y-2 pt-2">
          {isPending ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={actionLoading}
                onClick={() => handleAction("Approved")}
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-colors cursor-pointer text-center text-xs disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : "✓ Accept Booking"}
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction("Rejected")}
                className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✕ Reject Booking
              </button>
            </div>
          ) : (
            <div className="text-center bg-gray-50 p-4 rounded-xl border border-dashed">
              <p className="text-xs text-gray-500 font-medium">
                {isApproved 
                  ? "This reservation has already been Approved. The bed is allocated and the student will check in soon."
                  : "This reservation has been Rejected."}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-400">
        CampusNest Operations • Secure Escrow Platform Link
      </p>
    </div>
  );
}

export default function FastApprovePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Initializing fast-approve portal...</p>
      </div>
    }>
      <FastApproveContent />
    </Suspense>
  );
}
