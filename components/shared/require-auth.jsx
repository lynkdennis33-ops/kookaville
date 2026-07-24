"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingPage } from "@/components/shared/loading";

/**
 * RequireAuth — redirects unauthenticated users to /login.
 *
 * Shows a full-page loading spinner while the session is being restored on
 * first render. Once the session check completes:
 *   - authenticated → renders children
 *   - unauthenticated → redirects to /login
 */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingPage text="Verifying your session…" />;
  if (!user) return null;
  return <>{children}</>;
}

/**
 * RequireGuest — redirects authenticated users to their role-specific dashboard.
 *
 * Intended for pages that should only be visible to unauthenticated visitors
 * (login, signup). Shows a loading spinner during session restoration.
 */
export function RequireGuest({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const href =
        user.role === "chef"
          ? "/chef-portal/dashboard"
          : user.role === "admin"
            ? "/admin/dashboard"
            : "/dashboard";
      router.replace(href);
    }
  }, [user, loading, router]);

  if (loading) return <LoadingPage text="Loading…" />;
  if (user) return null;
  return <>{children}</>;
}

/**
 * RequireRole — allows access only to users with the given role.
 *
 * Unauthenticated users are redirected to /login.
 * Authenticated users with the wrong role are sent to their own dashboard.
 *
 * @param {{ role: 'client' | 'chef' | 'admin', children: React.ReactNode }} props
 */
export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== role) {
        const href =
          user.role === "chef"
            ? "/chef-portal/dashboard"
            : user.role === "admin"
              ? "/admin/dashboard"
              : "/dashboard";
        router.replace(href);
      }
    }
  }, [user, loading, role, router]);

  if (loading) return <LoadingPage text="Verifying access…" />;
  if (!user || user.role !== role) return null;
  return <>{children}</>;
}
