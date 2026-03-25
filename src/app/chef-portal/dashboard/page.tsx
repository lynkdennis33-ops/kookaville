import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, CalendarDays, CheckCircle2, ChevronRight, Share } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ChefDashboardOverview() {
  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Verified Profile
            </span>
          </div>
          <p className="text-muted-foreground">Welcome back, Chef Gordon.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" /> Share Profile
          </Button>
          <Button size="sm">
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,250.00</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next booking in 2 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +40% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Rating</CardTitle>
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on 124 reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Booking widget */}
        <Card className="flex flex-col border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Next Upcoming Booking</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4 border-b border-border/50 pb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Dinner Party for 10</h3>
                  <p className="text-sm text-muted-foreground">James C. • Manhattan, NY</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">$1,500</div>
                  <Badge variant="outline" className="bg-background">Confirmed</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Date & Time</h4>
                  <p className="font-medium">March 15, 2026 at 7:00 PM</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Dietary Notes</h4>
                  <p className="font-medium text-red-600">Strict Peanut Allergy (1 Guest)</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button variant="outline" className="bg-background">Message Client</Button>
              <Button>Review Event Details</Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Required & Notifications */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Tasks & Notifications</h3>
          
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-destructive">Review new booking request</h4>
              <p className="text-sm text-muted-foreground mt-1">Sarah M. requested a vegan dinner for 4 on April 2nd.</p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 self-center">Review</Button>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card flex gap-4">
            <div className="flex-1">
              <h4 className="font-bold">You received a 5-star review!</h4>
              <p className="text-sm text-muted-foreground mt-1">"Absolutely phenomenal experience. The food was incredible..."</p>
            </div>
            <Button size="sm" variant="ghost" className="shrink-0 self-center"><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card flex gap-4">
            <div className="flex-1">
              <h4 className="font-bold">Payout processing</h4>
              <p className="text-sm text-muted-foreground mt-1">Your payout of $350.00 is currently processing.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
