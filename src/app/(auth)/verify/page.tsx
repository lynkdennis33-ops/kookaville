"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length !== 6) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="bg-primary/5 p-3 rounded-full mb-6">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Verify your phone
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        We've sent a 6-digit verification code to <span className="font-semibold text-foreground">+1 (***) ***-8921</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm">
        <div className="flex justify-between gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                "w-12 h-14 text-center text-xl font-semibold border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                digit ? "border-primary text-foreground" : "border-border text-muted-foreground"
              )}
            />
          ))}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading} disabled={otp.join('').length !== 6}>
          Verify Account
        </Button>
      </form>

      <div className="mt-8 text-sm text-muted-foreground flex gap-1">
        Didn't receive code? 
        <button className="font-semibold text-primary hover:underline">
          Resend code
        </button>
      </div>
    </div>
  );
}
