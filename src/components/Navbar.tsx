"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Building, ClipboardList, LayoutDashboard, LogOut, Menu, X, Home } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };
    checkSession();

    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    const cleanHref = href.split("?")[0];
    return pathname.startsWith(cleanHref);
  };

  const getLinkStyle = (href: string) => {
    const active = isActive(href);
    const isDarkBg = scrolled || !isHome;

    if (isDarkBg) {
      return active
        ? "bg-midnight text-pearl font-bold rounded-full px-4 py-2 shadow-xs"
        : "text-midnight/70 hover:text-midnight font-semibold opacity-85 hover:opacity-100 px-1 py-2";
    } else {
      return active
        ? "bg-white/20 text-pearl font-bold rounded-full px-4 py-2 shadow-xs"
        : "text-pearl/80 hover:text-pearl font-semibold px-1 py-2";
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center w-full transition-all ease-out duration-500 ${
        scrolled ? "pt-2 md:pt-3" : "pt-4 md:pt-5"
      }`}
    >
      <nav 
        className={`rounded-full transition-all ease-out duration-500 ${
          scrolled
            ? "w-[85%] max-w-5xl bg-[#FFF7E6]/90 backdrop-blur-md border border-[#102E4A]/10 shadow-lg text-midnight py-1 px-5"
            : isHome
              ? "w-[92%] max-w-6xl bg-white/10 backdrop-blur-xs border border-white/20 text-pearl shadow-xs py-2.5 px-7"
              : "w-[92%] max-w-6xl bg-[#FFF7E6]/90 backdrop-blur-md border border-[#102E4A]/10 shadow-md text-midnight py-2 px-6"
        }`}
      >
        <div className="w-full">
          <div className="flex justify-between items-center h-14 md:h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <img 
                src="/logo.png" 
                alt="CampusNest Logo" 
                className={`object-contain transition-all ease-out duration-500 ${
                  scrolled 
                    ? "w-10 h-10 md:w-12 md:h-12 brightness-0" 
                    : "w-12 h-12 md:w-14 md:h-14 brightness-0 invert"
                }`} 
              />
              <span className="text-xl font-sans font-bold tracking-tight">
                CampusNest
              </span>
              <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full transition-all duration-300 ${
                isHome && !scrolled ? "bg-white/20 text-white" : "bg-midnight/10 text-midnight"
              }`}>
                Tier 2 & 3
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link href="/" className={`${getLinkStyle("/")} text-xs transition-all duration-300`}>
                Home
              </Link>
              <Link href="/search?query=" className={`${getLinkStyle("/search")} text-xs transition-all duration-300`}>
                Search PG
              </Link>
              <Link 
                href="/track" 
                className={`${getLinkStyle("/track")} text-xs transition-all duration-300 flex items-center gap-1.5`}
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span>Track Booking</span>
              </Link>
              <Link 
                href="/partner" 
                className={`${getLinkStyle("/partner")} text-xs transition-all duration-300 flex items-center gap-1.5`}
              >
                <Building className="w-3.5 h-3.5 shrink-0" />
                <span>Register PG</span>
              </Link>

              {user ? (
                <div className="flex items-center space-x-4 lg:space-x-6 border-l border-beige/30 pl-4 lg:pl-6">
                  <Link
                    href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                    className={`${getLinkStyle(user.role === "admin" ? "/admin" : "/owner/dashboard")} text-xs transition-all duration-300 flex items-center gap-1.5`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                    <span>{user.role === "admin" ? "Admin" : "Dashboard"}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-red-700 hover:text-red-900 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center px-4.5 py-2.5 text-xs font-bold rounded-full transition-all shadow-xs cursor-pointer ${
                    scrolled || !isHome
                      ? "bg-midnight hover:bg-midnight-light text-pearl"
                      : "bg-white hover:bg-white/90 text-midnight"
                  }`}
                >
                  Owner Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:opacity-80 focus:outline-none p-2 cursor-pointer transition-opacity"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden border-t border-beige/25 rounded-b-[22px] shadow-lg mt-1 overflow-hidden"
            style={scrolled || !isHome ? {
              background: "rgba(255, 247, 230, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)"
            } : {
              background: "rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(20px) saturate(130%)",
              WebkitBackdropFilter: "blur(20px) saturate(130%)"
            }}
          >
            <div className="px-5 pt-4 pb-6 space-y-3.5 flex flex-col font-sans">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                  isActive("/") 
                    ? "bg-midnight text-pearl" 
                    : "text-midnight/80 bg-beige/10 hover:bg-beige/20"
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Home</span>
              </Link>
              <Link
                href="/search?query="
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                  isActive("/search") 
                    ? "bg-midnight text-pearl" 
                    : "text-midnight/80 bg-beige/10 hover:bg-beige/20"
                }`}
              >
                <Home className="w-4 h-4 opacity-0 shrink-0" />
                <span>Search PG</span>
              </Link>
              <Link
                href="/track"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                  isActive("/track") 
                    ? "bg-midnight text-pearl" 
                    : "text-midnight/80 bg-beige/10 hover:bg-beige/20"
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Track Booking</span>
              </Link>
              <Link
                href="/partner"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                  isActive("/partner") 
                    ? "bg-midnight text-pearl" 
                    : "text-midnight/80 bg-beige/10 hover:bg-beige/20"
                }`}
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>Register PG Form</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-xs font-bold p-3 rounded-xl flex items-center gap-2.5 transition-all ${
                      isActive(user.role === "admin" ? "/admin" : "/owner/dashboard") 
                        ? "bg-midnight text-pearl" 
                        : "text-midnight/80 bg-beige/10 hover:bg-beige/20"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>{user.role === "admin" ? "Admin Portal" : "My Dashboard"}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-xs font-bold text-red-750 p-3 bg-red-50/40 rounded-xl cursor-pointer flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Logout ({user.name})</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center inline-flex items-center justify-center px-4 py-3 text-xs font-bold rounded-xl text-pearl bg-midnight hover:bg-midnight-light shadow-md cursor-pointer mt-1"
                >
                  Owner Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
