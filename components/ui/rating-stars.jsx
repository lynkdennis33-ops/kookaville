"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  max = 5,
  size = "md",
  className,
  readonly = true,
  onRatingChange,
}) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const fillPercentage = Math.max(0, Math.min(100, (rating - i) * 100));
        return (
          <div
            key={i}
            className={cn(
              "relative",
              !readonly &&
                "cursor-pointer transition-transform hover:scale-110",
            )}
            onClick={() => !readonly && onRatingChange && onRatingChange(i + 1)}
          >
            <Star
              className={cn("text-muted-foreground/30", sizeClasses[size])}
              strokeWidth={2}
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star
                className={cn(
                  "text-yellow-400 fill-yellow-400",
                  sizeClasses[size],
                )}
                strokeWidth={2}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
