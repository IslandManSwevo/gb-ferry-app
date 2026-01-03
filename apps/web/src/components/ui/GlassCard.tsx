'use client';

import { Card, CardProps } from 'antd';
import React from 'react';

interface GlassCardProps extends CardProps {
  intensity?: 'light' | 'medium' | 'strong';
}

/**
 * GlassCard - Maritime-themed frosted glass card component
 * Used for dashboard statistics and key metrics display
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  style,
  ...props
}) => {
  const intensityStyles = {
    light: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    strong: {
      background: 'rgba(255, 255, 255, 0.18)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
    },
  };

  return (
    <Card
      bordered={false}
      style={{
        ...intensityStyles[intensity],
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        WebkitBackdropFilter: intensityStyles[intensity].backdropFilter,
        ...style,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};
