import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Statistic, Typography } from 'antd';

const { Text } = Typography;

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

export function PriorityStatCard({
  title,
  value,
  priority,
  description,
  suffix,
  trend,
}: PriorityStatCardProps) {
  const styles = {
    BLOCKING: {
      color: '#ff4d4f',
      background: 'rgba(255, 77, 79, 0.1)',
      border: '1px solid #ff4d4f',
    },
    CRITICAL: {
      color: '#ff7a45',
      background: 'rgba(255, 122, 69, 0.1)',
      border: '1px solid #ff7a45',
    },
    WARNING: {
      color: '#faad14',
      background: 'rgba(250, 173, 20, 0.1)',
      border: '1px solid #faad14',
    },
    OK: {
      color: '#52c41a',
      background: 'rgba(82, 196, 26, 0.1)',
      border: '1px solid #52c41a',
    },
  }[priority];

  return (
    <Card
      style={{
        ...styles,
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <Statistic
        title={<Text style={{ color: styles.color, fontWeight: 600 }}>{title}</Text>}
        value={value}
        valueStyle={{ color: styles.color, fontSize: '28px', fontWeight: 'bold' }}
        suffix={suffix}
        prefix={
          trend && (
            <span
              style={{ fontSize: '14px', marginRight: '8px' }}
              role="img"
              aria-label={`Trend ${trend.isUp ? 'up' : 'down'} ${trend.value}%`}
            >
              {trend.isUp ? (
                <ArrowUpOutlined aria-hidden="true" />
              ) : (
                <ArrowDownOutlined aria-hidden="true" />
              )}
              <span aria-hidden="true">{trend.value}%</span>
            </span>
          )
        }
      />
      {description && (
        <Text style={{ display: 'block', marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
          {description}
        </Text>
      )}
    </Card>
  );
}
