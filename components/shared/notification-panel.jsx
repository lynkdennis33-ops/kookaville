"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/shared/loading";
import { NotificationItem } from "@/components/shared/notification-item";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHref,
} from "@/services/notification.service";

/**
 * Notification dropdown panel — rendered inside the bell popover.
 * Fetches notifications, handles read/unread mutations with optimistic UI.
 *
 * Props:
 *   onClose — called when the panel should close (e.g. after clicking a notification)
 */
export function NotificationPanel({ onClose }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "client";

  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    staleTime: 30_000,
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  // ── Mark single notification as read ────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      // Optimistically flip the single notification to isRead: true
      queryClient.setQueryData(["notifications"], (old = []) =>
        old.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      // Optimistically decrement the badge count
      queryClient.setQueryData(
        ["notifications", "unread-count"],
        (old = 0) => Math.max(0, old - 1),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // ── Mark all notifications as read ──────────────────────────────────────────

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old = []) =>
        old.map((n) => ({ ...n, isRead: true })),
      );
      queryClient.setQueryData(["notifications", "unread-count"], 0);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // ── Click handler ────────────────────────────────────────────────────────────

  function handleNotificationClick(notification) {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    const href = getNotificationHref(notification, userRole);
    onClose();
    if (href) {
      router.push(href);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="py-8">
            <Loading size="sm" text="Loading notifications..." />
          </div>
        ) : isError ? (
          <div className="py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn't load notifications.
            </p>
            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["notifications"] })
              }
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-sm">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll let you know when something important happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleNotificationClick}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border px-4 py-2.5 flex-shrink-0">
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="block text-center text-xs text-primary hover:underline font-medium py-0.5"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
