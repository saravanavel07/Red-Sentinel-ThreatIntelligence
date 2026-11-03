import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export const RedSentinelLogo: React.FC<LogoProps> = ({
  className = '',
  size = 36,
  showWordmark = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className="relative shrink-0 flex items-center justify-center"
      >
        <svg 
          viewBox="0 0 240 240" 
          fill="none" 
          className="w-full h-full drop-shadow-[0_0_12px_rgba(255,51,79,0.35)]"
        >
          <defs>
            <radialGradient id="rsEyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF5C6C" stopOpacity="1" />
              <stop offset="60%" stopColor="#FF334F" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF334F" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="rsShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#151A23" />
              <stop offset="100%" stopColor="#0B0E14" />
            </linearGradient>
            <linearGradient id="rsStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF334F" />
              <stop offset="50%" stopColor="#292F3B" />
              <stop offset="100%" stopColor="#FF334F" />
            </linearGradient>
          </defs>

          {/* Shield Outline */}
          <path
            d="M120 18 L205 52 C205 142 165 198 120 222 C75 198 35 142 35 52 Z"
            fill="url(#rsShieldGrad)"
            stroke="url(#rsStrokeGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Circuit Lines */}
          <path d="M55 70 L90 70 L105 85" stroke="#292F3B" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="55" cy="70" r="2.5" fill="#FF334F" />
          <circle cx="105" cy="85" r="2" fill="#292F3B" />

          <path d="M185 70 L150 70 L135 85" stroke="#292F3B" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="185" cy="70" r="2.5" fill="#FF334F" />
          <circle cx="135" cy="85" r="2" fill="#292F3B" />

          <path d="M60 145 L85 145 L100 160 L100 185" stroke="#292F3B" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="60" cy="145" r="2" fill="#292F3B" />
          <circle cx="100" cy="185" r="2.5" fill="#FF334F" />

          <path d="M180 145 L155 145 L140 160 L140 185" stroke="#292F3B" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="180" cy="145" r="2" fill="#292F3B" />
          <circle cx="140" cy="185" r="2.5" fill="#FF334F" />

          {/* Hood Silhouette */}
          <path
            d="M120 54 C92 54 78 80 75 118 C75 148 88 172 120 184 C152 172 165 148 165 118 C162 80 148 54 120 54 Z"
            fill="#090B10"
            stroke="#292F3B"
            strokeWidth="2"
          />
          <path
            d="M120 62 C100 62 88 84 86 116 C86 142 98 162 120 172 C142 162 154 142 154 116 C152 84 140 62 120 62 Z"
            fill="#06070A"
          />

          {/* Visor & Sentinel Glowing Red Eye */}
          <path d="M102 110 L114 113 L106 117 Z" fill="#FF334F" opacity="0.6" />
          <circle cx="128" cy="113" r="10" fill="url(#rsEyeGlow)" />
          <circle cx="128" cy="113" r="3.5" fill="#FFFFFF" />
          <path d="M124 113 L138 113" stroke="#FF5C6C" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cyber Collar */}
          <path d="M96 156 L120 164 L144 156" stroke="#FF334F" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M104 168 L120 174 L136 168" stroke="#292F3B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white leading-none">
            <span className="text-[#FF334F] text-lg tracking-wider font-mono">RED</span>
            <span className="text-white text-lg tracking-tight">SENTINEL</span>
          </div>
          <span className="text-[10px] text-[#9CA7B8] font-mono tracking-wider uppercase mt-0.5">
            Threat Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
