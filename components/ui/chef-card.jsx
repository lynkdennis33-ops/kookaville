"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { Heart, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  saveChef,
  removeSavedChef,
  getSavedChefs,
} from "@/services/saved-chef.service";

export function ChefCard({ chef }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Saved status ────────────────────────────────────────────────────────
  // All ChefCard instances share this single cached query, so the page makes
  // at most one request to /api/saved-chefs regardless of how many cards
  // are rendered.
  const { data: savedList = [] } = useQuery({
    queryKey: ["savedChefs"],
    queryFn: getSavedChefs,
    // Only fetch for authenticated clients; others never save chefs
    enabled: Boolean(user) && user.role === "client",
    staleTime: 5 * 60 * 1000,
  });

  const isSaved = savedList.some((item) => {
    // item.chef may be a full object or a raw ObjectId string depending on
    // when the cache was populated
    const id = item.chef?._id ?? item.chef;
    return String(id) === String(chef.id);
  });

  // ── Mutations ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => saveChef(chef.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["savedChefs"] });
      const previous = queryClient.getQueryData(["savedChefs"]);
      queryClient.setQueryData(["savedChefs"], (old = []) => [
        ...old,
        { _id: "__optimistic__", chef: { _id: chef.id }, client: null },
      ]);
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["savedChefs"], context.previous);
      toast.error(err.response?.data?.message ?? "Failed to save chef.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedChefs"] });
      toast.success(`${chef.name} saved to your favourites.`);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeSavedChef(chef.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["savedChefs"] });
      const previous = queryClient.getQueryData(["savedChefs"]);
      queryClient.setQueryData(["savedChefs"], (old = []) =>
        old.filter((item) => {
          const id = item.chef?._id ?? item.chef;
          return String(id) !== String(chef.id);
        }),
      );
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["savedChefs"], context.previous);
      toast.error(err.response?.data?.message ?? "Failed to remove saved chef.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedChefs"] });
      toast.success(`${chef.name} removed from your favourites.`);
    },
  });

  const isPending = saveMutation.isPending || removeMutation.isPending;

  function handleHeartClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save chefs.");
      return;
    }
    if (user.role !== "client") return;
    if (isPending) return;
    if (isSaved) {
      removeMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-card hover:-translate-y-1">
      <Link href={`/chef/${chef.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {chef.name}'s profile</span>
      </Link>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={
            chef.coverImage ||
            "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&auto=format&fit=crop"
          }
          alt={chef.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <button
          onClick={handleHeartClick}
          disabled={isPending}
          aria-label={isSaved ? "Remove from saved" : "Save chef"}
          className={`absolute right-3 top-3 z-20 rounded-full p-2 transition-all duration-200 backdrop-blur-md bg-black/20 hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed ${
            isSaved ? "text-red-400" : "text-white/90 hover:text-accent"
          }`}
        >
          <Heart
            className="h-5 w-5"
            fill={isSaved ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>

        {chef.featured && (
          <div className="absolute left-3 top-3 z-20">
            <Badge variant="default" className="shadow-md shadow-black/10">
              Featured
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  chef.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(chef.name)}&background=random`
                }
                alt={chef.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-background shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-lg leading-tight flex items-center gap-1.5">
                  {chef.name}
                  {chef.verified && (
                    <svg
                      className="h-4 w-4 text-accent"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-lg">${chef.pricePerPerson}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Per Person
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-sm">
              <RatingStars rating={chef.rating} size="sm" />
              <span className="ml-1">{chef.rating}</span>
              <span className="text-muted-foreground font-normal">
                ({chef.reviews})
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {chef.location?.split(",")[0]}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chef.specialties.slice(0, 3).map((spec, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="font-medium text-[10px] px-2"
              >
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
