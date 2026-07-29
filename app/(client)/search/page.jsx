"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChefCard } from "@/components/ui/chef-card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loading, LoadingPage } from "@/components/shared/loading";
import {
  Map,
  List,
  Search as SearchIcon,
  SlidersHorizontal,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { searchChefs } from "@/services/chef.service";
import { getCategories } from "@/services/category.service";

// ─── Constants ────────────────────────────────────────────────────────────────
const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher"];
const RATING_OPTIONS = [5, 4, 3];
const PAGE_SIZE = 9;

// ─── URL helper ───────────────────────────────────────────────────────────────
function pushFilter(router, updates, resetPage = true) {
  const params = new URLSearchParams(window.location.search);
  if (resetPage) params.delete("page");
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
  });
  router.replace(`/search?${params.toString()}`, { scroll: false });
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  // ── Derive checkbox / select filters directly from URL ───────────────────
  const cuisine = searchParams.get("cuisine") ?? "";
  const dietary = searchParams.get("dietary") ?? "";
  const minRating = searchParams.get("rating") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  // ── Local draft state for text inputs (debounced → URL) ─────────────────
  const [keywordDraft, setKeywordDraft] = useState(
    () => searchParams.get("keyword") ?? "",
  );
  const [minPriceDraft, setMinPriceDraft] = useState(
    () => searchParams.get("minPrice") ?? "",
  );
  const [maxPriceDraft, setMaxPriceDraft] = useState(
    () => searchParams.get("maxPrice") ?? "",
  );
  const [serviceAreaDraft, setServiceAreaDraft] = useState(
    () => searchParams.get("serviceArea") ?? "",
  );

  // Sync drafts when URL changes (browser back / forward)
  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setKeywordDraft(searchParams.get("keyword") ?? "");
    setMinPriceDraft(searchParams.get("minPrice") ?? "");
    setMaxPriceDraft(searchParams.get("maxPrice") ?? "");
    setServiceAreaDraft(searchParams.get("serviceArea") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey]);

  // Debounce keyword → URL
  useEffect(() => {
    const t = setTimeout(() => {
      const current = new URLSearchParams(window.location.search).get("keyword") ?? "";
      if (keywordDraft !== current) pushFilter(router, { keyword: keywordDraft });
    }, 400);
    return () => clearTimeout(t);
  }, [keywordDraft, router]);

  // Debounce price → URL
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      const curMin = p.get("minPrice") ?? "";
      const curMax = p.get("maxPrice") ?? "";
      if (minPriceDraft !== curMin || maxPriceDraft !== curMax) {
        pushFilter(router, { minPrice: minPriceDraft, maxPrice: maxPriceDraft });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [minPriceDraft, maxPriceDraft, router]);

  // Debounce service area → URL
  useEffect(() => {
    const t = setTimeout(() => {
      const current = new URLSearchParams(window.location.search).get("serviceArea") ?? "";
      if (serviceAreaDraft !== current) pushFilter(router, { serviceArea: serviceAreaDraft });
    }, 400);
    return () => clearTimeout(t);
  }, [serviceAreaDraft, router]);

  // ── Query values from URL (used in React Query key) ──────────────────────
  const keyword = searchParams.get("keyword") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const serviceArea = searchParams.get("serviceArea") ?? "";

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
  ];

  // ── Category list for sidebar ─────────────────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ── Chef search ───────────────────────────────────────────────────────────
  const {
    data: searchResult = { chefs: [], pagination: null },
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "chefs",
      "search",
      { keyword, cuisine, dietary, serviceArea, minPrice, maxPrice, minRating, page },
    ],
    queryFn: () =>
      searchChefs({
        keyword: keyword || undefined,
        cuisine: cuisine || undefined,
        dietary: dietary || undefined,
        serviceArea: serviceArea || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const chefs = searchResult.chefs ?? [];
  const pagination = searchResult.pagination ?? null;

  // ── Toggle helpers ────────────────────────────────────────────────────────
  function toggleCuisine(name) {
    pushFilter(router, { cuisine: cuisine === name ? "" : name });
  }
  function toggleDietary(option) {
    pushFilter(router, { dietary: dietary === option ? "" : option });
  }
  function toggleRating(value) {
    pushFilter(router, { rating: minRating === String(value) ? "" : String(value) });
  }
  function goToPage(newPage) {
    pushFilter(router, { page: newPage > 1 ? String(newPage) : "" }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
              {isLoading
                ? "Searching..."
                : pagination
                ? `${pagination.totalItems} chef${pagination.totalItems !== 1 ? "s" : ""} found`
                : `${chefs.length} chef${chefs.length !== 1 ? "s" : ""} found`}
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
                  placeholder="Search chefs by name..."
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  leftIcon={<SearchIcon className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Price Range
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min $"
                    type="number"
                    value={minPriceDraft}
                    onChange={(e) => setMinPriceDraft(e.target.value)}
                  />
                  <Input
                    placeholder="Max $"
                    type="number"
                    value={maxPriceDraft}
                    onChange={(e) => setMaxPriceDraft(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Service Area
                </h3>
                <Input
                  placeholder="e.g. Brooklyn, NY"
                  value={serviceAreaDraft}
                  onChange={(e) => setServiceAreaDraft(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Cuisine
                </h3>
                <div className="space-y-3">
                  {categories.slice(0, 5).map((cat) => (
                    <Checkbox
                      key={cat._id}
                      id={`cat-${cat._id}`}
                      label={cat.name}
                      checked={cuisine === cat.name}
                      onChange={() => toggleCuisine(cat.name)}
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
                  {DIETARY_OPTIONS.map((option) => (
                    <Checkbox
                      key={option}
                      id={`diet-${option}`}
                      label={option}
                      checked={dietary === option}
                      onChange={() => toggleDietary(option)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">
                  Rating
                </h3>
                <div className="space-y-3">
                  {RATING_OPTIONS.map((r) => (
                    <Checkbox
                      key={r}
                      id={`rating-${r}`}
                      label={`${r}+ Stars`}
                      checked={minRating === String(r)}
                      onChange={() => toggleRating(r)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
            {isLoading && (
              <div className="flex justify-center py-24">
                <Loading size="lg" text="Finding chefs..." />
              </div>
            )}

            {isError && (
              <div className="text-center py-24">
                <p className="text-muted-foreground">
                  Unable to load chefs. Please try again later.
                </p>
              </div>
            )}

            {!isLoading && !isError && view === "grid" && (
              <>
                {chefs.length === 0 ? (
                  <div className="text-center py-24">
                    <p className="text-muted-foreground text-lg">
                      No chefs found matching your filters.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Try adjusting your search criteria.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {chefs.map((chef) => (
                      <ChefCard key={chef.id} chef={chef} />
                    ))}
                  </div>
                )}

                {/* Pagination controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPreviousPage || isLoading}
                      onClick={() => goToPage(page - 1)}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            Math.abs(p - page) <= 1,
                        )
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "..." ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-2 text-muted-foreground"
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={item}
                              variant={item === page ? "default" : "outline"}
                              size="sm"
                              className="w-9 h-9 p-0"
                              onClick={() => goToPage(item)}
                            >
                              {item}
                            </Button>
                          ),
                        )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage || isLoading}
                      onClick={() => goToPage(page + 1)}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !isError && view === "map" && (
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

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingPage text="Loading search..." />}>
      <SearchPageContent />
    </Suspense>
  );
}
