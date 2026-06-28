'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserRoles } from '@/lib/auth/roles';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  HelpCircle,
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

/* ── Types ───────────────────────────────────────────────── */
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
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/70 transition-opacity md:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label="Navigation"
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#050505]',
          'border-r border-[rgba(51,255,51,0.2)] flex flex-col',
          'transition-transform duration-200 ease-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[rgba(51,255,51,0.1)]">
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#33FF33]">GB FERRY</p>
            <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(51,255,51,0.4)]">
              CREW COMPLIANCE
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] transition-colors"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={String(group.key)} className="mb-4">
              <p className="px-4 py-1 font-mono text-[9px] tracking-[0.15em] uppercase text-[rgba(51,255,51,0.3)]">
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
                      'w-full flex items-center justify-between px-4 py-2 text-left transition-colors',
                      'font-mono text-[11px] tracking-wide',
                      active
                        ? 'text-[#33FF33] bg-[rgba(51,255,51,0.06)] border-l-2 border-[#33FF33]'
                        : 'text-[rgba(51,255,51,0.45)] hover:text-[#33FF33] hover:bg-[rgba(51,255,51,0.04)] border-l-2 border-transparent'
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
        <div className="border-t border-[rgba(51,255,51,0.1)] p-4">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] tracking-wide text-[rgba(255,75,43,0.7)] hover:text-[#FF4B2B] transition-colors"
          >
            <LogOut size={13} aria-hidden />
            SIGN OUT
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
  // filterMenuItemsByRole accepts antd MenuItem[] — cast via unknown to our structural alias
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

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 h-14',
          'bg-[#050505] border-b border-[rgba(51,255,51,0.2)]',
          'flex items-center justify-between px-4 gap-4'
        )}
      >
        {/* Left — hamburger (mobile only) */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-1.5 text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] transition-colors"
            onClick={() => setSheetOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb / page label — desktop */}
          <span className="hidden md:block font-mono text-[10px] tracking-[0.12em] uppercase text-[rgba(51,255,51,0.4)]">
            {pathname === '/'
              ? 'Command Center'
              : pathname.split('/').filter(Boolean).join(' / ').toUpperCase()}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Emergency — always visible */}
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle size={12} />}
            onClick={() => router.push('/emergency')}
            className="hidden sm:inline-flex"
          >
            Emergency
          </Button>
          {/* Emergency icon-only on xs */}
          <button
            className="sm:hidden p-1.5 text-[#FF4B2B] hover:text-[#e03820] transition-colors"
            onClick={() => router.push('/emergency')}
            aria-label="Emergency"
          >
            <AlertTriangle size={18} />
          </button>

          <button
            className="p-1.5 text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={16} />
          </button>

          {/* Notification bell */}
          <button
            className="relative p-1.5 text-[rgba(51,255,51,0.4)] hover:text-[#33FF33] transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            onClick={() => setUnreadCount(0)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF4B2B] block" aria-hidden />
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 border border-[rgba(51,255,51,0.15)] hover:border-[rgba(51,255,51,0.4)] transition-colors"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-6 h-6 bg-[rgba(51,255,51,0.12)] flex items-center justify-center">
                {status === 'loading' ? (
                  <div className="w-3 h-3 border border-[#33FF33] border-t-transparent animate-spin" />
                ) : (
                  <span className="font-mono text-[10px] text-[#33FF33] font-semibold">
                    {userInitial}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="font-mono text-[11px] text-[rgba(51,255,51,0.7)]">{userName}</p>
                <p className="font-mono text-[9px] text-[rgba(51,255,51,0.45)] uppercase tracking-wider">
                  {primaryRole}
                </p>
              </div>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#050505] border border-[rgba(51,255,51,0.2)] z-50">
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] hover:bg-[rgba(51,255,51,0.04)] transition-colors"
                >
                  <User size={13} /> Profile
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[11px] text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] hover:bg-[rgba(51,255,51,0.04)] transition-colors"
                >
                  <Settings size={13} /> Settings
                </button>
                <div className="border-t border-[rgba(51,255,51,0.1)]" />
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] text-[rgba(255,75,43,0.7)] hover:text-[#FF4B2B] hover:bg-[rgba(255,75,43,0.04)] transition-colors"
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile slide-in nav sheet */}
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
