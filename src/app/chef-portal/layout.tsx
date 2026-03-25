import React from 'react';
import { Sidebar, CHEF_SIDEBAR_ITEMS } from '@/components/shared/sidebar';

export default function ChefPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar items={CHEF_SIDEBAR_ITEMS} role="chef" />
      <main className="flex-1 max-h-screen overflow-y-auto bg-muted/20">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
