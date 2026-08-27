import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusNest - Direct PG Bookings for Tier 2 & 3 College Outskirts",
  description: "SecurePaying Guest (PG) and hostel accommodation bookings near Tier 2 and Tier 3 colleges with secure escrow reservations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 relative">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>

        {/* Floating Support Widget */}
        <div className="fixed bottom-4 right-4 z-40">
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-2xl transition-transform hover:scale-105 cursor-pointer"
            title="CampusNest Customer Support"
          >
            <span className="text-base">💬</span>
            <span>Support: +91 99999 99999</span>
          </a>
        </div>
        <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
          <div className="max-w-6xl mx-auto px-4">
            <p>© {new Date().getFullYear()} CampusNest. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-400 max-w-md mx-auto">
              CampusNest is a match-making and reservation portal. Rental agreements and monthly payments are handled directly between the tenant and owner. The platform is not liable for disputes arising after check-in.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
