import { StatCard } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import React from 'react';

export interface PriorityStatCardProps {
  title: string;
  value: number | string;
  priority: 'BLOCKING' | 'CRITICAL' | 'WARNING' | 'OK';
  description?: string;
  suffix?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const priorityToStatus = {
  BLOCKING: 'critical',
  CRITICAL: 'critical',
  WARNING: 'warning',
  OK: 'ok',
} as const;

const trendColor = {
  BLOCKING: '#FF4B2B',
  CRITICAL: '#FF4B2B',
  WARNING:  '#FFB000',
  OK:       '#00F2FE',
} as const;

export function PriorityStatCard({
  title,
  value,
  priority,
  description,
  suffix,
  trend,
}: PriorityStatCardProps) {
  const TrendIcon = trend?.isUp ? TrendingUp : TrendingDown;
  const color = trendColor[priority];

  const displayValue = suffix ? (
    <span>
      {value}
      <span className="font-mono text-base ml-1" style={{ color: `${color}80` }}>{suffix}</span>
    </span>
  ) : (
    value
  );

  const sub = (
    <span className="flex items-center gap-2">
      {trend && (
        <span className="flex items-center gap-1" style={{ color }}>
          <TrendIcon size={11} aria-hidden />
          <span>{trend.value}%</span>
        </span>
      )}
      {description && <span className="text-[var(--muted-foreground)]">{description}</span>}
    </span>
  );

  return (
    <StatCard
      label={title}
      value={displayValue}
      status={priorityToStatus[priority]}
      sub={sub}
      accent={priority === 'BLOCKING' || priority === 'CRITICAL'}
    />
  );
}
