"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "@/lib/api";

/**
 * AuthContext — single source of truth for authentication state.
 *
 * Architecture decision:
 *  - Context lives at the root layout so every page and component can access it.
 *  - The backend uses HTTP-only cookies for JWT storage, so this context never
 *    reads from localStorage. It relies entirely on the /auth/me endpoint to
 *    rehydrate state on page load/refresh.
 *  - `login()` is called by the login page after a successful POST /auth/login.
 *    The backend sets the cookie; this function only updates React state.
 *  - `logout()` calls POST /auth/logout to clear the server-side cookie,
 *    then clears local state.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Rehydrate auth state by asking the backend who the current cookie owner is.
   *
   * TODO Phase B: Replace the placeholder block below with:
   *
   *   const { data } = await api.get("/auth/me");
   *   setUser(data.user);
   *
   * The /auth/me endpoint verifies the HTTP-only cookie and returns the user object.
   * A 401 response means no valid session — user stays null.
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      // TODO Phase B: uncomment when backend is connected
      // const { data } = await api.get("/auth/me");
      // setUser(data.user);
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

  /**
   * Called by the login page after a successful POST /auth/login response.
   * The backend has already set the HTTP-only cookie at this point.
   * This function just populates React state with the returned user data.
   *
   * TODO Phase B: The login page will call:
   *   const { data } = await api.post("/auth/login", { email, password });
   *   login(data.user);
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Clears the server-side cookie and resets local state.
   *
   * TODO Phase B: Uncomment the API call below:
   *   await api.post("/auth/logout");
   *
   * The backend clears the cookie; we clear React state regardless of
   * whether the request succeeds (network failure should not trap users).
   */
  const logout = useCallback(async () => {
    try {
      // TODO Phase B: await api.post("/auth/logout");
    } catch {
      // Always clear local state even if the network call fails
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
