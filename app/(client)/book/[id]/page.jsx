"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, CreditCard, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Loading } from "@/components/shared/loading";
import { getChefById } from "@/services/chef.service";
import { getMenusByChef } from "@/services/menu.service";
import { createBooking, getChefAvailability } from "@/services/booking.service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Day names matching ChefProfile.availability[].day values
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function BookingFlowPage() {
  const { id } = useParams(); // ChefProfile _id
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(undefined);
  const [eventTime, setEventTime] = useState("");
  const [duration, setDuration] = useState(2);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [guests, setGuests] = useState(2);
  const [childGuests, setChildGuests] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [stepError, setStepError] = useState("");

  const steps = [
    { title: "Details" },
    { title: "Guests" },
    { title: "Confirm" },
  ];

  const totalGuests = guests + childGuests;

  // ── Data fetching ───────────────────────────────────────────────────────────
  const {
    data: chef,
    isLoading: chefLoading,
    isError: chefError,
  } = useQuery({
    queryKey: ["chef", id],
    queryFn: () => getChefById(id),
    enabled: Boolean(id),
  });

  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ["menus", id],
    queryFn: () => getMenusByChef(id),
    enabled: Boolean(id),
  });

  const selectedMenu = menus.find((m) => m._id === selectedMenuId) ?? null;
  // ── Availability ──────────────────────────────────────────────────────────
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // null = chef has no schedule configured (don’t restrict the calendar)
  const availableDays = useMemo(
    () =>
      chef?.availability?.length
        ? new Set(chef.availability.map((a) => a.day))
        : null,
    [chef?.availability],
  );

  const isDateDisabled = useCallback(
    (d) => {
      if (d < today) return true;
      if (!availableDays) return false;
      return !availableDays.has(DAY_NAMES[d.getDay()]);
    },
    [today, availableDays],
  );

  // Calendar modifier that highlights available future dates
  const isDateAvailable = useCallback(
    (d) => {
      if (!availableDays || d < today) return false;
      return availableDays.has(DAY_NAMES[d.getDay()]);
    },
    [today, availableDays],
  );

  const selectedDateStr = useMemo(() => {
    if (!date) return null;
    const y = date.getFullYear();
    const mo = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }, [date]);

  // Fetch booked slots for the selected date to generate conflict-aware time slots
  const { data: dateAvailability, isLoading: availLoading } = useQuery({
    queryKey: ["chef", id, "availability", selectedDateStr],
    queryFn: () => getChefAvailability(id, selectedDateStr),
    enabled: Boolean(id) && Boolean(selectedDateStr),
    staleTime: 30_000,
  });

  // Valid starting times = chef’s window − existing bookings, constrained by duration
  const validTimeSlots = useMemo(() => {
    if (!date || !dateAvailability?.dayAvailability) return [];
    const { startTime, endTime } = dateAvailability.dayAvailability;
    const bookedSlots = dateAvailability.bookedSlots ?? [];
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const slots = [];
    for (let t = startMins; t + duration * 60 <= endMins; t += 60) {
      const slotEnd = t + duration * 60;
      const blocked = bookedSlots.some((bs) => {
        const bStart = timeToMinutes(bs.startTime);
        const bEnd = bStart + bs.duration * 60;
        return t < bEnd && slotEnd > bStart;
      });
      if (!blocked) slots.push(minsToTime(t));
    }
    return slots;
  }, [date, dateAvailability, duration]);

  // Auto-select the first valid slot when the slot list changes (date or duration change)
  useEffect(() => {
    if (validTimeSlots.length > 0 && !validTimeSlots.includes(eventTime)) {
      setEventTime(validTimeSlots[0]);
    } else if (validTimeSlots.length === 0 && eventTime !== "") {
      setEventTime("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTimeSlots]);

  const handleDateSelect = useCallback((newDate) => {
    setDate(newDate);
    setEventTime("");
    setStepError("");
  }, []);
  // ── Booking mutation ────────────────────────────────────────────────────────
  const {
    mutate: submitBooking,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Booking submitted!", {
        description: "Your request has been sent to the chef.",
      });
      router.push("/dashboard/bookings?success=true");
    },
  });

  // ── Step navigation with validation ────────────────────────────────────────
  const handleNext = () => {
    setStepError("");

    if (step === 1) {
      if (!date) {
        setStepError("Please select a date.");
        return;
      }
      if (!eventTime) {
        setStepError("Please select a time slot.");
        return;
      }
      if (!selectedMenuId) {
        setStepError("Please select a menu.");
        return;
      }
    }

    if (step === 2 && totalGuests < 1) {
      setStepError("At least 1 guest is required.");
      return;
    }

    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setStepError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleConfirm = () => {
    setStepError("");

    if (!date || !selectedMenuId) {
      setStepError("Missing booking details. Please go back and complete all fields.");
      return;
    }

    if (!eventTime) {
      setStepError("Please select a valid time slot.");
      return;
    }

    submitBooking({
      menu: selectedMenuId,
      bookingDate: date.toISOString(),
      eventTime,
      duration,
      guests: totalGuests,
      specialRequests: specialRequests.trim() || undefined,
    });
  };

  // ── Loading / error states ──────────────────────────────────────────────────
  if (chefLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-32">
          <Loading size="lg" text="Loading chef profile..." />
        </div>
      </div>
    );
  }

  if (chefError || !chef) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-32">
          <p className="text-muted-foreground text-lg">
            Unable to load chef details. Please try again.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => router.back()}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // ── Pricing calculations ────────────────────────────────────────────────────
  const basePrice = selectedMenu ? selectedMenu.price * totalGuests : 0;
  const serviceFee = 45;
  const taxes = Math.round(basePrice * 0.08);
  const total = basePrice + serviceFee + taxes;

  const menuOptions = menus.map((m) => ({
    value: m._id,
    label: `${m.name} — $${m.price}/person`,
  }));

  // Backend error message from mutation
  const backendError =
    mutationError?.response?.data?.message || mutationError?.message;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (step === 1 ? router.back() : handleBack())}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Complete your booking
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Form Area */}
        <div className="flex-1 w-full lg:w-2/3">
          <div className="mb-12 max-w-md">
            <Stepper steps={steps} currentStep={step} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* ── Step 1: Event details ─────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">When is the event?</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Select Date</h3>
                      <div className="border border-border rounded-xl p-2 inline-block bg-card">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateSelect}
                          disabled={isDateDisabled}
                          modifiers={{ available: isDateAvailable }}
                          modifiersClassNames={{ available: "ring-1 ring-primary/30 bg-primary/5 font-medium" }}
                          className="rounded-md border-0"
                        />
                      </div>
                      {availableDays && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-primary/40 bg-primary/10" />
                          Available dates highlighted
                        </p>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Duration</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {[2, 3, 4, 5].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setDuration(h)}
                              className={cn(
                                "flex flex-col items-center justify-center py-3 rounded-xl border-2 font-semibold transition-colors",
                                duration === h
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                              )}
                            >
                              <span className="text-base font-bold">{h}h</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-3">Time</h3>
                        {!date ? (
                          <p className="text-sm text-muted-foreground">Select a date first.</p>
                        ) : availLoading ? (
                          <Loading size="sm" text="Loading available times…" />
                        ) : validTimeSlots.length === 0 ? (
                          <p className="text-sm text-amber-600 font-medium">
                            No available slots for this date and duration.
                          </p>
                        ) : (
                          <Select
                            options={validTimeSlots.map((t) => ({ value: t, label: formatTime12(t) }))}
                            value={eventTime}
                            onChange={setEventTime}
                          />
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-3">Menu</h3>
                        {menusLoading ? (
                          <Loading size="sm" text="Loading menus…" />
                        ) : menuOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            No menus available for this chef yet.
                          </p>
                        ) : (
                          <Select
                            options={menuOptions}
                            value={selectedMenuId}
                            onChange={setSelectedMenuId}
                            placeholder="Select a menu"
                          />
                        )}
                        {selectedMenu?.description && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {selectedMenu.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {stepError && (
                    <p className="text-sm text-red-600 font-medium">{stepError}</p>
                  )}

                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-12"
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* ── Step 2: Guests ────────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">Who's coming?</h2>

                  <div className="space-y-6 max-w-md">
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div>
                        <h3 className="font-semibold text-lg">Adults</h3>
                        <p className="text-sm text-muted-foreground">Ages 13 or above</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => setGuests((g) => Math.max(1, g - 1))}
                          disabled={guests <= 1}
                        >
                          -
                        </Button>
                        <span className="font-medium w-4 text-center">{guests}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => setGuests((g) => g + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div>
                        <h3 className="font-semibold text-lg">Children</h3>
                        <p className="text-sm text-muted-foreground">Ages 2–12</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => setChildGuests((c) => Math.max(0, c - 1))}
                          disabled={childGuests <= 0}
                        >
                          -
                        </Button>
                        <span className="font-medium w-4 text-center">{childGuests}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => setChildGuests((c) => c + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-xl">
                    <h3 className="text-lg font-bold mb-3">
                      Dietary Needs &amp; Special Requests
                    </h3>
                    <Textarea
                      placeholder="E.g., One guest is highly allergic to peanuts. Another is strictly vegan."
                      rows={4}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>

                  {stepError && (
                    <p className="text-sm text-red-600 font-medium">{stepError}</p>
                  )}

                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-12"
                    onClick={handleNext}
                  >
                    Continue to Confirm
                  </Button>
                </div>
              )}

              {/* ── Step 3: Confirm & payment UI ─────────────────────────── */}
              {step === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">Pay with</h2>

                  {/* Booking summary card */}
                  <div className="border border-border rounded-xl p-5 bg-secondary/20 space-y-3 max-w-xl">
                    <h3 className="font-semibold">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Chef</span>
                      <span className="font-medium text-right">{chef.name}</span>
                      <span className="text-muted-foreground">Menu</span>
                      <span className="font-medium text-right">{selectedMenu?.name ?? "—"}</span>
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-right">
                        {date?.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium text-right">{eventTime}</span>
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-right">{duration} hours</span>
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-medium text-right">{totalGuests}</span>
                    </div>
                  </div>

                  {/* Payment method selection — UI preserved for Phase D2 */}
                  <div className="space-y-4 max-w-xl">
                    <div className="border-2 border-primary rounded-xl p-4 flex items-start gap-4 bg-primary/5 cursor-pointer relative overflow-hidden">
                      <div className="absolute right-[-10px] top-[-10px] bg-primary text-primary-foreground text-[10px] font-bold py-3 pl-4 pr-6 rounded-bl-xl rotate-45 transform origin-top-right">
                        SELECTED
                      </div>
                      <CreditCard className="h-6 w-6 mt-1 text-primary" />
                      <div className="flex-1">
                        <div className="font-semibold flex justify-between items-center">
                          Credit or Debit Card
                          <div className="flex gap-1 h-5">
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1000px-Mastercard-logo.svg.png"
                              alt="MC"
                              className="h-full object-contain"
                            />
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1000px-Visa_Inc._logo.svg.png"
                              alt="Visa"
                              className="h-full object-contain"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-4">
                          <Input
                            placeholder="Card number"
                            defaultValue="**** **** **** 4242"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Expiration"
                              defaultValue="12/26"
                            />
                            <Input placeholder="CVV" defaultValue="123" />
                          </div>
                          <Input placeholder="ZIP code" defaultValue="10001" />
                        </div>
                      </div>
                    </div>

                    <div className="border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/50">
                      <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold font-serif italic text-xs">
                        P
                      </div>
                      <span className="font-semibold">PayPal</span>
                    </div>

                    <div className="border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/50">
                      <svg
                        className="h-6 w-8"
                        viewBox="0 0 38 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.3 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z"
                          fill="#000"
                          fillOpacity=".1"
                        />
                        <path
                          d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z"
                          fill="#FFF"
                        />
                        <path
                          d="M12.1 11.2c-.2-.6-.9-2.3-2.6-2.3-1.9 0-3.3 1.5-3.3 3.5s1.4 3.5 3.3 3.5c1.4 0 2.2-.8 2.5-1.2l-.7-.8c-.3.4-.8.7-1.6.7-1 0-1.8-.7-2-1.8h4.6c0-.1 0-.3 0-.5 0-2.1-1.3-3.1-2.6-3.1h-.2zm-2.4 1h1.9c0 1.1-.6 1.1-.9 1.1s-1-.3-1-1.1v-.1zm4.8 1.8h1.1v4h1V8.2h-1.1v4.7zM24 10.9V8.2h-3v1.8c-.3-.4-1-.7-1.8-.7s-2.1.8-2.1 2.3c0 1.4.9 2.2 1.8 2.2.8 0 1.4-.3 1.7-.7v.6h1.1V10.9h.3zm-3.8 1.1c0 1 .7 1.4 1.4 1.4.7 0 1.5-.4 1.5-1.4V10.8c0-1-.8-1.4-1.5-1.4-.7 0-1.4.4-1.4 1.4v1.2zm6.2-3.8v7.5h1.1v-7.5h-1.1zm2.3 0h1.1l1.8 4.7 1.6-4.7h1.2l-2.4 6.5h-1.1l-2.2-6.5z"
                          fill="#111827"
                        />
                      </svg>
                      <span className="font-semibold lg:hidden">Apple Pay</span>
                    </div>
                  </div>

                  {/* Backend / validation error */}
                  {(stepError || backendError) && (
                    <p className="text-sm text-red-600 font-medium max-w-xl">
                      {stepError || backendError}
                    </p>
                  )}

                  <div className="pt-6 border-t border-border max-w-xl">
                    <p className="text-xs text-muted-foreground mb-4">
                      By selecting the button below, I agree to the Host&apos;s House
                      Rules, Ground rules for guests, Kookaville&apos;s Rebooking and
                      Refund Policy, and that Kookaville can charge my payment
                      method when the booking is accepted.
                    </p>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-12 bg-accent hover:bg-accent/90"
                      onClick={handleConfirm}
                      isLoading={isPending}
                    >
                      Confirm and pay
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Pricing Summary Widget */}
        <div className="w-full lg:w-1/3 relative lg:mt-6">
          <div className="sticky top-24 border border-border rounded-2xl p-6 shadow-card bg-card mb-8">
            <div className="flex gap-4 items-start border-b border-border pb-6 mb-6">
              <img
                src={
                  chef.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=random`
                }
                alt={chef.name}
                className="w-24 h-24 rounded-xl object-cover"
              />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Private Chef
                </div>
                <h3 className="font-bold">{chef.name}</h3>
                <div className="flex items-center gap-1 text-sm mt-1">
                  <Star className="w-3.5 h-3.5 text-foreground" />
                  <span className="font-medium">{chef.rating}</span>
                  <span className="text-muted-foreground">
                    ({chef.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-4">Price details</h3>
            <div className="space-y-3 text-sm mb-6">
              {selectedMenu ? (
                <div className="flex justify-between">
                  <span>
                    ${selectedMenu.price} × {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                  </span>
                  <span>${basePrice}</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  Select a menu to see pricing
                </p>
              )}
              <div className="flex justify-between">
                <span className="underline decoration-dotted cursor-help">
                  Service fee
                </span>
                <span>${serviceFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline decoration-dotted cursor-help">
                  Taxes
                </span>
                <span>{selectedMenu ? `$${taxes}` : "—"}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg pt-4 border-t border-border">
              <span>Total (USD)</span>
              <span>{selectedMenu ? `$${total}` : "—"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-secondary/50 p-6 rounded-xl border border-secondary">
            <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">
              Payment is held securely by Kookaville and only released to the chef
              24h after your event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
