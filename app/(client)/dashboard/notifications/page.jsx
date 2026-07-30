"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/loading";
import { NotificationItem } from "@/components/shared/notification-item";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationHref,
} from "@/services/notification.service";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "client";
  const [page, setPage] = useState(1);

  const {
    data: allNotifications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    staleTime: 30_000,
  });

  const hasUnread = allNotifications.some((n) => !n.isRead);
  const totalPages = Math.max(1, Math.ceil(allNotifications.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedNotifications = allNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ── Mark single as read ──────────────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old = []) =>
        old.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
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
      toast.error("Could not mark notification as read.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // ── Mark all as read ─────────────────────────────────────────────────────────

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
      toast.error("Could not mark all notifications as read.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast.success("All notifications marked as read.");
    },
  });

  // ── Click handler ────────────────────────────────────────────────────────────

  function handleNotificationClick(notification) {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    const href = getNotificationHref(notification, userRole);
    if (href) {
      router.push(href);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your activity and alerts
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex-shrink-0"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <Loading size="default" text="Loading notifications..." />
          </div>
        ) : isError ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Failed to load notifications.
            </p>
            {error?.message && (
              <p className="text-xs text-red-500">{error.message}</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["notifications"] })
              }
            >
              Try again
            </Button>
          </div>
        ) : allNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground">
              No notifications yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              We'll let you know when something important happens.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Client-side pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
