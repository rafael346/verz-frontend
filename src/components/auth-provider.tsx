"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api } from "@/lib/api";

export type Role = "seller" | "bidder";
export type User = { id: number; email: string; role: Role };

type Auth = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, role: Role) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User | null>("/api/auth/me/")
      .then(setUser, () => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const signedIn = await api<User>("/api/auth/login/", { method: "POST", body: { email, password } });
    setUser(signedIn);
    return signedIn;
  }, []);

  const register = useCallback(async (email: string, password: string, role: Role) => {
    const created = await api<User>("/api/auth/register/", { method: "POST", body: { email, password, role } });
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout/", { method: "POST" });
    } finally {
      setUser(null); // sessão já expirada também termina deslogada
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return auth;
}
