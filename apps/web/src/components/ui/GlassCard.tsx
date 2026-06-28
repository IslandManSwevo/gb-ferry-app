'use client';

/**
 * GlassCard — legacy import alias.
 * Preserves all existing import paths while replacing the old glassmorphism
 * implementation with the Industrial Brutalist terminal card.
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: 'light' | 'medium' | 'strong';
  hoverable?: boolean; // legacy antd Card compat — accepted, not applied
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity,
  hoverable: _hoverable,
  className,
  style,
  ...props
}) => {
  return (
    <Card className={cn('h-full', className)} style={style} {...props}>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
