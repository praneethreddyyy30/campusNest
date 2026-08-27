"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const [gender, setGender] = useState("");
  const [sharing, setSharing] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Resolve typed college queries (e.g. from Enter button submit)
  useEffect(() => {
    const resolveCollege = async () => {
      if (collegeId || !queryText) return;
      setLoading(true);
      setResolveError("");
      try {
        const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(queryText)}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            setCollegeId(list[0].id);
            setCollegeName(list[0].name);
          } else {
            setResolveError(`No colleges found matching "${queryText}"`);
            setLoading(false);
          }
        } else {
          setResolveError("Failed to search colleges.");
          setLoading(false);
        }
      } catch (err) {
        setResolveError("Something went wrong during search.");
        setLoading(false);
      }
    };
    resolveCollege();
  }, [queryText, collegeId]);

  const fetchFilteredPgs = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      let url = `/api/pgs/search?collegeId=${collegeId}`;
      if (gender) url += `&gender=${gender}`;
      if (sharing) url += `&sharing=${sharing}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;

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
  }, [collegeId, gender, sharing, maxPrice]);

  if (!collegeId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {resolveError || "No college selected."}
        </h2>
        <p className="text-gray-500 mt-2">
          {resolveError
            ? "Please check your spelling and search again."
            : "Please go back to home page and search by college name."}
        </p>
        <Link
          href="/"
          className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b pb-6 mb-8">
        <span className="text-sm text-gray-500 font-semibold tracking-wider uppercase">
          Search Results
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
          PGs near {collegeName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Found {pgs.length} verified accommodations sorted by proximity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border h-fit space-y-6">
          <h2 className="font-bold text-gray-950 text-lg border-b pb-2">Filter By</h2>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Gender preference</label>
            <select
              className="w-full bg-gray-50 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
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
            <label className="text-sm font-semibold text-gray-700">Room Sharing</label>
            <select
              className="w-full bg-gray-50 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
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
            <label className="text-sm font-semibold text-gray-700">Max Budget (Monthly)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                placeholder="e.g. 6000"
                className="w-full bg-gray-50 border rounded-md p-2 pl-7 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(gender || sharing || maxPrice) && (
            <button
              onClick={() => {
                setGender("");
                setSharing("");
                setMaxPrice("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-md transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-gray-500 text-sm font-medium">Searching nearby accommodations...</p>
            </div>
          ) : pgs.length === 0 ? (
            <div className="bg-white border rounded-lg p-12 text-center shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-gray-300 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 21h19.5m-18-10.5h16.5m-16.5 3h16.5m-16.5 3h16.5M6.75 6.75h.75m-.75 3h.75m3-3h.75m-.75 3h.75m3-3h.75m-.75 3h.75M21 21V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75V21M9 9h.008v.008H9V9zm.5 0a.5.5 0 11-1 0 .5.5 0 011 0zM12 9h.008v.008H12V9zm.5 0a.5.5 0 11-1 0 .5.5 0 011 0zm2.5 0h.008v.008H15V9zm.5 0a.5.5 0 11-1 0 .5.5 0 011 0z"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-800 mt-4">No matching PGs found</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                Try widening your price range or clearing filters to find more rooms near the campus outskirts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pgs.map((pg) => {
                // Find starting price
                const startingPrice = pg.rooms.length > 0 
                  ? Math.min(...pg.rooms.map((r) => r.priceMonthly))
                  : 0;

                return (
                  <div
                    key={pg.id}
                    className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6"
                  >
                    {/* PG Cover Image */}
                    <div className="w-full md:w-48 h-36 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                      {pg.imageUrl ? (
                        <img
                          src={pg.imageUrl}
                          alt={pg.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-indigo-50">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-12 h-12"
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

                    {/* Content */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                            {pg.name}
                          </h3>
                          {pg.isVerified && (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold border border-green-200">
                              Verified
                            </span>
                          )}
                        </div>

                        {/* Proximity Distance */}
                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded w-fit">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9.5a7 7 0 10-14 0c0 2.992 1.698 5.487 3.363 7.126.83.799 1.654 1.381 2.273 1.765a8.736 8.736 0 001.038.573l.018.008.006.003zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{pg.distanceKm} km from college gate</span>
                        </div>

                        <p className="text-gray-500 text-sm line-clamp-2 mt-2 leading-relaxed">
                          {pg.description}
                        </p>

                        {/* Amenities Tags */}
                        <div className="flex flex-wrap gap-1 pt-2">
                          {pg.amenities.split(",").map((amenity, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {amenity.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div>
                          <span className="text-xs text-gray-500">Starting from</span>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{startingPrice}
                            <span className="text-xs text-gray-400 font-normal"> / month</span>
                          </p>
                        </div>
                        <Link
                          href={`/pgs/${pg.id}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm transition-colors cursor-pointer"
                        >
                          View Rooms
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
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 text-sm font-medium mt-2">Loading search environment...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
