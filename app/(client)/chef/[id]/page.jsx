"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  Share,
  Heart,
  MapPin,
  CheckCircle,
  Flame,
  Utensils,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { RatingStars } from "@/components/ui/rating-stars";
import { chefs, reviews } from "@/mocks/data";

export default function ChefProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  // Find chef in mock data
  const chef = chefs.find((c) => c.id === id) || chefs[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex text-sm text-muted-foreground mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <Link href="/search" className="hover:text-foreground">
              Chefs
            </Link>
          </li>
          <li>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="font-medium text-foreground">{chef.name}</li>
        </ol>
      </nav>

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {chef.name}
            {chef.verified && <CheckCircle className="h-6 w-6 text-accent" />}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-foreground" />
              <span>{chef.rating}</span>
            </div>
            <span className="text-muted-foreground underline cursor-pointer">
              {chef.reviews} reviews
            </span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{chef.location}</span>
            </div>
            {chef.featured && (
              <>
                <span className="text-muted-foreground hidden sm:inline">
                  •
                </span>
                <span className="text-accent flex items-center gap-1">
                  <Flame className="h-4 w-4" /> Super Host
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex">
            <Share className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button variant="outline">
            <Heart className="mr-2 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[400px] sm:h-[500px] mb-12 rounded-2xl overflow-hidden group">
        <div className="col-span-1 md:col-span-2 row-span-2 relative">
          <img
            src={chef.coverImage}
            alt="Main dish"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative">
          <img
            src={chef.gallery[0] || chef.coverImage}
            alt="Dish 1"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative">
          <img
            src={chef.gallery[1] || chef.coverImage}
            alt="Dish 2"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-2 row-span-1 relative">
          <img
            src={chef.gallery[2] || chef.coverImage}
            alt="Dish 3"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <button className="absolute bottom-4 right-4 bg-background px-4 py-2 rounded-lg border shadow-md font-medium text-sm flex items-center gap-2 hover:bg-secondary">
            <Utensils className="h-4 w-4" />
            Show all photos
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Details */}
        <div className="flex-1 w-full lg:w-2/3">
          {/* Chef Info Layout */}
          <div className="flex items-center justify-between border-b border-border pb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                Prepared by Chef {chef.name.split(" ")[0]}
              </h2>
              <p className="text-muted-foreground flex gap-2 items-center">
                <span>10+ years experience</span> •{" "}
                <span>100+ events hosted</span>
              </p>
            </div>
            <img
              src={chef.avatar}
              alt={chef.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-border object-cover"
            />
          </div>

          {/* About */}
          <div className="py-8 border-b border-border">
            <h3 className="text-xl font-bold mb-4">About the Chef</h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {chef.bio}
            </p>
            <Button
              variant="link"
              className="px-0 mt-2 font-bold text-foreground underline text-base"
            >
              Show more &rarr;
            </Button>
          </div>

          {/* Specialties & Tags */}
          <div className="py-8 border-b border-border">
            <h3 className="text-xl font-bold mb-4">Cuisine & Specialties</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {chef.specialties.map((spec, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="px-3 py-1 text-sm"
                >
                  {spec}
                </Badge>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-4 mt-8">
              Dietary Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {chef.dietary.map((diet, i) => (
                <Badge
                  key={`diet-${i}`}
                  variant="outline"
                  className="px-3 py-1 text-sm bg-background"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  {diet}
                </Badge>
              ))}
            </div>
          </div>

          {/* Calendar Mock */}
          <div className="py-8 border-b border-border">
            <h3 className="text-xl font-bold mb-4">Availability</h3>
            <div className="p-4 border border-border rounded-xl inline-block bg-card">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-0"
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="py-8">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-foreground" />
              <h3 className="text-2xl font-bold">
                {chef.rating}{" "}
                <span className="text-muted-foreground font-medium text-xl">
                  · {chef.reviews} reviews
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.map((review, i) => (
                <div key={review.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center font-bold text-lg text-primary">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{review.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.date}
                      </div>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                  <p className="text-muted-foreground leading-relaxed">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="mt-8 font-semibold">
              Show all {chef.reviews} reviews
            </Button>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget */}
        <div className="w-full lg:w-1/3 relative">
          <div className="sticky top-24 border border-border rounded-2xl p-6 shadow-dropdown bg-card backdrop-blur-xl bg-background/90 z-10 flex flex-col gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${chef.pricePerPerson}</span>
              <span className="text-base text-muted-foreground font-medium">
                per person
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-3 bg-secondary/30">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                    Date
                  </label>
                  <div className="text-sm font-medium">
                    {date?.toLocaleDateString() || "Add dates"}
                  </div>
                </div>
                <div className="p-3 bg-secondary/30">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                    Time
                  </label>
                  <div className="text-sm font-medium">19:00 PM</div>
                </div>
              </div>
              <div className="p-3 bg-secondary/30">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-1">
                  Guests
                </label>
                <div className="text-sm font-medium">4 Guests</div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg bg-accent hover:bg-accent/90 focus-visible:ring-accent"
              onClick={() => router.push(`/book/${chef.id}`)}
            >
              Reserve
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-2">
              You won't be charged yet
            </p>

            <div className="space-y-4 text-sm mt-4 border-b border-border pb-6">
              <div className="flex justify-between">
                <span className="underline cursor-pointer">
                  ${chef.pricePerPerson} x 4 guests
                </span>
                <span>${chef.pricePerPerson * 4}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline cursor-pointer">Service fee</span>
                <span>$45</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span>${chef.pricePerPerson * 4 + 45}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center sticky top-[500px]">
            <Button
              variant="link"
              className="text-muted-foreground flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Report this listing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
