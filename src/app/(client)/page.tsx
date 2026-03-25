import React from 'react';
import { HeroSearch } from '@/components/client/hero-search';
import { Categories } from '@/components/client/categories';
import { FeaturedChefs } from '@/components/client/featured-chefs';
import { HowItWorks } from '@/components/client/how-it-works';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSearch />
      <HowItWorks />
      <FeaturedChefs />
      <Categories />
      
      {/* Testimonial / CTA Section */}
      <section className="bg-primary text-primary-foreground py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#gradient)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="gradient">
                <stop stopColor="#ffffff" />
                <stop offset="1" stopColor="#3b82f6" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <svg className="mx-auto h-12 w-12 text-accent opacity-50 mb-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-3xl sm:text-4xl md:text-5xl font-serif text-white leading-tight mb-12 drop-shadow-sm font-medium">
            "The easiest way to host a dinner party. The food was simply incredible, and waking up to a spotless kitchen the next day was purely magical."
          </blockquote>
          <div className="flex items-center justify-center gap-5">
            <img 
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format" 
              alt="Sarah M." 
              className="h-16 w-16 rounded-full object-cover ring-4 ring-white/10"
            />
            <div className="text-left">
              <div className="font-semibold text-lg text-white font-serif">Sarah Jenkins</div>
              <div className="text-primary-foreground/70 font-medium">Hosted a 10-person birthday dinner</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
