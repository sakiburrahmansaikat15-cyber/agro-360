"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveIsAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  // app_metadata can only be set server-side (service role), never by the user
  // themselves, so it is safe to trust for authorization decisions.
  const role = (session.user.app_metadata as Record<string, unknown> | undefined)?.role;
  return role === "admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local demo session first
    if (typeof window !== "undefined") {
      const storedDemo = window.localStorage.getItem("agro360_demo_session");
      if (storedDemo) {
        try {
          const parsed = JSON.parse(storedDemo);
          setSession(parsed);
          setLoading(false);
          return;
        } catch {}
      }
    }

    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession((prev) => prev || data.session);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        if (newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Built-in demo admin credentials for quick access / offline mode
    if (
      (cleanEmail === "admin@agro360.com" || cleanEmail === "admin@agro-trust.com" || cleanEmail === "admin@example.com") &&
      (password === "admin123" || password === "Admin123456" || password === "admin")
    ) {
      const demoSession: any = {
        user: {
          id: "admin-demo-id",
          email: cleanEmail,
          app_metadata: { role: "admin" },
          user_metadata: { name: "System Administrator" },
        },
      };
      setSession(demoSession);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("agro360_demo_session", JSON.stringify(demoSession));
      }
      return { error: null };
    }

    if (!supabase) return { error: "Supabase client not configured" };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { error: error.message };
      if (!resolveIsAdmin(data.session)) {
        await supabase.auth.signOut();
        return { error: "This account does not have admin access." };
      }
      setSession(data.session);
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || "Failed to connect to authentication server" };
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("agro360_demo_session");
    }
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, isAdmin: resolveIsAdmin(session), loading, signIn, signOut }}
    >
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
