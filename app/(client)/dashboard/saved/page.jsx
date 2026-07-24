"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loading } from "@/components/shared/loading";
import { ChefCard } from "@/components/ui/chef-card";
import { getSavedChefs } from "@/services/saved-chef.service";
import { normalizeChef } from "@/services/chef.service";

export default function ClientSavedPage() {
  const {
    data: savedItems = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["savedChefs"],
    queryFn: getSavedChefs,
  });

  // Each saved item contains a populated ChefProfile under .chef.
  // Normalise to the shape ChefCard expects.
  const chefs = savedItems
    .map((item) => (item.chef ? normalizeChef(item.chef) : null))
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Chefs</h1>
        <p className="text-muted-foreground">
          Keep track of your favorite culinary professionals.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loading size="lg" text="Loading saved chefs..." />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-xl bg-card shadow-sm">
          <p className="text-muted-foreground">
            Unable to load saved chefs. Please try again later.
          </p>
        </div>
      )}

      {!isLoading && !isError && chefs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-xl bg-card shadow-sm">
          <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No saved chefs</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            When you see a chef you like, click the heart icon on their profile
            or card to save them here for later.
          </p>
          <Button asChild size="lg">
            <Link href="/search">Explore Chefs</Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && chefs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chefs.map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </div>
      )}
    </div>
  );
}
