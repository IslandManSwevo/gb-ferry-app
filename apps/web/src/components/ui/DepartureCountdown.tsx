import { ClockCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Text, Title } = Typography;

interface DepartureCountdownProps {
  departureTime: string;
  sailingLabel?: string;
  className?: string;
}

export const DepartureCountdown: React.FC<DepartureCountdownProps> = ({
  departureTime,
  sailingLabel,
  className,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateCountdown = () => {
      const now = dayjs();
      const departure = dayjs(departureTime);

      if (!departure.isValid()) {
        setTimeRemaining('--:--');
        return;
      }

      const diff = departure.diff(now);

      if (diff <= 0) {
        setTimeRemaining('Departed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Determine urgency level
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes < 15) {
        setUrgencyLevel('critical');
      } else if (totalMinutes < 120) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('normal');
      }

      // Format display
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [departureTime]);

  const getColor = () => {
    switch (urgencyLevel) {
      case 'critical':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      default:
        return '#52c41a';
    }
  };

  const isPulsing = urgencyLevel === 'critical';

  return (
    <div className={className} style={{ textAlign: 'center' }}>
      {sailingLabel && (
        <Text
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 14,
            display: 'block',
            marginBottom: 8,
          }}
        >
          {sailingLabel}
        </Text>
      )}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          animation: isPulsing ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        <ClockCircleOutlined style={{ fontSize: 32, color: getColor() }} />
        <Title level={1} style={{ color: getColor(), margin: 0, fontWeight: 700, fontSize: 48 }}>
          {timeRemaining}
        </Title>
      </div>
      <Text
        style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, display: 'block', marginTop: 4 }}
      >
        {urgencyLevel === 'critical'
          ? 'URGENT - Final boarding'
          : urgencyLevel === 'warning'
            ? 'Boarding soon'
            : 'On schedule'}
      </Text>
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};
