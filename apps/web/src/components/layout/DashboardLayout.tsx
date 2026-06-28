'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Extra classes on the main content area */
  contentClassName?: string;
}

/**
 * Shared shell for every dashboard page.
 * Provides AppSidebar (desktop), AppHeader, BottomNav (mobile).
 * Replaces the pattern of importing all three individually in each page.
 */
export function DashboardLayout({ children, contentClassName }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />

        <main
          className={cn(
            'flex-1 overflow-auto',
            'pb-16 md:pb-0', // clear BottomNav height on mobile
            contentClassName
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
