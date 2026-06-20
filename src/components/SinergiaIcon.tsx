import React from 'react';

interface SinergiaIconProps {
  className?: string;
  size?: number;
}

export function SinergiaIcon({ className = "w-9 h-9", size }: SinergiaIconProps) {
  const dims = size ? `${size}px` : undefined;
  
  return (
    <svg 
      className={className} 
      style={{ width: dims, height: dims }} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Green Polygon/Hexagon Network (Sinergia Agency Green) */}
      <path 
        d="M 50,15 L 28,28 L 28,62 L 50,75 L 72,62" 
        stroke="#0B523A" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Connection loop/line near right node */}
      <path 
        d="M 72,43 C 72,40 72,40 72,43" 
        stroke="#0B523A" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Circular green nodes at vertices */}
      <circle cx="50" cy="15" r="5" fill="#0B523A" />
      <circle cx="50" cy="75" r="5" fill="#0B523A" />
      <circle cx="72" cy="43" r="5.5" fill="#0B523A" />
      
      {/* Golden stylized inner element (Sinergia gold/amber) */}
      <path 
        d="M 70,27 L 43,41 L 43,62 L 57,69" 
        stroke="#D1A12A" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

interface SinergiaLogoProps {
  className?: string;
  isDark?: boolean; // If true, matches dark theme layout text colors, otherwise light theme
  showSubtitle?: boolean;
}

export function SinergiaLogo({ className = "flex items-center gap-2.5", isDark = false, showSubtitle = true }: SinergiaLogoProps) {
  return (
    <div className={className}>
      <SinergiaIcon className="w-10 h-10 shrink-0" />
      <div className="flex flex-col text-left leading-none">
        <span className={`text-base font-black tracking-[0.06em] font-sans ${isDark ? 'text-white' : 'text-[#0B523A]'}`}>
          SINERGIA
        </span>
        {showSubtitle && (
          <span className="text-[8px] font-bold tracking-[0.18em] text-[#D1A12A] uppercase font-sans mt-0.5">
            AGENCIA CREATIVA
          </span>
        )}
      </div>
    </div>
  );
}
