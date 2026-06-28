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
  { color: string; bg: string; border: string; icon: React.ElementType; label: string }
> = {
  ok: {
    color: '#33FF33',
    bg: 'rgba(51,255,51,0.08)',
    border: 'rgba(51,255,51,0.3)',
    icon: CheckCircle,
    label: 'ok',
  },
  warning: {
    color: '#FFB000',
    bg: 'rgba(255,176,0,0.08)',
    border: 'rgba(255,176,0,0.3)',
    icon: AlertTriangle,
    label: 'warning',
  },
  critical: {
    color: '#FF4B2B',
    bg: 'rgba(255,75,43,0.08)',
    border: 'rgba(255,75,43,0.3)',
    icon: XCircle,
    label: 'critical',
  },
  info: {
    color: '#00FFFF',
    bg: 'rgba(0,255,255,0.06)',
    border: 'rgba(0,255,255,0.25)',
    icon: Info,
    label: 'info',
  },
  muted: {
    color: 'rgba(234,234,234,0.4)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    icon: Minus,
    label: 'muted',
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
        'font-mono uppercase tracking-widest',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-[10px]',
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
