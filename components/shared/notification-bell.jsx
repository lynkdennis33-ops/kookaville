"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { NotificationPanel } from "@/components/shared/notification-panel";
import { getUnreadCount } from "@/services/notification.service";
import { cn } from "@/lib/utils";

/**
 * Notification bell button with unread count badge.
 * Opens/closes a positioned dropdown panel.
 * Renders nothing for unauthenticated users.
 */
export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const { data: count = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const displayCount = count > 99 ? "99+" : count;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          count > 0
            ? `${count} unread notification${count !== 1 ? "s" : ""}`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "relative flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background transition-colors",
          "hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isOpen && "bg-secondary",
        )}
      >
        <Bell className="h-4 w-4 text-foreground" />

        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none select-none">
            {displayCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute right-0 z-50 mt-2 rounded-xl border border-border bg-background shadow-dropdown overflow-hidden",
              // Fixed width on desktop, near-full-width on small screens
              "w-80 max-h-[480px] flex flex-col",
              "max-sm:w-[min(20rem,calc(100vw-2rem))]",
            )}
          >
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
