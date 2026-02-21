import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#d4a853",
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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
