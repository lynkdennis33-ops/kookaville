import React from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClientPaymentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Payment Methods
        </h1>
        <p className="text-muted-foreground">
          Manage your cards and billing information.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Saved Cards</CardTitle>
            <CardDescription>
              Your primary payment method is used for all bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/30">
              <div className="flex items-center gap-4">
                <div className="h-10 w-12 bg-white rounded border border-border flex items-center justify-center p-1">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1000px-Mastercard-logo.svg.png"
                    alt="Mastercard"
                    className="h-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold">Mastercard •••• 4242</p>
                  <p className="text-sm text-muted-foreground">
                    Expires 12/2026
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-background">
                Primary
              </Badge>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 dashed border-2 border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Payment Method
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 bg-secondary/20 p-6 rounded-xl border border-border">
          <ShieldCheck className="h-8 w-8 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Secure Payments</p>
            <p className="text-sm text-muted-foreground">
              Your payment information is encrypted and stored securely. We
              never store your full card details on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Badge component since we can't easily import it without checking path
function Badge({ children, variant, className }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variant === "outline" ? "border-border text-foreground" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
