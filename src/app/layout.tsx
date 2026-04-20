import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://smouj.github.io'),
  title: "CAPTCHA Shield v3.0 - Sistema Anti-Bot Avanzado",
  description:
    "Sistema CAPTCHA anti-bot/anti-IA con 7 tipos de desafío, análisis comportamental de 14 señales y verificación móvil QR. 100% del lado del cliente.",
  icons: {
    icon: "/logo-icon-white.png",
    shortcut: "/logo-icon-white.png",
    apple: "/logo-icon-black.png",
  },
  openGraph: {
    title: "CAPTCHA Shield v3.0",
    description: "Advanced Anti-Bot / Anti-AI CAPTCHA - 7 Challenges, 14 Behavioral Signals, QR Mobile Verification",
    siteName: "CAPTCHA Shield",
    type: "website",
    images: [
      {
        url: "/social-banner.png",
        width: 1536,
        height: 1024,
        alt: "CAPTCHA Shield v3.0",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAPTCHA Shield v3.0",
    description: "Advanced Anti-Bot / Anti-AI CAPTCHA System",
    images: ["/social-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
