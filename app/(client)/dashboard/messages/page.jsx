"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getBookings } from "@/services/booking.service";
import { getMessages, sendMessage } from "@/services/message.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/loading";
import { toast } from "sonner";
import { Send, Search, MessageSquare, AlertCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// â”€â”€â”€ Date / time helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatEventDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString([], {
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
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
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

// â”€â”€â”€ Chef info helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getChefName(booking) {
  const u = booking?.chef?.user;
  if (!u) return "Chef";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Chef";
}

// â”€â”€â”€ Shared UI atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function InitialsAvatar({ name, className }) {
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

function UserAvatar({ src, name, className }) {
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

// â”€â”€â”€ Conversation item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ConversationItem({ booking, isSelected, onClick }) {
  const name = getChefName(booking);
  const eventDate = formatEventDate(booking.eventDate);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border/50 transition-colors flex items-center gap-3",
        isSelected ? "bg-secondary" : "hover:bg-secondary/50",
      )}
    >
      <InitialsAvatar name={name} className="w-11 h-11 text-sm" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">Chef {name.split(" ")[0]}</p>
        <p className="text-xs text-muted-foreground truncate">
          {eventDate ? `Event Â· ${eventDate}` : booking.status}
        </p>
      </div>
      <span
        className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 capitalize",
          booking.status === "confirmed"
            ? "bg-emerald-100 text-emerald-700"
            : booking.status === "pending"
              ? "bg-amber-100 text-amber-700"
              : "bg-secondary text-muted-foreground",
        )}
      >
        {booking.status}
      </span>
    </button>
  );
}

// â”€â”€â”€ Message bubble â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MessageBubble({ msg, isMine, showAvatar }) {
  const senderName = msg.sender
    ? `${msg.sender.firstName ?? ""} ${msg.sender.lastName ?? ""}`.trim() || "User"
    : "User";

  return (
    <div className={cn("flex items-end gap-2.5", isMine && "flex-row-reverse")}>
      {/* Avatar â€” visible only on the last bubble of a consecutive run */}
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
          {formatTime(msg.createdAt)}
          {msg._optimistic && " Â·"}
        </p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Message thread â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MessageThread({ booking, currentUser, onBack }) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");

  const bookingId = booking._id;
  const name = getChefName(booking);
  const currentUserId = currentUser?._id?.toString();

  // Fetch messages, polling every 5 s â€” avoids Socket.IO for MVP while keeping
  // the UI structure ready for a drop-in WebSocket upgrade later.
  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["messages", bookingId],
    queryFn: () => getMessages(bookingId),
    enabled: !!bookingId,
    refetchInterval: 5_000,
    staleTime: 0,
  });

  // Optimistic send: append a temporary bubble immediately, rollback on error
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
            _id: currentUser?._id,
            firstName: currentUser?.firstName,
            lastName: currentUser?.lastName,
            avatar: currentUser?.avatar ?? null,
          },
          message: text,
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
      const errMsg = err?.response?.data?.message ?? "Failed to send message.";
      toast.error(errMsg);
    },

    onSuccess: () => {
      // Replace the optimistic entry with the server-confirmed message
      queryClient.invalidateQueries({ queryKey: ["messages", bookingId] });
    },
  });

  // Auto-scroll to the newest message whenever the list changes
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
      {/* Thread header */}
      <div className="h-16 px-4 md:px-6 border-b border-border flex items-center gap-3 bg-card shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <InitialsAvatar name={name} className="w-9 h-9 text-xs" />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">Chef {name.split(" ")[0]}</p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {booking.status} booking
            {booking.eventDate ? ` Â· ${formatEventDate(booking.eventDate)}` : ""}
          </p>
        </div>
      </div>

      {/* Messages list */}
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
            {/* Day separator */}
            <div className="flex justify-center py-3">
              <span className="text-[11px] font-semibold bg-secondary text-muted-foreground px-3 py-1 rounded-full uppercase tracking-wider">
                {group.label}
              </span>
            </div>
            <div className="space-y-3">
              {group.messages.map((msg, idx) => {
                const isMine = msg.sender?._id?.toString() === currentUserId;
                const next = group.messages[idx + 1];
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

        {/* Invisible scroll anchor â€” always at the bottom of the list */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          {/* Attachment button placeholder â€” ready for image upload in a future phase */}
          <Input
            className="flex-1 bg-secondary border-transparent rounded-full px-5 focus-visible:ring-1 focus-visible:ring-primary h-12"
            placeholder="Type a messageâ€¦"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendMutation.isPending}
            aria-label="Message input"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-full bg-accent hover:bg-accent/90 focus-visible:ring-accent h-12 w-12 shadow-sm"
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

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // "list" | "thread"
  const [search, setSearch] = useState("");

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    isError: bookingsError,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
    staleTime: 30_000,
  });

  const selectedBooking = bookings.find((b) => b._id === selectedBookingId) ?? null;

  const filtered = !search.trim()
    ? bookings
    : bookings.filter((b) =>
        getChefName(b).toLowerCase().includes(search.toLowerCase()),
      );

  function selectBooking(bookingId) {
    setSelectedBookingId(bookingId);
    setMobileView("thread");
  }

  return (
    <div className="h-[700px] border border-border rounded-2xl overflow-hidden bg-card flex shadow-sm">
      {/* â”€â”€ Conversation sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className={cn(
          "w-full lg:w-80 border-r border-border bg-muted/20 flex flex-col shrink-0",
          mobileView === "thread" ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="p-4 border-b border-border bg-card">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          <Input
            placeholder="Search conversationsâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="h-10 bg-background"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {bookingsLoading && (
            <div className="flex justify-center pt-8">
              <Loading />
            </div>
          )}

          {bookingsError && !bookingsLoading && (
            <div className="flex flex-col items-center gap-2 pt-8 px-4 text-center text-muted-foreground">
              <AlertCircle className="h-6 w-6 text-destructive/50" />
              <p className="text-sm">Could not load conversations.</p>
            </div>
          )}

          {!bookingsLoading && !bookingsError && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 pt-10 px-4 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-25" />
              <p className="text-sm">
                {search
                  ? "No conversations match your search."
                  : "No bookings yet. Book a chef to start messaging!"}
              </p>
            </div>
          )}

          {filtered.map((booking) => (
            <ConversationItem
              key={booking._id}
              booking={booking}
              isSelected={booking._id === selectedBookingId}
              onClick={() => selectBooking(booking._id)}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          mobileView === "list" ? "hidden lg:flex" : "flex",
        )}
      >
        {selectedBooking ? (
          <MessageThread
            booking={selectedBooking}
            currentUser={user}
            onBack={() => setMobileView("list")}
          />
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <MessageSquare className="h-16 w-16 opacity-20" />
            <p className="text-lg font-semibold">Select a conversation</p>
            <p className="text-sm opacity-70">
              Choose a booking from the list to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
