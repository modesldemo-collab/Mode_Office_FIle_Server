import React, { createContext, useContext, useState, useEffect } from "react";
import { Auth } from "../api";

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mde_token");
    if (token) {
      Auth.me()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem("mde_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await Auth.login({ email, password });
    localStorage.setItem("mde_token", r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem("mde_token");
    setUser(null);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
