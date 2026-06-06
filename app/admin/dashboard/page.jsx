import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ChefHat,
  DollarSign,
  Activity,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { clientBookings } from "@/mocks/data";

export default function AdminDashboardOverview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Platform Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Key metrics and detailed tracking.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Button size="sm">Manage Admins</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,430.00</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +180 since last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Chefs
            </CardTitle>
            <ChefHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+124</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> 12 pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">143%</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              Booking volume surging
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border flex flex-col">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between bg-muted/20">
          <div>
            <CardTitle>Recent Bookings</CardTitle>
          </div>
          <div className="flex gap-2 relative">
            <Input
              placeholder="Search bookings..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="w-64 bg-background h-9 border-border text-sm"
            />

            <Button variant="outline" size="sm" className="bg-background">
              <Filter className="h-4 w-4 border-border" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f9fafb] text-[#6b7280] uppercase text-xs">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Booking ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Chef
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 font-semibold tracking-wider text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientBookings.map((b, i) => (
                <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-primary">
                    #{b.id}
                  </td>
                  <td className="px-6 py-4 font-semibold">James Crawford</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    Chef Sarah
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(b.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    ${b.totalPrice}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                        b.status === "upcoming"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {/* Dummy rows */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-primary">
                  #b3
                </td>
                <td className="px-6 py-4 font-semibold">Emily Chen</td>
                <td className="px-6 py-4 text-muted-foreground">Chef Gordon</td>
                <td className="px-6 py-4 text-muted-foreground">
                  Apr 22, 2026
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">$1,200</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                    Cancelled
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">
                    Details
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
