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

  const login = async (identifier, password) => {
    const r = await Auth.login({ identifier, password });
    localStorage.setItem("mde_token", r.data.token);
    setUser(r.data.user);
  };

  const signup = async (identifier, password) => {
    await Auth.register({ identifier, password });
    await login(identifier, password);
  };

  const changePassword = async (currentPassword, newPassword) => {
    await Auth.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
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
    <AuthCtx.Provider value={{ user, login, signup, changePassword, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
