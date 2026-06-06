import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Admin Settings
        </h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and security.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Platform Configuration
              </CardTitle>
              <CardDescription>Global settings for Lumière.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Fee (%)</label>
                <Input type="number" defaultValue="12" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Support Email</label>
                <Input type="email" defaultValue="support@lumiere.com" />
              </div>
              <Button className="w-full">Update Global Config</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security & Auth
              </CardTitle>
              <CardDescription>
                Manage administrative access rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Multi-Factor Auth (2FA)
                  </span>
                </div>
                <div className="h-5 w-9 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Manage Admin Roles
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Maintenance Mode</CardTitle>
            <CardDescription>
              Take the platform offline for updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enabling maintenance mode will restrict access to all users except
              admins.
            </p>
            <Button variant="danger">Enable Maintenance Mode</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
