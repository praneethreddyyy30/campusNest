"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Smartphone, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.refresh(); // Refresh navbar status
        if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/owner/dashboard");
        }
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Failed to reach auth server. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col justify-center min-h-[76vh] space-y-8 bg-pearl font-sans text-midnight">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-sans font-bold text-midnight tracking-tight">Portal Sign In</h1>
        <p className="text-xs sm:text-sm text-midnight/60 max-w-sm mx-auto leading-relaxed">
          Sign in to your PG Owner or Admin account to manage accommodations, inquiries, and bookings.
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white border border-beige/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
              Registered Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-midnight/70 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-beige/10 border border-beige/40 rounded-xl p-3 text-xs text-midnight focus:outline-none focus:ring-1 focus:ring-midnight font-semibold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-midnight hover:bg-midnight-light text-pearl font-bold py-3.5 rounded-xl text-xs mt-6 transition-all shadow-xs cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-3.5 h-3.5" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Demo Credentials */}
      <div className="bg-beige/20 border border-beige/35 p-5 rounded-2xl text-center text-xs text-midnight/65 leading-relaxed space-y-1 font-sans">
        <p className="font-bold text-[10px] uppercase text-midnight/50 tracking-wider mb-1">Demo Login Credentials</p>
        <p>
          PG Owner: <strong className="font-mono text-midnight">9876543210</strong> / <strong className="font-mono text-midnight">password123</strong>
        </p>
        <p>
          Super Admin: <strong className="font-mono text-midnight">9999999999</strong> / <strong className="font-mono text-midnight font-bold">admin123</strong>
        </p>
      </div>
    </div>
  );
}
