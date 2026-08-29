"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  Star, 
  ShieldAlert, 
  Loader2, 
  SlidersHorizontal,
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Check
} from "lucide-react";

interface Room {
  id: string;
  sharingType: string;
  priceMonthly: number;
  genderPreference: string;
  availableBeds: number;
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
  rooms: Room[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryCollegeId = searchParams.get("collegeId") || "";
  const queryCollegeName = searchParams.get("collegeName") || "";
  const queryText = searchParams.get("query") || "";

  const [collegeId, setCollegeId] = useState(queryCollegeId);
  const [collegeName, setCollegeName] = useState(queryCollegeName || "College");
  const [resolveError, setResolveError] = useState("");

  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [sharing, setSharing] = useState(searchParams.get("sharing") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [amenity, setAmenity] = useState(searchParams.get("amenity") || "");

  // Local search college list if no college selected
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localColleges, setLocalColleges] = useState<any[]>([]);
  const [showLocalSuggestions, setShowLocalSuggestions] = useState(false);

  // Save college memory for the homepage
  useEffect(() => {
    if (collegeId && collegeId !== "SEARCH_BY_NAME" && collegeName && collegeName !== "College") {
      try {
        localStorage.setItem(
          "campusnest_last_college",
          JSON.stringify({ id: collegeId, name: collegeName })
        );
      } catch (err) {
        console.error("Failed to save college preference to localStorage:", err);
      }
    }
  }, [collegeId, collegeName]);

  // Resolve typed college queries
  useEffect(() => {
    const resolveCollege = async () => {
      if (collegeId || !queryText) return;
      setLoading(true);
      setResolveError("");
      try {
        // First try to find college
        const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(queryText)}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            setCollegeId(list[0].id);
            setCollegeName(list[0].name);
            return;
          }
        }

        // Fallback: search by PG name directly
        const pgRes = await fetch(`/api/pgs/search?query=${encodeURIComponent(queryText)}`);
        if (pgRes.ok) {
          const pgData = await pgRes.json();
          if (pgData.length > 0) {
            setPgs(pgData);
            setCollegeName(`"${queryText}"`);
            setCollegeId("SEARCH_BY_NAME");
            setLoading(false);
            return;
          }
        }

        setResolveError(`No colleges or hostels found matching "${queryText}"`);
        setLoading(false);
      } catch (err) {
        setResolveError("Something went wrong during search.");
        setLoading(false);
      }
    };
    resolveCollege();
  }, [queryText, collegeId]);

  // Local college search
  useEffect(() => {
    if (localSearchTerm.trim() === "") {
      setLocalColleges([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(localSearchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setLocalColleges(data);
        }
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const fetchFilteredPgs = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      let url = `/api/pgs/search?`;
      if (collegeId === "SEARCH_BY_NAME") {
        url += `query=${encodeURIComponent(queryText)}`;
      } else {
        url += `collegeId=${collegeId}`;
      }
      if (gender) url += `&gender=${gender}`;
      if (sharing) url += `&sharing=${sharing}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (amenity) url += `&amenity=${amenity}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPgs(data);
      }
    } catch (err) {
      console.error("Error fetching PGs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredPgs();
  }, [collegeId, gender, sharing, maxPrice, amenity]);

  if (!collegeId) {
    return (
      <div className="max-w-xl mx-auto min-h-[70vh] flex flex-col justify-center items-center px-4 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-sans font-bold text-midnight">
            {resolveError || "Find PG Accommodations"}
          </h2>
          <p className="text-xs sm:text-sm text-midnight/60 leading-relaxed max-w-sm mx-auto font-sans">
            {resolveError
              ? "We couldn't resolve the college location. Please review your query and search again."
              : "Enter your college name below to discover verified PGs and hostels nearby."}
          </p>
        </div>

        {/* Dynamic college search bar */}
        <div className="relative max-w-md mx-auto w-full pt-4">
          <div className="bg-white border border-beige/40 p-2 rounded-xl flex items-center h-14 w-full shadow-sm">
            <div className="flex items-center gap-2 px-2 flex-grow text-left h-full">
              <MapPin className="w-4 h-4 text-midnight opacity-75 shrink-0" />
              <input
                type="text"
                placeholder="Enter college name (e.g. RGMCET, GPREC)..."
                className="w-full bg-transparent text-midnight focus:outline-none placeholder:text-midnight/50 font-medium text-sm h-full"
                value={localSearchTerm}
                onChange={(e) => {
                  setLocalSearchTerm(e.target.value);
                  setShowLocalSuggestions(true);
                }}
                onFocus={() => setShowLocalSuggestions(true)}
              />
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showLocalSuggestions && localColleges.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-beige/40 divide-y divide-beige/25 overflow-hidden max-h-48 overflow-y-auto">
              {localColleges.map((college) => (
                <button
                  key={college.id}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-beige/10 text-midnight flex flex-col cursor-pointer transition-colors"
                  onClick={() => {
                    setCollegeId(college.id);
                    setCollegeName(college.name);
                    setShowLocalSuggestions(false);
                    router.replace(`/search?collegeId=${college.id}&collegeName=${encodeURIComponent(college.name)}`);
                  }}
                >
                  <span className="font-semibold text-xs text-left">{college.name}</span>
                  <span className="text-[10px] text-left text-midnight/50 mt-0.5">
                    {college.city}, {college.state}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white border border-beige/45 hover:bg-beige/10 text-midnight font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="border-b border-beige/30 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">
            Search Results
          </span>
          <h1 className="text-3xl font-sans font-bold text-midnight">
            {collegeId === "SEARCH_BY_NAME" ? `Accommodations matching ${collegeName}` : `Accommodations near ${collegeName}`}
          </h1>
          <p className="text-xs sm:text-sm text-midnight/60 font-sans">
            {collegeId === "SEARCH_BY_NAME" ? `Found ${pgs.length} verified listings` : `Found ${pgs.length} verified outskirts PGs sorted by proximity to gate`}
          </p>
        </div>
        
        {/* Active Filters Summary */}
        {(gender || sharing || maxPrice || amenity) && (
          <button
            onClick={() => {
              setGender("");
              setSharing("");
              setMaxPrice("");
              setAmenity("");
            }}
            className="flex items-center gap-1.5 text-xs text-red-700 font-bold bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Filters Sidebar */}
        <div className="bg-white p-8 rounded-2xl border border-beige/40 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-beige/35 pb-4">
            <SlidersHorizontal className="w-4 h-4 text-midnight/80" />
            <h2 className="font-bold text-midnight text-sm tracking-wide">Filter Accommodation</h2>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-midnight/70 uppercase tracking-wider block">Gender Preference</label>
            <select
              className="w-full bg-beige/10 border border-beige/40 rounded-xl px-3 py-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight cursor-pointer font-semibold"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Boys">Boys Only</option>
              <option value="Girls">Girls Only</option>
              <option value="Co-ed">Co-ed</option>
            </select>
          </div>

          {/* Sharing Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-midnight/70 uppercase tracking-wider block">Room Sharing</label>
            <select
              className="w-full bg-beige/10 border border-beige/40 rounded-xl px-3 py-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight cursor-pointer font-semibold"
              value={sharing}
              onChange={(e) => setSharing(e.target.value)}
            >
              <option value="">Any Sharing</option>
              <option value="Single">Single Sharing</option>
              <option value="Double">Double Sharing</option>
              <option value="Triple">Triple Sharing</option>
            </select>
          </div>

          {/* Max Price */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-midnight/70 uppercase tracking-wider block">Max Budget (Monthly)</label>
            <div className="relative">
              <span className="absolute left-4 top-[13px] text-midnight/60 text-xs font-bold">₹</span>
              <input
                type="number"
                placeholder="e.g. 6000"
                className="w-full bg-beige/10 border border-beige/40 rounded-xl pl-8 pr-4 py-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Special Amenities */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-midnight/70 uppercase tracking-wider block">Special Amenities</label>
            <select
              className="w-full bg-beige/10 border border-beige/40 rounded-xl px-3 py-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight cursor-pointer font-semibold"
              value={amenity}
              onChange={(e) => setAmenity(e.target.value)}
            >
              <option value="">Any Amenity</option>
              <option value="Meals">Meals Included</option>
              <option value="AC">Air Conditioning</option>
              <option value="WiFi">WiFi Enabled</option>
              <option value="PowerBackup">Power Backup</option>
              <option value="Laundry">Washing Machine</option>
              <option value="Security">Security Guard</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
              <p className="text-xs text-midnight/60 font-semibold tracking-wide">Searching nearby accommodations...</p>
            </div>
          ) : pgs.length === 0 ? (
            <div className="bg-white border border-beige/40 rounded-2xl p-16 text-center shadow-sm max-w-xl mx-auto space-y-4">
              <ShieldAlert className="w-12 h-12 text-midnight/35 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-midnight">No matching PGs found</h3>
                <p className="text-xs text-midnight/60 leading-relaxed max-w-xs mx-auto">
                  Try widening your budget, resetting sharing preferences, or exploring other campus outskirts.
                </p>
              </div>
              {(gender || sharing || maxPrice || amenity) && (
                <button
                  onClick={() => {
                    setGender("");
                    setSharing("");
                    setMaxPrice("");
                    setAmenity("");
                  }}
                  className="bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {pgs.map((pg, index) => {
                const startingPrice = pg.rooms.length > 0 
                  ? Math.min(...pg.rooms.map((r) => r.priceMonthly))
                  : 6000;

                // Alternate images
                const imageMap = ["/exterior.jpg", "/room-1.jpg", "/room-2.jpg"];
                const coverImg = pg.imageUrl || imageMap[index % imageMap.length];

                return (
                  <div
                    key={pg.id}
                    className="bg-white border border-beige/40 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col md:flex-row gap-6"
                  >
                    {/* Cover Image */}
                    <div className="w-full md:w-52 h-40 bg-beige/10 rounded-xl overflow-hidden shrink-0 relative">
                      <img
                        src={coverImg}
                        alt={pg.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      {pg.isVerified && (
                        <span className="absolute top-3 left-3 bg-sage/10 text-sage border border-sage/20 backdrop-blur-xs text-[8px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 text-sage stroke-[3px]" />
                          <span>Verified PG</span>
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h3 className="font-bold text-base text-midnight leading-tight">
                            {pg.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-sage font-bold bg-sage/5 border border-sage/15 px-2.5 py-1 rounded-xl w-fit">
                            <MapPin className="w-3.5 h-3.5 text-sage" />
                            <span>{pg.distanceKm} km from college gate</span>
                          </div>
                        </div>

                        <p className="text-midnight/70 text-xs line-clamp-2 leading-relaxed">
                          {pg.description}
                        </p>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
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
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}
                              >
                                {trimText}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="flex items-center justify-between border-t border-beige/20 pt-4">
                        <div>
                          <span className="text-[9px] text-midnight/55 uppercase font-bold tracking-wider block">Starts from</span>
                          <p className="text-lg font-extrabold text-rust">
                            ₹{startingPrice}
                            <span className="text-xs text-midnight/50 font-normal"> / month</span>
                          </p>
                        </div>
                        <Link
                          href={`/pgs/${pg.id}`}
                          className="inline-flex items-center gap-1 bg-midnight hover:bg-midnight-light text-pearl font-bold text-xs px-5 py-3 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>View Rooms</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-pearl">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin w-8 h-8 text-midnight/60" />
            <p className="text-xs text-midnight/60 font-semibold tracking-wide">Loading search environment...</p>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
