"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

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
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">
              Campus<span className="text-indigo-800">Nest</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
              Tier 2 & 3
            </span>
          </Link>

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/partner"
              className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Register PG
            </Link>

            <Link
              href="/track"
              className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Track Booking
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {user.role === "admin" ? "⚙ Admin Portal" : "🏠 Owner Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none shadow-sm transition-colors cursor-pointer"
              >
                Owner Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle (Hidden on Desktop) */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none p-2 cursor-pointer"
              aria-label="Toggle Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg animate-slide-down">
          <div className="px-4 pt-3 pb-4 space-y-3 flex flex-col">
            <Link
              href="/partner"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-gray-700 hover:text-indigo-600 py-1.5 border-b"
            >
              📋 Register PG Form
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-gray-700 hover:text-indigo-600 py-1.5 border-b"
            >
              🔍 Track Booking
            </Link>

            {user ? (
              <>
                <Link
                  href={user.role === "admin" ? "/admin" : "/owner/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-extrabold text-indigo-600 py-1.5 border-b"
                >
                  {user.role === "admin" ? "⚙ Admin Portal" : "🏠 My Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-bold text-red-600 hover:text-red-800 py-1.5 cursor-pointer"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center inline-flex items-center justify-center px-4 py-2.5 border text-sm font-extrabold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer mt-2"
              >
                Owner Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
