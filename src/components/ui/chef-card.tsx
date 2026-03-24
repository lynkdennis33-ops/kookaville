import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { Heart, MapPin } from 'lucide-react';

export interface ChefCardProps {
  chef: any;
}

export function ChefCard({ chef }: ChefCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-card hover:-translate-y-1">
      <Link href={`/chef/${chef.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {chef.name}'s profile</span>
      </Link>
      
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={chef.coverImage}
          alt={chef.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button className="absolute right-3 top-3 z-20 rounded-full p-2 text-white/90 hover:scale-110 hover:text-accent transition-transform backdrop-blur-md bg-black/20">
          <Heart className="h-5 w-5" />
        </button>
        {chef.featured && (
          <div className="absolute left-3 top-3 z-20">
            <Badge variant="default" className="shadow-md shadow-black/10">Featured</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={chef.avatar}
                alt={chef.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-background shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-lg leading-tight flex items-center gap-1.5">
                  {chef.name}
                  {chef.verified && (
                    <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-lg">${chef.pricePerPerson}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Per Person</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium text-sm">
              <RatingStars rating={chef.rating} size="sm" />
              <span className="ml-1">{chef.rating}</span>
              <span className="text-muted-foreground font-normal">({chef.reviews})</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {chef.location.split(',')[0]}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chef.specialties.slice(0, 3).map((spec: string, i: number) => (
              <Badge key={i} variant="secondary" className="font-medium text-[10px] px-2">
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
