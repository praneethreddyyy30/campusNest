"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Booking {
  id: string;
  studentName: string;
  studentPhone: string;
  amountPaid: number;
  checkInDate: string;
  room: {
    sharingType: string;
    priceMonthly: number;
    pg: {
      name: string;
      address: string;
    };
  };
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId") || "";
  const phone = searchParams.get("phone") || "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi_app"); // "upi_app" | "qr" | "netbanking"
  const [paying, setPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0); // 0: Idle, 1: Loading, 2: Success

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking credentials.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        // Fetch booking using public tracking lookup parameters
        // Try searching by phone parameter if provided, otherwise fetch details
        const url = `/api/bookings?bookingId=${bookingId}&phone=${encodeURIComponent(phone)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
        } else {
          setError("Failed to retrieve booking information. Please make sure the link is correct.");
        }
      } catch (err) {
        setError("Error loading payment transaction.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, phone]);

  const handleMockPayment = async () => {
    setPaying(true);
    setPaymentStep(1); // Step 1: Processing

    // Generate mock secure transaction reference ID
    const randomTxnId = "TXN_NEST_" + Math.floor(100000000000 + Math.random() * 900000000000);

    // Simulate 2-second gateway processing and network delay
    setTimeout(async () => {
      try {
        const res = await fetch("/api/bookings/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            transactionId: randomTxnId,
          }),
        });

        if (res.ok) {
          setPaymentStep(2); // Success!
          setTimeout(() => {
            // Redirect back to booking tracking page on success
            router.push(`/bookings/${bookingId}?phone=${encodeURIComponent(booking?.studentPhone || phone)}&paid=true`);
          }, 1500);
        } else {
          const data = await res.json();
          setError(data.error || "Payment verification failed. Please try again.");
          setPaymentStep(0);
          setPaying(false);
        }
      } catch (err) {
        setError("Payment connection timeout. Please check your internet connection.");
        setPaymentStep(0);
        setPaying(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-gray-50 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 text-sm font-semibold">Loading secure gateway...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white border border-red-200 rounded-xl text-center shadow-md space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto font-black text-xl">✕</div>
        <h2 className="text-xl font-bold text-gray-800">Gateway Error</h2>
        <p className="text-gray-500 text-sm">{error || "Could not retrieve booking transaction."}</p>
        <Link href="/" className="inline-block bg-indigo-600 text-white font-bold px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm">
          Go back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      {/* Simulator Banner */}
      <div className="bg-amber-500 text-white text-xs font-bold py-2 px-4 rounded-t-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <span>Secure Payment Gateway Sandbox (Simulated Razorpay / PhonePe)</span>
      </div>

      <div className="bg-white border-x border-b rounded-b-xl shadow-md overflow-hidden relative">
        {/* Processing/Success Overlay */}
        {paymentStep > 0 && (
          <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center space-y-4 p-6 text-center">
            {paymentStep === 1 ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
                <h3 className="text-xl font-bold text-gray-900">Verifying Transaction...</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Connecting to bank secure nodes. Please do not close this window or hit back.
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-inner animate-bounce">✓</div>
                <h3 className="text-xl font-black text-green-700">Payment Successful!</h3>
                <p className="text-gray-500 text-sm">
                  Allocating your bed in {booking.room.pg.name}. Redirecting back to your Nest...
                </p>
              </>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <span className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider block">Checkout</span>
              <h2 className="text-xl font-black text-gray-900">CampusNest Gateway</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block font-semibold">Amount to Pay</span>
              <span className="text-2xl font-black text-indigo-600">₹{booking.amountPaid}</span>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-sm text-gray-700">Booking Summary</h4>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-gray-400">Hostel Name:</span>
                <p className="font-bold text-gray-700">{booking.room.pg.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Room Category:</span>
                <p className="font-bold text-gray-700">{booking.room.sharingType} Sharing</p>
              </div>
              <div>
                <span className="text-gray-400">Student Guest:</span>
                <p className="font-bold text-gray-700">{booking.studentName} ({booking.studentPhone})</p>
              </div>
              <div>
                <span className="text-gray-400">Check-in Date:</span>
                <p className="font-bold text-gray-700">{new Date(booking.checkInDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods Tabs */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("upi_app")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "upi_app" ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                UPI Apps
              </button>
              <button
                onClick={() => setPaymentMethod("qr")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "qr" ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                Scan QR Code
              </button>
              <button
                onClick={() => setPaymentMethod("cards")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "cards" ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                Credit / Debit Card
              </button>
            </div>
          </div>

          {/* Method Content Panel */}
          <div className="border rounded-lg p-5 min-h-[140px] flex flex-col justify-center">
            {paymentMethod === "upi_app" && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-gray-500 font-medium">Click on any UPI application to simulate mobile payment:</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleMockPayment}
                    className="flex flex-col items-center justify-center p-2 border rounded-lg hover:border-indigo-300 w-20 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-lg">📱</span>
                    <span className="text-[10px] font-bold text-gray-700 mt-1">PhonePe</span>
                  </button>
                  <button
                    onClick={handleMockPayment}
                    className="flex flex-col items-center justify-center p-2 border rounded-lg hover:border-indigo-300 w-20 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-lg">🤖</span>
                    <span className="text-[10px] font-bold text-gray-700 mt-1">Google Pay</span>
                  </button>
                  <button
                    onClick={handleMockPayment}
                    className="flex flex-col items-center justify-center p-2 border rounded-lg hover:border-indigo-300 w-20 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-lg">👛</span>
                    <span className="text-[10px] font-bold text-gray-700 mt-1">Paytm</span>
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "qr" && (
              <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                {/* Simulating QR code with a pre-filled UPI string */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                    `upi://pay?pa=saiprasad@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`
                  )}`}
                  alt="Dynamic checkout QR"
                  className="w-32 h-32 border p-1 rounded bg-white shadow-inner"
                />
                <div className="space-y-2 text-center md:text-left max-w-xs">
                  <h4 className="font-extrabold text-sm text-gray-800">Scan & Simulate Success</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    This QR simulates the ₹2,200 escrow reservation payment. Click the trigger button below to mock scanning & successful completion of payment on your phone.
                  </p>
                  <button
                    onClick={handleMockPayment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] py-1.5 px-3 rounded shadow cursor-pointer transition-colors"
                  >
                    Simulate QR Scan Success
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "cards" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 block font-semibold text-center mb-1">Enter Card Details (Demo mode accepts dummy digits)</p>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Card Number"
                    maxLength={16}
                    defaultValue="4321987654320987"
                    className="col-span-3 border bg-gray-50 p-2 rounded text-xs text-gray-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    defaultValue="12/29"
                    className="border bg-gray-50 p-2 rounded text-xs text-gray-900 focus:outline-none text-center"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength={3}
                    defaultValue="999"
                    className="border bg-gray-50 p-2 rounded text-xs text-gray-900 focus:outline-none text-center"
                  />
                  <button
                    onClick={handleMockPayment}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded transition-all cursor-pointer shadow-sm text-center"
                  >
                    Pay ₹{booking.amountPaid}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer security labels */}
          <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-4">
            <span className="flex items-center gap-1">
              🔒 128-bit SSL Secure encryption
            </span>
            <span>Powered by CampusNest Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-gray-50 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        <p className="text-gray-600 text-sm font-semibold">Loading secure gateway...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
