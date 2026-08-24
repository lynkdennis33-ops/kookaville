"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Heart,
  Settings,
  MessageSquare,
  CreditCard,
  LayoutDashboard,
  Bell,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/shared/require-auth";

export default function ClientDashboardLayout({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Saved Chefs", href: "/dashboard/saved", icon: Heart },
    { name: "Payment Methods", href: "/dashboard/payments", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Only show "Become a Chef" for clients (not yet chefs or admins)
  if (user?.role === "client") {
    tabs.push({ name: "Become a Chef", href: "/chef/onboarding", icon: ChefHat });
  }

  return (
    <RequireAuth>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold font-serif">
                {user?.firstName?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">
                  {user ? `${user.firstName} ${user.lastName[0]}.` : ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Joined {new Date(user?.createdAt ?? Date.now()).getFullYear()}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    <tab.icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
    </RequireAuth>
  );
}
