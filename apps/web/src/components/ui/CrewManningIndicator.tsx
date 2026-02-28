import { Progress, Space, Typography } from 'antd';
import type { StatusKind } from './StatusBadge';
import { StatusBadge } from './StatusBadge';

const { Text } = Typography;

interface CrewManningIndicatorProps {
  current: number;
  required: number;
  label?: string;
  size?: 'small' | 'default' | 'large';
}

/**
 * Visual indicator for Safe Manning coverage.
 * Used in Fleet Status and Vessel Detail views.
 */
export const CrewManningIndicator: React.FC<CrewManningIndicatorProps> = ({
  current,
  required,
  label = 'Manning Coverage',
  size = 'default',
}) => {
  const percentage = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
  const deficit = Math.max(0, required - current);

  const getStatus = (): StatusKind => {
    if (percentage < 100) return 'critical';
    return 'ok';
  };

  const getStrokeColor = () => {
    if (percentage < 100) return '#ff4d4f';
    return '#52c41a';
  };

  const getStatusLabel = () => {
    if (percentage < 100) return 'INSUFFICIENT';
    return 'COMPLIANT';
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
          {label}: {current} / {required}
        </Text>
        <StatusBadge status={getStatus()} label={getStatusLabel()} compact />
      </div>
      <Progress
        percent={percentage}
        strokeColor={getStrokeColor()}
        showInfo={percentage < 100}
        size={size === 'small' ? 'small' : 'default'}
      />
      {deficit > 0 && (
        <Text
          type="secondary"
          style={{
            fontSize: size === 'small' ? 11 : 12,
            color: '#ff7875',
          }}
        >
          Requires {deficit} more qualified crew to meet safe manning
        </Text>
      )}
    </Space>
  );
};
