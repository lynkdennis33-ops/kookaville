import React from "react";
import Link from "next/link";
import { ChefHat, Instagram, Twitter, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-white text-primary p-1.5 rounded-lg">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Lumière
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-6 leading-relaxed">
              Curated private dining experiences crafted by world-class chefs,
              delivered to your home.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-primary-foreground/70 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-white">
              Discover
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/search"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Find a Chef
                </Link>
              </li>
              <li>
                <Link
                  href="/cuisines"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Cuisines
                </Link>
              </li>
              <li>
                <Link
                  href="/experiences"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Experiences
                </Link>
              </li>
              <li>
                <Link
                  href="/gift-cards"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Gift Cards
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-white">
              For Chefs
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/chef/onboarding"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Become a Chef
                </Link>
              </li>
              <li>
                <Link
                  href="/chef/guidelines"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/chef/stories"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Chef Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/chef/support"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-white">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-primary-foreground/70 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Lumière Private Chefs. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 cursor-pointer">
              English (US)
            </span>
            <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground/80 cursor-pointer">
              $ USD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
