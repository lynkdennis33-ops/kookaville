"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";
import { clearToken } from "@/lib/token";

const AuthContext = createContext(null);

// ─── sessionStorage helpers (SSR-safe) ────────────────────────────────────────

function getChefFlag() {
  try { return sessionStorage.getItem("chef_session_established"); } catch { return null; }
}
function setChefFlag() {
  try { sessionStorage.setItem("chef_session_established", "true"); } catch {}
}
function clearChefFlag() {
  try { sessionStorage.removeItem("chef_session_established"); } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when the user's DB role is "chef" but the current browser session was
  // originally issued for a "client". The user must log out and back in.
  const [needsChefTransition, setNeedsChefTransition] = useState(false);

  /**
   * Apply a user payload and decide whether the chef-transition dialog is needed.
   * Safe to call from multiple code paths (initial load, polling, manual refresh).
   */
  const applyUser = useCallback((userData) => {
    setUser(userData);
    if (userData?.role === "chef") {
      // No sessionStorage flag means this is a promoted client, not a fresh chef login
      setNeedsChefTransition(!getChefFlag());
    } else {
      setNeedsChefTransition(false);
    }
  }, []);

  /**
   * Full refresh: rehydrates auth state from the backend.
   * Sets the loading spinner — only call from mounts or explicit user actions.
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      applyUser(data.data.user);
    } catch {
      setUser(null);
      setNeedsChefTransition(false);
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  // Restore session on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for 401 responses dispatched by api.js interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      clearChefFlag();
      setUser(null);
      setNeedsChefTransition(false);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  /**
   * Background poll — checks for chef approval while the user is browsing as a client.
   * Uses a generous interval (60 s) to stay well within the apiLimiter budget.
   * Stops automatically once the role changes away from "client".
   */
  useEffect(() => {
    if (!user || user.role !== "client") return;
    const id = setInterval(async () => {
      try {
        const { data } = await api.get("/auth/me");
        applyUser(data.data.user);
      } catch {
        // Silently ignore network errors in background poll
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [user?.role, applyUser]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Called by auth pages after a successful credential submission.
   * Token is already stored by auth.service before this is called.
   */
  const login = useCallback((userData) => {
    if (userData?.role === "chef") {
      // Fresh chef login: mark the session so the transition dialog is suppressed
      setChefFlag();
    }
    setUser(userData);
    setNeedsChefTransition(false);
  }, []);

  /**
   * Clears the JWT cookie and resets all local state.
   */
  const logout = useCallback(async () => {
    clearToken();
    clearChefFlag();
    setUser(null);
    setNeedsChefTransition(false);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
    needsChefTransition,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — consume auth state in any client component.
 * Throws if used outside of AuthProvider (fail-fast to catch misuse early).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
