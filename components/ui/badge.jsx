import React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border border-border",
    success: "border-transparent bg-emerald-500 text-white shadow",
    warning: "border-transparent bg-amber-500 text-white shadow",
    destructive: "border-transparent bg-red-500 text-white shadow",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
