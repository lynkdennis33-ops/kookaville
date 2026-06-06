"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { chefs } from "@/mocks/data";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingFlowPage() {
  const { id } = useParams();
  const router = useRouter();
  const chef = chefs.find((c) => c.id === id) || chefs[0];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // Form State Mock
  const [date, setDate] = useState(new Date());
  const steps = [
    { title: "Details" },
    { title: "Guests" },
    { title: "Payment" },
  ];

  const handleNext = () => setStep((s) => Math.min(3, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(`/dashboard/bookings?success=true`);
    }, 2000);
  };

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
              {step === 1 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">When is the event?</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Select Date
                      </h3>
                      <div className="border border-border rounded-xl p-2 inline-block bg-card">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          className="rounded-md border-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-3">Time</h3>
                        <Select
                          options={[
                            { value: "17:00", label: "17:00 PM" },
                            { value: "18:00", label: "18:00 PM" },
                            { value: "19:00", label: "19:00 PM" },
                            { value: "20:00", label: "20:00 PM" },
                          ]}
                          value="19:00"
                          onChange={() => {}}
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-3">
                          Event Type
                        </h3>
                        <Select
                          options={[
                            { value: "dinner", label: "Dinner Party" },
                            { value: "lunch", label: "Corporate Lunch" },
                            {
                              value: "romantic",
                              label: "Romantic Dinner for 2",
                            },
                            { value: "prep", label: "Weekly Meal Prep" },
                          ]}
                          value="dinner"
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-12"
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">Who's coming?</h2>

                  <div className="space-y-6 max-w-md">
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div>
                        <h3 className="font-semibold text-lg">Adults</h3>
                        <p className="text-sm text-muted-foreground">
                          Ages 13 or above
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                        >
                          -
                        </Button>
                        <span className="font-medium w-4 text-center">4</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div>
                        <h3 className="font-semibold text-lg">Children</h3>
                        <p className="text-sm text-muted-foreground">
                          Ages 2-12
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8 disabled:opacity-50"
                          disabled
                        >
                          -
                        </Button>
                        <span className="font-medium w-4 text-center">0</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-xl">
                    <h3 className="text-lg font-bold mb-3">
                      Dietary Needs & Special Requests
                    </h3>
                    <Textarea
                      placeholder="E.g., One guest is highly allergic to peanuts. Another is strictly vegan."
                      rows={4}
                    />
                  </div>

                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-12"
                    onClick={handleNext}
                  >
                    Continue to Payment
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold">Pay with</h2>

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

                  <div className="pt-6 border-t border-border max-w-xl">
                    <p className="text-xs text-muted-foreground mb-4">
                      By selecting the button below, I agree to the Host's House
                      Rules, Ground rules for guests, Lumière's Rebooking and
                      Refund Policy, and that Lumière can charge my payment
                      method.
                    </p>
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-12 bg-accent hover:bg-accent/90"
                      onClick={handleConfirm}
                      isLoading={isLoading}
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
                src={chef.avatar}
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
              <div className="flex justify-between">
                <span>${chef.pricePerPerson} x 4 guests</span>
                <span>${chef.pricePerPerson * 4}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline decoration-dotted cursor-help">
                  Service fee
                </span>
                <span>$45</span>
              </div>
              <div className="flex justify-between">
                <span className="underline decoration-dotted cursor-help">
                  Taxes
                </span>
                <span>${Math.round(chef.pricePerPerson * 4 * 0.08)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg pt-4 border-t border-border">
              <span>Total (USD)</span>
              <span>
                $
                {chef.pricePerPerson * 4 +
                  45 +
                  Math.round(chef.pricePerPerson * 4 * 0.08)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-secondary/50 p-6 rounded-xl border border-secondary">
            <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">
              Payment is held securely by Lumière and only released to the chef
              24h after your event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
