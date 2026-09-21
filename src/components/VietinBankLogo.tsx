import React, { useState } from 'react';

interface VietinBankLogoProps {
  variant?: 'full' | 'icon-only' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
}

export function VietinBankLogo({
  variant = 'full',
  className = '',
  size = 'md',
}: VietinBankLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Height mappings for pristine optical balance
  const sizeClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11 sm:h-13',
    xl: 'h-14 sm:h-16',
  };

  const iconSizes = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56,
  };

  // Authentic VietinBank Coin Emblem (Biểu tượng đồng tiền cổ ngũ hành âm dương)
  const CoinEmblem = (
    <svg
      width={iconSizes[size]}
      height={iconSizes[size]}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Upper Hemisphere - Sky/Deep Blue with Square Coin Cutout */}
      <path
        d="M 50 6 C 25.7 6 6 25.7 6 50 C 6 52.8 6.3 55.5 6.8 58.1 C 18.5 48.2 33.6 42.4 50 42.4 C 66.4 42.4 81.5 48.2 93.2 58.1 C 93.7 55.5 94 52.8 94 50 C 94 25.7 74.3 6 50 6 Z"
        fill={variant === 'white' ? '#FFFFFF' : '#005A9C'}
      />
      {/* Central Square Hole (Cửa tiền âm dương) */}
      <rect
        x="38"
        y="17"
        width="24"
        height="24"
        rx="1"
        fill="#FFFFFF"
      />
      {/* Lower Arc - Earth/Ruby Red */}
      <path
        d="M 6.8 58.1 C 11.2 78.4 28.9 94 50 94 C 71.1 94 88.8 78.4 93.2 58.1 C 80.9 49.3 65.9 44 50 44 C 34.1 44 19.1 49.3 6.8 58.1 Z"
        fill={variant === 'white' ? '#FFFFFF' : '#BE1E2D'}
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{CoinEmblem}</div>;
  }

  // Full Brand Logo using uploaded official brand asset
  if (!imageError) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/vietinbank-logo.png"
          alt="VietinBank – Nâng giá trị cuộc sống"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`w-auto ${sizeClasses[size]} object-contain select-none ${
            variant === 'white' ? 'brightness-0 invert' : ''
          }`}
        />
      </div>
    );
  }

  // Graceful fallback SVG
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex flex-col select-none">
        <div className="flex items-baseline font-black tracking-tight text-xl sm:text-2xl">
          <span className={variant === 'white' ? 'text-white' : 'text-[#005A9C]'}>Vietin</span>
          <span className={variant === 'white' ? 'text-white' : 'text-[#005A9C]'}>Bank</span>
        </div>
        <span
          className={`text-[9px] font-bold tracking-wider ${
            variant === 'white' ? 'text-white/80' : 'text-[#005A9C]'
          }`}
        >
          Nâng giá trị cuộc sống
        </span>
      </div>
      {CoinEmblem}
    </div>
  );
}
