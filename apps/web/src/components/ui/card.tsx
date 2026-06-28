'use client';

import { cn } from '@/lib/utils';
import React from 'react';

/* ── Terminal module card ─────────────────────────────────── */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Phosphor-glow left accent stripe */
  accent?: boolean;
}

export function Card({ className, accent, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#050505] border border-[rgba(51,255,51,0.2)]',
        accent && 'border-l-[#33FF33] border-l-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card header with micro-label ────────────────────────── */

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional right-side action element */
  action?: React.ReactNode;
}

export function CardHeader({ className, action, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'px-4 py-3 border-b border-[rgba(51,255,51,0.1)]',
        className
      )}
      {...props}
    >
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[rgba(51,255,51,0.6)]">
        {children}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ── Card body ───────────────────────────────────────────── */

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

/* ── Card footer ─────────────────────────────────────────── */

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-4 py-3 border-t border-[rgba(51,255,51,0.1)]',
        'flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Stat card (data value + label) ──────────────────────── */

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  status?: 'ok' | 'warning' | 'critical' | 'info' | 'muted';
  accent?: boolean;
}

const statusValueColor: Record<NonNullable<StatCardProps['status']>, string> = {
  ok: '#33FF33',
  warning: '#FFB000',
  critical: '#FF4B2B',
  info: '#00FFFF',
  muted: 'rgba(51,255,51,0.25)',
};

export function StatCard({ label, value, sub, status = 'info', accent, className, ...props }: StatCardProps) {
  const valueColor = statusValueColor[status];

  return (
    <Card accent={accent} className={className} {...props}>
      <div className="p-4 flex flex-col gap-1">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[rgba(51,255,51,0.5)]">
          {label}
        </span>
        <span
          className="font-mono text-2xl font-semibold leading-none tabular-nums"
          style={{ color: valueColor }}
        >
          {value}
        </span>
        {sub && (
          <span className="font-mono text-[11px] text-[rgba(51,255,51,0.25)] mt-1">{sub}</span>
        )}
      </div>
    </Card>
  );
}
