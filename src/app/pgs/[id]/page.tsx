"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [utr, setUtr] = useState("");
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
        // Redirect to secure mock payment gateway checkout sandbox
        router.push(`/checkout?bookingId=${data.bookingId}&phone=${encodeURIComponent(studentPhone)}`);
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
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 text-sm font-medium">Loading PG details...</p>
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">PG Accommodation not found.</h2>
        <Link href="/" className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md">
          Go Home
        </Link>
      </div>
    );
  }

  const avgRating = pg.reviews && pg.reviews.length > 0
    ? (pg.reviews.reduce((sum, r) => sum + r.rating, 0) / pg.reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to results</span>
      </button>

      {/* Main Details Section */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-8">
        {/* Photo Gallery Grid with Slider */}
        <div className="md:col-span-1 space-y-3 shrink-0">
          {(() => {
            const pgImages = pg.images
              ? pg.images.split(",")
              : [pg.imageUrl].filter(Boolean) as string[];

            const labels = ["Hostel View", "Washroom", "Mess/Dining", "Study Desk"];

            return (
              <>
                <div className="w-full h-64 bg-gray-100 border rounded-lg overflow-hidden shrink-0 relative group shadow-sm">
                  {pgImages.length > 0 ? (
                    <>
                      <img
                        src={pgImages[activePgImageIdx]}
                        alt={`${pg.name} view ${activePgImageIdx + 1}`}
                        className="w-full h-full object-cover transition-opacity duration-300"
                      />
                      
                      {/* Left Arrow */}
                      {pgImages.length > 1 && (
                        <button
                          onClick={() => setActivePgImageIdx((prev) => (prev === 0 ? pgImages.length - 1 : prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow flex items-center justify-center"
                          aria-label="Previous Image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                      )}

                      {/* Right Arrow */}
                      {pgImages.length > 1 && (
                        <button
                          onClick={() => setActivePgImageIdx((prev) => (prev === pgImages.length - 1 ? 0 : prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow flex items-center justify-center"
                          aria-label="Next Image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      )}

                      {/* Indicator Dots */}
                      {pgImages.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2.5 py-1 rounded-full">
                          {pgImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActivePgImageIdx(idx)}
                              className={`h-1.5 w-1.5 rounded-full transition-all ${
                                activePgImageIdx === idx ? "bg-white scale-125" : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-indigo-50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-16 h-16"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Thumbnails grid with clean labels */}
                {pgImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {pgImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePgImageIdx(idx)}
                        className={`relative aspect-[4/3] rounded-md overflow-hidden border cursor-pointer transition-all ${
                          activePgImageIdx === idx 
                            ? "border-indigo-600 ring-2 ring-indigo-500/20" 
                            : "border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        <img
                          src={img}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
                        <span className="absolute bottom-0 inset-x-0 text-[8px] leading-tight font-extrabold text-white text-center bg-black/60 py-0.5 truncate uppercase tracking-wide">
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

        {/* Text Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{pg.name}</h1>
            {pg.isVerified && (
              <span className="bg-green-50 text-green-700 text-xs font-extrabold px-3 py-1 rounded-full border border-green-200">
                Verified Listing
              </span>
            )}
            {avgRating && (
              <span className="bg-amber-50 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-0.5 animate-fade-in">
                ★ {avgRating} ({pg.reviews.length} {pg.reviews.length === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded w-fit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9.5a7 7 0 10-14 0c0 2.992 1.698 5.487 3.363 7.126.83.799 1.654 1.381 2.273 1.765a8.736 8.736 0 001.038.573l.018.008.006.003zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {pg.distanceKm} km from {pg.college.name} Gate
            </span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {pg.description}
          </p>

          <div className="space-y-2">
            <h3 className="font-bold text-gray-900 text-sm">Included Amenities:</h3>
            <div className="flex flex-wrap gap-2">
              {pg.amenities.split(",").map((amenity, idx) => (
                <span
                  key={idx}
                  className="bg-indigo-50/60 text-indigo-700 font-semibold text-xs px-3 py-1.5 rounded-md border border-indigo-100"
                >
                  ✓ {amenity.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Pricing and Booking section */}
      <div className="bg-white border rounded-xl shadow-sm p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-extrabold text-gray-900 border-b pb-3">Available Room Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pg.rooms.map((room) => (
            <div
              key={room.id}
              className="border border-gray-150 rounded-lg overflow-hidden flex flex-col justify-between hover:border-indigo-400 transition-colors bg-gray-50/50"
            >
              {room.imageUrl && (
                <div 
                  onClick={() => {
                    const roomImagesArr = room.images ? room.images.split(",") : [room.imageUrl].filter(Boolean) as string[];
                    setActiveRoomImages(roomImagesArr);
                    setActiveRoomImageIdx(0);
                  }}
                  className="w-full h-48 bg-gray-200 relative overflow-hidden shrink-0 border-b cursor-pointer group"
                >
                  <img
                    src={room.imageUrl}
                    alt={`${room.sharingType} sharing room`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <span className="bg-white/90 text-indigo-600 hover:bg-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>View Room Photos</span>
                    </span>
                  </div>
                </div>
              )}
              <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {room.sharingType} Sharing
                      </h3>
                      <span className="inline-block text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded mt-1">
                        {room.genderPreference} Preference
                      </span>
                    </div>
                    <p className="text-xl font-black text-indigo-600">
                      ₹{room.priceMonthly}
                      <span className="text-xs text-gray-400 font-normal font-sans"> / month</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        room.availableBeds > 0 ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-gray-600 text-xs font-semibold">
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
                  className={`w-full py-2 px-4 rounded-md font-semibold text-sm transition-colors cursor-pointer text-center ${
                    room.availableBeds > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {room.availableBeds > 0 ? "Reserve Bed (₹2200)" : "Unavailable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middleman mediated support queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FAQ list */}
        <div className="bg-white border rounded-xl shadow-sm p-6 md:p-8 space-y-4 h-fit">
          <h2 className="text-xl font-extrabold text-gray-900 border-b pb-3">Student FAQs</h2>
          {pg.queries.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              No questions asked yet. Have doubts about curfews, meals, or laundry? Ask below!
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {pg.queries.map((q) => (
                <div key={q.id} className="pt-3 first:pt-0">
                  <p className="text-sm font-semibold text-gray-800 flex items-start gap-1.5">
                    <span className="text-indigo-600">Q:</span>
                    <span>{q.question}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1 pl-4 flex items-start gap-1.5">
                    <span className="text-green-600 font-bold">A:</span>
                    <span>{q.answer}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Query Ask Form */}
        <div className="bg-white border rounded-xl shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-extrabold text-gray-900 border-b pb-3">Ask a Question</h2>
          <p className="text-xs text-gray-500 leading-normal">
            Your question is submitted directly to our CampusNest Admin Support. We will check details with the PG owner and post the official answer here within 24 hours. Your contact info is kept completely private.
          </p>

          {questionSuccess ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 text-sm font-medium">
              ✓ Question submitted successfully! We are checking with the owner and will post the answer here shortly.
            </div>
          ) : (
            <form onSubmit={handleQuestionSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={questionName}
                  onChange={(e) => setQuestionName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Your Phone"
                  required
                  className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={questionPhone}
                  onChange={(e) => setQuestionPhone(e.target.value)}
                />
              </div>
              <textarea
                placeholder="Ask about food, wifi speed, curfews, water geyser, etc..."
                required
                rows={3}
                className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <button
                type="submit"
                disabled={questionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-md shadow-sm transition-colors cursor-pointer"
              >
                {questionLoading ? "Submitting..." : "Submit Question"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Reviews & Write a Review Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Reviews List */}
        <div className="md:col-span-2 bg-white border rounded-xl shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-extrabold text-gray-900 border-b pb-3">
            Reviews from Seniors
          </h2>
          {pg.reviews.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4">
              No reviews yet. Be the first to share your experience living here!
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
              {pg.reviews.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-extrabold text-gray-800">{r.studentName}</p>
                    <span className="text-amber-500 font-bold">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-relaxed italic">" {r.comment} "</p>
                  <p className="text-[10px] text-gray-400">
                    Posted on {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review Form */}
        <div className="bg-white border rounded-xl shadow-sm p-6 md:p-8 space-y-4 h-fit">
          <h2 className="text-xl font-extrabold text-gray-900 border-b pb-3">Write a Review</h2>
          {reviewSuccess ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 text-sm font-medium">
              ✓ Review posted successfully! Thank you for sharing your experience.
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              {reviewError && (
                <div className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold p-2 rounded">
                  {reviewError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amit (RGM Senior)"
                  className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Rating</label>
                <select
                  className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold cursor-pointer"
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Your Comment</label>
                <textarea
                  placeholder="Tell juniors about the food quality, room cleanliness, WiFi, landlord behavior, curfew rules, etc..."
                  required
                  rows={4}
                  className="bg-gray-50 border rounded-md p-2 text-sm text-gray-900 w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-md shadow-sm transition-colors cursor-pointer"
              >
                {reviewLoading ? "Posting..." : "Post Review"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-extrabold text-lg text-gray-900">Reserve Your Bed</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Price details explanation */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 space-y-2">
              <h4 className="font-bold text-sm text-indigo-900">Total Booking Advance: ₹{pg.reservationFee + 200}</h4>
              <ul className="text-xs text-indigo-800 list-disc list-inside space-y-1">
                <li><span className="font-semibold">₹200:</span> Platform service fee (non-refundable)</li>
                <li><span className="font-semibold">₹{pg.reservationFee}:</span> Token rent advance (Held safely in Escrow)</li>
                <li>This ₹{pg.reservationFee} is deducted from your first month's PG rent at check-in.</li>
                <li>Refundable if the owner rejects booking or doesn't have the bed!</li>
              </ul>
            </div>

            {/* Payment Details */}
            <div className="bg-indigo-50 border border-indigo-150 rounded-md p-4 space-y-4 text-xs">
              <h4 className="font-bold text-indigo-900 flex items-center gap-1 text-sm border-b pb-1">
                UPI Payment Options (₹{pg.reservationFee + 200})
              </h4>

              {/* Option 1: Mobile direct redirection intent link */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Option 1: Pay directly via PhonePe / GPay</span>
                <a
                  href={upiPayload}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-4 rounded shadow-sm transition-colors text-center w-full cursor-pointer text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 15h9" />
                  </svg>
                  <span>Open UPI Pay App (Mobile Only)</span>
                </a>
              </div>

              {/* Option 2: QR Scanner code */}
              <div className="space-y-2 flex flex-col items-center justify-center bg-white p-3 border rounded-md">
                <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px] text-center w-full">Option 2: Scan QR Code (Desktop/Tablet)</span>
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code scanner"
                  className="h-36 w-36 object-contain border p-1 rounded bg-white shadow-sm"
                />
                <span className="text-[10px] text-gray-500 font-medium text-center leading-normal">
                  Open GPay / PhonePe / Paytm / BHIM on your phone and scan this code
                </span>
              </div>

              {/* Option 3: Manual UPI ID string copy option */}
              <div className="space-y-1.5 pt-1 border-t">
                <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Option 3: Pay to UPI ID manually</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    className="bg-white border rounded p-1.5 text-xs font-mono text-gray-700 flex-grow select-all focus:outline-none"
                    value={upiId}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(upiId);
                      alert("UPI ID copied to clipboard!");
                    }}
                    className="bg-gray-100 hover:bg-gray-200 border text-gray-700 font-bold px-2 py-1.5 rounded transition-colors text-xs cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs font-semibold border border-red-200">
                {bookingError}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Amit Kumar"
                  className="w-full bg-gray-50 border rounded-md p-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full bg-gray-50 border rounded-md p-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Expected Check-in Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-gray-50 border rounded-md p-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md text-sm mt-4 transition-colors cursor-pointer"
              >
                {bookingLoading ? "Connecting to Gateway..." : `Proceed to Payment (₹${pg.reservationFee + 200})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Image Viewer Modal */}
      {activeRoomImages && activeRoomImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl relative space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-gray-900 text-sm">
                Room Photo Gallery ({activeRoomImageIdx + 1} of {activeRoomImages.length})
              </h3>
              <button
                onClick={() => {
                  setActiveRoomImages(null);
                  setActiveRoomImageIdx(0);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden relative group">
              <img
                src={activeRoomImages[activeRoomImageIdx]}
                alt={`Room photo ${activeRoomImageIdx + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />

              {/* Left Arrow */}
              {activeRoomImages.length > 1 && (
                <button
                  onClick={() => setActiveRoomImageIdx((prev) => (prev === 0 ? activeRoomImages.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 cursor-pointer shadow flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Right Arrow */}
              {activeRoomImages.length > 1 && (
                <button
                  onClick={() => setActiveRoomImageIdx((prev) => (prev === activeRoomImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 cursor-pointer shadow flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {activeRoomImages.length > 1 && (
              <div className="flex gap-2 justify-center pt-2">
                {activeRoomImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRoomImageIdx(idx)}
                    className={`h-12 w-16 relative rounded overflow-hidden border-2 transition-all cursor-pointer ${
                      activeRoomImageIdx === idx ? "border-indigo-600 ring-2 ring-indigo-500/20" : "border-gray-200"
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
            
            <div className="text-center pt-2 border-t">
              <button
                onClick={() => {
                  setActiveRoomImages(null);
                  setActiveRoomImageIdx(0);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-6 rounded-md transition-colors cursor-pointer shadow-sm"
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
