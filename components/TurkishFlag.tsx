/**
 * Waving Turkish flag on a small pole. `size` is the cloth height in px.
 */
export default function TurkishFlag({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const h = size;
  const w = Math.round(size * 1.5);

  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: w + 4, height: h + 6 }}
      aria-label="Türkiye"
      title="Türkiye"
    >
      {/* pole */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: "linear-gradient(180deg,#cfd6df,#7d858f)" }}
      />
      <span
        className="absolute left-[1px] top-0 h-[7px] w-[7px] rounded-full"
        style={{ background: "#cfd6df", transform: "translate(-2px,-2px)" }}
      />
      {/* waving cloth */}
      <span
        className="flag-wave absolute left-[3px] top-[3px] block"
        style={{ width: w, height: h }}
      >
        <svg
          viewBox="0 0 90 60"
          width="100%"
          height="100%"
          style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}
        >
          <defs>
            <linearGradient id="tr-red" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e11d2a" />
              <stop offset="100%" stopColor="#c1121f" />
            </linearGradient>
          </defs>
          <rect width="90" height="60" rx="4" fill="url(#tr-red)" />
          {/* crescent */}
          <circle cx="39" cy="30" r="16" fill="#fff" />
          <circle cx="45" cy="30" r="12.8" fill="#c1121f" />
          {/* star */}
          <path
            fill="#fff"
            transform="translate(62 30) scale(1.05)"
            d="M0,-9 L2.6,-2.9 L9,-2.9 L3.7,1.1 L5.6,7.3 L0,3.5 L-5.6,7.3 L-3.7,1.1 L-9,-2.9 L-2.6,-2.9 Z"
          />
        </svg>
      </span>
    </span>
  );
}
