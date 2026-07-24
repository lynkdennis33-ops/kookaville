'use client';
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { clientBookings, chefs } from "@/mocks/data";
import { Calendar, MapPin, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ClientDashboardOverview() {
  const upcoming = clientBookings.filter((b) => b.status === "upcoming");
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {user?.firstName ?? "User"}
        </h1>
        <p className="text-muted-foreground">
          Manage your reservations and connect with chefs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
            <CardDescription>{upcoming.length} events planned</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="space-y-4 mt-2">
                {upcoming.map((booking) => {
                  const chef = chefs.find((c) => c.id === booking.chefId);
                  if (!chef) return null;
                  return (
                    <div
                      key={booking.id}
                      className="flex gap-4 p-4 rounded-xl border border-border bg-secondary/30"
                    >
                      <img
                        src={chef.avatar}
                        className="w-16 h-16 rounded-lg object-cover"
                        alt="Chef"
                      />
                      <div className="space-y-1 w-full">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">
                            Dinner with Chef {chef.name}
                          </h4>
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">
                            Confirmed
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />{" "}
                            {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Your Home
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-4">
                  No upcoming bookings.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/search">Find a Chef</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Saved Chefs</CardTitle>
            <CardDescription>2 chefs in your list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {chefs.slice(0, 2).map((chef) => (
                <div
                  key={chef.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={chef.avatar}
                      className="w-12 h-12 rounded-full object-cover"
                      alt="Chef"
                    />
                    <div>
                      <h4 className="font-bold text-sm">{chef.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {chef.specialties[0]}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/chef/${chef.id}`}>
                      <Search className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
