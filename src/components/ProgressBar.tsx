import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'red' | 'green';
}

export function ProgressBar({
  value,
  label,
  showText = true,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const barColor = {
    primary: 'bg-gradient-to-r from-red-600 to-red-700',
    red: 'bg-red-600',
    green: 'bg-emerald-600',
  }[color];

  return (
    <div className="w-full">
      {(label || showText) && (
        <div className="flex justify-between items-center mb-1 text-xs">
          {label && <span className="font-medium text-slate-700">{label}</span>}
          {showText && <span className="font-bold text-slate-900 ml-auto">{clampedValue}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
