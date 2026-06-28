'use client';

import { canAccess } from '@/lib/auth/access';
import { useUserRoles } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';
import {
  Anchor,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

/* ── Types ────────────────────────────────────────────────── */
export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  type?: 'divider';
}

/* ── Feature access map ───────────────────────────────────── */
const FEATURE_MAP: Record<string, string> = {
  '/crew': 'crew.view',
  '/crew/safe-manning': 'crew.manage',
  '/crew/certifications': 'certifications.view',
  '/compliance/cbp': 'compliance.export',
  '/compliance/bma': 'compliance.export',
  '/compliance/alerts': 'compliance.reports',
  '/vessels/documents': 'documents.upload',
  '/vessels': 'vessels.view',
  '/compliance/exports': 'compliance.export',
  '/compliance/reports': 'compliance.reports',
  '/compliance/fleet': 'compliance.dashboard',
  '/compliance/inspections': 'inspections.manage',
  '/audit': 'audit.view',
  '/settings': 'settings.view',
};

/* ── Menu items ───────────────────────────────────────────── */
export const menuItems: NavItem[] = [
  {
    key: '/',
    icon: <LayoutDashboard size={15} />,
    label: 'Command Center',
  },
  {
    key: 'crew-compliance',
    icon: <Users size={15} />,
    label: 'Crew Compliance',
    children: [
      { key: '/crew', label: 'Crew Directory' },
      { key: '/crew/safe-manning', label: 'Safe Manning' },
      { key: '/crew/certifications', label: 'Certifications' },
    ],
  },
  {
    key: 'regulatory-forms',
    icon: <ShieldCheck size={15} />,
    label: 'Regulatory Forms',
    children: [
      { key: '/compliance/cbp', label: 'CBP Forms' },
      { key: '/compliance/bma', label: 'BMA Endorsements' },
      { key: '/compliance/alerts', label: 'Compliance Alerts' },
    ],
  },
  {
    key: 'fleet-management',
    icon: <Anchor size={15} />,
    label: 'Fleet Management',
    children: [
      { key: '/vessels', label: 'Vessel Status' },
      { key: '/vessels/documents', label: 'Vessel Documents' },
      { key: '/compliance/exports', label: 'Export Records' },
    ],
  },
  {
    key: 'regulatory',
    icon: <ClipboardCheck size={15} />,
    label: 'Inspections & Audit',
    children: [
      { key: '/compliance/fleet', label: 'Fleet Performance' },
      { key: '/compliance/reports', label: 'Compliance Reports' },
      { key: '/compliance/inspections', label: 'Inspection Readiness' },
      { key: '/audit', label: 'Audit Log' },
    ],
  },
  { key: '__divider__', label: '', type: 'divider' },
  {
    key: 'system-management',
    icon: <Settings size={15} />,
    label: 'System Management',
    children: [{ key: '/settings', label: 'Platform Settings' }],
  },
];

export const parentKeys = new Set(
  menuItems.filter((item) => Array.isArray(item.children)).map((item) => item.key)
);

export function filterMenuItemsByRole(items: NavItem[], roles: string[]): NavItem[] {
  return items
    .map((item): NavItem | null => {
      if (item.type === 'divider') return item;
      if (FEATURE_MAP[item.key] && !canAccess(roles, FEATURE_MAP[item.key])) return null;
      if (item.children) {
        const children = item.children
          .map((child): NavItem | null =>
            FEATURE_MAP[child.key] && !canAccess(roles, FEATURE_MAP[child.key]) ? null : child
          )
          .filter((c): c is NavItem => c !== null);
        if (children.length === 0) return null;
        return { ...item, children };
      }
      return item;
    })
    .filter((i): i is NavItem => i !== null);
}

export function findOpenKeys(pathname: string): string[] {
  for (const item of menuItems) {
    if (Array.isArray(item.children)) {
      for (const child of item.children) {
        if (pathname === child.key || pathname.startsWith(`${child.key}/`)) {
          return [item.key];
        }
      }
    }
  }
  return [];
}

/* ── AppSidebar ───────────────────────────────────────────── */
export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const roles = useUserRoles();

  const filtered = React.useMemo(() => filterMenuItemsByRole(menuItems, roles), [roles]);

  useEffect(() => {
    const keys = findOpenKeys(pathname);
    setOpenGroups(new Set(keys));
  }, [pathname]);

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function navigate(key: string) {
    if (!parentKeys.has(key)) router.push(key);
  }

  function isActive(key: string) {
    return pathname === key || pathname.startsWith(`${key}/`);
  }

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen flex flex-col bg-[var(--card)]',
        'border-r border-[var(--border)]',
        'hidden md:flex overflow-hidden transition-all duration-200',
        collapsed ? 'w-0' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)] flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,242,254,0.1)] border border-[rgba(0,242,254,0.2)] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={15} className="text-[#00F2FE]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
                GB Ferry
              </span>
              <span className="font-mono text-[9px] tracking-[0.1em] text-[var(--muted-foreground)] uppercase">
                Compliance
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-all ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filtered.map((item) => {
          if (item.type === 'divider') {
            return <div key={item.key} className="h-px mx-2 my-2 bg-[var(--border)]" />;
          }

          if (!item.children) {
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                  active
                    ? 'bg-[rgba(0,242,254,0.1)] text-[#00F2FE]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                )}
              >
                <span className={active ? 'text-[#00F2FE]' : 'text-[var(--muted-foreground)]'}>
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </button>
            );
          }

          const groupOpen = openGroups.has(item.key);
          const groupActive = item.children.some((c) => isActive(c.key));

          return (
            <div key={item.key}>
              <button
                onClick={() => toggleGroup(item.key)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                  groupActive
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={groupActive ? 'text-[#00F2FE]' : ''}>{item.icon}</span>
                  {!collapsed && item.label}
                </span>
                {!collapsed && (
                  <ChevronRight
                    size={13}
                    className={cn(
                      'transition-transform duration-150 text-[var(--muted-foreground)]',
                      groupOpen ? 'rotate-90' : 'rotate-0'
                    )}
                  />
                )}
              </button>

              {groupOpen && !collapsed && (
                <div className="ml-4 mt-0.5 pl-3 border-l border-[var(--border)] space-y-0.5">
                  {item.children.map((child) => {
                    const active = isActive(child.key);
                    return (
                      <button
                        key={child.key}
                        onClick={() => navigate(child.key)}
                        className={cn(
                          'w-full flex items-center px-3 py-2 rounded-md text-sm transition-all text-left',
                          active
                            ? 'text-[#00F2FE] bg-[rgba(0,242,254,0.08)] font-medium'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                        )}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
