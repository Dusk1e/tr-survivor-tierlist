/**
 * Türk bayrağı banner'ı — sayfanın tüm üst alanını kaplayan yarı saydam
 * kırmızı bant; aşağı doğru yumuşak geçişle kaybolur. Hilal + yıldız tam
 * ortada ve simetrik. Sert dalgalanma yok — sadece sakin bir ipek parlaması.
 */
export default function FlagBanner() {
  return (
    <div className="flag-banner" aria-hidden>
      <div className="flag-banner__sheen" />
      <svg className="flag-banner__emblem" viewBox="0 0 124 80">
        <defs>
          <mask id="fb-crescent">
            <rect width="124" height="80" fill="#000" />
            {/* dış daire */}
            <circle cx="48" cy="40" r="20" fill="#fff" />
            {/* iç daire (oyuk) */}
            <circle cx="55" cy="40" r="16.5" fill="#000" />
          </mask>
        </defs>
        <g fill="#ffffff">
          <rect width="124" height="80" mask="url(#fb-crescent)" />
          {/* yıldız — bir ucu bayrak yönüne (sağa) bakar */}
          <path
            transform="translate(84 40) rotate(90) scale(1.28)"
            d="M0,-9 L2.6,-2.9 L9,-2.9 L3.7,1.1 L5.6,7.3 L0,3.5 L-5.6,7.3 L-3.7,1.1 L-9,-2.9 L-2.6,-2.9 Z"
          />
        </g>
      </svg>
    </div>
  );
}
