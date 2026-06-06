import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function Stepper({ steps, currentStep, className }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border -z-10" />
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10"
          initial={{ width: "0%" }}
          animate={{
            width: `${(Math.max(0, currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.title}
              className="flex flex-col items-center relative z-10 w-8"
            >
              <motion.div
                initial={false}
                animate={{
                  backgroundColor:
                    isCompleted || isCurrent
                      ? "var(--primary)"
                      : "var(--background)",
                  borderColor:
                    isCompleted || isCurrent
                      ? "var(--primary)"
                      : "var(--border)",
                  color:
                    isCompleted || isCurrent
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)",
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm transition-colors",
                  isCurrent && "ring-4 ring-primary/20",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <div className="absolute top-10 w-24 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
