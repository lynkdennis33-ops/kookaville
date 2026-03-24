"use client";

import React from 'react';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side: Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex justify-center lg:justify-start">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <ChefHat className="h-6 w-6" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-primary">
                Lumière
              </span>
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
      
      {/* Right side: Image */}
      <div className="hidden lg:block relative w-0 flex-1 bg-muted">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&auto=format&fit=crop"
          alt="Chef preparing a premium meal"
        />
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Elevate your dining experience.</h2>
          <p className="text-lg text-white/90 max-w-lg leading-relaxed">
            Connect with world-class private chefs for unforgettable culinary moments in the comfort of your home.
          </p>
        </div>
      </div>
    </div>
  );
}
