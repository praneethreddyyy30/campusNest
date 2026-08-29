"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Check, 
  MessageSquare, 
  Calendar, 
  Phone, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ShieldAlert, 
  Copy, 
  Smartphone, 
  Clock, 
  Tv, 
  Coffee, 
  Eye, 
  Info,
  Loader2
} from "lucide-react";

interface Room {
  id: string;
  sharingType: string;
  priceMonthly: number;
  genderPreference: string;
  availableBeds: number;
  imageUrl: string | null;
  images: string | null;
}

interface College {
  name: string;
  city: string;
}

interface FAQ {
  id: string;
  studentName: string;
  question: string;
  answer: string;
  createdAt: string;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface PG {
  id: string;
  name: string;
  address: string;
  description: string;
  distanceKm: number;
  amenities: string;
  isVerified: boolean;
  imageUrl: string | null;
  images: string | null;
  reservationFee: number;
  rooms: Room[];
  college: College;
  queries: FAQ[];
  reviews: Review[];
}

export default function PGDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [pg, setPg] = useState<PG | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Ask Question State
  const [questionName, setQuestionName] = useState("");
  const [questionPhone, setQuestionPhone] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  // Write Review State
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Photo Gallery State
  const [activePgImageIdx, setActivePgImageIdx] = useState(0);
  const [activeRoomImages, setActiveRoomImages] = useState<string[] | null>(null);
  const [activeRoomImageIdx, setActiveRoomImageIdx] = useState(0);

  // UPI Payment Config for Escrow (₹2200)
  const upiId = "saiprasad@okaxis";
  const upiName = "CampusNest Escrow";
  const bookingAmount = 2200;
  const payNote = selectedRoom && pg ? `CN-${pg.name.substring(0, 10).replace(/\s+/g, "")}-${selectedRoom.sharingType}` : "";
  const upiPayload = selectedRoom ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${bookingAmount}&cu=INR&tn=${payNote}` : "";
  const qrCodeUrl = selectedRoom ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}` : "";

  const fetchPgDetails = async () => {
    try {
      const res = await fetch(`/api/pgs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPg(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPgDetails();
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setBookingLoading(true);
    setBookingError("");

    const phoneDigits = studentPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      setBookingError("Please enter a valid 10-digit Indian phone number (starting with 6-9, no spaces or special symbols).");
      setBookingLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          studentName,
          studentPhone,
          checkInDate,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("campusnest_student_phone", phoneDigits);
          sessionStorage.setItem("campusnest_booking_id", `CN-${data.bookingId.slice(0, 8).toUpperCase()}`);
        }
        router.push(`/checkout?bookingId=${data.bookingId}&phone=${encodeURIComponent(phoneDigits)}`);
      } else {
        setBookingError(data.error || "Failed to make reservation request.");
      }
    } catch (err) {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionLoading(true);
    setQuestionSuccess(false);

    const phoneDigits = questionPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      alert("Please enter a valid 10-digit Indian phone number (starting with 6-9, no spaces or special symbols).");
      setQuestionLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgId: id,
          studentName: questionName,
          studentPhone: questionPhone,
          question: questionText,
        }),
      });

      if (res.ok) {
        setQuestionSuccess(true);
        setQuestionText("");
        setQuestionName("");
        setQuestionPhone("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewSuccess(false);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgId: id,
          studentName: reviewName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReviewSuccess(true);
        setReviewComment("");
        setReviewName("");
        setReviewRating(5);
        fetchPgDetails();
      } else {
        setReviewError(data.error || "Failed to post review.");
      }
    } catch (err) {
      setReviewError("Failed to submit review. Try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-pearl min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
        <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading PG details...</p>
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6 bg-pearl">
        <ShieldAlert className="w-12 h-12 text-midnight/35 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-2xl font-sans font-bold text-midnight">PG Accommodation Not Found</h2>
          <p className="text-xs text-midnight/60 max-w-sm mx-auto leading-relaxed">
            The property listing could not be found. It may have been unlisted or removed by the platform administrator.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center justify-center bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer">
          Go Home
        </Link>
      </div>
    );
  }

  const avgRating = pg.reviews && pg.reviews.length > 0
    ? (pg.reviews.reduce((sum, r) => sum + r.rating, 0) / pg.reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-pearl py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      
      {/* Back to Results */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-xs font-bold text-midnight hover:opacity-80 cursor-pointer gap-1.5 transition-opacity"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to results</span>
      </button>

      {/* 1. Main Details Grid */}
      <div className="bg-white border border-beige/40 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8">
        
        {/* Photo Gallery Column */}
        <div className="md:col-span-1 space-y-3 shrink-0">
          {(() => {
            const pgImages = pg.images
              ? pg.images.split(",")
              : [pg.imageUrl].filter(Boolean) as string[];

            const labels = ["Hostel View", "Washroom", "Mess/Dining", "Study Desk"];
            // Fallback default image array if empty
            const defaultImages = ["/exterior.jpg", "/room-1.jpg", "/room-2.jpg"];
            const displayImages = pgImages.length > 0 ? pgImages : defaultImages;

            return (
              <>
                <div className="w-full h-64 bg-beige/5 border border-beige/35 rounded-xl overflow-hidden shrink-0 relative group shadow-xs">
                  <img
                    src={displayImages[activePgImageIdx]}
                    alt={`${pg.name} view ${activePgImageIdx + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  
                  {/* Left Arrow */}
                  {displayImages.length > 1 && (
                    <button
                      onClick={() => setActivePgImageIdx((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-midnight/70 hover:bg-midnight text-pearl rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow flex items-center justify-center"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {displayImages.length > 1 && (
                    <button
                      onClick={() => setActivePgImageIdx((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-midnight/70 hover:bg-midnight text-pearl rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow flex items-center justify-center"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dots Indicator */}
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-midnight/40 px-2.5 py-1 rounded-full">
                      {displayImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePgImageIdx(idx)}
                          className={`h-1 w-1 rounded-full transition-all ${
                            activePgImageIdx === idx ? "bg-pearl scale-125" : "bg-pearl/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails grid */}
                {displayImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {displayImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePgImageIdx(idx)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          activePgImageIdx === idx 
                            ? "border-rust ring-2 ring-rust/5" 
                            : "border-beige/40 hover:border-rust/40"
                        }`}
                      >
                        <img
                          src={img}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-midnight/5 hover:bg-transparent transition-colors" />
                        <span className="absolute bottom-0 inset-x-0 text-[7px] leading-tight font-bold text-pearl text-center bg-midnight/70 py-0.5 truncate uppercase tracking-wider">
                          {labels[idx] || `View ${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Text Details Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-sans font-bold text-midnight tracking-tight leading-tight">{pg.name}</h1>
              {pg.isVerified && (
                <span className="bg-sage/10 border border-sage/20 text-sage text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider font-sans">
                  Verified
                </span>
              )}
              {avgRating && (
                <span className="bg-gold/[0.06] border border-gold/25 text-gold text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1 font-sans">
                  <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                  <span>{avgRating} ({pg.reviews.length} {pg.reviews.length === 1 ? "Review" : "Reviews"})</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-sage font-bold bg-sage/5 border border-sage/15 px-3 py-1.5 rounded-lg w-fit">
              <MapPin className="w-3.5 h-3.5 text-sage" />
              <span>
                {pg.distanceKm} km from {pg.college.name} Gate
              </span>
            </div>
          </div>

          <p className="text-midnight/80 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
            {pg.description}
          </p>

          <div className="space-y-3 border-t border-beige/25 pt-6">
            <h3 className="font-bold text-midnight text-xs uppercase tracking-wider">Amenities Included:</h3>
            <div className="flex flex-wrap gap-2">
              {pg.amenities.split(",").map((amenity, idx) => {
                const trimText = amenity.trim();
                const lower = trimText.toLowerCase();
                let badgeClass = "bg-sage/5 text-sage border border-sage/15";
                if (lower.includes("wifi") || lower.includes("internet")) badgeClass = "bg-indigo-50/50 text-indigo-700 border border-indigo-100/50";
                else if (lower.includes("ac") || lower.includes("cooler")) badgeClass = "bg-teal-50/50 text-teal-700 border border-teal-100/50";
                else if (lower.includes("meals") || lower.includes("food") || lower.includes("mess")) badgeClass = "bg-rust/5 text-rust border border-rust/15";
                else if (lower.includes("gym") || lower.includes("fitness")) badgeClass = "bg-rose-50/50 text-rose-700 border border-rose-100/50";

                return (
                  <span
                    key={idx}
                    className={`font-bold text-xs px-3.5 py-1.5 rounded-lg ${badgeClass}`}
                  >
                    ✓ {trimText}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 2. Room Vacancies & Escrow Lock Reservation */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-beige/25 pb-4">
          <h2 className="text-xl font-sans font-bold text-midnight">Available Room Options</h2>
          <p className="text-xs text-midnight/60 font-sans mt-0.5">Select a category below to initiate an escrow reservation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pg.rooms.map((room) => {
            const displayRoomImages = room.images ? room.images.split(",") : [room.imageUrl].filter(Boolean) as string[];
            const displayRoomCover = room.imageUrl || "/room-1.jpg";

            return (
              <div
                key={room.id}
                className="border border-beige/40 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-midnight/40 transition-colors bg-beige/5"
              >
                <div 
                  onClick={() => {
                    setActiveRoomImages(displayRoomImages.length > 0 ? displayRoomImages : ["/room-1.jpg", "/room-2.jpg"]);
                    setActiveRoomImageIdx(0);
                  }}
                  className="w-full h-48 bg-beige/10 relative overflow-hidden shrink-0 border-b border-beige/35 cursor-pointer group"
                >
                  <img
                    src={displayRoomCover}
                    alt={`${room.sharingType} sharing room`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-midnight/25 group-hover:bg-midnight/40 transition-colors flex items-center justify-center">
                    <span className="bg-pearl text-midnight text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Gallery</span>
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-midnight text-lg">
                          {room.sharingType} Sharing
                        </h3>
                        {(() => {
                          const gender = room.genderPreference.toLowerCase();
                          const badgeClass = gender.includes("girl") 
                            ? "bg-rose-50/70 text-rose-700 border-rose-200/60" 
                            : gender.includes("boy") 
                              ? "bg-blue-50/70 text-blue-700 border-blue-200/60" 
                              : "bg-beige/35 text-midnight/80 border-beige/30";
                          return (
                            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full mt-1 border ${badgeClass}`}>
                              {room.genderPreference} Preference
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-midnight/55 uppercase font-bold tracking-wider block">Rent</span>
                        <p className="text-lg font-bold text-rust">
                          ₹{room.priceMonthly}
                          <span className="text-xs text-midnight/50 font-normal">/mo</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          room.availableBeds > 0 ? "bg-green-600" : "bg-red-500"
                        }`}
                      />
                      <span className="text-midnight/60 text-xs font-semibold">
                        {room.availableBeds > 0 
                          ? `${room.availableBeds} beds vacant`
                          : "Fully Booked"}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={room.availableBeds <= 0}
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowBookingModal(true);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center uppercase tracking-wider ${
                      room.availableBeds > 0
                        ? "bg-midnight hover:bg-midnight-light text-pearl shadow-xs"
                        : "bg-beige/35 text-midnight/40 cursor-not-allowed border border-beige/25"
                    }`}
                  >
                    {room.availableBeds > 0 ? `Reserve Bed (₹${pg.reservationFee + 200})` : "Unavailable"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Student FAQs & Questions Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FAQs */}
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-4 h-fit">
          <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/20 pb-3">Student FAQs</h2>
          {pg.queries.length === 0 ? (
            <p className="text-midnight/50 text-xs sm:text-sm italic font-sans py-4">
              No questions asked yet. Ask about meals, water heater, rules, or power backup.
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-beige/15 max-h-80 overflow-y-auto pr-1">
              {pg.queries.map((q) => (
                <div key={q.id} className="pt-3.5 first:pt-0 space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-midnight flex items-start gap-2">
                    <span className="text-midnight/55 uppercase text-[10px] tracking-wide pt-0.5 shrink-0 font-extrabold">Q:</span>
                    <span>{q.question}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-midnight/70 pl-6 flex items-start gap-2">
                    <span className="text-midnight/55 uppercase text-[10px] tracking-wide pt-0.5 shrink-0 font-extrabold">A:</span>
                    <span>{q.answer || "Checking with owner..."}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Ask Form */}
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/20 pb-3">Ask a Question</h2>
          <p className="text-xs text-midnight/55 leading-relaxed font-sans">
            Your question is submitted directly to our support operations. We contact the landlord, verify the information, and post the answers publicly, ensuring there is no communication bypass.
          </p>

          {questionSuccess ? (
            <div className="bg-cream/40 text-midnight p-4 rounded-xl border border-beige/35 text-xs font-bold">
              ✓ Question submitted successfully! We are checking with the owner and will post the answer here shortly.
            </div>
          ) : (
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-midnight/75 uppercase tracking-wide block">Your Name</label>
                  <input
                    type="text"
                    placeholder="Amit (Junior)"
                    required
                    className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={questionName}
                    onChange={(e) => setQuestionName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-midnight/75 uppercase tracking-wide block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    required
                    className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                    value={questionPhone}
                    onChange={(e) => setQuestionPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-midnight/75 uppercase tracking-wide block">Question</label>
                <textarea
                  placeholder="Ask about wifi speed, geyser timings, warden presence, curfew, mess meals details..."
                  required
                  rows={3}
                  className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={questionLoading}
                className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3.5 px-6 rounded-xl shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                {questionLoading ? "Submitting..." : "Submit Question"}
              </button>
            </form>
          )}
        </div>

      </div>

      {/* 4. Reviews & Write Review */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Reviews List */}
        <div className="md:col-span-2 bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/20 pb-3 font-sans">
            Reviews from Seniors
          </h2>
          {pg.reviews.length === 0 ? (
            <p className="text-midnight/50 text-xs sm:text-sm italic font-sans py-6">
              No reviews posted yet. Be the first to share your experience living here!
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-beige/15 max-h-96 overflow-y-auto pr-1">
              {pg.reviews.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 space-y-2 text-xs sm:text-sm font-sans">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-midnight">{r.studentName}</p>
                    <span className="text-gold font-bold text-[11px] tracking-wide">
                      {"★".repeat(r.rating)}
                      <span className="text-beige/90">{"☆".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  <p className="text-midnight/70 leading-relaxed italic">" {r.comment} "</p>
                  <p className="text-[10px] text-midnight/40">
                    Posted on {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review */}
        <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 space-y-4 h-fit">
          <h2 className="text-xl font-sans font-bold text-midnight border-b border-beige/20 pb-3">Write a Review</h2>
          {reviewSuccess ? (
            <div className="bg-cream/40 text-midnight p-4 rounded-xl border border-beige/35 text-xs font-bold">
              ✓ Review posted successfully! Thank you for sharing your experience.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 font-sans">
              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3 rounded-lg">
                  {reviewError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-midnight/70 uppercase tracking-wider block">Your Name</label>
                <input
                  type="text"
                  placeholder="Amit (Senior)"
                  required
                  className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-midnight/70 uppercase tracking-wider block">Rating</label>
                <select
                  className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold cursor-pointer"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                >
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                  <option value="2">★★☆☆☆ (2 Stars)</option>
                  <option value="1">★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-midnight/70 uppercase tracking-wider block">Your Comment</label>
                <textarea
                  placeholder="Provide feedback on wifi, cleanliness, mess food quality, landlord behavior, safety..."
                  required
                  rows={3}
                  className="bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight w-full focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                {reviewLoading ? "Posting..." : "Post Review"}
              </button>
            </form>
          )}
        </div>

      </div>

      {/* 5. Booking / Checkout Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-beige/40">
            <div className="flex justify-between items-center border-b border-beige/25 pb-3">
              <h2 className="font-sans font-bold text-lg text-midnight">Reserve Your Bed</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-midnight/60 hover:text-midnight cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deposit Detail */}
            <div className="bg-cream/40 border border-beige/35 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-midnight uppercase tracking-wider">
                Advance Deposit: ₹{pg.reservationFee + 200}
              </h4>
              <ul className="text-xs text-midnight/70 list-disc list-inside space-y-1.5 leading-relaxed font-sans">
                <li><span className="font-bold text-midnight">₹200:</span> Platform service commission (non-refundable)</li>
                <li><span className="font-bold text-midnight">₹{pg.reservationFee}:</span> Rent advance token (Held securely in Escrow)</li>
                <li>The ₹{pg.reservationFee} escrow is released to owner 24 hours after check-in, deducted from your first month rent.</li>
                <li>Fully refundable if owner cancels or listing is unavailable.</li>
              </ul>
            </div>

            {/* UPI Sandbox Panel */}
            <div className="bg-beige/15 border border-beige/35 rounded-xl p-5 space-y-4 text-xs font-sans">
              <h4 className="font-bold text-midnight uppercase tracking-wider text-xs border-b border-beige/20 pb-2 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-midnight/80" />
                <span>UPI Payment Sandbox</span>
              </h4>

              {/* Mobile intent redirection button */}
              <div className="space-y-1.5">
                <span className="font-bold text-midnight/55 uppercase tracking-wide block text-[9px]">Option 1: Mobil App checkout</span>
                <a
                  href={upiPayload}
                  className="inline-flex items-center justify-center gap-2 bg-midnight hover:bg-midnight-light text-pearl font-bold py-3 px-4 rounded-xl shadow-xs transition-colors text-center w-full cursor-pointer text-xs"
                >
                  <span>Open Payee Application</span>
                </a>
              </div>

              {/* QR display scanner */}
              <div className="space-y-2 flex flex-col items-center justify-center bg-white p-4 border border-beige/30 rounded-xl shadow-xs">
                <span className="font-bold text-midnight/45 uppercase tracking-wide block text-[9px] text-center w-full">Option 2: Scan QR code</span>
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code scanner"
                  className="h-32 w-32 object-contain border border-beige/20 p-1 rounded bg-white"
                />
                <span className="text-[9px] text-midnight/50 font-semibold text-center leading-normal max-w-xs">
                  Scan this code using any UPI app (GPay / PhonePe / Paytm / BHIM)
                </span>
              </div>

              {/* Manual UPI copy */}
              <div className="space-y-1.5 pt-2 border-t border-beige/20">
                <span className="font-bold text-midnight/55 uppercase tracking-wide block text-[9px]">Option 3: Pay to UPI address manually</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    className="bg-white border border-beige/30 rounded-lg p-2 text-xs font-mono text-midnight flex-grow select-all focus:outline-none"
                    value={upiId}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(upiId);
                      alert("UPI ID copied!");
                    }}
                    className="bg-beige/35 hover:bg-beige/65 border border-beige/40 text-midnight font-bold px-3 py-2 rounded-lg transition-colors text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-xs font-semibold border border-red-200">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Amit Kumar"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Student Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">Expected Check-in Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-4 transition-colors cursor-pointer uppercase tracking-wider"
              >
                {bookingLoading ? "Connecting to Gateway..." : `Proceed to Payment (₹${pg.reservationFee + 200})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Image Viewer Modal */}
      {activeRoomImages && activeRoomImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-midnight/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 border border-beige/40">
            <div className="flex justify-between items-center border-b border-beige/20 pb-3">
              <h3 className="font-sans font-bold text-midnight">
                Room Photo Gallery ({activeRoomImageIdx + 1} of {activeRoomImages.length})
              </h3>
              <button
                onClick={() => {
                  setActiveRoomImages(null);
                  setActiveRoomImageIdx(0);
                }}
                className="text-midnight/55 hover:text-midnight cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 bg-beige/10 rounded-2xl overflow-hidden relative group">
              <img
                src={activeRoomImages[activeRoomImageIdx]}
                alt={`Room photo ${activeRoomImageIdx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Left Arrow */}
              {activeRoomImages.length > 1 && (
                <button
                  onClick={() => setActiveRoomImageIdx((prev) => (prev === 0 ? activeRoomImages.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-midnight/70 hover:bg-midnight text-pearl rounded-full p-2 cursor-pointer shadow flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Right Arrow */}
              {activeRoomImages.length > 1 && (
                <button
                  onClick={() => setActiveRoomImageIdx((prev) => (prev === activeRoomImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-midnight/70 hover:bg-midnight text-pearl rounded-full p-2 cursor-pointer shadow flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Thumbnail selector */}
            {activeRoomImages.length > 1 && (
              <div className="flex gap-2 justify-center pt-2">
                {activeRoomImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRoomImageIdx(idx)}
                    className={`h-12 w-16 relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      activeRoomImageIdx === idx ? "border-midnight ring-2 ring-midnight/5" : "border-beige/40"
                    }`}
                  >
                    <img
                      src={img}
                      alt="Room thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            <div className="text-center pt-2 border-t border-beige/25">
              <button
                onClick={() => {
                  setActiveRoomImages(null);
                  setActiveRoomImageIdx(0);
                }}
                className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-xs uppercase tracking-wider"
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
