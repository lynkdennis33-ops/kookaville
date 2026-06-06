"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          error && "border-red-500 focus:ring-red-500",
          !selectedOption && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-dropdown text-popover-foreground bg-background"
          >
            <ul className="p-1">
              {options.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-2 text-sm outline-none hover:bg-secondary hover:text-secondary-foreground transition-colors",
                    value === option.value && "bg-secondary font-medium",
                  )}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
