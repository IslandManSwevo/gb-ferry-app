'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/lib/auth/roles';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { filterMenuItemsByRole, menuItems, parentKeys } from './AppSidebar';

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1';

type NavMenuItem = Record<string, any>;

/* ── Mobile nav sheet ───────────────────────────────────── */
interface NavSheetProps {
  open: boolean;
  onClose: () => void;
  items: NavMenuItem[];
  selectedKey: string;
  onNavigate: (key: string) => void;
}

function NavSheet({ open, onClose, items, selectedKey, onNavigate }: NavSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      sheetRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const groups = items.filter((item): item is NavMenuItem & { children: NavMenuItem[] } =>
    Array.isArray(item.children) && item.children.length > 0
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label="Navigation"
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-72',
          'bg-[var(--card)] border-r border-[var(--border)] flex flex-col',
          'transition-transform duration-200 ease-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)]">
          <div>
            <p className="font-display text-[13px] font-semibold text-[var(--foreground)]">GB Ferry</p>
            <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[var(--muted-foreground)]">
              Crew Compliance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((group) => (
            <div key={String(group.key)} className="mb-4">
              <p className="px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase text-[var(--muted-foreground)] font-mono">
                {String(group.label)}
              </p>
              {group.children.map((child) => {
                const key = String(child.key);
                const active = selectedKey === key || selectedKey.startsWith(`${key}/`);
                return (
                  <button
                    key={key}
                    onClick={() => onNavigate(key)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all',
                      active
                        ? 'text-[#00F2FE] bg-[rgba(0,242,254,0.08)] font-medium'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                    )}
                  >
                    {String(child.label)}
                    {active && <ChevronRight size={12} aria-hidden />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sheet footer */}
        <div className="border-t border-[var(--border)] p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgba(255,75,43,0.8)] hover:text-[#FF4B2B] hover:bg-[rgba(255,75,43,0.06)] transition-all"
          >
            <LogOut size={14} aria-hidden />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

/* ── AppHeader ───────────────────────────────────────────── */
export const AppHeader: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roles = useUserRoles();
  const filteredItems = React.useMemo(
    () => filterMenuItemsByRole(menuItems, roles) as NavMenuItem[],
    [roles]
  );

  /* SSE — STCW expiry push notifications */
  useEffect(() => {
    const sseUrl = `${API_PREFIX}/notifications/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'EXPIRY_WARNING' || payload?.type === 'MANNING_ALERT') {
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // malformed SSE chunk — ignore
      }
    };

    return () => { eventSource.close(); };
  }, []);

  /* Close user menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigate = (key: string) => {
    setSheetOpen(false);
    if (!parentKeys.has(key)) router.push(key);
  };

  const userName = session?.user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const primaryRole = (session?.user?.roles?.[0] || 'Staff')
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  /* Breadcrumb label */
  const breadcrumb =
    pathname === '/'
      ? 'Command Center'
      : pathname.split('/').filter(Boolean).join(' / ');

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 h-14',
          'bg-[var(--card)] border-b border-[var(--border)]',
          'flex items-center justify-between px-4 gap-4'
        )}
      >
        {/* Left — hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
            onClick={() => setSheetOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <span className="hidden md:block text-sm font-medium text-[var(--muted-foreground)] capitalize">
            {breadcrumb}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Emergency */}
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle size={13} />}
            onClick={() => router.push('/emergency')}
            className="hidden sm:inline-flex ml-1"
          >
            Emergency
          </Button>
          <button
            className="sm:hidden p-2 rounded-md text-[#FF4B2B] hover:bg-[rgba(255,75,43,0.08)] transition-all"
            onClick={() => router.push('/emergency')}
            aria-label="Emergency"
          >
            <AlertTriangle size={18} />
          </button>

          {/* Notification bell */}
          <button
            className="relative p-2 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            onClick={() => setUnreadCount(0)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF4B2B] rounded-full block" aria-hidden />
            )}
          </button>

          {/* User menu */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all',
                userMenuOpen
                  ? 'bg-[var(--accent)] border-[var(--border)]'
                  : 'border-transparent hover:bg-[var(--accent)] hover:border-[var(--border)]'
              )}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-7 h-7 rounded-full bg-[rgba(0,242,254,0.12)] border border-[rgba(0,242,254,0.2)] flex items-center justify-center">
                {status === 'loading' ? (
                  <div className="w-3 h-3 border border-[#00F2FE] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="font-mono text-[11px] text-[#00F2FE] font-semibold">
                    {userInitial}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-sm font-medium text-[var(--foreground)]">{userName}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{primaryRole}</p>
              </div>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-card z-50 overflow-hidden py-1">
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
                >
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all"
                >
                  <Settings size={14} /> Settings
                </button>
                <div className="h-px bg-[var(--border)] my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[rgba(255,75,43,0.8)] hover:text-[#FF4B2B] hover:bg-[rgba(255,75,43,0.06)] transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NavSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={filteredItems}
        selectedKey={pathname}
        onNavigate={handleNavigate}
      />
    </>
  );
};
