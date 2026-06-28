import React from 'react';

interface CrewManningIndicatorProps {
  current: number;
  required: number;
  label?: string;
  size?: 'small' | 'default' | 'large';
}

export const CrewManningIndicator: React.FC<CrewManningIndicatorProps> = ({
  current,
  required,
  label = 'Manning Coverage',
  size = 'default',
}) => {
  const percentage = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
  const deficit = Math.max(0, required - current);
  const compliant = percentage >= 100;

  const barColor = compliant ? '#00F2FE' : '#FF4B2B';
  const badgeColor = compliant ? '#00F2FE' : '#FF4B2B';
  const badgeBorder = compliant ? 'rgba(0,242,254,0.4)' : 'rgba(255,75,43,0.4)';
  const labelText = compliant ? 'COMPLIANT' : 'INSUFFICIENT';
  const textSize = size === 'small' ? 'text-[11px]' : 'text-[13px]';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between w-full">
        <span className={`font-mono ${textSize} text-[var(--muted-foreground)]`}>
          {label}: {current} / {required}
        </span>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded tracking-widest"
          style={{ color: badgeColor, borderColor: badgeBorder, border: `1px solid ${badgeBorder}`, background: `${badgeColor}10` }}
        >
          {labelText}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: barColor }}
        />
      </div>

      {deficit > 0 && (
        <span className={`font-mono ${size === 'small' ? 'text-[10px]' : 'text-[11px]'} text-[rgba(255,75,43,0.7)]`}>
          Requires {deficit} more qualified crew to meet safe manning
        </span>
      )}
    </div>
  );
};
