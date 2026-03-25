"use client";

import React from 'react';
import { Search, MapPin, Calendar, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSearch() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80&auto=format&fit=crop"
          alt="Exquisite private dining"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pt-10">
        <div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur-md mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-accent mr-2 animate-pulse"></span>
          Now booking for the holiday season
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold font-serif text-white tracking-tight mb-8 drop-shadow-lg leading-[1.1]">
          Fine Dining, <br className="hidden sm:block" />
          <span className="text-accent italic font-medium">Elevated at Home.</span>
        </h1>
        <p className="mt-4 text-xl sm:text-2xl text-white/95 max-w-2xl mx-auto mb-12 leading-relaxed font-light font-serif drop-shadow-md">
          Book world-class private chefs for intimate dinners, special events, and curated culinary experiences.
        </p>

        {/* Search Bar - Airbnb Style */}
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-xl rounded-[2rem] p-2 sm:p-3 shadow-2xl flex flex-col md:flex-row items-center border border-white/20">
          
          <div className="flex-1 w-full md:w-auto px-6 py-4 cursor-pointer hover:bg-black/5 rounded-full transition-colors flex flex-col items-start border-b md:border-b-0 md:border-r border-border/50">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Location</span>
            <div className="flex items-center text-muted-foreground w-full">
              <MapPin className="w-5 h-5 mr-3 text-accent" strokeWidth={1.5} />
              <input 
                type="text" 
                placeholder="Where are you dining?" 
                className="bg-transparent border-none outline-none text-[15px] w-full text-primary font-medium placeholder:font-normal placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="flex-1 w-full md:w-auto px-6 py-4 cursor-pointer hover:bg-black/5 rounded-full transition-colors flex flex-col items-start border-b md:border-b-0 md:border-r border-border/50">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Date</span>
            <div className="flex items-center text-muted-foreground w-full">
              <Calendar className="w-5 h-5 mr-3 text-accent" strokeWidth={1.5} />
              <input 
                type="text" 
                placeholder="Add dates" 
                disabled
                className="bg-transparent border-none outline-none text-[15px] w-full cursor-pointer text-primary font-medium placeholder:font-normal placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="flex-1 w-full md:w-auto px-6 py-4 cursor-pointer hover:bg-black/5 rounded-full transition-colors flex flex-col items-start">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Cuisine</span>
            <div className="flex items-center text-muted-foreground w-full">
              <Utensils className="w-5 h-5 mr-3 text-accent" strokeWidth={1.5} />
              <input 
                type="text" 
                placeholder="Italian, Sushi, Vegan..." 
                className="bg-transparent border-none outline-none text-[15px] w-full text-primary font-medium placeholder:font-normal placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="w-full md:w-auto mt-2 md:mt-0 px-2 md:px-0 md:pr-1 pb-2 md:pb-0">
            <Button size="lg" className="w-full md:w-auto rounded-full h-16 px-10 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/30 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Search className="w-5 h-5 mr-3" strokeWidth={2.5} />
              Find Chefs
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
