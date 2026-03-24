"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1200);
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Check your email
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          We've sent a password reset link to your email address. Please check your inbox and spam folder.
        </p>
        <Button asChild variant="outline" className="mt-8 w-full font-semibold">
          <Link href="/login">Return to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to login
      </Link>
      
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Forgot password?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email address to get a password reset link.
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-foreground">
              Email address
            </label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
