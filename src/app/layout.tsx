import type { Metadata, Viewport } from "next";
import { Amiri, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import SerwistInit from "@/components/SerwistInit";

// Self-hosted via next/font — downloaded at build time, served from same origin.
// This means fonts are bundled into the app, precached by Serwist, and work
// fully offline without any Google CDN requests at runtime.
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
  // System Arabic fonts used while the self-hosted file is loading
  fallback: ["Scheherazade New", "Arabic Typesetting", "Traditional Arabic", "serif"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-naskh",
  display: "swap",
  // System Arabic fonts used while the self-hosted file is loading
  fallback: ["Segoe UI Historic", "Arial Unicode MS", "Tahoma", "sans-serif"],
});

export const metadata: Metadata = {
  title: "القرآن الكريم — الشيخ محمود خليل الحصري",
  description:
    "تطبيق الاستماع للقرآن الكريم برواية ورش عن نافع بصوت الشيخ محمود خليل الحصري. استماع بجودة عالية مع دعم كامل للعمل بدون إنترنت.",
  keywords: [
    "القرآن الكريم",
    "الحصري",
    "ورش عن نافع",
    "محمود خليل الحصري",
    "تطبيق قرآن",
    "بدون إنترنت",
    "قرآن MP3",
  ],
  manifest: "/manifest.json",
  authors: [{ name: "Sheikh Mahmoud Khalil Al-Hosari" }],
  category: "religion",
  openGraph: {
    title: "القرآن الكريم — الحصري",
    description:
      "استمع للقرآن الكريم برواية ورش عن نافع بصوت الشيخ محمود خليل الحصري (بدون إنترنت)",
    url: "https://github.com/zakari90/Alhosari-warsh",
    siteName: "القرآن الكريم",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "القرآن الكريم — الحصري",
    description:
      "استمع للقرآن الكريم برواية ورش عن نافع بصوت الشيخ محمود خليل الحصري",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "القرآن الكريم",
  },
};

export const viewport: Viewport = {
  themeColor: "#d4a017",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${notoNaskhArabic.variable}`}>
      <head></head>
      <body>
        <SerwistInit />
        {children}
      </body>
    </html>
  );
}
