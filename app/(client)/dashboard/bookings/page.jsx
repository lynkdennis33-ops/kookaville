"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  PartyPopper,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/shared/loading";
import { getBookings, cancelBooking } from "@/services/booking.service";

// ── Status badge helpers ─────────────────────────────────────────────────────

/**
 * Coloured badge for booking status.
 * Kept separate from payment status so they are always displayed independently.
 */
function BookingStatusBadge({ status }) {
  const config = {
    pending:   { variant: "warning",     label: "Pending" },
    accepted:  { variant: "success",     label: "Accepted" },
    rejected:  { variant: "destructive", label: "Rejected" },
    completed: { variant: "default",     label: "Completed" },
    cancelled: { variant: "secondary",   label: "Cancelled" },
  };
  const { variant, label } = config[status] ?? { variant: "secondary", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

/**
 * Coloured badge for payment status.
 * Always displayed alongside BookingStatusBadge, never combined into one.
 */
function PaymentStatusBadge({ status }) {
  const config = {
    pending:  { variant: "warning",     label: "Payment Pending" },
    paid:     { variant: "success",     label: "Paid" },
    failed:   { variant: "destructive", label: "Payment Failed" },
    refunded: { variant: "secondary",   label: "Refunded" },
  };
  const { variant, label } = config[status] ?? { variant: "secondary", label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Booking Timeline ─────────────────────────────────────────────────────────

/**
 * Visual lifecycle indicator for a booking.
 * Milestones are easy to extend — append to the MILESTONES array to add more stages.
 */
function BookingTimeline({ status }) {
  const MILESTONES = [
    { key: "created",   label: "Submitted",    Icon: ClipboardList },
    { key: "reviewing", label: "Awaiting Chef", Icon: Clock },
    { key: "accepted",  label: "Accepted",      Icon: CheckCircle2 },
    { key: "completed", label: "Completed",     Icon: PartyPopper },
  ];

  // Number of milestones reached (0-indexed) based on booking status
  const reachedIndex = {
    pending:   1,
    accepted:  2,
    completed: 3,
    // rejected / cancelled branch off — shown as a separate note below
  }[status] ?? 1;

  if (status === "rejected" || status === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        <span>
          {status === "rejected"
            ? "This booking was rejected by the chef."
            : "This booking was cancelled."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-4">
      {MILESTONES.map((milestone, i) => {
        const { Icon } = milestone;
        const isReached = i <= reachedIndex;
        const isLast = i === MILESTONES.length - 1;

        return (
          <React.Fragment key={milestone.key}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                  isReached
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block whitespace-nowrap ${
                  isReached ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {milestone.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-px mb-3 ${
                  i < reachedIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Individual booking card ───────────────────────────────────────────────────

function BookingCard({ booking, onCancelRequest }) {
  const chefName = booking.chef?.user
    ? `${booking.chef.user.firstName} ${booking.chef.user.lastName}`
    : "—";

  const formattedDate = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const formattedCreated = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const totalPrice =
    booking.menu?.price != null && booking.guests != null
      ? booking.menu.price * booking.guests
      : null;

  // Only pending bookings can be cancelled by the client
  const canCancel = booking.status === "pending";

  return (
    <div className="p-6 rounded-xl border border-border bg-card flex flex-col gap-4">
      {/* Header: menu name + chef + status badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex gap-4 items-center">
          <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center text-xl shrink-0">
            👨‍🍳
          </div>
          <div>
            <h3 className="font-bold text-base">{booking.menu?.name || "Unnamed menu"}</h3>
            <p className="text-sm font-medium text-primary mt-0.5">{chefName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.paymentStatus} />
        </div>
      </div>

      {/* Booking detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t border-border pt-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Date</p>
          <p className="font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {formattedDate}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Time</p>
          <p className="font-medium">{booking.eventTime || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Guests</p>
          <p className="font-medium">{booking.guests ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Total</p>
          <p className="font-medium">{totalPrice != null ? `$${totalPrice}` : "—"}</p>
        </div>
      </div>

      {/* Progress timeline */}
      <BookingTimeline status={booking.status} />

      {/* Footer: creation date + cancel action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Booked on {formattedCreated}</p>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
            onClick={() => onCancelRequest(booking)}
          >
            Cancel booking
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Success banner — reads ?success=true from URL ────────────────────────────

function BookingsHeader() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            Review your past and upcoming dining experiences.
          </p>
        </div>
      </div>

      {isSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">
            Booking submitted! Your request is awaiting the chef&apos;s response.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClientBookingsPage() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });

  const { mutate: doCancel, isPending: cancelling } = useMutation({
    mutationFn: (id) => cancelBooking(id),
    onSuccess: () => {
      toast.success("Booking cancelled.");
      // Invalidate so the list refreshes immediately
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setCancelTarget(null);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || "Could not cancel booking. Please try again.";
      toast.error(msg);
      setCancelTarget(null);
    },
  });

  // Split into active (upcoming) and past
  const ACTIVE_STATUSES = new Set(["pending", "accepted"]);
  const activeBookings = bookings.filter((b) => ACTIVE_STATUSES.has(b.status));
  const pastBookings = bookings.filter((b) => !ACTIVE_STATUSES.has(b.status));

  return (
    <div className="space-y-8">
      {/* Success banner — uses Suspense because useSearchParams needs it */}
      <Suspense fallback={<div className="h-10" />}>
        <BookingsHeader />
      </Suspense>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loading size="lg" text="Loading your bookings…" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-red-200 rounded-xl bg-red-50">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-red-700 font-medium">Unable to load bookings.</p>
          <p className="text-sm text-red-500 mt-1">
            {error?.response?.data?.message || error?.message || "Please try again later."}
          </p>
        </div>
      )}

      {/* Bookings list */}
      {!isLoading && !isError && (
        <>
          {/* Empty state — no bookings at all */}
          {bookings.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t made any bookings yet.
              </p>
              <Button asChild>
                <Link href="/search">Find a chef</Link>
              </Button>
            </div>
          )}

          {/* Upcoming / active bookings */}
          {activeBookings.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Upcoming Events</h2>
              {activeBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancelRequest={setCancelTarget}
                />
              ))}
            </section>
          )}

          {/* Past bookings */}
          {bookings.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Past Experiences</h2>
              {pastBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card">
                  <p className="text-muted-foreground">No past bookings yet.</p>
                </div>
              ) : (
                pastBookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onCancelRequest={setCancelTarget}
                  />
                ))
              )}
            </section>
          )}
        </>
      )}

      {/* Cancellation confirmation modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel booking?"
        description={
          cancelTarget
            ? `Are you sure you want to cancel your booking with ${
                cancelTarget.chef?.user
                  ? `${cancelTarget.chef.user.firstName} ${cancelTarget.chef.user.lastName}`
                  : "the chef"
              }? This action cannot be undone.`
            : ""
        }
      >
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
          >
            Keep booking
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            isLoading={cancelling}
            onClick={() => cancelTarget && doCancel(cancelTarget._id)}
          >
            Yes, cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
