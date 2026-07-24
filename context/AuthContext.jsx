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

/**
 * AuthContext — single source of truth for authentication state.
 *
 * Architecture decision:
 *  - Context lives at the root layout so every page and component can access it.
 *  - The JWT is stored in a first-party cookie by auth.service. lib/api.js
 *    reads it and attaches it as a Bearer token on every request.
 *  - `login()` is called by auth pages after the API returns a user object.
 *    The token is already stored by auth.service before login() is called.
 *  - `logout()` clears the cookie and resets local React state.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Rehydrate auth state by asking the backend who the current session owner is.
   * Called once on mount. Reads the stored JWT cookie via api.js interceptor.
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      setUser(data.data.user);
    } catch {
      // No valid session — treat as unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on mount to restore session from cookie
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for 401 responses dispatched by api.js interceptor.
  // Clears the session when the backend reports the token is expired/invalid.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  /**
   * Called by login/signup pages after a successful API response.
   * The token is already stored by auth.service before this is called.
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Clears the JWT cookie and resets local state.
   */
  const logout = useCallback(async () => {
    try {
      clearToken();
    } catch {
      // Always clear local state even if something goes wrong
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — consume auth state in any client component.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 * Throws if used outside of AuthProvider (fail-fast to catch misuse early).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
