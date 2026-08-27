"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Debounced search for colleges
  useEffect(() => {
    if (searchTerm.trim() === "" || (selectedCollege && selectedCollege.name === searchTerm)) {
      setColleges([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setColleges(data);
        }
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCollege]);

  // Handle click outside suggestions to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollege) {
      router.push(`/search?collegeId=${selectedCollege.id}&collegeName=${encodeURIComponent(selectedCollege.name)}`);
    } else if (searchTerm.trim() !== "") {
      // Fallback: search by text
      router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white py-20 px-4 text-center flex-grow flex flex-col justify-center items-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Find & Reserve Verified PGs Near Your College Outskirts
          </h1>
          <p className="text-lg sm:text-xl text-indigo-200 max-w-2xl mx-auto font-medium">
            Exclusively for Tier 2 and Tier 3 engineering and degree campuses. Pay ₹200 to secure your room with our 100% Escrow Guarantee.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto mt-8 w-full">
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-lg shadow-lg">
              <div className="relative flex-grow text-left">
                <input
                  type="text"
                  placeholder="Enter your college (e.g. RGMCET, GPREC)..."
                  className="w-full px-4 py-3 text-gray-900 focus:outline-none placeholder-gray-400 font-medium"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCollege(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />

                {/* Suggestions dropdown */}
                {showSuggestions && colleges.length > 0 && (
                  <div
                    ref={suggestionRef}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-md shadow-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {colleges.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-gray-800 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedCollege(college);
                          setSearchTerm(college.name);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-semibold text-sm">{college.name}</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {college.city}, {college.state}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Search Nearby</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick links for demo */}
          <div className="pt-8 text-sm text-indigo-300">
            <span className="font-medium mr-2">Quick Search Demo:</span>
            <div className="inline-flex flex-wrap gap-2 mt-2 sm:mt-0 justify-center">
              <button
                onClick={async () => {
                  // Direct fetch to find RGMCET ID in seeded database
                  const res = await fetch("/api/colleges/search?query=RGMCET");
                  const list = await res.json();
                  if (list.length > 0) {
                    router.push(`/search?collegeId=${list[0].id}&collegeName=${encodeURIComponent(list[0].name)}`);
                  }
                }}
                className="bg-indigo-800/40 hover:bg-indigo-800/80 border border-indigo-700 text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
              >
                RGMCET (Nandyal)
              </button>
              <button
                onClick={async () => {
                  const res = await fetch("/api/colleges/search?query=GPREC");
                  const list = await res.json();
                  if (list.length > 0) {
                    router.push(`/search?collegeId=${list[0].id}&collegeName=${encodeURIComponent(list[0].name)}`);
                  }
                }}
                className="bg-indigo-800/40 hover:bg-indigo-800/80 border border-indigo-700 text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
              >
                GPREC (Kurnool)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Info features section */}
      <section className="max-w-6xl mx-auto py-16 px-4 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Proximity-Sorted</h3>
          <p className="text-gray-500 text-sm">
            No more guess work. PGs are listed sorted by distance directly from your college gate. Save hours of travel.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Escrow Security</h3>
          <p className="text-gray-500 text-sm">
            Your ₹2,000 reservation advance is held safely in our escrow wallet. It is released to the landlord ONLY after you check in.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Admin-Managed Queries</h3>
          <p className="text-gray-500 text-sm">
            Ask questions anonymously. We contact the landlord, verify the information, and post the answer so there is no communication bypass.
          </p>
        </div>
      </section>
    </div>
  );
}
