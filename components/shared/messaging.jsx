"use client";

/**
 * Shared messaging components used by both the client dashboard
 * (/dashboard/messages) and the chef portal (/chef-portal/messages).
 *
 * Exports: InitialsAvatar, UserAvatar, BookingInfoPanel, MessageThread,
 *          formatMsgTime, formatTime12, formatShortDate, formatBookingDate
 */

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { getToken } from "@/lib/token";
import {
  Send,
  ChevronLeft,
  MessageSquare,
  AlertCircle,
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/shared/loading";
import { cn } from "@/lib/utils";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/services/message.service";

// Derive the socket server URL from the API base URL (strip trailing /api)
const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatMsgTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatBookingDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDay(messages) {
  const map = new Map();
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(msg);
  }
  return Array.from(map.entries()).map(([, msgs]) => ({
    label: dayLabel(msgs[0].createdAt),
    messages: msgs,
  }));
}

// ── UI atoms ──────────────────────────────────────────────────────────────────

export function InitialsAvatar({ name, className }) {
  const initials =
    (name || "?")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 select-none",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function UserAvatar({ src, name, className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover shrink-0", className)}
      />
    );
  }
  return <InitialsAvatar name={name || "?"} className={className} />;
}

// ── Booking status badge ──────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:   "bg-amber-100 text-amber-700",
  accepted:  "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
        STATUS_COLORS[status] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

// ── Booking info panel (shown above the message thread) ───────────────────────

export function BookingInfoPanel({ booking }) {
  const menuName  = booking.menu?.name ?? "—";
  const eventDate = formatBookingDate(booking.bookingDate);
  const startTime = formatTime12(booking.eventTime);
  const endTime   = booking.endTime ? formatTime12(booking.endTime) : null;

  return (
    <div className="px-4 md:px-6 py-2.5 bg-muted/30 border-b border-border flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        {eventDate}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {startTime}
        {endTime && <span className="opacity-60"> → {endTime}</span>}
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 shrink-0" />
        {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
        {menuName}
      </span>
      <StatusBadge status={booking.status} />
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, showAvatar }) {
  const senderName = msg.sender
    ? `${msg.sender.firstName ?? ""} ${msg.sender.lastName ?? ""}`.trim() || "User"
    : "User";

  return (
    <div className={cn("flex items-end gap-2.5", isMine && "flex-row-reverse")}>
      {/* Avatar — hidden for consecutive messages from the same sender */}
      <div className={cn("w-8 h-8 shrink-0", !showAvatar && "invisible")}>
        <UserAvatar
          src={msg.sender?.avatar}
          name={senderName}
          className="w-8 h-8 text-[10px]"
        />
      </div>

      <div
        className={cn(
          "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-secondary text-foreground rounded-bl-sm",
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {msg.message}
        </p>
        <p
          className={cn(
            "text-[10px] mt-1 text-right",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          {formatMsgTime(msg.createdAt)}
          {/* optimistic indicator — disappears once the server confirms */}
          {msg._optimistic && " ·"}
        </p>
      </div>
    </div>
  );
}

// ── Message thread (header + info panel + message list + composer) ────────────

export function MessageThread({ booking, currentUser, onBack }) {
  const queryClient  = useQueryClient();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");

  const bookingId     = booking._id;
  const currentUserId = currentUser?._id?.toString();

  // Determine the other participant's name and role label
  const isClientView = currentUserId === booking.client?._id?.toString();
  const otherRole    = isClientView ? "Chef" : "Client";
  const otherName    = isClientView
    ? `${booking.chef?.user?.firstName ?? ""} ${booking.chef?.user?.lastName ?? ""}`.trim() || "Chef"
    : `${booking.client?.firstName ?? ""} ${booking.client?.lastName ?? ""}`.trim() || "Client";

  // Fetch messages; 5 s polling is the safety-net fallback — socket.io is primary
  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["messages", bookingId],
    queryFn:  () => getMessages(bookingId),
    enabled:  !!bookingId,
    staleTime: 0,
    // Socket.IO handles real-time delivery; polling is intentionally omitted
  });

  // ── Socket.IO real-time integration ─────────────────────────────────────────
  // Authenticates with the JWT stored in the cookie, joins the booking room,
  // and appends incoming messages directly to the cache (no extra REST fetch).
  // Rejoins the room automatically after reconnect and fetches any missed messages.
  useEffect(() => {
    if (!bookingId) return;

    const token = getToken();
    if (!token) return; // unauthenticated — REST still works; socket is optional

    let isFirstConnect = true;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Fired on initial connect AND after every successful reconnect
    socket.on("connect", () => {
      socket.emit("joinBooking", { bookingId });
      if (!isFirstConnect) {
        // After reconnect — fetch once to catch messages sent while disconnected
        queryClient.invalidateQueries({ queryKey: ["messages", bookingId] });
      }
      isFirstConnect = false;
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    socket.on("authError", ({ message }) => {
      console.warn("Socket auth error:", message);
    });

    socket.on("newMessage", ({ bookingId: incomingId, message: newMsg }) => {
      if (incomingId !== bookingId) return;

      // Append to cache; skip if already present (deduplicates when onSuccess
      // REST invalidation and the socket event resolve in either order)
      queryClient.setQueryData(["messages", bookingId], (old = []) => {
        if (old.some((m) => m._id?.toString() === newMsg._id?.toString())) return old;

        // Replace a matching optimistic bubble with the confirmed server document
        const filtered = old.filter(
          (m) =>
            !m._optimistic ||
            !(
              m.sender?._id?.toString() === newMsg.sender?._id?.toString() &&
              m.message === newMsg.message
            ),
        );

        return [...filtered, newMsg];
      });

      // Refresh conversation sidebar (unread counts, last message preview)
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => socket.disconnect();
  }, [bookingId, queryClient]);

  // Mark conversation as read when first opened
  useEffect(() => {
    if (!bookingId) return;
    markMessagesAsRead(bookingId).catch(() => {});
  }, [bookingId]);

  // Re-mark as read whenever fresh messages arrive while the thread is open
  useEffect(() => {
    if (!bookingId || !messages.length) return;
    const hasUnread = messages.some(
      (m) =>
        m.isRead === false &&
        m.receiver?._id?.toString() === currentUserId,
    );
    if (hasUnread) {
      markMessagesAsRead(bookingId).catch(() => {});
      // Invalidate conversation list so unread badge clears immediately
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [messages, bookingId, currentUserId, queryClient]);

  // ── Optimistic send mutation ──────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (text) => sendMessage(bookingId, text),

    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["messages", bookingId] });
      const previous = queryClient.getQueryData(["messages", bookingId]) ?? [];

      queryClient.setQueryData(["messages", bookingId], [
        ...previous,
        {
          _id: `temp-${Date.now()}`,
          sender: {
            _id:       currentUser?._id,
            firstName: currentUser?.firstName,
            lastName:  currentUser?.lastName,
            avatar:    currentUser?.avatar ?? null,
          },
          message:   text,
          createdAt: new Date().toISOString(),
          _optimistic: true,
        },
      ]);

      return { previous };
    },

    onError: (err, _text, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["messages", bookingId], ctx.previous);
      }
      toast.error(err?.response?.data?.message ?? "Failed to send message.");
    },

    onSuccess: () => {
      // Replace optimistic entry with confirmed server document
      queryClient.invalidateQueries({ queryKey: ["messages", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(text);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const dayGroups = groupByDay(messages);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* ── Thread header ── */}
      <div className="h-16 px-4 md:px-6 border-b border-border flex items-center gap-3 bg-card shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <InitialsAvatar name={otherName} className="w-9 h-9 text-xs" />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">
            {otherRole} {otherName.split(" ")[0]}
          </p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {booking.status} booking
          </p>
        </div>
      </div>

      {/* ── Booking info strip (date, time, menu, guests, status) ── */}
      <BookingInfoPanel booking={booking} />

      {/* ── Messages list ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-muted/10 min-h-0">
        {isLoading && (
          <div className="flex justify-center pt-8">
            <Loading />
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <AlertCircle className="h-7 w-7 text-destructive/50" />
            <p className="text-sm">Could not load messages. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <MessageSquare className="h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Be the first to say hello!</p>
          </div>
        )}

        {dayGroups.map((group) => (
          <React.Fragment key={group.label}>
            <div className="flex justify-center py-3">
              <span className="text-[11px] font-semibold bg-secondary text-muted-foreground px-3 py-1 rounded-full uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            <div className="space-y-3">
              {group.messages.map((msg, idx) => {
                const isMine = msg.sender?._id?.toString() === currentUserId;
                const next   = group.messages[idx + 1];
                const showAvatar =
                  !next ||
                  next.sender?._id?.toString() !== msg.sender?._id?.toString();
                return (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          </React.Fragment>
        ))}

        {/* Invisible scroll anchor — always at the bottom of the list */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ── */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 bg-secondary border-transparent rounded-full px-5 focus-visible:ring-1 focus-visible:ring-primary h-12"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendMutation.isPending}
            aria-label="Message input"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-full h-12 w-12 shadow-sm"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
