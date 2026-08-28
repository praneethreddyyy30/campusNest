"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col justify-center min-h-[70vh] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portal Sign In</h1>
        <p className="text-sm text-gray-500">
          Sign in to your PG Owner or Admin account to manage listings and bookings.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 text-xs font-semibold p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Registered Phone Number
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-gray-50 border rounded-md p-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md text-sm mt-6 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>Demo Login Details (from database seed):</p>
        <p>
          Owner: <strong className="font-mono text-gray-600">9876543210</strong> /{" "}
          <strong className="font-mono text-gray-600">password123</strong>
        </p>
        <p>
          Admin: <strong className="font-mono text-gray-600">9391333699</strong> /{" "}
          <strong className="font-mono text-gray-600">admin123</strong>
        </p>
      </div>
    </div>
  );
}
