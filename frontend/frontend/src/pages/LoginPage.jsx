import React, { useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode]         = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(identifier, password);
      } else {
        await login(identifier, password);
      }
    } catch (err) {
      setError(err?.response?.data?.error || (mode === "signup" ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 40px,#0ff1 40px,#0ff1 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#0ff1 40px,#0ff1 41px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ministry of Digital Economy
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            File Management System — Sri Lanka
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">
            {mode === "signup" ? "Create your account" : "Sign in to your account"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="username or you@mde.gov.lk"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? mode === "signup" ? "Creating account..." : "Signing in..."
                : mode === "signup" ? "Sign Up" : "Sign In"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "login" ? "signup" : "login"));
                setError("");
              }}
              className="w-full text-sm text-cyan-400 hover:text-cyan-300"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "No account? Sign up"}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-4">
          © 2025 Ministry of Digital Economy, Sri Lanka. All rights reserved.
        </p>
      </div>
    </div>
  );
}
