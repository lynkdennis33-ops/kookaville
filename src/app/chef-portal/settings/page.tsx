import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Bell, Shield, MapPin } from 'lucide-react';

export default function ChefSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences.</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your public chef profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center border-2 border-border overflow-hidden shrink-0">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input defaultValue="Gordon Ramsey-ish" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input defaultValue="New York, NY" leftIcon={<MapPin className="h-4 w-4" />} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea defaultValue="Award-winning chef with 15 years of culinary excellence in fine dining." rows={3} />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Preferences</CardTitle>
            <CardDescription>Configure how you receive bookings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl">
              <div className="flex items-center gap-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Instant Booking</p>
                  <p className="text-sm text-muted-foreground">Allow clients to book without manual approval.</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Disable</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
