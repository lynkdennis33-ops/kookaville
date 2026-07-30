"use client";

import React from "react";
import { Bell, Calendar, CreditCard, MessageCircle, Star } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

// Maps backend notification type values to display config
const TYPE_CONFIG = {
  booking: { Icon: Calendar,      colour: "text-blue-500",   bg: "bg-blue-50" },
  message: { Icon: MessageCircle, colour: "text-violet-500", bg: "bg-violet-50" },
  review:  { Icon: Star,          colour: "text-amber-500",  bg: "bg-amber-50" },
  payment: { Icon: CreditCard,    colour: "text-emerald-500",bg: "bg-emerald-50" },
  system:  { Icon: Bell,          colour: "text-slate-500",  bg: "bg-slate-100" },
};

/**
 * A single notification row.
 *
 * Props:
 *   notification  — notification document from the backend
 *   onClick       — called with (notification) when the row is clicked
 *   compact       — omits the body message text (used in the dropdown panel)
 */
export function NotificationItem({ notification, onClick, compact = false }) {
  const { Icon, colour, bg } =
    TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors",
        "hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        !notification.isRead && "bg-primary/[0.04]",
      )}
    >
      {/* Type icon */}
      <div className={cn("mt-0.5 flex-shrink-0 rounded-full p-2", bg)}>
        <Icon className={cn("h-4 w-4", colour)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Unread indicator dot — visible only for unread; read slot kept for layout stability */}
          <span
            aria-hidden={notification.isRead}
            className={cn(
              "flex-shrink-0 h-2 w-2 rounded-full",
              !notification.isRead ? "bg-primary" : "bg-transparent",
            )}
          />
          <p
            className={cn(
              "text-sm leading-snug truncate",
              !notification.isRead
                ? "font-semibold text-foreground"
                : "font-medium text-foreground/75",
            )}
          >
            {notification.title}
          </p>
        </div>

        {!compact && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 pl-3.5">
            {notification.message}
          </p>
        )}

        <p className="mt-0.5 text-xs text-muted-foreground pl-3.5">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
