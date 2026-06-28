import React, { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaedf6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing blobs matching the dashboard design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb-blob w-[400px] h-[400px] -left-20 top-[10%] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 animate-float opacity-45" />
        <div className="orb-blob w-[450px] h-[450px] -right-20 -top-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 opacity-45" style={{ animationDelay: '-5s' }} />
        <div className="orb-blob w-[200px] h-[200px] right-[10%] bottom-[10%] bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 opacity-45" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-4 bg-white/60 backdrop-blur-md rounded-3xl p-3.5 shadow-md border border-white/50">
            <img src="/emblem.svg" alt="Sri Lanka National Emblem" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2b254a] tracking-tight">
            Ministry of Digital Economy
          </h1>
          <p className="text-[#59537a] font-bold text-xs mt-1.5 uppercase tracking-wider">
            File Management System — Sri Lanka
          </p>
        </div>

        <div className="bg-white/45 backdrop-blur-md border border-white/50 rounded-[2rem] p-8 shadow-xl">
          <h2 className="text-md font-extrabold text-[#2b254a] mb-6 uppercase tracking-wider">
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#59537a] mb-2 uppercase tracking-wider">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/60 border border-[#cbd5e1] rounded-xl px-4 py-3 text-[#2b254a] placeholder-[#8b85ad] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm shadow-inner"
                placeholder="username or you@mde.gov.lk"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#59537a] mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/60 border border-[#cbd5e1] rounded-xl px-4 py-3 text-[#2b254a] placeholder-[#8b85ad] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-purple-500/20 uppercase tracking-wider text-xs"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => setError("If you want to use this system, please contact the IT Director and get your credentials.")}
              className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
            >
              No account? Sign up
            </button>
          </form>
        </div>
        <p className="text-center text-[#8b85ad] text-xs mt-6 font-medium">
          © 2025 Ministry of Digital Economy, Sri Lanka. All rights reserved.
        </p>
      </div>
    </div>
  );
}
