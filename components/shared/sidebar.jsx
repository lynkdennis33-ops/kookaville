"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  LogOut,
  LayoutDashboard,
  Calendar,
  Utensils,
  DollarSign,
  Settings,
  Users,
  ClipboardList,
} from "lucide-react";

export function Sidebar({ items, role }) {
  const pathname = usePathname();

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">
            Lumière{" "}
            <span className="text-sm font-normal text-muted-foreground ml-1 capitalize">
              {role}
            </span>
          </span>
        </Link>

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-primary">
            {role.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold capitalize">{role} Account</span>
            <span className="text-xs text-muted-foreground">
              Manage profile
            </span>
          </div>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </Link>
      </div>
    </div>
  );
}

// Pre-defined sets
export const CHEF_SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/chef-portal/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/chef-portal/bookings", icon: Calendar },
  { name: "My Menus", href: "/chef-portal/menus", icon: Utensils },
  { name: "Earnings", href: "/chef-portal/earnings", icon: DollarSign },
  { name: "Settings", href: "/chef-portal/settings", icon: Settings },
];

export const ADMIN_SIDEBAR_ITEMS = [
  { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Chefs Approvals", href: "/admin/chefs", icon: Utensils },
  { name: "All Bookings", href: "/admin/bookings", icon: ClipboardList },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];
