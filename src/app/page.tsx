"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MapPin, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  Building, 
  Users, 
  Star, 
  Award, 
  Compass, 
  CreditCard, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  Check,
  Calendar,
  Sparkles,
  Coins
} from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;
    
    const duration = 1200; // 1.2s duration
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = end / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(increment * currentStep));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [target]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
}

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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [suggestedPgs, setSuggestedPgs] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  
  // Featured PGs near default college
  const [featuredPgs, setFeaturedPgs] = useState<PG[]>([]);
  const [featuredCollegeName, setFeaturedCollegeName] = useState("");
  const [loadingPgs, setLoadingPgs] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [exploreTab, setExploreTab] = useState<"all" | "near" | "budget">("all");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const router = useRouter();
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Debounced search for colleges and PGs
  useEffect(() => {
    if (searchTerm.trim() === "" || (selectedCollege && selectedCollege.name === searchTerm)) {
      setColleges([]);
      setSuggestedPgs([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setColleges(data);
        }

        const resPg = await fetch(`/api/pgs/search?query=${encodeURIComponent(searchTerm)}`);
        if (resPg.ok) {
          const pgData = await resPg.json();
          setSuggestedPgs(pgData);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCollege]);

  // Load featured PGs near the first available college or last searched college
  useEffect(() => {
    const loadFeatured = async () => {
      setLoadingPgs(true);
      try {
        let activeCollegeId = "";
        let activeCollegeName = "";

        const savedCollegeStr = localStorage.getItem("campusnest_last_college");
        if (savedCollegeStr) {
          try {
            const savedCollege = JSON.parse(savedCollegeStr);
            if (savedCollege.id && savedCollege.name) {
              activeCollegeId = savedCollege.id;
              activeCollegeName = savedCollege.name;
            }
          } catch (e) {
            console.error("Failed to parse saved college:", e);
          }
        }

        if (activeCollegeId && activeCollegeName) {
          setFeaturedCollegeName(activeCollegeName);
          const pgRes = await fetch(`/api/pgs/search?collegeId=${activeCollegeId}`);
          if (pgRes.ok) {
            const pgData = await pgRes.json();
            setFeaturedPgs(pgData.slice(0, 3));
            setLoadingPgs(false);
            return;
          }
        }

        // Fallback to RGMCET
        const res = await fetch("/api/colleges/search?query=");
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            const rgm = list.find((c: College) => c.name.includes("RGMCET")) || list[0];
            setFeaturedCollegeName(rgm.name);
            const pgRes = await fetch(`/api/pgs/search?collegeId=${rgm.id}`);
            if (pgRes.ok) {
              const pgData = await pgRes.json();
              setFeaturedPgs(pgData.slice(0, 3));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load featured PGs:", err);
      } finally {
        setLoadingPgs(false);
      }
    };
    loadFeatured();
  }, []);

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

  const exploredPgs = featuredPgs.filter(pg => {
    if (exploreTab === "near") return pg.distanceKm <= 1.0;
    if (exploreTab === "budget") {
      return pg.rooms.some(r => r.priceMonthly <= 5000);
    }
    return true; // "all"
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollege) {
      router.push(`/search?collegeId=${selectedCollege.id}&collegeName=${encodeURIComponent(selectedCollege.name)}`);
    } else if (searchTerm.trim() !== "") {
      router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleQuickSearch = async (collegeNameStr: string) => {
    try {
      const res = await fetch(`/api/colleges/search?query=${encodeURIComponent(collegeNameStr)}`);
      if (res.ok) {
        const list = await res.json();
        if (list.length > 0) {
          router.push(`/search?collegeId=${list[0].id}&collegeName=${encodeURIComponent(list[0].name)}`);
        }
      }
    } catch (err) {
      console.error("Quick search redirection failed:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-pearl">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-[center_43%] transition-transform duration-[10000ms] ease-out scale-100 hover:scale-105" 
            style={{ backgroundImage: `url('/hero-bg.jpg')` }}
          />
          <div className="absolute inset-0 bg-midnight/35" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-2 sm:px-6">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-[60px] lg:text-[64px] font-sans font-semibold tracking-[-0.015em] text-pearl leading-[1.0] max-w-[880px] mx-auto mb-5 opacity-0 animate-fade-in-up">
              Find Verified PGs & Hostels<br />
              Near <span className="font-accent text-[42px] sm:text-[56px] md:text-[80px] lg:text-[84px] font-normal tracking-normal text-cream inline-block align-middle ml-1">Your Campus</span>
            </h1>
            <p className="text-sm md:text-[17px] text-cream/90 max-w-[760px] mx-auto font-sans leading-[1.55] tracking-normal mb-8 opacity-0 animate-fade-in-up animation-delay-150">
              Exclusively tailored for Tier 2 & Tier 3 engineering and degree campuses.
              Secure your bed with a verified escrow-backed advance deposit.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-[720px] mx-auto w-full mt-12 opacity-0 animate-fade-in-up animation-delay-300">
            <div className="glass-search backdrop-blur-xl p-2 rounded-full flex items-center h-16 md:h-[68px] w-full">
              <div className="flex items-center gap-3 px-3 flex-grow text-left h-full relative">
                <MapPin className="w-5 h-5 text-midnight opacity-85 shrink-0" />
                <input
                  type="text"
                  placeholder="Enter college or PG name..."
                  className="w-full bg-transparent text-midnight focus:outline-none placeholder:text-midnight/60 font-medium text-[15px] sm:text-[16px] md:text-[18px] h-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCollege(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && (colleges.length > 0 || suggestedPgs.length > 0) && (
                  <div
                    ref={suggestionRef}
                    className="absolute z-50 left-0 right-0 top-full mt-3 bg-white rounded-xl shadow-xl border border-beige/40 divide-y divide-beige/25 overflow-hidden max-h-60 overflow-y-auto"
                  >
                    {colleges.map((college) => (
                      <button
                        key={college.id}
                        type="button"
                        className="w-full text-left px-5 py-3.5 hover:bg-beige/20 text-midnight flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedCollege(college);
                          setSearchTerm(college.name);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-semibold text-[9px] uppercase tracking-wider text-midnight/40 mb-0.5">College Campus</span>
                        <span className="font-semibold text-sm text-midnight">{college.name}</span>
                        <span className="text-xs text-midnight/50 mt-0.5 font-sans">
                          {college.city}, {college.state}
                        </span>
                      </button>
                    ))}

                    {suggestedPgs.map((pg) => (
                      <button
                        key={pg.id}
                        type="button"
                        className="w-full text-left px-5 py-3.5 hover:bg-beige/20 text-midnight flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setSearchTerm(pg.name);
                          setShowSuggestions(false);
                          router.push(`/search?query=${encodeURIComponent(pg.name)}`);
                        }}
                      >
                        <span className="font-semibold text-[9px] uppercase tracking-wider text-midnight/40 mb-0.5">Hostel PG</span>
                        <span className="font-semibold text-sm text-midnight">{pg.name}</span>
                        <span className="text-xs text-midnight/50 mt-0.5 font-sans">
                          {pg.address}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-midnight hover:bg-midnight-light text-pearl font-semibold text-xs md:text-sm px-6 h-full rounded-full transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 uppercase tracking-wider"
              >
                <Search className="w-4 h-4 text-pearl" />
                <span className="hidden sm:inline">Search Nearby</span>
              </button>
            </div>
          </form>

          {/* Quick Search Pills */}
          <div className="text-xs text-pearl/85 flex flex-wrap items-center justify-center gap-3 pt-6 font-sans max-w-2xl mx-auto">
            <span className="font-semibold tracking-wide text-pearl/70 w-full md:w-auto">Quick Search:</span>
            <button
              onClick={() => router.push(`/search?collegeId=dacc0911-a010-4f74-87f5-9ea08168c5a8&collegeName=${encodeURIComponent("Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)")}`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              PG near RGMCET
            </button>
            <button
              onClick={() => router.push(`/search?collegeId=287294a3-0ff1-40d9-b85a-bfbdeaf05ac4&collegeName=${encodeURIComponent("G. Pulla Reddy Engineering College (GPREC)")}&gender=Girls`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              Girls PG near GPREC
            </button>
            <button
              onClick={() => router.push(`/search?collegeId=287294a3-0ff1-40d9-b85a-bfbdeaf05ac4&collegeName=${encodeURIComponent("G. Pulla Reddy Engineering College (GPREC)")}&gender=Boys`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              Boys PG in Kurnool
            </button>
            <button
              onClick={() => router.push(`/search?collegeId=dacc0911-a010-4f74-87f5-9ea08168c5a8&collegeName=${encodeURIComponent("Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)")}&amenity=Meals`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              PG with Food
            </button>
            <button
              onClick={() => router.push(`/search?collegeId=dacc0911-a010-4f74-87f5-9ea08168c5a8&collegeName=${encodeURIComponent("Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)")}&amenity=AC`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              PG with AC
            </button>
            <button
              onClick={() => router.push(`/search?collegeId=dacc0911-a010-4f74-87f5-9ea08168c5a8&collegeName=${encodeURIComponent("Rajeev Gandhi Memorial College of Engineering and Technology (RGMCET)")}&maxPrice=7000`)}
              type="button"
              className="glass-chip hover:bg-white/25 text-pearl px-4 py-1.5 rounded-full transition-colors cursor-pointer text-xs font-semibold"
            >
              PG under ₹7000
            </button>
          </div>
        </div>
      </section>

      {/* 2. Trust Cards Section */}
      <section className="relative z-20 max-w-6xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group bg-white rounded-2xl p-8 border border-midnight/[0.06] border-t-4 border-t-rust/70 shadow-[0_8px_30px_rgba(16,46,74,0.04)] hover:shadow-[0_20px_40px_rgba(16,46,74,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-rust/[0.04] flex items-center justify-center mb-6 group-hover:bg-rust group-hover:scale-110 transition-all duration-300">
              <Compass className="w-5 h-5 text-rust group-hover:text-pearl transition-colors duration-300" />
            </div>
            <h3 className="text-[18px] font-sans font-bold text-midnight mb-3">Proximity-Sorted</h3>
            <p className="text-sm text-midnight/70 font-sans leading-relaxed">
              Browse PGs sorted by distance from your college. Save hours of daily travel.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white rounded-2xl p-8 border border-midnight/[0.06] border-t-4 border-t-sage/70 shadow-[0_8px_30px_rgba(16,46,74,0.04)] hover:shadow-[0_20px_40px_rgba(16,46,74,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-sage/[0.04] flex items-center justify-center mb-6 group-hover:bg-sage group-hover:scale-110 transition-all duration-300">
              <ShieldCheck className="w-5 h-5 text-sage group-hover:text-pearl transition-colors duration-300" />
            </div>
            <h3 className="text-[18px] font-sans font-bold text-midnight mb-3">Escrow Security</h3>
            <p className="text-sm text-midnight/70 font-sans leading-relaxed">
              Your ₹200 reservation advance is held safely in escrow according to the booking process.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white rounded-2xl p-8 border border-midnight/[0.06] border-t-4 border-t-gold/70 shadow-[0_8px_30px_rgba(16,46,74,0.04)] hover:shadow-[0_20px_40px_rgba(16,46,74,0.08)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-gold/[0.04] flex items-center justify-center mb-6 group-hover:bg-gold group-hover:scale-110 transition-all duration-300">
              <MessageSquare className="w-5 h-5 text-gold group-hover:text-pearl transition-colors duration-300" />
            </div>
            <h3 className="text-[18px] font-sans font-bold text-midnight mb-3">Admin-Moderated Q&As</h3>
            <p className="text-sm text-midnight/70 font-sans leading-relaxed">
              Ask questions and receive verified answers from owners and administrators.
            </p>
          </div>

        </div>
      </section>

      {/* 3. Featured Property Section */}
      <section className="max-w-6xl mx-auto pt-10 pb-12 px-4 sm:px-6 lg:px-8 w-full space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-beige/30 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-midnight tracking-tight">
              Explore PGs & Hostels Near You
            </h2>
            <p className="text-xs sm:text-sm text-midnight/60 font-sans">
              Hand-picked verified accommodations near {featuredCollegeName || "your college"}
            </p>
          </div>
          <Link
            href="/search?query="
            className="text-xs sm:text-sm font-bold text-midnight hover:opacity-80 flex items-center gap-1 group transition-opacity"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Dynamic Showcase Tabs (Glassmorphic Segment Control) */}
        <div className="inline-flex flex-wrap p-1.5 bg-beige/35 backdrop-blur-xs border border-beige/45 rounded-2xl shadow-xs gap-1.5 animate-fade-in-up">
          {[
            { id: "all", label: "All Listings", icon: Sparkles, count: featuredPgs.length },
            { id: "near", label: "Outskirts (≤ 1.0 KM)", icon: MapPin, count: featuredPgs.filter(pg => pg.distanceKm <= 1.0).length },
            { id: "budget", label: "Budget (≤ ₹5000/mo)", icon: Coins, count: featuredPgs.filter(pg => pg.rooms.some(r => r.priceMonthly <= 5000)).length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setExploreTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  exploreTab === tab.id
                    ? "bg-midnight text-pearl shadow-md translate-y-0"
                    : "text-midnight hover:bg-white/50 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  exploreTab === tab.id ? "bg-white/20 text-white" : "bg-midnight/10 text-midnight/70"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {loadingPgs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-beige/25 p-4 animate-pulse space-y-4">
                <div className="w-full h-48 bg-beige/20 rounded-xl" />
                <div className="h-4 bg-beige/25 rounded w-2/3" />
                <div className="h-3 bg-beige/20 rounded w-1/2" />
                <div className="h-6 bg-beige/20 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : exploredPgs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-beige/25 p-8 max-w-xl mx-auto">
            <ShieldAlert className="w-12 h-12 text-midnight/35 mx-auto mb-4" />
            <h4 className="text-base font-bold text-midnight">No matching listings found</h4>
            <p className="text-xs text-midnight/50 mt-1">
              No hostel listing fits this category tab constraint in the selected outskirts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exploredPgs.map((pg, index) => {
              const startPrice = pg.rooms.length > 0 
                ? Math.min(...pg.rooms.map((r) => r.priceMonthly)) 
                : 6000;
              
              // Map images
              const imageMap = ["/exterior.jpg", "/room-1.jpg", "/room-2.jpg"];
              const coverImg = pg.imageUrl || imageMap[index % imageMap.length];

              return (
                <div key={pg.id} className="bg-white rounded-2xl border border-beige/40 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                  <div className="relative w-full h-48 bg-beige/20 overflow-hidden">
                    <img 
                      src={coverImg} 
                      alt={pg.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {pg.isVerified && (
                      <span className="absolute top-4 left-4 bg-sage/95 backdrop-blur-sm text-white text-[8px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-sm">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                        <span>Verified PG</span>
                      </span>
                    )}
                    <span className="absolute bottom-4 right-4 bg-midnight/80 backdrop-blur-xs text-pearl text-[10px] font-semibold px-2.5 py-0.5 rounded">
                      {pg.distanceKm} km from college
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-midnight line-clamp-1">{pg.name}</h3>
                        <div className="flex items-center gap-1 text-xs font-semibold text-midnight/80">
                          <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                          <span>4.6</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-midnight/60 line-clamp-2 leading-relaxed">
                        {pg.description}
                      </p>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {pg.amenities.split(",").slice(0, 3).map((amenity, idx) => {
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

                    <div className="flex items-center justify-between border-t border-beige/20 pt-4">
                      <div>
                        <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-wider">Starts from</span>
                        <p className="text-base font-bold text-rust">
                          ₹{startPrice}
                          <span className="text-xs text-midnight/55 font-normal">/mo</span>
                        </p>
                      </div>
                      <Link
                        href={`/pgs/${pg.id}`}
                        className="bg-midnight hover:bg-midnight-light text-pearl text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Stats Section */}
      <section className="bg-midnight text-pearl py-12 px-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-2">
              <div className="flex justify-center text-pearl/50">
                <Building className="w-6 h-6" />
              </div>
              <p className="text-3xl font-sans font-bold text-pearl tracking-tight">
                <AnimatedCounter target={250} suffix="+" />
              </p>
              <p className="text-[10px] text-cream/60 uppercase tracking-wider font-bold">Verified PGs</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center text-pearl/50">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-3xl font-sans font-bold text-pearl tracking-tight">
                <AnimatedCounter target={15} suffix="+" />
              </p>
              <p className="text-[10px] text-cream/60 uppercase tracking-wider font-bold">College Partners</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center text-pearl/50">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-3xl font-sans font-bold text-pearl tracking-tight">
                <AnimatedCounter target={10000} suffix="+" />
              </p>
              <p className="text-[10px] text-cream/60 uppercase tracking-wider font-bold">Happy Students</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center text-pearl/50">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-3xl font-sans font-bold text-pearl tracking-tight">4.6 / 5</p>
              <p className="text-[10px] text-cream/60 uppercase tracking-wider font-bold">Average Rating</p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Why Students Trust Section */}
      <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto font-sans">
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-midnight tracking-tight">
            Why Students Trust CampusNest
          </h2>
          <p className="text-xs sm:text-sm text-midnight/60 leading-relaxed font-sans">
            Direct matching, secure escrows, and zero information gaps for college outskirts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-beige/30 text-center hover:bg-white/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-midnight/5 text-midnight flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-midnight mb-2">Verified & Trusted</h3>
            <p className="text-xs sm:text-sm text-midnight/70 leading-relaxed">
              Every PG is verified by our team for safety, security, and authenticity. No fake listings.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-beige/30 text-center hover:bg-white/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-midnight/5 text-midnight flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-midnight mb-2">Transparent Pricing</h3>
            <p className="text-xs sm:text-sm text-midnight/70 leading-relaxed">
              No hidden charges. What you see is what you pay. Escrow is applied directly to your rent.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-beige/30 text-center hover:bg-white/80 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-midnight/5 text-midnight flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-midnight mb-2">Student First Support</h3>
            <p className="text-xs sm:text-sm text-midnight/70 leading-relaxed">
              We are here before, during, and after your booking to resolve disputes and verify check-ins.
            </p>
          </div>

        </div>
      </section>

      {/* 6. How It Works Section */}
      <section id="how-it-works" className="bg-cream/40 border-y border-beige/25 py-12 px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto font-sans">
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-midnight tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-midnight/60 font-sans">
            Reserve your hostel room near college gate in four simple steps.
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop Timeline */}
          <div className="hidden md:grid grid-cols-4 gap-8 relative">
            <div className="absolute top-[26px] left-[12.5%] right-[12.5%] h-0.5 bg-beige" />
            
            <div className="space-y-4 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-midnight text-pearl flex items-center justify-center mx-auto border-4 border-pearl font-bold">
                01
              </div>
              <h3 className="font-bold text-sm text-midnight">Search</h3>
              <p className="text-xs text-midnight/60 leading-relaxed max-w-[180px] mx-auto">
                Search your college or explore nearby verified PGs.
              </p>
            </div>

            <div className="space-y-4 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-midnight text-pearl flex items-center justify-center mx-auto border-4 border-pearl font-bold">
                02
              </div>
              <h3 className="font-bold text-sm text-midnight">Compare</h3>
              <p className="text-xs text-midnight/60 leading-relaxed max-w-[180px] mx-auto">
                Compare pricing, room options, and distance in km.
              </p>
            </div>

            <div className="space-y-4 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-midnight text-pearl flex items-center justify-center mx-auto border-4 border-pearl font-bold">
                03
              </div>
              <h3 className="font-bold text-sm text-midnight">Book</h3>
              <p className="text-xs text-midnight/60 leading-relaxed max-w-[180px] mx-auto">
                Pay the ₹200 commission + ₹2000 token escrow deposit.
              </p>
            </div>

            <div className="space-y-4 text-center relative z-10">
              <div className="w-14 h-14 rounded-full bg-midnight text-pearl flex items-center justify-center mx-auto border-4 border-pearl font-bold">
                04
              </div>
              <h3 className="font-bold text-sm text-midnight">Check-in</h3>
              <p className="text-xs text-midnight/60 leading-relaxed max-w-[180px] mx-auto">
                Check in to verify room quality. Escrow is released after check-in.
              </p>
            </div>

          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-10 pl-6 border-l border-beige relative">
            
            <div className="space-y-2 relative">
              <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-midnight text-pearl flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-midnight">Search</h3>
              <p className="text-xs text-midnight/60 leading-relaxed">
                Search your college or explore nearby verified PGs.
              </p>
            </div>

            <div className="space-y-2 relative">
              <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-midnight text-pearl flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-midnight">Compare</h3>
              <p className="text-xs text-midnight/60 leading-relaxed">
                Compare pricing, room options, and distance in km.
              </p>
            </div>

            <div className="space-y-2 relative">
              <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-midnight text-pearl flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-midnight">Book</h3>
              <p className="text-xs text-midnight/60 leading-relaxed">
                Pay the ₹200 commission + ₹2000 token escrow deposit.
              </p>
            </div>

            <div className="space-y-2 relative">
              <div className="absolute -left-[37px] top-0 w-8 h-8 rounded-full bg-midnight text-pearl flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="font-bold text-sm text-midnight">Check-in</h3>
              <p className="text-xs text-midnight/60 leading-relaxed">
                Check in to verify room quality. Escrow is released after check-in.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="bg-ivory border-y border-beige/30 py-16 px-4 sm:px-6 lg:px-8 w-full space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto font-sans">
          <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block">
            Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-midnight tracking-tight">
            Loved by Thousands of Students
          </h2>
          <p className="text-xs sm:text-sm text-midnight/60 leading-relaxed font-sans">
            Hear from seniors who secured their campus outskirts housing without broker interventions.
          </p>
        </div>

        {/* Reviews Slider */}
        <div className="relative max-w-2xl mx-auto overflow-hidden bg-white border border-beige/45 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
          <div 
            className="flex transition-transform duration-500 ease-in-out" 
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {[
              {
                name: "Karthik R.",
                college: "RGMCET Nandyal",
                image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80",
                quote: "Booking via CampusNest was a lifesaver. The ₹2,000 security token stayed in escrow until I physically verified my room. Total peace of mind!",
                rating: 5
              },
              {
                name: "Siri Chowdary",
                college: "GPREC Kurnool",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                quote: "The regional ambassador visited the hostel to verify the custom study desks and safety cameras. The listing matched the actual room perfectly.",
                rating: 5
              },
              {
                name: "Rahul Verma",
                college: "BIT Kurnool",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                quote: "I loved that there were no broker fees or hidden rates. The transparent public query log cleared all my questions before I visited.",
                rating: 5
              }
            ].map((t, idx) => (
              <div key={idx} className="w-full shrink-0 space-y-6">
                <div className="flex justify-center text-amber-500 gap-1 text-lg">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-sm sm:text-base text-midnight/80 italic font-sans leading-relaxed max-w-lg mx-auto">
                  "{t.quote}"
                </p>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-beige shadow-xs" />
                  <div>
                    <h4 className="font-bold text-xs text-midnight">{t.name}</h4>
                    <p className="text-[10px] text-midnight/55 font-bold uppercase tracking-wider font-sans">{t.college}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Indicators */}
          <div className="flex justify-center gap-1.5 mt-8">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-6 bg-midnight" : "w-2 bg-beige/85"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Promotional / Banner Section */}
      <section className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-midnight rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 text-pearl items-center border border-midnight-light">
          
          <div className="p-8 sm:p-16 space-y-6 font-sans">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-sans font-bold text-pearl leading-[1.15] tracking-tight">
              Affordable Stays.<br />Close to Campus.
            </h2>
            <p className="text-xs sm:text-sm text-cream/70 leading-relaxed max-w-sm">
              Comfortable rooms, essential amenities, and a student-friendly environment situated directly around Tier 2 & 3 college outskirts.
            </p>
            <Link
              href="/search?query="
              className="inline-flex items-center gap-2 bg-pearl hover:bg-cream text-midnight font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Search PGs Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 md:h-full w-full relative">
            <img 
              src="/room-2.jpg" 
              alt="Student Accommodation" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-midnight/10" />
          </div>

        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] text-midnight/55 uppercase font-bold tracking-widest block font-sans">
            Have Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-midnight tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-midnight/60 font-sans leading-relaxed">
            Everything you need to know about secure student reservations, amenities, and campus proximity.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the escrow-backed reservation deposit work?",
              a: "When you reserve a room, you pay a ₹2,000 security token and ₹200 service commission. Your ₹2,000 token is held in a secure escrow account by CampusNest. It is only released to the owner 24 hours after you check in and confirm the accommodation meets the standards. If the listing is unavailable, you get a 100% refund."
            },
            {
              q: "Are the custom amenities listed verified by the platform?",
              a: "Yes. Before any new accommodation goes live or changes are updated, our regional student ambassadors physically visit the site to verify all listed details, including special offerings like gyms, power backup, study halls, or recreation setups."
            },
            {
              q: "How does CampusNest ensure there is no communication bypass?",
              a: "To prevent information gaps, students submit questions directly through the site. The questions are checked, verified with the owner by our operators, and answered publicly. This ensures all pricing, rules, and expectations are documented transparently."
            },
            {
              q: "Can PG owners edit their listings directly?",
              a: "Landlords can propose edits (descriptions, proximity, amenities, and photo galleries) through their dashboard. However, to keep details 100% accurate, all proposed modifications must be approved by a Super Admin before they appear publicly on the site."
            }
          ].map((faq, idx) => (
            <div key={idx} className="border border-beige/45 rounded-2xl bg-white/40 backdrop-blur-sm overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
              <button
                type="button"
                onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 text-left font-bold text-xs sm:text-sm text-midnight hover:bg-beige/10 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-lg font-normal ml-4 shrink-0 transition-transform duration-300">
                  {openFaqIdx === idx ? "−" : "+"}
                </span>
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFaqIdx === idx ? "max-h-40 border-t border-beige/15 bg-beige/5" : "max-h-0"
                }`}
              >
                <div className="p-5 text-xs text-midnight/70 leading-relaxed font-sans">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Popular Searches Section */}
      <section className="max-w-6xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 w-full text-center space-y-6">
        <h3 className="text-xs font-bold text-midnight/50 uppercase tracking-widest">Popular Searches</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
          
          <button 
            onClick={() => handleQuickSearch("RGMCET")}
            type="button"
            className="text-xs bg-beige/35 hover:bg-beige/65 text-midnight border border-beige/40 px-4 py-2 rounded-full transition-colors cursor-pointer font-semibold"
          >
            PG near RGMCET
          </button>
          
          <button 
            onClick={() => handleQuickSearch("GPREC")}
            type="button"
            className="text-xs bg-beige/35 hover:bg-beige/65 text-midnight border border-beige/40 px-4 py-2 rounded-full transition-colors cursor-pointer font-semibold"
          >
            Girls PG near GPREC
          </button>

          <button 
            onClick={() => handleQuickSearch("GPREC")}
            type="button"
            className="text-xs bg-beige/35 hover:bg-beige/65 text-midnight border border-beige/40 px-4 py-2 rounded-full transition-colors cursor-pointer font-semibold"
          >
            Boys PG in Kurnool
          </button>

          <span 
            className="text-xs bg-beige/35 text-midnight border border-beige/40 px-4 py-2 rounded-full font-semibold opacity-85 select-none"
          >
            PG with Food
          </span>

          <span 
            className="text-xs bg-beige/35 text-midnight border border-beige/40 px-4 py-2 rounded-full font-semibold opacity-85 select-none"
          >
            PG with AC
          </span>

          <span 
            className="text-xs bg-beige/35 text-midnight border border-beige/40 px-4 py-2 rounded-full font-semibold opacity-85 select-none"
          >
            PG under ₹7000
          </span>

        </div>
      </section>

    </div>
  );
}
