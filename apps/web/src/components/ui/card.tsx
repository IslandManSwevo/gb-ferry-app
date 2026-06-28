'use client';

import { cn } from '@/lib/utils';
import React from 'react';

/* ── Card ─────────────────────────────────────────────────── */

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  elevated?: boolean;
}

export function Card({ className, accent, elevated, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--card)] border border-[var(--border)] rounded-2xl transition-shadow duration-200',
        elevated && 'shadow-card',
        accent && 'border-l-[#00F2FE] border-l-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Card header ─────────────────────────────────────────── */

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export function CardHeader({ className, action, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'px-5 py-3.5 border-b border-[var(--border)]',
        className
      )}
      {...props}
    >
      <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--muted-foreground)] flex items-center gap-2">
        {children}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/* ── Card body ───────────────────────────────────────────── */

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

/* ── Card footer ─────────────────────────────────────────── */

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-3.5 border-t border-[var(--border)]',
        'flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────── */

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  status?: 'ok' | 'warning' | 'critical' | 'info' | 'muted';
  accent?: boolean;
}

const statusValueColor: Record<NonNullable<StatCardProps['status']>, string> = {
  ok:       'var(--primary)',
  warning:  '#FFB000',
  critical: '#FF4B2B',
  info:     'var(--primary)',
  muted:    'var(--muted-foreground)',
};

export function StatCard({ label, value, sub, status = 'info', accent, className, ...props }: StatCardProps) {
  const valueColor = statusValueColor[status];

  return (
    <Card accent={accent} elevated className={className} {...props}>
      <div className="p-5 flex flex-col gap-1.5">
        <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--muted-foreground)]">
          {label}
        </span>
        <span
          className="font-mono text-2xl font-semibold leading-none tabular-nums"
          style={{ color: valueColor }}
        >
          {value}
        </span>
        {sub && (
          <span className="font-mono text-[11px] text-[var(--muted-foreground)] mt-0.5">{sub}</span>
        )}
      </div>
    </Card>
  );
}
