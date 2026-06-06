import React from "react";
import Link from "next/link";
import { ChefCard } from "@/components/ui/chef-card";
import { chefs } from "@/mocks/data";

export function FeaturedChefs() {
  const featured = chefs.filter((c) => c.featured);

  return (
    <section className="py-24 bg-background border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground sm:text-4xl mb-3">
              Michelin-Trained Experts
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed font-serif font-light">
              Discover verified, world-class culinary artists creating bespoke
              menus in your area.
            </p>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-block text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            See all chefs &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/search"
            className="text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            See all chefs &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
