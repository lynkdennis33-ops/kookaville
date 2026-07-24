"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { login as loginService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/shared/loading";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const form = e.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;   

    try {
      const user = await loginService({ email, password });
      login(user);

      // Redirect to the originally requested page, or to the role dashboard
      const from = searchParams.get("from");
      if (from && from.startsWith("/")) {
        router.replace(from);
      } else if (user.role === "chef") {
        router.replace("/chef-portal/dashboard");
      } else if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome back
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>

      <div className="mt-8">
        <div className="grid gap-3">
          <Button
            variant="outline"
            className="w-full text-foreground hover:bg-secondary"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />

              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />

              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />

              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          {/* <Button
            variant="outline"
            className="w-full text-foreground hover:bg-secondary"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.33-.79 3.83-.69 1.15.08 2.35.48 3.2 1.25-2.6 1.4-2.14 4.88.58 5.76-.84 2.1-1.93 4.21-2.69 5.85z" />
              <path d="M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </Button> */}
        </div>

        <div className="relative mt-8">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm font-medium leading-6">
            <span className="bg-background px-6 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-foreground"
            >
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
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-foreground"
            >
              Password
            </label>
            <div className="mt-2">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox id="remember-me" name="remember-me" label="Remember me" />

            <div className="text-sm leading-6">
              <Link
                href="/forgot-password"
                className="font-semibold text-otherPrimary hover:text-otherPrimary/80"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Not a member?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginContent />
    </Suspense>
  );
}
