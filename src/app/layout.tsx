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
  title: "CAPTCHA Shield v3.1 - Sistema Anti-Bot Avanzado",
  description:
    "Sistema CAPTCHA anti-bot/anti-IA instalable en cualquier web con 2 líneas de código. 7 desafíos, 14 señales, QR móvil, personalizable. 100% client-side.",
  icons: {
    icon: "/captcha-shield/logo-icon-white.png",
    shortcut: "/captcha-shield/logo-icon-white.png",
    apple: "/captcha-shield/logo-icon-black.png",
  },
  openGraph: {
    title: "CAPTCHA Shield v3.1",
    description: "Installable Anti-Bot / Anti-AI CAPTCHA - 7 Challenges, 14 Behavioral Signals, QR Mobile Verification, Theme Customizer",
    siteName: "CAPTCHA Shield",
    type: "website",
    images: [
      {
        url: "/captcha-shield/social-banner.png",
        width: 1536,
        height: 1024,
        alt: "CAPTCHA Shield v3.1",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAPTCHA Shield v3.1",
    description: "Installable Anti-Bot / Anti-AI CAPTCHA System",
    images: ["/captcha-shield/social-banner.png"],
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
