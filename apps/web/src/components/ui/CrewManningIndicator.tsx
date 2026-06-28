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

  const barColor = compliant ? '#33FF33' : '#FF4B2B';
  const badgeColor = compliant ? '#33FF33' : '#FF4B2B';
  const badgeBorder = compliant ? 'rgba(51,255,51,0.4)' : 'rgba(255,75,43,0.4)';
  const labelText = compliant ? 'COMPLIANT' : 'INSUFFICIENT';
  const textSize = size === 'small' ? 'text-[11px]' : 'text-[13px]';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between w-full">
        <span className={`font-mono ${textSize} text-[rgba(51,255,51,0.7)]`}>
          {label}: {current} / {required}
        </span>
        <span
          className="font-mono text-[10px] px-1.5 py-0.5 border tracking-widest"
          style={{ color: badgeColor, borderColor: badgeBorder, background: `${badgeColor}10` }}
        >
          {labelText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[rgba(51,255,51,0.08)]">
        <div
          className="h-full transition-all"
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
