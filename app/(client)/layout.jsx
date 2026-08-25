"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ChefTransitionDialog } from "@/components/shared/chef-transition-dialog";
import { useAuth } from "@/context/AuthContext";

export default function ClientLayout({ children }) {
  const { needsChefTransition } = useAuth();
  const pathname = usePathname();

  // Let active booking/payment flows finish uninterrupted.
  // The onboarding page shows its own inline transition UI so the global
  // modal is suppressed there too.
  const suppressDialog =
    pathname === "/chef/onboarding" || pathname.startsWith("/book/");

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col relative w-full pt-16">
        {children}
      </main>
      <Footer />
      {needsChefTransition && !suppressDialog && <ChefTransitionDialog />}
    </>
  );
}
