import React from 'react';
import Link from 'next/link';
import { Calendar, Heart, Settings, MessageSquare, CreditCard } from 'lucide-react';

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'Overview', href: '/dashboard', icon: Calendar },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Saved Chefs', href: '/dashboard/saved', icon: Heart },
    { name: 'Payment Methods', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold font-serif">
                J
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">James C.</h2>
                <p className="text-sm text-muted-foreground">Joined 2026</p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  );
}
