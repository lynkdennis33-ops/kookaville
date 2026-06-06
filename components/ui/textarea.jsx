import React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 resize-y",
            error && "border-red-500 focus-visible:ring-red-500",
            className,
          )}
          ref={ref}
          {...props}
        />

        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
