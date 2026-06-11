import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  brandColor?: string;
}

/**
 * Full Circular Ekam Homes Doon Logo
 */
export function EkamLogo({
  className = '',
  size = 360,
  textColor = '#1D3E24',
  brandColor = '#1D3E24',
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2050/svg"
    >
      <defs>
        {/* Circle path for text-aligning */}
        <path
          id="circularLogoPath"
          d="M 200,200 m -155,0 a 155,155 0 1,1 310,0 a 155,155 0 1,1 -310,0"
        />
        {/* Subtle shadow filter for rendering polish */}
        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Outer Circle Ring */}
      <circle
        cx="200"
        cy="200"
        r="170"
        fill="none"
        stroke={brandColor}
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />

      {/* Curving Text: INDULGE IN EXCEPTIONAL HOSPITALITY */}
      <text
        fontFamily='"Space Grotesk", "Outfit", "Inter", sans-serif'
        fontSize="12.2"
        fontWeight="bold"
        letterSpacing="6.2"
        fill={textColor}
      >
        <textPath href="#circularLogoPath" startOffset="0%">
          EXCEPTIONAL HOSPITALITY INDULGE IN EXCEPTIONAL HOSPITALITY INDULGE IN
        </textPath>
      </text>

      {/* Central Motif Group */}
      <g transform="translate(0, 10)" filter="url(#subtleShadow)">
        {/* Roof line shadow block (optional accent) */}
        
        {/* Main chimney */}
        <path
          d="M 164,152 L 164,136 L 174,136 L 174,142 Z"
          fill={brandColor}
          stroke={brandColor}
          strokeWidth="1"
        />
        {/* Chimney cap */}
        <rect x="162" y="133" width="14" height="3" fill={brandColor} rx="0.5" />

        {/* Double Main Roof Lines */}
        <path
          d="M 148,181 L 188,145 L 228,181"
          fill="none"
          stroke={brandColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 152,185 L 188,152 L 224,185"
          fill="none"
          stroke={brandColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary Offset Roof on Right */}
        <path
          d="M 212,163 L 228,151 L 253,174"
          fill="none"
          stroke={brandColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 216,167 L 228,157 L 249,177"
          fill="none"
          stroke={brandColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Home Window (4-pane grid) */}
        <rect
          x="181"
          y="161"
          width="14"
          height="14"
          fill="none"
          stroke={brandColor}
          strokeWidth="1.5"
        />
        <line
          x1="188"
          y1="161"
          x2="188"
          y2="175"
          stroke={brandColor}
          strokeWidth="1"
        />
        <line
          x1="181"
          y1="168"
          x2="195"
          y2="168"
          stroke={brandColor}
          strokeWidth="1"
        />

        {/* "EKAM" brand typography in center */}
        <text
          x="200"
          y="218"
          textAnchor="middle"
          fontFamily='"Space Grotesk", sans-serif'
          fontSize="35"
          fontWeight="900"
          letterSpacing="4"
          fill={brandColor}
          style={{ paintOrder: 'stroke fill', stroke: '#ffffff', strokeWidth: '1px' }}
        >
          EKAM
        </text>

        {/* Divider lines on left and right of "HOMES" */}
        <line
          x1="108"
          y1="231"
          x2="152"
          y2="231"
          stroke={brandColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="248"
          y1="231"
          x2="292"
          y2="231"
          stroke={brandColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* "HOMES" text */}
        <text
          x="200"
          y="237"
          textAnchor="middle"
          fontFamily='"Space Grotesk", "Outfit", "Inter", sans-serif'
          fontSize="16.5"
          fontWeight="bold"
          letterSpacing="2.8"
          fill={brandColor}
        >
          HOMES
        </text>
      </g>
    </svg>
  );
}

/**
 * Compact header/footer logo (House + EKAM text)
 */
export function EkamLogoCompact({
  className = '',
  size = 40,
  brandColor = '#1D3E24',
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 160 120"
      width={size * 1.33}
      height={size}
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0, -10)">
        {/* Chimney */}
        <path d="M 68,52 L 68,40 L 75,40 L 75,45 Z" fill={brandColor} />
        <rect x="66" y="38" width="11" height="2" fill={brandColor} rx="0.5" />

        {/* Double Roof */}
        <path
          d="M 55,75 L 85,48 L 115,75"
          fill="none"
          stroke={brandColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 58,78 L 85,53 L 112,78"
          fill="none"
          stroke={brandColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Second Roof */}
        <path
          d="M 103,61 L 115,51 L 132,68"
          fill="none"
          stroke={brandColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Window */}
        <rect
          x="79"
          y="61"
          width="12"
          height="12"
          fill="none"
          stroke={brandColor}
          strokeWidth="1.5"
        />
        <line x1="85" y1="61" x2="85" y2="73" stroke={brandColor} strokeWidth="1" />
        <line x1="79" y1="67" x2="91" y2="67" stroke={brandColor} strokeWidth="1" />

        {/* EKAM logo text */}
        <text
          x="85"
          y="102"
          textAnchor="middle"
          fontFamily='"Space Grotesk", sans-serif'
          fontSize="24"
          fontWeight="900"
          letterSpacing="1"
          fill={brandColor}
        >
          EKAM
        </text>

        {/* HOMES logo text */}
        <text
          x="85"
          y="115"
          textAnchor="middle"
          fontFamily='"Space Grotesk", sans-serif'
          fontSize="10"
          fontWeight="bold"
          letterSpacing="2.5"
          fill={brandColor}
        >
          HOMES
        </text>
      </g>
    </svg>
  );
}
