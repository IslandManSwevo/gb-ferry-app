import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, Minus, XCircle } from 'lucide-react';
import React from 'react';

export type StatusKind = 'ok' | 'warning' | 'critical' | 'info' | 'muted';

export interface StatusBadgeProps {
  status: StatusKind;
  label: string;
  compact?: boolean;
  className?: string;
  'data-testid'?: string;
  dataTestId?: string;
}

const statusConfig: Record<
  StatusKind,
  { color: string; bg: string; border: string; icon: React.ElementType }
> = {
  ok: {
    color: '#00F2FE',
    bg: 'rgba(0,242,254,0.08)',
    border: 'rgba(0,242,254,0.3)',
    icon: CheckCircle,
  },
  warning: {
    color: '#FFB000',
    bg: 'rgba(255,176,0,0.08)',
    border: 'rgba(255,176,0,0.3)',
    icon: AlertTriangle,
  },
  critical: {
    color: '#FF4B2B',
    bg: 'rgba(255,75,43,0.08)',
    border: 'rgba(255,75,43,0.3)',
    icon: XCircle,
  },
  info: {
    color: '#00F2FE',
    bg: 'rgba(0,242,254,0.06)',
    border: 'rgba(0,242,254,0.25)',
    icon: Info,
  },
  muted: {
    color: 'var(--muted-foreground)',
    bg: 'var(--muted)',
    border: 'var(--border)',
    icon: Minus,
  },
};

export function StatusBadge({
  status,
  label,
  compact,
  className,
  dataTestId,
  'data-testid': dataTestIdAttr,
}: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? statusConfig.muted;
  const Icon = cfg.icon;
  const resolvedTestId = dataTestId ?? dataTestIdAttr;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-mono uppercase tracking-[0.08em]',
        'rounded-md',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[10px]',
        className
      )}
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
      data-testid={resolvedTestId}
    >
      <Icon size={10} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  );
}
