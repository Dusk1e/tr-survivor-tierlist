/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Oyuncular kendi görsel URL'lerini yapıştırabiliyor.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        // API yanıtları ASLA önbelleğe alınmasın. Vercel'in kenar (CDN)
        // önbelleği yüzünden onaylanan oylar/yetkili değişiklikleri saatlerce
        // eski haliyle görünüyordu; bu üç başlık tarayıcı + CDN + Vercel
        // katmanlarının hepsini kapatır.
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
