import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Loading — inline spinner with an optional text label.
 *
 * Props:
 *   size    — "sm" | "default" | "lg"
 *   text    — optional label rendered below the spinner
 *   className — forwarded to the wrapper div
 *
 * Usage examples:
 *   <Loading />                          — default spinner
 *   <Loading size="sm" />               — small spinner (inside buttons)
 *   <Loading size="lg" text="Loading your bookings..." />
 */
export function Loading({ className, size = "default", text }) {
  const sizeMap = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * LoadingPage — full-viewport loading state.
 *
 * Used by:
 *   - AuthProvider while verifying the session cookie on first render
 *     (Phase B will render this while awaiting /auth/me).
 *   - Protected layouts while waiting for async data.
 *
 * Usage:
 *   if (loading) return <LoadingPage />;
 */
export function LoadingPage({ text = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading size="lg" text={text} />
    </div>
  );
}
