"use client";

import React from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

export default function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col relative w-full pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
