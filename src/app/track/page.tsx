"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackBookingLookup() {
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Standardize Ref Code (e.g. CPG-3AF9 -> 3af9...)
    let bookingId = refCode.trim().toLowerCase();
    if (bookingId.startsWith("cpg-")) {
      bookingId = bookingId.substring(4);
    }

    if (!bookingId || !phone) {
      setError("Please fill in both fields.");
      setLoading(false);
      return;
    }

    try {
      // Query database API to check if booking exists
      const res = await fetch(`/api/bookings?bookingId=${bookingId}&phone=${encodeURIComponent(phone.trim())}`);
      if (res.ok) {
        const booking = await res.json();
        // Redirect to status page
        router.push(`/bookings/${booking.id}?phone=${encodeURIComponent(phone.trim())}`);
      } else {
        const data = await res.json();
        setError(data.error || "No booking found with this Phone & Reference ID.");
      }
    } catch (err) {
      setError("Failed to reach server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col justify-center min-h-[70vh] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Track Your Booking</h1>
        <p className="text-sm text-gray-500">
          Enter the details provided on your booking receipt to view approval status and contact info.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Registered Phone Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Booking Reference Code
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CPG-3AF90D1C"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono uppercase"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md text-sm mt-6 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? "Searching..." : "Track Booking"}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-gray-400">
        Lost your reference code? Check your browser history or contact our support team.
      </div>
    </div>
  );
}
