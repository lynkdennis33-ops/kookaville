import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, MoreHorizontal } from "lucide-react";

export default function AdminBookingsPage() {
  const bookings = [
    {
      id: "B101",
      chef: "Gordon R.",
      client: "James C.",
      date: "Mar 15, 2026",
      total: "$1,500",
      status: "Upcoming",
    },
    {
      id: "B102",
      chef: "Maria R.",
      client: "Sarah M.",
      date: "Mar 18, 2026",
      total: "$450",
      status: "Pending Approval",
    },
    {
      id: "B100",
      chef: "David K.",
      client: "Bob S.",
      date: "Mar 05, 2026",
      total: "$1,200",
      status: "Completed",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Global Bookings
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage all reservations across the platform.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            placeholder="Search bookings by ID, chef, or client..."
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/10 font-bold">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Chef</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                      {b.id}
                    </td>
                    <td className="px-6 py-4 font-medium">{b.chef}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {b.client}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {b.date}
                    </td>
                    <td className="px-6 py-4 font-bold">{b.total}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          b.status === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : b.status === "Pending Approval"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
