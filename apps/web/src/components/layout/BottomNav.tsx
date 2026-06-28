'use client';

import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  Ship,
  Users,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',                  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/crew',              label: 'Crew',       icon: Users },
  { href: '/vessels',           label: 'Fleet',      icon: Ship },
  { href: '/compliance/alerts', label: 'Compliance', icon: ClipboardList },
  { href: '/compliance/fleet',  label: 'Analytics',  icon: BarChart2 },
  { href: '/emergency',         label: 'Emergency',  icon: AlertTriangle, danger: true },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--card)] border-t border-[var(--border)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-6 h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon, danger }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 transition-colors',
                active
                  ? danger
                    ? 'text-[#FF4B2B]'
                    : 'text-[#00F2FE]'
                  : danger
                  ? 'text-[rgba(255,75,43,0.45)] hover:text-[#FF4B2B]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden />
              <span className="text-[9px] tracking-wide uppercase leading-none font-medium">
                {label}
              </span>
              {active && !danger && (
                <span className="absolute top-0 w-8 h-[2px] bg-[#00F2FE] rounded-full" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
