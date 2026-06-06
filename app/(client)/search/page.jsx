"use client";

import React, { useState } from "react";
import { ChefCard } from "@/components/ui/chef-card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Map,
  List,
  Search as SearchIcon,
  SlidersHorizontal,
  MapPin,
} from "lucide-react";
import { chefs, categories } from "@/mocks/data";

export default function SearchPage() {
  const [view, setView] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pt-6 md:pt-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Search header area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Discover Chefs
            </h1>
            <p className="text-muted-foreground mt-1">
              24 top-rated chefs available in your area
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full md:w-64 z-10">
              <Select
                options={sortOptions}
                value="recommended"
                onChange={() => {}}
              />
            </div>
            <div className="flex bg-secondary p-1 rounded-lg border border-border">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${view === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("map")}
                className={`p-2 rounded-md flex items-center justify-center transition-colors ${view === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 pb-20">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            className="lg:hidden w-full flex items-center justify-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          {/* Sidebar Filters */}
          <div
            className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="sticky top-24 space-y-8 h-[calc(100vh-8rem)] overflow-y-auto pr-4 custom-scrollbar">
              <div className="space-y-4 shadow-sm border border-border p-5 rounded-2xl bg-card">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<SearchIcon className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Price Range
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Min $" type="number" />
                  <Input placeholder="Max $" type="number" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Cuisine
                </h3>
                <div className="space-y-3">
                  {categories.slice(0, 5).map((cat) => (
                    <Checkbox
                      key={cat.id}
                      id={`cat-${cat.id}`}
                      label={cat.name}
                    />
                  ))}
                  <button className="text-sm font-medium text-primary hover:text-accent">
                    Show more
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Dietary Needs
                </h3>
                <div className="space-y-3">
                  <Checkbox id="diet-1" label="Vegetarian" />
                  <Checkbox id="diet-2" label="Vegan" />
                  <Checkbox id="diet-3" label="Gluten-Free" />
                  <Checkbox id="diet-4" label="Halal" />
                  <Checkbox id="diet-5" label="Kosher" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Rating
                </h3>
                <div className="space-y-3">
                  {[5, 4, 3].map((rating) => (
                    <Checkbox
                      key={rating}
                      id={`rating-${rating}`}
                      label={`${rating}+ Stars`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
            {view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {chefs.map((chef) => (
                  <ChefCard key={chef.id} chef={chef} />
                ))}
              </div>
            ) : (
              <div className="h-[600px] w-full rounded-2xl border border-border bg-muted/50 overflow-hidden relative flex flex-col items-center justify-center text-center p-8">
                {/* Embedded Map UI Mockup */}
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=New+York,NY&zoom=12&size=1000x800&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x333333&key=YOUR_API_KEY_MOCK')] bg-cover bg-center opacity-70 inset-0 z-0 grayscale" />

                {/* Mock Pins */}
                <div className="absolute top-1/4 left-1/3 bg-background border shadow-lg text-sm font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-primary">$150</span>
                </div>
                <div className="absolute top-1/2 left-1/2 bg-background border shadow-lg text-sm font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-primary">$90</span>
                </div>
                <div className="absolute top-2/3 right-1/4 bg-background border shadow-lg text-sm font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-primary">$200</span>
                </div>

                <div className="relative z-20 bg-background/80 backdrop-blur-md p-6 rounded-xl border shadow-xl max-w-sm">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">
                    Interactive Map View
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    In a production environment, this would be integrated with
                    Google Maps or Mapbox API to display precise chef locations
                    and service areas.
                  </p>
                </div>
              </div>
            )}

            {view === "grid" && (
              <div className="mt-12 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Load more chefs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
