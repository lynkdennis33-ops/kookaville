import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';

export default function ClientBookingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Review your past and upcoming dining experiences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>You have 1 upcoming event.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-xl border border-border bg-secondary/30 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
             <div className="flex gap-4 items-center">
                <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center text-2xl">👨‍🍳</div>
                <div>
                  <h3 className="font-bold text-lg">Dinner Party for 10</h3>
                  <p className="text-sm font-medium text-primary mt-1">Chef Sarah Jenkins</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Dec 31, 2026 - 7:00 PM</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> 123 Main St, New York</span>
                  </div>
                </div>
             </div>
             <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
               <Button variant="outline" className="flex-1 sm:flex-none">Reschedule</Button>
               <Button className="flex-1 sm:flex-none">Details</Button>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-bold tracking-tight mt-12 mb-4">Past Experiences</h3>
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <p className="text-muted-foreground mb-4">You have no past bookings yet.</p>
      </div>
    </div>
  );
}
