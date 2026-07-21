/**
 * Default mouse avatar — a sterner, cooler take on the classic Transformice
 * mouse: side profile, sharp ears, narrowed determined eye, clean shapes.
 * Used whenever a player has no custom avatar URL.
 *
 * Drop an exact PNG at /public/mouse.png to override globally, or give each
 * player their own image URL from the panel.
 */
export default function DefaultMouse({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Transformice faresi"
    >
      <defs>
        <linearGradient id="m-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6b4c35" />
          <stop offset="100%" stopColor="#3f2d20" />
        </linearGradient>
        <linearGradient id="m-cream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8cba0" />
          <stop offset="100%" stopColor="#c9a274" />
        </linearGradient>
        <linearGradient id="m-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c1f16" />
          <stop offset="100%" stopColor="#1d1510" />
        </linearGradient>
      </defs>

      <g style={{ filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.5))" }}>
        {/* tail — long, low sweep */}
        <path
          d="M 58 168 C 18 164, 8 112, 22 78 C 30 56, 50 48, 66 58"
          fill="none"
          stroke="#b98f63"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 58 168 C 18 164, 8 112, 22 78 C 30 56, 50 48, 66 58"
          fill="none"
          stroke="url(#m-cream)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* big back ear — sharp */}
        <path
          d="M 60 78 C 40 44, 66 14, 96 22 C 112 26, 118 44, 110 62 C 104 76, 88 86, 72 86 Z"
          fill="url(#m-shadow)"
        />
        <path
          d="M 66 74 C 52 48, 72 26, 94 32 C 106 36, 110 48, 104 60 C 98 72, 84 80, 72 80 Z"
          fill="url(#m-cream)"
        />

        {/* front ear — sharp, dark */}
        <path
          d="M 128 52 C 124 26, 148 12, 164 24 C 176 34, 172 54, 156 62 C 146 66, 134 62, 128 52 Z"
          fill="url(#m-body)"
        />

        {/* head crest spikes */}
        <path d="M 108 64 L 121 34 L 130 62 Z" fill="url(#m-body)" />
        <path d="M 124 60 L 140 40 L 142 62 Z" fill="url(#m-body)" />

        {/* body — hunched, powerful */}
        <path
          d="M 60 132 C 58 96, 88 74, 120 76 C 152 78, 176 98, 178 126 C 180 154, 158 178, 124 180 C 92 182, 62 162, 60 132 Z"
          fill="url(#m-body)"
        />

        {/* cream belly */}
        <path
          d="M 96 176 C 78 168, 72 146, 80 128 C 88 112, 108 106, 124 114 C 138 122, 142 142, 134 158 C 126 172, 110 180, 96 176 Z"
          fill="url(#m-cream)"
          opacity="0.9"
        />

        {/* muzzle — pointed, determined */}
        <path
          d="M 150 96 C 168 96, 186 104, 192 114 C 186 122, 168 128, 152 124 C 144 120, 142 104, 150 96 Z"
          fill="#79573e"
        />
        {/* nose */}
        <circle cx="189" cy="113" r="5" fill="#d99a75" />

        {/* narrowed, sharp eye */}
        <path d="M 138 92 L 162 88 L 160 96 Z" fill="#150e09" />
        <circle cx="151" cy="94" r="6.5" fill="#150e09" />
        <circle cx="153.5" cy="91.5" r="2.2" fill="#ffffff" />

        {/* brow line — stern look */}
        <path
          d="M 136 84 L 164 79"
          stroke="#241811"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* whiskers — swept back */}
        <g stroke="#cfc8bb" strokeWidth="1.6" opacity="0.55" strokeLinecap="round">
          <line x1="176" y1="118" x2="146" y2="126" />
          <line x1="176" y1="122" x2="150" y2="134" />
        </g>

        {/* front paw */}
        <ellipse cx="118" cy="168" rx="14" ry="8" fill="url(#m-cream)" />
        {/* back foot */}
        <ellipse cx="86" cy="176" rx="16" ry="8" fill="url(#m-cream)" />
      </g>
    </svg>
  );
}
