import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Utensils, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';

export default function AdminChefsPage() {
  const pendingApprovals = [
    { id: 'C1', name: 'Chef Mario', specialty: 'Italian', applied: '2 days ago' },
    { id: 'C2', name: 'Chef Yuki', specialty: 'Sushi', applied: '1 week ago' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Chef Approvals</h1>
        <p className="text-muted-foreground">Review applications and verify chef credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-amber-200 bg-amber-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Applications
            </CardTitle>
            <CardDescription>Chefs waiting for manual review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApprovals.map((chef) => (
              <div key={chef.id} className="flex items-center justify-between p-4 border border-amber-200 rounded-xl bg-background shadow-sm">
                <div>
                  <p className="font-bold">{chef.name}</p>
                  <p className="text-sm text-muted-foreground">{chef.specialty} • {chef.applied}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Reject</Button>
                  <Button size="sm">Review</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verified Chefs</CardTitle>
            <CardDescription>Track performance and compliance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">124 Verified Chefs</p>
                  <p className="text-sm text-muted-foreground">All active on the platform.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Manage <ExternalLink className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
