import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ClientSavedPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Chefs</h1>
        <p className="text-muted-foreground">Keep track of your favorite culinary professionals.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-border rounded-xl bg-card shadow-sm">
        <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2">No saved chefs</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          When you see a chef you like, click the heart icon on their profile or card to save them here for later.
        </p>
        <Button asChild size="lg">
          <Link href="/search">Explore Chefs</Link>
        </Button>
      </div>
    </div>
  );
}
