"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/ui/stepper";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, BadgeCheck, Utensils } from "lucide-react";

export default function ChefOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { title: "Personal Info" },
    { title: "Specialties" },
    { title: "Credentials" },
  ];

  const handleNext = () => setStep((s) => Math.min(3, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/chef/dashboard");
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Become a Kookaville Chef
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join our exclusive network of top-tier private chefs and culinary
          experts.
        </p>
      </div>

      <div className="bg-card border border-border shadow-dropdown rounded-3xl p-8 md:p-12 mb-8">
        <div className="mb-12 max-w-xl mx-auto">
          <Stepper steps={steps} currentStep={step} />
        </div>

        <div className="max-w-xl mx-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b border-border pb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <Input placeholder="E.g. Gordon" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <Input placeholder="E.g. Ramsay" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Location (City, State)
                </label>
                <Input placeholder="E.g. New York, NY" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Short Bio
                </label>
                <Textarea
                  placeholder="Tell clients about your culinary background..."
                  rows={4}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleNext} className="w-full sm:w-auto px-8">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b border-border pb-4">
                Culinary Expertise
              </h2>

              <div>
                <label className="block text-sm font-medium mb-3 border-b border-border pb-2">
                  Primary Cuisines
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Italian" />
                  <Checkbox label="French" />
                  <Checkbox label="Japanese / Sushi" />
                  <Checkbox label="Mediterranean" />
                  <Checkbox label="American BBQ" />
                  <Checkbox label="Mexican" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 border-b border-border pb-2 mt-6">
                  Dietary Accommodations
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Vegan" />
                  <Checkbox label="Vegetarian" />
                  <Checkbox label="Gluten-Free" />
                  <Checkbox label="Halal" />
                  <Checkbox label="Kosher" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 mt-6">
                  Base Pricing (Per Person)
                </label>
                <Input type="number" placeholder="$150" />
              </div>

              <div className="pt-6 flex justify-between">
                <Button variant="outline" onClick={handleBack} className="px-8">
                  Back
                </Button>
                <Button onClick={handleNext} className="px-8">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold border-b border-border pb-4">
                Credentials & Verification
              </h2>

              <div className="bg-secondary/50 border border-secondary rounded-xl p-4 flex gap-4">
                <BadgeCheck className="h-6 w-6 text-primary shrink-0" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Kookaville requires all chefs to hold a valid Food Handler's
                  License and undergo a background check.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload ID (Passport or Driver's License)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-card hover:bg-secondary cursor-pointer transition-colors">
                  <CloudUpload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SVG, PNG, JPG or PDF (max. 5MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 mt-6">
                  Food Handler's Certificate
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-card hover:bg-secondary cursor-pointer transition-colors">
                  <Utensils className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="font-medium">Upload Certificate</p>
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="px-8"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="px-8 bg-accent hover:bg-accent/90 focus-visible:ring-accent"
                  isLoading={isLoading}
                >
                  Submit Application
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
