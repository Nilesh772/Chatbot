"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSandbox: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load session on startup
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setUser(data.user);
        setIsSandbox(data.isSandbox);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname]);

  // Auth routing guards
  useEffect(() => {
    if (loading) return;

    const isDashboardPath = pathname.startsWith("/dashboard");
    const isAuthPath = pathname === "/login" || pathname === "/register";

    if (!user && isDashboardPath) {
      // Allow them to access dashboard even without login by using sandbox usr-admin
      // But we can nudge them or keep them in dashboard
      // Let's set a default sandbox user if none exists so they can view everything
      setUser({
        id: "usr-admin",
        email: "admin@chetbot.com",
        name: "Sandbox Demo Admin"
      });
    }

    if (user && isAuthPath) {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setUser(data.user);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setUser(data.user);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSandbox, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
