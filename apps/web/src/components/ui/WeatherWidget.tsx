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
  high:     { color: '#FF4B2B', border: 'rgba(255,75,43,0.3)',   label: 'HIGH RISK' },
  elevated: { color: '#FFB000', border: 'rgba(255,176,0,0.3)',   label: 'MONITOR' },
  low:      { color: '#00F2FE', border: 'rgba(0,242,254,0.3)',   label: 'CALM' },
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
              className="flex items-center gap-1 text-[10px] tracking-wide text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40 transition-colors font-mono"
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
            <div className="h-4 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--foreground)]">{condition}</span>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded tracking-widest"
                style={{ color, borderColor: border, border: `1px solid ${border}`, background: `${color}10` }}
              >
                {label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'TEMP', value: temperatureC !== undefined ? `${temperatureC}°C` : '—' },
                { label: 'WIND', value: windKts !== undefined ? `${windKts} kts` : '—' },
                { label: 'SEAS', value: waveHeightM !== undefined ? `${waveHeightM}m` : '—' },
                { label: 'VIS',  value: visibilityNm !== undefined ? `${visibilityNm}nm` : '—' },
              ].map(({ label: l, value }) => (
                <div key={l} className="flex flex-col gap-1 p-2.5 rounded-lg bg-[var(--muted)]">
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)] tracking-[0.08em]">{l}</span>
                  <span className="font-mono text-sm tabular-nums text-[#00F2FE] font-medium">{value}</span>
                </div>
              ))}
            </div>

            {advisory && (
              <div className="border-t border-[var(--border)] pt-3">
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{advisory}</p>
              </div>
            )}

            {updatedAt && (
              <span className="font-mono text-[10px] text-[var(--muted-foreground)] tabular-nums">
                UPDATED {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
