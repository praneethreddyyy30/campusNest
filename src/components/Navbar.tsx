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

  return (
    <header className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-50 pt-4 md:pt-5 px-4 flex justify-center w-full transition-all duration-300`}>
      <nav 
        className={`w-[92%] max-w-6xl rounded-[22px] transition-all duration-350 ${
          scrolled
            ? "bg-[#FFF7E6]/90 backdrop-blur-md border border-[#102E4A]/10 shadow-md text-midnight"
            : isHome
              ? "bg-white/10 backdrop-blur-xs border border-white/20 text-pearl shadow-xs"
              : "bg-[#FFF7E6]/90 backdrop-blur-md border border-[#102E4A]/10 shadow-md text-midnight"
        }`}
      >
        <div className="px-6 sm:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="CampusNest Logo" 
                className={`w-11 h-11 md:w-12 md:h-12 object-contain transition-all duration-300 ${
                  isHome && !scrolled ? "brightness-0 invert" : ""
                }`} 
              />
              <span className="text-xl font-sans font-bold tracking-tight">
                CampusNest
              </span>
              <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full transition-all duration-300 ${
                isHome && !scrolled ? "bg-white/20 text-white" : "bg-midnight/10 text-midnight"
              }`}>
                Tier 2 & 3
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-xs font-semibold hover:opacity-80 transition-opacity"
              >
                Home
              </Link>
              <Link
                href="/search?query="
                className="text-xs font-semibold hover:opacity-80 transition-opacity"
              >
                Search PG
              </Link>
              <Link
                href="/track"
                className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Track Booking</span>
              </Link>
              <Link
                href="/partner"
                className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Register PG</span>
              </Link>

              {user ? (
                <div className="flex items-center space-x-6">
                  <Link
                    href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                    className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{user.role === "admin" ? "Admin Portal" : "Dashboard"}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-red-700 hover:text-red-900 cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-pearl bg-midnight hover:bg-midnight-light transition-all shadow-sm cursor-pointer"
                >
                  Owner Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:opacity-80 focus:outline-none p-2 cursor-pointer"
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
            className="md:hidden border-t border-beige/20 rounded-b-[22px] shadow-lg"
            style={isHome ? {
              background: "rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(20px) saturate(130%)",
              WebkitBackdropFilter: "blur(20px) saturate(130%)"
            } : {
              background: "rgba(255, 247, 230, 0.95)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)"
            }}
          >
            <div className="px-6 pt-3 pb-6 space-y-4 flex flex-col">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold py-1 border-b border-beige/10 flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5 text-midnight/70" />
                Home
              </Link>
              <Link
                href="/search?query="
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold py-1 border-b border-beige/10 flex items-center gap-2"
              >
                Search PG
              </Link>
              <Link
                href="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold py-1 border-b border-beige/10 flex items-center gap-2"
              >
                <ClipboardList className="w-3.5 h-3.5 text-midnight/70" />
                Track Booking
              </Link>
              <Link
                href="/partner"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold py-1 border-b border-beige/10 flex items-center gap-2"
              >
                <Building className="w-3.5 h-3.5 text-midnight/70" />
                Register PG Form
              </Link>

              {user ? (
                <>
                  <Link
                    href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-semibold py-1 border-b border-beige/10 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-midnight/70" />
                    {user.role === "admin" ? "Admin Portal" : "My Dashboard"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-left text-xs font-semibold text-red-700 py-1.5 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout ({user.name})
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-lg text-pearl bg-midnight hover:bg-midnight-light shadow-sm cursor-pointer mt-2"
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
