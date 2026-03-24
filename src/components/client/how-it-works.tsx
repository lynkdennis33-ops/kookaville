import React from 'react';
import { Search, CalendarDays, UtensilsCrossed, Star } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      title: 'Find Your Chef',
      description: 'Browse our curated list of world-class private chefs based on location, cuisine, or specific dietary needs.',
      icon: Search,
    },
    {
      title: 'Customize Menu',
      description: 'Collaborate directly with your chef to tailor a menu perfectly suited for your event or dining preference.',
      icon: UtensilsCrossed,
    },
    {
      title: 'Book Details',
      description: 'Reserve your date securely. Your chef handles the ingredients, cooking, and the cleanup.',
      icon: CalendarDays,
    },
    {
      title: 'Enjoy the Experience',
      description: 'Relax and savor an unforgettable, restaurant-quality meal right in the comfort of your own home.',
      icon: Star,
    },
  ];

  return (
    <section className="py-32 bg-muted/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl font-bold font-serif tracking-tight text-foreground sm:text-5xl mb-6">The Lumière Experience</h2>
        <p className="text-muted-foreground font-serif max-w-2xl mx-auto mb-20 text-xl font-light">
          A seamless journey from discovering local culinary talent to indulging in an unforgettable meal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
          <div className="hidden md:block absolute top-[2.75rem] left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center group">
              <div className="h-20 w-20 rounded-full bg-background border border-border/50 shadow-sm flex items-center justify-center mb-8 ring-8 ring-muted/30 transition-transform duration-500 group-hover:scale-110">
                <step.icon className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold font-serif tracking-tight mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
