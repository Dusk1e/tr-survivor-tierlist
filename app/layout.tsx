import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-system",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TR - SURVİVOR TİERLİST",
  description:
    "Türk Transformice Survivor topluluğunun resmi tierlisti — Monarch'tan E-Rank'a.",
  keywords: ["Transformice", "Survivor", "TFM", "Tierlist", "TR"],
  openGraph: {
    title: "TR - SURVİVOR TİERLİST",
    description: "Türk TFM Survivor topluluğu sıralama sistemi.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="scene-bg" aria-hidden />
        <div className="scene-grid" aria-hidden />
        <div className="scene-glow" aria-hidden />
        {children}
      </body>
    </html>
  );
}
