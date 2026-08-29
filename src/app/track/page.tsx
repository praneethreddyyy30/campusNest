"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, ArrowRight, ShieldAlert } from "lucide-react";

export default function TrackBookingLookup() {
  const [phone, setPhone] = useState("");
  const [refCode, setRefCode] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = sessionStorage.getItem("campusnest_student_phone") || "";
      const savedRef = sessionStorage.getItem("campusnest_booking_id") || "";
      if (savedPhone) setPhone(savedPhone);
      if (savedRef) setRefCode(savedRef);
    }
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults([]);
    setLoading(true);

    const trimmedPhone = phone.trim();
    let trimmedRef = refCode.trim().toLowerCase();
    
    if (trimmedRef.startsWith("cpg-")) {
      trimmedRef = trimmedRef.substring(4);
    } else if (trimmedRef.startsWith("cn-")) {
      trimmedRef = trimmedRef.substring(3);
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
            if (typeof window !== "undefined") {
              sessionStorage.setItem("campusnest_student_phone", data[0].studentPhone);
              sessionStorage.setItem("campusnest_booking_id", `CN-${data[0].id.slice(0, 8).toUpperCase()}`);
            }
            router.push(`/bookings/${data[0].id}?phone=${encodeURIComponent(data[0].studentPhone)}`);
          } else {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("campusnest_student_phone", trimmedPhone);
            }
            setResults(data);
          }
        } else {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("campusnest_student_phone", data.studentPhone);
            sessionStorage.setItem("campusnest_booking_id", `CN-${data.id.slice(0, 8).toUpperCase()}`);
          }
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
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center min-h-[78vh] space-y-8 bg-pearl font-sans">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-sans font-bold text-midnight tracking-tight">Track Your Booking</h1>
        <p className="text-xs sm:text-sm text-midnight/60 max-w-sm mx-auto leading-relaxed">
          Enter either of the details below to look up your booking progress, check-in status, and contact info.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
              Registered Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-beige/25"></div>
            <span className="flex-shrink mx-3 text-midnight/35 text-[9px] font-extrabold tracking-wider uppercase">OR</span>
            <div className="flex-grow border-t border-beige/25"></div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
              Booking Reference Code
            </label>
            <input
              type="text"
              placeholder="e.g. CN-3AF90D1C"
              className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-mono uppercase"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-6 transition-all shadow-xs cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-3.5 h-3.5" />
                <span>Searching Records...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Track Booking</span>
              </>
            )}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="bg-white border border-beige/40 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-xs text-midnight uppercase tracking-wider border-b border-beige/25 pb-2">
            Multiple Reservations Found ({results.length}):
          </h4>
          <div className="space-y-3">
            {results.map((b) => (
              <div key={b.id} className="border border-beige/35 p-4 rounded-xl flex justify-between items-center text-xs bg-beige/5">
                <div className="space-y-1">
                  <p className="font-bold text-midnight leading-tight">{b.room?.pg?.name || "Sai Chaitanya PG"}</p>
                  <p className="text-midnight/55 text-[10px] font-sans">
                    {b.room?.sharingType} Sharing • Check-in: {new Date(b.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/bookings/${b.id}?phone=${encodeURIComponent(b.studentPhone)}`}
                  className="bg-midnight hover:bg-midnight-light text-pearl font-bold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <span>Track</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-midnight/40 leading-relaxed font-sans">
        Lost your reference code? Enter your registered phone number above to pull up active logs.
      </div>
    </div>
  );
}
