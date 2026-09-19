import React from 'react';

interface VietinBankLogoProps {
  variant?: 'full' | 'icon-only' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VietinBankLogo({
  variant = 'full',
  className = '',
  size = 'md',
}: VietinBankLogoProps) {
  // Dimensions
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  // Authentic VietinBank Coin Emblem: Interlocking circular dual-color arc coin
  const CoinIcon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer Blue Arc (Left & Top) */}
      <path
        d="M 50 10 C 27.9 10 10 27.9 10 50 C 10 72.1 27.9 90 50 90 C 58.5 90 66.4 87.3 73 82.8 L 61 70.8 C 57.8 73.4 54 75 50 75 C 36.2 75 25 63.8 25 50 C 25 36.2 36.2 25 50 25 C 57.5 25 64 28.5 68.5 34 L 80.5 22 C 72.8 14.5 62 10 50 10 Z"
        fill={variant === 'white' ? '#FFFFFF' : '#003B70'}
      />
      {/* Outer Red Arc (Right & Bottom) */}
      <path
        d="M 50 10 C 65 10 78 18 85 30 L 73 42 C 68.5 35 60 30 50 30 C 47.5 30 45.1 30.4 43 31.2 L 32 20.2 C 37.3 14 43.5 10 50 10 Z"
        fill={variant === 'white' ? '#FFFFFF' : '#BE1E2D'}
      />
      {/* Red Dynamic Swoosh Arc in Inner Section */}
      <path
        d="M 90 50 C 90 72.1 72.1 90 50 90 L 50 75 C 63.8 75 75 63.8 75 50 C 75 42 71.5 35 66 30 L 78 18 C 85.5 26.5 90 37.5 90 50 Z"
        fill={variant === 'white' ? '#FFFFFF' : '#BE1E2D'}
      />
      {/* Central Diamond Coin Hole */}
      <rect
        x="42"
        y="42"
        width="16"
        height="16"
        transform="rotate(45 50 50)"
        fill={variant === 'white' ? 'currentColor' : '#BE1E2D'}
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{CoinIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {CoinIcon}
      <div className="flex flex-col leading-none select-none">
        <div className="flex items-baseline font-black tracking-tight text-lg sm:text-xl">
          <span className={variant === 'white' ? 'text-white' : 'text-[#003B70]'}>Vietin</span>
          <span className={variant === 'white' ? 'text-red-200' : 'text-[#BE1E2D]'}>Bank</span>
          <span className={variant === 'white' ? 'text-red-200' : 'text-[#BE1E2D] font-black'}>.</span>
        </div>
        <span
          className={`text-[9px] font-extrabold uppercase tracking-widest mt-0.5 ${
            variant === 'white' ? 'text-red-100' : 'text-slate-500'
          }`}
        >
          Nâng giá trị cuộc sống
        </span>
      </div>
    </div>
  );
}
