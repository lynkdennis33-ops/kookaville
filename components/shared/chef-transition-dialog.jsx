"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/**
 * ChefTransitionDialog — blocking modal shown when a client account has been
 * promoted to chef by an admin.
 *
 * The dialog has no dismiss or cancel option; the only action is to log out
 * and re-authenticate so the new JWT session carries the chef role correctly.
 *
 * Visibility is driven by AuthContext.needsChefTransition (derived from
 * backend state), so it reappears after a page refresh until the user
 * completes the logout/re-login cycle.
 */
export function ChefTransitionDialog() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Non-dismissible backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-background rounded-2xl shadow-dropdown p-8 text-center"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 mb-6">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>

          <h2 className="text-2xl font-bold mb-3">Your Chef Account Is Ready!</h2>

          <p className="text-muted-foreground mb-2">
            Congratulations! Your chef application has been approved.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Please log out and sign back in with the same email and password to
            continue to your Chef Portal.
          </p>

          <Button onClick={handleLogout} size="lg" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out and Continue
          </Button>
        </motion.div>
      </div>
    </>
  );
}
