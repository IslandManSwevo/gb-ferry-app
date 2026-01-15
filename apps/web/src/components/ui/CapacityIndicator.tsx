import { Progress, Space, Typography } from 'antd';
import type { StatusKind } from './StatusBadge';
import { StatusBadge } from './StatusBadge';

const { Text } = Typography;

interface CapacityIndicatorProps {
  current: number;
  max: number;
  showRemaining?: boolean;
  size?: 'small' | 'default' | 'large';
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  current,
  max,
  showRemaining = true,
  size = 'default',
}) => {
  const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const remaining = Math.max(0, max - current);

  const getStatus = (): StatusKind => {
    if (percentage >= 95) return 'critical';
    if (percentage >= 85) return 'warning';
    return 'ok';
  };

  const getStrokeColor = () => {
    if (percentage >= 95) return '#ff4d4f';
    if (percentage >= 85) return '#faad14';
    return '#52c41a';
  };

  const getLabel = () => {
    if (percentage >= 95) return 'Near capacity';
    if (percentage >= 85) return 'Filling up';
    return 'Available';
  };

  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: size === 'small' ? 12 : 14 }}>
          Capacity: {current} / {max}
        </Text>
        <StatusBadge status={getStatus()} label={getLabel()} compact />
      </div>
      <Progress
        percent={percentage}
        strokeColor={getStrokeColor()}
        showInfo
        size={size === 'small' ? 'small' : 'default'}
      />
      {showRemaining && (
        <Text
          type="secondary"
          style={{
            fontSize: size === 'small' ? 11 : 12,
            color: percentage >= 95 ? '#ff7875' : 'rgba(255,255,255,0.65)',
          }}
        >
          {remaining} seats remaining
        </Text>
      )}
    </Space>
  );
};
