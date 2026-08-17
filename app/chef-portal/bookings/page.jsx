"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  ChefHat,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/shared/loading";
import { cn } from "@/lib/utils";
import {
  getBookings,
  acceptBooking,
  rejectBooking,
} from "@/services/booking.service";

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DURATION_OPTIONS = [2, 3, 4, 5];
const PAGE_SIZE = 10;

const STATUS_TABS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "accepted",  label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "rejected",  label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDate(iso) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    year:    "numeric",
    month:   "short",
    day:     "numeric",
  });
}

function formatTime12(time24) {
  if (!time24) return "\u2014";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function computeEndTime(startTime, durationHours) {
  if (!startTime) return "\u2014";
  const [h, m] = startTime.split(":").map(Number);
  const totalMins = h * 60 + m + durationHours * 60;
  const eh = Math.floor(totalMins / 60) % 24;
  const em = totalMins % 60;
  return formatTime12(`${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`);
}

function getClientName(booking) {
  if (!booking?.client) return "Unknown Client";
  return `${booking.client.firstName ?? ""} ${booking.client.lastName ?? ""}`.trim() || "Unknown Client";
}

// â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_CONFIG = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-800 border-amber-200" },
  accepted:  { label: "Accepted",  className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  rejected:  { label: "Rejected",  className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-secondary text-muted-foreground" };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
      cfg.className
    )}>
      {cfg.label}
    </span>
  );
}

// â”€â”€ Detail row helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// â”€â”€ Booking row card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingCard({ booking, onView }) {
  const clientName = getClientName(booking);
  const menuName   = booking.menu?.name ?? "\u2014";

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{clientName}</p>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatDate(booking.bookingDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {formatTime12(booking.eventTime)}
            {booking.duration ? (
              <span className="ml-1 text-foreground/60">
                &rarr; {formatTime12(booking.endTime)} ({booking.duration}h)
              </span>
            ) : null}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
          {menuName}
        </p>
      </div>

      <Button size="sm" variant="outline" onClick={() => onView(booking)}>
        <Eye className="h-4 w-4 mr-1.5" />
        View
      </Button>
    </div>
  );
}

// â”€â”€ Booking detail drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BookingDetail({ booking, onClose, onAccept, onReject }) {
  if (!booking) return null;

  const clientName = getClientName(booking);
  const menuName   = booking.menu?.name ?? "\u2014";
  const menuPrice  = booking.menu?.price;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">Booking Details</h2>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-6">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</h3>
            <p className="font-semibold text-base">{clientName}</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Details</h3>
            <div className="space-y-3">
              <DetailRow icon={Calendar} label="Booking Date" value={formatDate(booking.bookingDate)} />
              <DetailRow icon={Clock}    label="Start Time"   value={formatTime12(booking.eventTime)} />
              {booking.duration && (
                <DetailRow icon={Clock} label="Duration"
                  value={`${booking.duration}h (ends at ${formatTime12(booking.endTime)})`}
                />
              )}
              <DetailRow icon={Users} label="Guests"
                value={`${booking.guests} guest${booking.guests !== 1 ? "s" : ""}`}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</h3>
            <p className="font-semibold">{menuName}</p>
            {menuPrice != null && (
              <p className="text-sm text-muted-foreground">${menuPrice}/person</p>
            )}
          </section>

          {booking.specialRequests && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Special Requests</h3>
              <p className="text-sm bg-secondary rounded-lg px-4 py-3 leading-relaxed">
                {booking.specialRequests}
              </p>
            </section>
          )}

          {/* Conversation shortcut â€” links to the client messages page since
              a dedicated chef-portal messages route does not yet exist */}
          <section>
            <Link
              href="/chef-portal/bookings"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MessageSquare className="h-4 w-4" />
              Open Conversation
            </Link>
          </section>
        </div>

        {/* Footer â€” accept / reject only for pending bookings */}
        {booking.status === "pending" && (
          <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onReject(booking)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button className="flex-1" onClick={() => onAccept(booking)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Accept dialog (with duration selector) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AcceptDialog({ booking, onConfirm, onCancel, isPending }) {
  const [durationHours, setDurationHours] = useState(2);

  if (!booking) return null;

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Accept Booking"
      description="Choose the duration for this event. Duration cannot be changed after acceptance."
    >
      <div className="space-y-5 pt-2">
        <p className="text-sm text-muted-foreground">
          <strong>{getClientName(booking)}</strong> on{" "}
          <strong>{formatDate(booking.bookingDate)}</strong> starting at{" "}
          <strong>{formatTime12(booking.eventTime)}</strong>
        </p>

        <div>
          <p className="text-sm font-semibold mb-3">Select Duration</p>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setDurationHours(h)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 rounded-xl border-2 font-semibold transition-colors",
                  durationHours === h
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <span className="text-base font-bold">{h}h</span>
                <span className="text-xs font-normal opacity-70">{h * 60} min</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-secondary rounded-lg px-4 py-3 text-sm">
          <span className="text-muted-foreground">Event ends at: </span>
          <span className="font-semibold">
            {computeEndTime(booking.eventTime, durationHours)}
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={() => onConfirm(booking._id, durationHours)}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Accepting&hellip;</>
            ) : (
              "Confirm Accept"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


function RejectDialog({ booking, onConfirm, onCancel, isPending }) {
  if (!booking) return null;

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Reject Booking"
      description="This action cannot be undone. The client will be notified by email."
    >
      <div className="space-y-5 pt-2">
        <p className="text-sm text-muted-foreground">
          Reject the booking from <strong>{getClientName(booking)}</strong> on{" "}
          <strong>{formatDate(booking.bookingDate)}</strong>?
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={isPending}
            onClick={() => onConfirm(booking._id)}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting&hellip;</>
            ) : (
              "Confirm Reject"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ChefBookingsPage() {
  const queryClient = useQueryClient();

  const [activeStatus, setActiveStatus]     = useState("all");
  const [page, setPage]                     = useState(1);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [acceptTarget, setAcceptTarget]     = useState(null);
  const [rejectTarget, setRejectTarget]     = useState(null);

  const queryKey = ["chef-bookings", activeStatus, page];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () =>
      getBookings({
        status: activeStatus === "all" ? undefined : activeStatus,
        page,
        limit: PAGE_SIZE,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while loading next page
  });

  const bookings   = data?.bookings ?? [];
  const pagination = data?.pagination ?? null;

  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status);
    setPage(1);
  }, []);

  const acceptMutation = useMutation({
    mutationFn: ({ id, durationHours }) => acceptBooking(id, durationHours),
    onSuccess: (updatedBooking) => {
      toast.success("Booking accepted!", {
        description: `Duration: ${updatedBooking.duration}h \u2014 ends at ${formatTime12(updatedBooking.endTime)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["chef-bookings"] });
      setAcceptTarget(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? "Could not accept booking.";
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => rejectBooking(id),
    onSuccess: () => {
      toast.success("Booking rejected.");
      queryClient.invalidateQueries({ queryKey: ["chef-bookings"] });
      setRejectTarget(null);
      setViewingBooking(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? "Could not reject booking.";
      toast.error(msg);
    },
  });

  function openAccept(booking) {
    setViewingBooking(null);
    setAcceptTarget(booking);
  }

  function openReject(booking) {
    setViewingBooking(null);
    setRejectTarget(booking);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-primary" />
          Bookings
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage incoming booking requests.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md transition-colors -mb-px border-b-2",
              activeStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loading size="lg" text="Loading bookings\u2026" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <AlertCircle className="h-10 w-10 text-destructive/50" />
          <p className="font-medium">Could not load bookings.</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey })}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Filter className="h-10 w-10 opacity-20" />
          <p className="font-medium">No bookings found</p>
          {activeStatus !== "all" && (
            <p className="text-sm">
              Try{" "}
              <button className="underline" onClick={() => handleStatusChange("all")}>
                viewing all bookings
              </button>
              .
            </p>
          )}
        </div>
      )}

      {/* Booking list */}
      {!isLoading && !isError && bookings.length > 0 && (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onView={setViewingBooking}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
                <span className="ml-2 text-xs opacity-70">
                  ({pagination.totalItems} total)
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking detail drawer */}
      {viewingBooking && (
        <BookingDetail
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onAccept={openAccept}
          onReject={openReject}
        />
      )}

      {/* Accept dialog */}
      {acceptTarget && (
        <AcceptDialog
          booking={acceptTarget}
          isPending={acceptMutation.isPending}
          onConfirm={(id, durationHours) => acceptMutation.mutate({ id, durationHours })}
          onCancel={() => setAcceptTarget(null)}
        />
      )}

      {/* Reject dialog */}
      {rejectTarget && (
        <RejectDialog
          booking={rejectTarget}
          isPending={rejectMutation.isPending}
          onConfirm={(id) => rejectMutation.mutate(id)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
