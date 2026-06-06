"use client";

import React, { useState } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default function ChefBookingsPage() {
  const [date, setDate] = useState(new Date());

  const mockTimeSlots = [
    { time: "12:00 PM", status: "available" },
    { time: "17:00 PM", status: "booked", client: "James C." },
    { time: "19:00 PM", status: "blocked" },
    { time: "20:30 PM", status: "available" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Schedule & Bookings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your availability calendar and upcoming events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Calendar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <CalendarUI
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-xl border border-border shadow-sm p-3 w-full max-w-[300px] bg-background"
              />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle>Quick Availability</CardTitle>
              <CardDescription>
                Block off specific dates instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                >
                  Block Entire Day
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                >
                  Open Entire Day
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Time Slots & specific booking details for the selected day */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border h-full">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {date
                    ? date.toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a date"}
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage your schedule for this day
                </CardDescription>
              </div>
              <Button size="sm">Add Custom Slot</Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockTimeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-6 transition-colors hover:bg-secondary/30"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-24 font-bold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        {slot.time}
                      </div>

                      <div>
                        {slot.status === "available" && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200"
                          >
                            Available
                          </Badge>
                        )}
                        {slot.status === "booked" && (
                          <div className="flex items-center gap-3">
                            <Badge className="bg-primary text-primary-foreground">
                              Booked
                            </Badge>
                            <span className="font-semibold text-sm">
                              Dinner Party for {slot.client}
                            </span>
                          </div>
                        )}
                        {slot.status === "blocked" && (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground line-through"
                          >
                            Blocked
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {slot.status === "available" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Block
                        </Button>
                      )}
                      {slot.status === "blocked" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          Unblock
                        </Button>
                      )}
                      {slot.status === "booked" && (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
