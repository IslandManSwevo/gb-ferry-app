import { Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface DepartureCountdownProps {
  departureTime: string;
  sailingLabel?: string;
  className?: string;
}

type Urgency = 'normal' | 'warning' | 'critical';

const URGENCY_COLOR: Record<Urgency, string> = {
  critical: '#FF4B2B',
  warning:  '#FFB000',
  normal:   '#33FF33',
};

export const DepartureCountdown: React.FC<DepartureCountdownProps> = ({
  departureTime,
  sailingLabel,
  className,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');

  useEffect(() => {
    function update() {
      const departure = dayjs(departureTime);
      if (!departure.isValid()) { setTimeRemaining('--:--'); return; }
      const diff = departure.diff(dayjs());
      if (diff <= 0) { setTimeRemaining('Departed'); return; }

      const hours   = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const total   = hours * 60 + minutes;

      setUrgency(total < 15 ? 'critical' : total < 120 ? 'warning' : 'normal');
      setTimeRemaining(hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [departureTime]);

  const color = URGENCY_COLOR[urgency];

  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className ?? ''}`}>
      {sailingLabel && (
        <span className="font-mono text-[12px] text-[rgba(51,255,51,0.5)]">{sailingLabel}</span>
      )}
      <div
        className="flex items-center gap-3"
        style={{ animation: urgency === 'critical' ? 'pulse 1.5s ease-in-out infinite' : 'none' }}
      >
        <Clock size={28} style={{ color }} />
        <span className="font-mono tabular-nums font-bold" style={{ color, fontSize: 48, lineHeight: 1 }}>
          {timeRemaining}
        </span>
      </div>
      <span className="font-mono text-[11px] tracking-widest" style={{ color: 'rgba(51,255,51,0.4)' }}>
        {urgency === 'critical' ? 'URGENT — FINAL BOARDING' : urgency === 'warning' ? 'BOARDING SOON' : 'ON SCHEDULE'}
      </span>
    </div>
  );
};
