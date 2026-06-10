"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: string;
  accountId?: string;
  permissions?: string[];
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSandbox: boolean;
  modules: any[];
  loadingModules: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, name: string, password?: string, company?: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  hasPagePermission: (moduleSlug: string, action: "view" | "add" | "edit" | "delete") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
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

  // Load dynamic modules with CRUD permissions for user
  useEffect(() => {
    async function loadModules() {
      try {
        setLoadingModules(true);
        const res = await fetch("/api/modules");
        const data = await res.json();
        if (data.modules) {
          setModules(data.modules);
        }
      } catch (err) {
        console.error("Failed to load modules in AuthContext:", err);
      } finally {
        setLoadingModules(false);
      }
    }
    if (user) {
      loadModules();
    } else {
      setModules([]);
      setLoadingModules(false);
    }
  }, [user]);

  // Auth routing guards
  useEffect(() => {
    if (loading) return;

    const isDashboardPath = pathname.startsWith("/dashboard");
    const isAuthPath = pathname === "/login" || pathname === "/register";

    if (!user && isDashboardPath) {
      // Bypassing login on direct reload for sandbox ease of preview
      setUser({
        id: "usr-admin",
        email: "admin@chatbot.com",
        name: "Sandbox Demo Admin",
        role: "super_admin",
        accountId: "acc-super-admin",
        permissions: [],
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

  const register = async (email: string, name: string, password?: string, company?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, company }),
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

  const hasPagePermission = (moduleSlug: string, action: "view" | "add" | "edit" | "delete"): boolean => {
    if (!user) return false;
    const normalizedRole = user.role?.toLowerCase() || "";
    if (normalizedRole === "super_admin" || normalizedRole === "super admin") {
      return true;
    }
    const mod = modules.find((m) => m.slug === moduleSlug);
    if (!mod) return false;
    return mod.permissions?.[action] || false;
  };

  const can = (permission: string): boolean => {
    if (!user) return false;
    const normalizedRole = user.role?.toLowerCase() || "";
    if (normalizedRole === "super_admin" || normalizedRole === "super admin") {
      return true;
    }

    // Map legacy static permission queries dynamically to loaded module permissions
    let moduleSlug = "";
    let action: "view" | "add" | "edit" | "delete" = "view";

    if (permission.startsWith("bots:")) {
      moduleSlug = "/dashboard/bots";
      action = permission.endsWith("manage") ? "edit" : "view";
    } else if (permission.startsWith("conversations:")) {
      moduleSlug = "/dashboard/inbox";
      action = permission.endsWith("manage") ? "edit" : "view";
    } else if (permission.startsWith("leads:")) {
      moduleSlug = "/dashboard/leads";
      action = permission.endsWith("manage") ? "edit" : "view";
    } else if (permission.startsWith("team:")) {
      moduleSlug = "/dashboard/users";
      action = permission.endsWith("manage") ? "edit" : "view";
    } else if (permission.startsWith("analytics:")) {
      moduleSlug = "/dashboard/analytics";
      action = "view";
    }

    if (moduleSlug && modules.length > 0) {
      return hasPagePermission(moduleSlug, action);
    }

    // Fallback for Admin role when modules are not loaded yet or for static configs
    if (normalizedRole === "admin") {
      return true;
    }
    // Live chat agents only have conversations rights
    if (normalizedRole === "agent") {
      return permission === "conversations:view" || permission === "conversations:manage";
    }
    // Staff members checked against assigned permission arrays
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSandbox, modules, loadingModules, login, register, logout, can, hasPagePermission }}>
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
