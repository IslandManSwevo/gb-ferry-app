'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function DashboardLayout({ children, contentClassName }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <main
          className={cn(
            'flex-1 overflow-auto',
            'pb-16 md:pb-0',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
