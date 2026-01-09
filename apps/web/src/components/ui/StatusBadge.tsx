import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  MinusCircleFilled,
} from '@ant-design/icons';
import { Tag } from 'antd';
import React from 'react';

export type StatusKind = 'ok' | 'warning' | 'critical' | 'info' | 'muted';

interface StatusBadgeProps {
  status: StatusKind;
  label: string;
  compact?: boolean;
}

const statusStyles: Record<StatusKind, { color: string; bg: string; icon: React.ReactNode }> = {
  ok: { color: '#0f915a', bg: 'rgba(15,145,90,0.12)', icon: <CheckCircleFilled /> },
  warning: { color: '#c47c00', bg: 'rgba(196,124,0,0.14)', icon: <ExclamationCircleFilled /> },
  critical: { color: '#d4380d', bg: 'rgba(212,56,13,0.16)', icon: <CloseCircleFilled /> },
  info: { color: '#1070b8', bg: 'rgba(16,112,184,0.12)', icon: <InfoCircleFilled /> },
  muted: { color: '#6b7280', bg: 'rgba(107,114,128,0.14)', icon: <MinusCircleFilled /> },
};

export function StatusBadge({ status, label, compact }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.muted;

  return (
    <Tag
      icon={style.icon}
      style={{
        color: style.color,
        background: style.bg,
        borderColor: style.color,
        padding: compact ? '2px 8px' : '4px 12px',
        fontWeight: 600,
      }}
    >
      {label}
    </Tag>
  );
}
