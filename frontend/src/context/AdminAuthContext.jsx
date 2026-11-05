import { createContext, useContext, useEffect, useState } from "react";
import { apiPost } from "../services/api";
import {
  getAdminToken,
  setAdminToken,
  setAdminUser,
  getAdminUser,
  clearAdminSession,
} from "../utils/custom";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => getAdminToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cached = await getAdminUser(token);
      if (cached) setUser(cached);

      const res = await apiPost("/admin/dashboard", {}, { token });
      if (res?.status === 1) {
        setUser(res.data);
        await setAdminUser(res.data, token);
      } else {
        clearAdminSession();
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    boot();
  }, [token]);

  const login = async (email, password) => {
    const res = await apiPost("/admin/login", { email, password });
    if (res?.status !== 1) {
      return { ok: false, message: res?.message || "Login failed" };
    }
    const nextToken = res.data.token;
    setAdminToken(nextToken);
    await setAdminUser(res.data.user, nextToken);
    setToken(nextToken);
    setUser(res.data.user);
    return { ok: true };
  };

  const logout = () => {
    clearAdminSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ token, user, loading, login, logout, isAuthenticated: !!token && !!user }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}