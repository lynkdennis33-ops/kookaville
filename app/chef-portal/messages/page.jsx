"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getConversations } from "@/services/message.service";
import { Loading } from "@/components/shared/loading";
import { Input } from "@/components/ui/input";
import {
  MessageThread,
  InitialsAvatar,
  formatShortDate,
  formatTime12,
} from "@/components/shared/messaging";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { ChefHat, Search, MessageSquare, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientName(booking) {
  const c = booking?.client;
  if (!c) return "Client";
  return `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "Client";
}

// ── Conversation list item (chef perspective: shows client info) ──────────────

function ConversationItem({ conversation, isSelected, onClick }) {
  const { booking, lastMessage, unreadCount } = conversation;

  const clientName = getClientName(booking);
  const menuName   = booking.menu?.name ?? null;
  const eventDate  = formatShortDate(booking.bookingDate);
  const eventTime  = formatTime12(booking.eventTime);
  const hasUnread  = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border/50 transition-colors flex items-start gap-3",
        isSelected ? "bg-secondary" : "hover:bg-secondary/50",
      )}
    >
      <InitialsAvatar name={clientName} className="w-11 h-11 text-sm mt-0.5" />

      <div className="flex-1 min-w-0">
        {/* Client name + unread badge + relative time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-semibold text-sm truncate">
            {clientName}
            {menuName && (
              <span className="font-normal text-muted-foreground">
                {" · "}
                {menuName}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasUnread && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {lastMessage && (
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Booking date + time */}
        <p className="text-xs text-muted-foreground truncate">
          {eventDate
            ? `${eventDate}${eventTime ? " · " + eventTime : ""}`
            : "No date set"}
        </p>

        {/* Last message preview */}
        {lastMessage ? (
          <p
            className={cn(
              "text-xs truncate mt-0.5",
              hasUnread
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {lastMessage.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
            No messages yet
          </p>
        )}
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChefMessagesPage() {
  const { user }                         = useAuth();
  const [selectedBookingId, setSelected] = useState(null);
  const [mobileView, setMobileView]      = useState("list"); // "list" | "thread"
  const [search, setSearch]              = useState("");

  const { data: conversations = [], isLoading, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn:  getConversations,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const selectedConversation =
    conversations.find((c) => c.booking._id === selectedBookingId) ?? null;

  const filtered = !search.trim()
    ? conversations
    : conversations.filter((c) =>
        getClientName(c.booking).toLowerCase().includes(search.toLowerCase()),
      );

  function selectConversation(bookingId) {
    setSelected(bookingId);
    setMobileView("thread");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Messages
        </h1>
        <p className="text-muted-foreground mt-1">
          Chat with clients about their bookings.
        </p>
      </div>

      {/* Messaging panel */}
      <div className="h-[700px] border border-border rounded-2xl overflow-hidden bg-card flex shadow-sm">

        {/* ── Conversation sidebar ── */}
        <div
          className={cn(
            "w-full lg:w-80 border-r border-border bg-muted/20 flex flex-col shrink-0",
            mobileView === "thread" ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="p-4 border-b border-border bg-card">
            <h2 className="text-lg font-bold mb-3">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-background pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex justify-center pt-8">
                <Loading />
              </div>
            )}

            {isError && !isLoading && (
              <div className="flex flex-col items-center gap-2 pt-8 px-4 text-center text-muted-foreground">
                <AlertCircle className="h-6 w-6 text-destructive/50" />
                <p className="text-sm">Could not load conversations.</p>
              </div>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 pt-10 px-4 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-25" />
                <p className="text-sm">
                  {search
                    ? "No conversations match your search."
                    : "No bookings yet. Conversations will appear here once clients book you."}
                </p>
              </div>
            )}

            {filtered.map((conversation) => (
              <ConversationItem
                key={conversation.booking._id}
                conversation={conversation}
                isSelected={conversation.booking._id === selectedBookingId}
                onClick={() => selectConversation(conversation.booking._id)}
              />
            ))}
          </div>
        </div>

        {/* ── Thread panel ── */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            mobileView === "list" ? "hidden lg:flex" : "flex",
          )}
        >
          {selectedConversation ? (
            <MessageThread
              booking={selectedConversation.booking}
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
    </div>
  );
}
