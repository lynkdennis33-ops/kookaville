"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChefHat, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Mock auth state — replace with real session when auth is wired up
  const isLoggedIn = true;
  const userType = "client"; // 'client' | 'chef' | 'admin'

  const pathname = usePathname();
  const isHome = pathname === "/";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click-outside to close dropdown — fixes the onBlur race condition
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  const navLinks = [
    { label: "Find a Chef", href: "/search" },
    { label: "How it Works", href: "/about" },
  ];

  const dashboardHref =
    userType === "chef"
      ? "/chef-portal/dashboard"
      : userType === "admin"
        ? "/admin/dashboard"
        : "/dashboard";

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-40 transition-all duration-300",
        isScrolled || !isHome || mobileMenuOpen
          ? "bg-background shadow-sm border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-1.5 rounded-lg shadow-sm">
                <ChefHat className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "font-bold text-xl tracking-tight transition-colors text-primary",
                )}
              >
                Lumière
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}

            {!isLoggedIn ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border/50">
                <Link
                  href="/login"
                  className={cn(
                    "text-sm font-semibold text-foreground hover:text-accent transition-colors",
                  )}
                >
                  Log in
                </Link>
                <Button
                  asChild
                  variant="primary"
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div
                className="relative ml-4 pl-4 border-l border-border/30"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded-full border transition-all border-border bg-background hover:bg-secondary hover:shadow-sm",
                  )}
                >
                  <Menu className="h-4 w-4 ml-2" />
                  <div className="h-7 w-7 rounded-full bg-primary overflow-hidden flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-background border border-border shadow-dropdown overflow-hidden"
                    >
                      <div className="py-2">
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/bookings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/dashboard/saved"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                        >
                          Saved Chefs
                        </Link>
                        <div className="h-px bg-border my-1" />
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Settings className="h-4 w-4" />
                          Account Settings
                        </Link>
                        <button
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "block px-3 py-3 rounded-md text-base font-medium hover:bg-secondary",
                    pathname === link.href ? "text-accent" : "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-px bg-border my-4" />

              {!isLoggedIn ? (
                <div className="grid gap-2 mt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-center"
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    My Account
                  </p>
                  <Link
                    href={dashboardHref}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
                  >
                    Bookings
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary"
                  >
                    Settings
                  </Link>
                  <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-50 mt-4">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
