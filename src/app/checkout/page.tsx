"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  Loader2, 
  Lock, 
  Smartphone, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  CheckCircle,
  HelpCircle 
} from "lucide-react";

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
  const [paymentMethod, setPaymentMethod] = useState("qr"); // Default to QR Code
  const [paying, setPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0); // 0: Idle, 1: Loading, 2: Success
  const [utrInput, setUtrInput] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking credentials.");
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
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

  const handleMockPayment = async (customTxnId?: string) => {
    setPaying(true);
    setPaymentStep(1); // Processing

    const finalTxnId = customTxnId || ("TXN_NEST_" + Math.floor(100000000000 + Math.random() * 900000000000));

    setTimeout(async () => {
      try {
        const res = await fetch("/api/bookings/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            transactionId: finalTxnId,
          }),
        });

        if (res.ok) {
          setPaymentStep(2); // Success!
          if (typeof window !== "undefined") {
            sessionStorage.setItem("campusnest_student_phone", booking?.studentPhone || phone);
            sessionStorage.setItem("campusnest_booking_id", `CN-${bookingId.slice(0, 8).toUpperCase()}`);
          }
          setTimeout(() => {
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading secure gateway...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-beige/40 rounded-2xl text-center shadow-sm space-y-6">
        <div className="w-12 h-12 rounded-full bg-beige/35 flex items-center justify-center mx-auto text-midnight">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-sans font-bold text-midnight">Gateway Error</h2>
          <p className="text-xs sm:text-sm text-midnight/60 leading-relaxed">{error || "Could not retrieve booking transaction."}</p>
        </div>
        <Link href="/" className="inline-block bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer">
          Go back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-12 px-4">
      {/* Sandbox Banner */}
      <div className="bg-midnight border border-midnight-light text-pearl text-[10px] font-bold uppercase tracking-wider py-3 px-4 rounded-t-2xl text-center flex items-center justify-center gap-1.5 shadow-sm">
        <Lock className="w-3.5 h-3.5 text-pearl" />
        <span>Escrow Reservation Sandbox (Simulated Payment Checkout)</span>
      </div>

      <div className="bg-white border-x border-b border-beige/45 rounded-b-2xl shadow-sm overflow-hidden relative">
        {/* Processing/Success Overlay */}
        {paymentStep > 0 && (
          <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center space-y-4 p-6 text-center">
            {paymentStep === 1 ? (
              <>
                <Loader2 className="animate-spin w-12 h-12 text-midnight/80" />
                <h3 className="text-lg font-bold text-midnight font-sans">Verifying Transaction...</h3>
                <p className="text-xs text-midnight/60 max-w-xs leading-relaxed">
                  Connecting to bank secure nodes. Please do not close this window or hit back.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-midnight animate-bounce" />
                <h3 className="text-xl font-sans font-bold text-midnight">Payment Successful</h3>
                <p className="text-xs text-midnight/60">
                  Allocating your bed in {booking.room.pg.name}. Redirecting back to dashboard...
                </p>
              </>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-beige/25 pb-4">
            <div>
              <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">Checkout</span>
              <h2 className="text-lg font-bold text-midnight font-sans">CampusNest Gateway</h2>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-midnight/50 uppercase font-bold tracking-wider block">Escrow amount</span>
              <span className="text-xl font-black text-midnight">₹{booking.amountPaid}</span>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-beige/10 border border-beige/40 rounded-xl p-5 space-y-3 font-sans">
            <h4 className="font-bold text-xs text-midnight uppercase tracking-wider">Booking Summary</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <div>
                <span className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wide">Hostel/PG</span>
                <p className="font-bold text-midnight leading-tight">{booking.room.pg.name}</p>
              </div>
              <div>
                <span className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wide">Category</span>
                <p className="font-bold text-midnight leading-tight">{booking.room.sharingType} Sharing</p>
              </div>
              <div>
                <span className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wide">Student Guest</span>
                <p className="font-bold text-midnight leading-tight">{booking.studentName}</p>
              </div>
              <div>
                <span className="text-midnight/50 block text-[10px] font-bold uppercase tracking-wide">Check-in Date</span>
                <p className="font-bold text-midnight leading-tight">{new Date(booking.checkInDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 font-sans">
            <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("upi_app")}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMethod === "upi_app" 
                    ? "border-midnight bg-midnight text-pearl" 
                    : "border-beige/40 bg-white text-midnight hover:bg-beige/10"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI App</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod("qr")}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMethod === "qr" 
                    ? "border-midnight bg-midnight text-pearl" 
                    : "border-beige/40 bg-white text-midnight hover:bg-beige/10"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod("cards")}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentMethod === "cards" 
                    ? "border-midnight bg-midnight text-pearl" 
                    : "border-beige/40 bg-white text-midnight hover:bg-beige/10"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>
          </div>          {/* Payment Details Panel */}
          <div className="border border-beige/40 rounded-xl p-5 min-h-[140px] flex flex-col justify-center bg-beige/5 font-sans">
            {paymentMethod === "qr" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      `upi://pay?pa=93913333699@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`
                    )}`}
                    alt="UPI Escrow QR Code"
                    className="w-36 h-36 border border-beige/35 p-1 rounded-2xl bg-white shadow-xs"
                  />
                  <div className="space-y-2 text-center sm:text-left max-w-xs">
                    <h4 className="font-bold text-xs text-midnight uppercase tracking-wider">UPI Qr Checkout (Escrow Deposit)</h4>
                    <p className="text-[11px] text-midnight/60 leading-relaxed">
                      Scan this QR code using any UPI App (GPay, PhonePe, Paytm) to deposit the <strong>₹{booking.amountPaid}</strong> escrow token directly to <strong>93913333699@okaxis</strong>.
                    </p>
                  </div>
                </div>

                <div className="border-t border-beige/25 pt-4 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
                      Enter 12-Digit UPI Ref No. / UTR Reference
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 348912048592"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-bold tracking-widest font-mono text-center placeholder:tracking-normal placeholder:font-sans"
                    />
                    <p className="text-[9px] text-midnight/50 leading-relaxed mt-1">
                      ⚠️ <strong>Crucial:</strong> Enter the exact 12-digit Ref / UTR number from your successful payment receipt. The landlord will check their bank statement matching this UTR before approving your bed check-in. Entering a fake code will result in immediate booking cancellation.
                    </p>
                  </div>

                  <button
                    disabled={utrInput.length !== 12 || paying}
                    onClick={() => handleMockPayment(utrInput)}
                    className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all shadow-xs text-center uppercase tracking-wider cursor-pointer ${
                      utrInput.length === 12
                        ? "bg-midnight hover:bg-midnight-light text-pearl"
                        : "bg-beige/40 text-midnight/35 border border-beige/20 cursor-not-allowed"
                    }`}
                  >
                    {paying ? "Submitting Request..." : "Verify & Complete Booking"}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "upi_app" && (
              <div className="space-y-5 text-center">
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-midnight uppercase tracking-wider font-sans">Direct UPI Intent Link</h4>
                  <p className="text-[11px] text-midnight/60 leading-relaxed max-w-sm mx-auto">
                    Choose your UPI app to complete the dynamic payment of <strong>₹{booking.amountPaid}</strong> directly.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                    <a
                      href={`phonepe://pay?pa=93913333699@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`}
                      className="flex flex-col items-center justify-center p-3 border border-beige/40 rounded-xl hover:border-midnight/40 hover:bg-white bg-white transition-all shadow-xs"
                    >
                      <Smartphone className="w-5 h-5 text-midnight/80" />
                      <span className="text-[10px] font-bold text-midnight mt-1.5 font-sans">PhonePe</span>
                    </a>
                    <a
                      href={`gpay://upi/pay?pa=93913333699@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`}
                      className="flex flex-col items-center justify-center p-3 border border-beige/40 rounded-xl hover:border-midnight/40 hover:bg-white bg-white transition-all shadow-xs"
                    >
                      <Smartphone className="w-5 h-5 text-midnight/80" />
                      <span className="text-[10px] font-bold text-midnight mt-1.5 font-sans">Google Pay</span>
                    </a>
                    <a
                      href={`paytmmp://cash_wallet?pa=93913333699@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`}
                      className="flex flex-col items-center justify-center p-3 border border-beige/40 rounded-xl hover:border-midnight/40 hover:bg-white bg-white transition-all shadow-xs"
                    >
                      <Smartphone className="w-5 h-5 text-midnight/80" />
                      <span className="text-[10px] font-bold text-midnight mt-1.5 font-sans">Paytm</span>
                    </a>
                    <a
                      href={`upi://pay?pa=93913333699@okaxis&pn=CampusNest&am=${booking.amountPaid}&cu=INR`}
                      className="flex flex-col items-center justify-center p-3 border border-beige/40 rounded-xl hover:border-midnight/40 hover:bg-white bg-white transition-all shadow-xs"
                    >
                      <Smartphone className="w-5 h-5 text-midnight/80" />
                      <span className="text-[10px] font-bold text-midnight mt-1.5 font-sans">Other UPI</span>
                    </a>
                  </div>
                </div>

                <div className="border-t border-beige/25 pt-4 space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
                      Enter 12-Digit UPI Ref No. / UTR Reference
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 348912048592"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-bold tracking-widest font-mono text-center placeholder:tracking-normal placeholder:font-sans"
                    />
                  </div>

                  <button
                    disabled={utrInput.length !== 12 || paying}
                    onClick={() => handleMockPayment(utrInput)}
                    className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all shadow-xs text-center uppercase tracking-wider cursor-pointer ${
                      utrInput.length === 12
                        ? "bg-midnight hover:bg-midnight-light text-pearl"
                        : "bg-beige/40 text-midnight/35 border border-beige/20 cursor-not-allowed"
                    }`}
                  >
                    {paying ? "Submitting Request..." : "Verify & Complete Booking"}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === "cards" && (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto text-yellow-600 border border-yellow-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h4 className="font-bold text-xs text-midnight uppercase tracking-wider">Card Payments Disabled</h4>
                  <p className="text-[11px] text-midnight/60 leading-relaxed">
                    To prevent credit card payment bypass scams, credit and debit card options are disabled for this campus outskirts registry. All bookings must go via secure verified UPI transfers with UTR submission.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Secure indicator */}
          <div className="flex justify-between items-center text-[10px] text-midnight/50 border-t border-beige/25 pt-4 font-sans">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>128-bit SSL Secure checkout</span>
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
    <div className="min-h-screen bg-pearl py-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl">
          <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
          <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading secure gateway...</p>
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
