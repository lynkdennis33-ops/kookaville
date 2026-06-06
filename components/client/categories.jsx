import React from "react";
import Link from "next/link";
import { categories } from "@/mocks/data";

export function Categories() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground sm:text-4xl">
            Explore by Cuisine
          </h2>
          <Link
            href="/search"
            className="text-sm font-semibold text-primary hover:text-accent transition-colors flex items-center"
          >
            View all cuisines <span className="ml-1 text-accent">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.slice(0, 8).map((category, index) => (
            <Link
              href={`/search?category=${category.name}`}
              key={index}
              className="group relative block overflow-hidden rounded-3xl aspect-[4/5] shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              <div className="absolute inset-0 z-20 flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white font-serif mb-1">
                    {category.name}
                  </h3>
                  <p className="text-white/80 text-sm font-medium translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    Explore chefs &rarr;
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
