/**
 * Sayfanın üst kısmını kaplayan Türk bayrağı — gerçek bayrak kırmızısı,
 * aşağı doğru yumuşak geçişle kaybolur.
 *
 * Ay-yıldızın TAM ARKASINDA Atatürk portresi durur: aynı dikey eksende,
 * dairesel, siyah-beyaz ve kenarları erimiş hâlde. Böylece yapıştırılmış
 * bir kare gibi değil, bayrağın içinden çıkıyormuş gibi görünür.
 *
 * Portre `public/ataturk.jpg` dosyasından gelir. Dosya yoksa katman
 * sessizce boş kalır, bant eskisi gibi çalışmaya devam eder.
 */
export default function FlagBanner() {
  return (
    <div className="flag-banner" aria-hidden>
      {/* Portre — ay-yıldızla aynı eksende, onun arkasında */}
      <div className="flag-banner__portrait" />

      <svg className="flag-banner__emblem" viewBox="0 0 124 80">
        <defs>
          <mask id="fb-crescent">
            <rect width="124" height="80" fill="#000" />
            <circle cx="48" cy="40" r="20" fill="#fff" />
            <circle cx="55" cy="40" r="16.5" fill="#000" />
          </mask>
        </defs>
        <g fill="#ffffff">
          <rect width="124" height="80" mask="url(#fb-crescent)" />
          <path
            transform="translate(84 40) rotate(90) scale(1.28)"
            d="M0,-9 L2.6,-2.9 L9,-2.9 L3.7,1.1 L5.6,7.3 L0,3.5 L-5.6,7.3 L-3.7,1.1 L-9,-2.9 L-2.6,-2.9 Z"
          />
        </g>
      </svg>
    </div>
  );
}
