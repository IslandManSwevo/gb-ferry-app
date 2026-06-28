import { RefreshCw, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type RiskLevel = 'low' | 'elevated' | 'high';

interface WeatherWidgetProps {
  loading?: boolean;
  location: string;
  condition: string;
  temperatureC?: number;
  windKts?: number;
  waveHeightM?: number;
  visibilityNm?: number;
  updatedAt?: string;
  advisory?: string;
  onRefresh?: () => void;
}

function getRiskLevel(windKts?: number, waveHeightM?: number): RiskLevel {
  if ((windKts ?? 0) >= 25 || (waveHeightM ?? 0) >= 2.5) return 'high';
  if ((windKts ?? 0) >= 15 || (waveHeightM ?? 0) >= 1.5) return 'elevated';
  return 'low';
}

const RISK_CONFIG = {
  high:     { color: '#FF4B2B', border: 'rgba(255,75,43,0.3)',  label: 'HIGH RISK' },
  elevated: { color: '#FFB000', border: 'rgba(255,176,0,0.3)',  label: 'MONITOR' },
  low:      { color: '#33FF33', border: 'rgba(51,255,51,0.3)',  label: 'CALM' },
};

export function WeatherWidget({
  loading,
  location,
  condition,
  temperatureC,
  windKts,
  waveHeightM,
  visibilityNm,
  updatedAt,
  advisory,
  onRefresh,
}: WeatherWidgetProps) {
  const risk = getRiskLevel(windKts, waveHeightM);
  const { color, border, label } = RISK_CONFIG[risk];

  return (
    <Card>
      <CardHeader
        action={
          onRefresh ? (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-[rgba(51,255,51,0.5)] hover:text-[#33FF33] disabled:opacity-40 transition-colors"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              SYNC
            </button>
          ) : undefined
        }
      >
        <span className="flex items-center gap-2">
          <Wind size={13} />
          {location.toUpperCase()}
        </span>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-[rgba(51,255,51,0.05)] animate-pulse" />
            <div className="h-3 w-3/4 bg-[rgba(51,255,51,0.04)] animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Risk badge + condition */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-[rgba(51,255,51,0.8)]">{condition}</span>
              <span
                className="font-mono text-[10px] px-2 py-0.5 border tracking-widest"
                style={{ color, borderColor: border, background: `${color}10` }}
              >
                {label}
              </span>
            </div>

            {/* 2-col metrics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'TEMP', value: temperatureC !== undefined ? `${temperatureC}°C` : '—' },
                { label: 'WIND', value: windKts !== undefined ? `${windKts} kts` : '—' },
                { label: 'SEAS', value: waveHeightM !== undefined ? `${waveHeightM}m` : '—' },
                { label: 'VIS', value: visibilityNm !== undefined ? `${visibilityNm}nm` : '—' },
              ].map(({ label: l, value }) => (
                <div key={l} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-[rgba(51,255,51,0.35)] tracking-[0.1em]">{l}</span>
                  <span className="font-mono text-[13px] tabular-nums text-[#00FFFF]">{value}</span>
                </div>
              ))}
            </div>

            {advisory && (
              <div className="border-t border-[rgba(51,255,51,0.08)] pt-3">
                <p className="font-mono text-[11px] text-[rgba(51,255,51,0.55)] leading-relaxed">{advisory}</p>
              </div>
            )}

            {updatedAt && (
              <span className="font-mono text-[10px] text-[rgba(51,255,51,0.25)] tabular-nums">
                UPDATED {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
