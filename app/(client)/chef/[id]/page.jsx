"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Loading } from "@/components/shared/loading";
import { getChefById } from "@/services/chef.service";
import { getChefReviews } from "@/services/review.service";

export default function ChefProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [reviewPage, setReviewPage] = useState(1);

  const {
    data: chef,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chef", id],
    queryFn: () => getChefById(id),
    enabled: Boolean(id),
  });

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useQuery({
    queryKey: ["reviews", "chef", id, reviewPage],
    queryFn: () => getChefReviews(id, { page: reviewPage, limit: 5 }),
    enabled: Boolean(id) && !isLoading && !isError,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-32">
          <Loading size="lg" text="Loading chef profile..." />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-32">
          <p className="text-muted-foreground text-lg">
            {error?.response?.status === 404
              ? "Chef not found."
              : "Unable to load chef profile. Please try again later."}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/search")}
          >
            Back to search
          </Button>
        </div>
      </div>
    );
  }

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
            src={chef.coverImage || "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1000&auto=format&fit=crop"}
            alt="Main dish"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative">
          <img
            src={chef.gallery[0] || chef.coverImage || "https://images.unsplash.com/photo-1544025162-8315ea07ec93?w=500&auto=format&fit=crop"}
            alt="Dish 1"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-1 row-span-1 relative">
          <img
            src={chef.gallery[1] || chef.coverImage || "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&auto=format&fit=crop"}
            alt="Dish 2"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="hidden md:block col-span-2 row-span-1 relative">
          <img
            src={chef.gallery[2] || chef.coverImage || "https://images.unsplash.com/photo-1514326640560-7d063ef8aedc?w=500&auto=format&fit=crop"}
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
                {chef.yearsOfExperience > 0 && (
                  <span>{chef.yearsOfExperience}+ years experience</span>
                )}
                {chef.yearsOfExperience > 0 && <span>•</span>}
                <span>{chef.reviews}+ events hosted</span>
              </p>
            </div>
            <img
              src={chef.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=random`}
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
              {[...chef.cuisines, ...chef.specialties].length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No specialties listed yet.</p>
              ) : (
                [...chef.cuisines, ...chef.specialties].map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    {item}
                  </Badge>
                ))
              )}
            </div>

            {chef.serviceAreas && chef.serviceAreas.length > 0 && (
              <>
                <h3 className="text-lg font-bold mb-4 mt-8">Service Areas</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {chef.serviceAreas.map((area, i) => (
                    <Badge
                      key={`area-${i}`}
                      variant="outline"
                      className="px-3 py-1 text-sm bg-background"
                    >
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {area}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            <h3 className="text-lg font-bold mb-4 mt-8">
              Dietary Capabilities
            </h3>
            {chef.dietary.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Dietary information not yet specified.
              </p>
            ) : (
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
            )}
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
                {chef.rating > 0 ? chef.rating.toFixed(1) : "No ratings yet"}{" "}
                {chef.reviews > 0 && (
                  <span className="text-muted-foreground font-medium text-xl">
                    · {chef.reviews} review{chef.reviews !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>
            </div>

            {reviewsLoading && (
              <div className="flex justify-center py-8">
                <Loading text="Loading reviews..." />
              </div>
            )}

            {reviewsError && (
              <p className="text-muted-foreground">
                Unable to load reviews. Please try again later.
              </p>
            )}

            {!reviewsLoading && !reviewsError && (
              <>
                {(!reviewsData?.reviews?.length) ? (
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to book this chef!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviewsData.reviews.map((review) => (
                      <div key={review._id} className="space-y-4">
                        <div className="flex items-center gap-3">
                          {review.client?.avatar ? (
                            <img
                              src={review.client.avatar}
                              alt={review.client.firstName}
                              className="w-12 h-12 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center font-bold text-lg text-primary">
                              {review.client?.firstName?.charAt(0) ?? "?"}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">
                              {review.client?.firstName} {review.client?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString(
                                undefined,
                                { year: "numeric", month: "long", day: "numeric" },
                              )}
                            </div>
                          </div>
                        </div>
                        <RatingStars rating={review.rating} size="sm" />
                        <p className="text-muted-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination for reviews */}
                {reviewsData?.pagination && (
                  <div className="mt-8 flex items-center gap-3">
                    {reviewsData.pagination.hasPreviousPage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                    )}
                    {reviewsData.pagination.hasNextPage && (
                      <Button
                        variant="outline"
                        className="font-semibold"
                        onClick={() => setReviewPage((p) => p + 1)}
                      >
                        Show more reviews
                      </Button>
                    )}
                    {reviewsData.pagination.totalPages > 1 && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        Page {reviewsData.pagination.currentPage} of{" "}
                        {reviewsData.pagination.totalPages}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
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
