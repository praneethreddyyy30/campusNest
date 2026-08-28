"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackBookingLookup() {
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults([]);
    setLoading(true);

    const trimmedPhone = phone.trim();
    let trimmedRef = refCode.trim().toLowerCase();
    if (trimmedRef.startsWith("cpg-")) {
      trimmedRef = trimmedRef.substring(4);
    }

    if (!trimmedPhone && !trimmedRef) {
      setError("Please fill in either your Phone Number or your Booking Reference Code.");
      setLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (trimmedPhone) queryParams.set("phone", trimmedPhone);
      if (trimmedRef) queryParams.set("bookingId", trimmedRef);

      const res = await fetch(`/api/bookings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        
        if (Array.isArray(data)) {
          if (data.length === 0) {
            setError("No bookings found matching that phone number.");
          } else if (data.length === 1) {
            // Only one booking found, redirect directly!
            router.push(`/bookings/${data[0].id}?phone=${encodeURIComponent(data[0].studentPhone)}`);
          } else {
            // Multiple bookings, let the user select
            setResults(data);
          }
        } else {
          // Single booking object returned, redirect directly!
          router.push(`/bookings/${data.id}?phone=${encodeURIComponent(data.studentPhone)}`);
        }
      } else {
        const data = await res.json();
        setError(data.error || "No reservation found with these credentials.");
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
          Enter either of the details below to look up your booking progress and contact info.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold p-3 rounded-md">
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
              placeholder="e.g. 9876543210"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-extrabold uppercase">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Booking Reference Code
            </label>
            <input
              type="text"
              placeholder="e.g. CPG-3AF90D1C"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono uppercase"
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

      {results.length > 0 && (
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">
            Multiple Reservations Found ({results.length}):
          </h4>
          <div className="space-y-2">
            {results.map((b) => (
              <div key={b.id} className="border p-3 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-800">{b.room?.pg?.name || "SV Chaitanya PG"}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">
                    {b.room?.sharingType} Sharing • Check-in: {new Date(b.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/bookings/${b.id}?phone=${encodeURIComponent(b.studentPhone)}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded text-[10px]"
                >
                  Track
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400">
        Lost your reference code? Enter your registered phone number above to find it.
      </div>
    </div>
  );
}
