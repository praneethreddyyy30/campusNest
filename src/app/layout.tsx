import type { Metadata } from "next";
import { Allura, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { MessageCircle } from "lucide-react";

const allura = Allura({
  variable: "--font-allura",
  weight: ["400"],
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusNest - Direct PG Bookings for Tier 2 & 3 College Outskirts",
  description: "Secure Paying Guest (PG) and hostel accommodation bookings near Tier 2 and Tier 3 colleges with secure escrow reservations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${allura.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-pearl flex flex-col font-sans text-midnight relative antialiased selection:bg-midnight/10 selection:text-midnight">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>

        {/* Floating Support Widget */}
        <div className="fixed bottom-6 right-6 z-40">
          <a
            href="https://wa.me/919391333699"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-midnight hover:bg-midnight-light text-pearl font-semibold text-xs px-4 py-3 rounded-full shadow-lg border border-pearl/20 transition-all hover:scale-105 hover:-translate-y-0.5 cursor-pointer duration-200"
            title="CampusNest Customer Support"
          >
            <MessageCircle className="w-4 h-4 text-pearl" />
            <span>Support: +91 93913 33699</span>
          </a>
        </div>

        {/* Refined Midnight Footer */}
        <footer className="bg-midnight text-cream border-t border-midnight-light/50 pt-16 pb-12 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-midnight-light/30">
              
              {/* Brand Col */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <img 
                    src="/logo.png" 
                    alt="CampusNest Logo" 
                    className="w-9 h-9 object-contain brightness-0 invert" 
                  />
                  <span className="text-xl font-sans font-bold tracking-tight text-pearl">
                    CampusNest
                  </span>
                </div>
                <p className="text-xs text-cream/70 leading-relaxed max-w-xs">
                  A premium, modern platform built exclusively for students to find safe, verified, and affordable PG accommodations near their college outskirts.
                </p>
                <div className="text-[10px] inline-block bg-pearl/10 text-pearl px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Tier 2 & 3 Campuses
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-xs font-bold text-pearl uppercase tracking-wider mb-4">Quick Links</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <a href="/search?query=" className="text-cream/75 hover:text-pearl transition-colors">
                      Search PG
                    </a>
                  </li>
                  <li>
                    <a href="/track" className="text-cream/75 hover:text-pearl transition-colors">
                      Track Booking
                    </a>
                  </li>
                  <li>
                    <a href="/#how-it-works" className="text-cream/75 hover:text-pearl transition-colors">
                      How It Works
                    </a>
                  </li>
                </ul>
              </div>

              {/* For Owners */}
              <div>
                <h4 className="text-xs font-bold text-pearl uppercase tracking-wider mb-4">For Owners</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <a href="/partner" className="text-cream/75 hover:text-pearl transition-colors">
                      Register PG
                    </a>
                  </li>
                  <li>
                    <a href="/login" className="text-cream/75 hover:text-pearl transition-colors">
                      Owner Dashboard
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-xs font-bold text-pearl uppercase tracking-wider mb-4">Support</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <a href="https://wa.me/919391333699" target="_blank" rel="noopener noreferrer" className="text-cream/75 hover:text-pearl transition-colors">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <span className="text-cream/50 cursor-default">Help Center</span>
                  </li>
                  <li>
                    <span className="text-cream/50 cursor-default">Terms & Conditions</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Footer Bottom */}
            <div className="pt-8 text-center space-y-4">
              <p className="text-xs text-cream/50">
                © {new Date().getFullYear()} CampusNest. All rights reserved.
              </p>
              <p className="text-[10px] text-cream/40 max-w-2xl mx-auto leading-relaxed">
                CampusNest is a match-making and reservation portal. Rental agreements and monthly payments are handled directly between the tenant and owner. The platform is not liable for disputes arising after check-in.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
