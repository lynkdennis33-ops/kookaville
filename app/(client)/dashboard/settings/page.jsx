import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ClientSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your contact details and name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  First Name
                </label>
                <Input defaultValue="James" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Last Name
                </label>
                <Input defaultValue="Crawford" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Email Address
              </label>
              <Input defaultValue="james@example.com" type="email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Phone Number
              </label>
              <Input defaultValue="+1 (555) 123-4567" type="tel" />
            </div>
            <div className="pt-4">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your password and authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Current Password
              </label>
              <Input type="password" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                New Password
              </label>
              <Input type="password" />
            </div>
            <div className="pt-4">
              <Button variant="secondary">Update Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
