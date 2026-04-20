import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://github.com/smouj/captcha-shield"),
  title: "CAPTCHA Shield - Advanced Anti-Bot CAPTCHA System",
  description:
    "Advanced anti-bot / anti-AI CAPTCHA system with 6-signal behavioral analysis engine. Sistema avanzado de CAPTCHA anti-bot y anti-IA con motor de análisis comportamental.",
  icons: {
    icon: "/logo-icon-white.png",
    shortcut: "/logo-icon-white.png",
    apple: "/logo-icon-black.png",
  },
  openGraph: {
    title: "CAPTCHA Shield",
    description: "Advanced Anti-Bot / Anti-AI CAPTCHA System",
    url: "https://github.com/smouj/captcha-shield",
    siteName: "CAPTCHA Shield",
    type: "website",
    images: [
      {
        url: "/social-banner.png",
        width: 1536,
        height: 1024,
        alt: "CAPTCHA Shield - Advanced Anti-Bot System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAPTCHA Shield",
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
        <Toaster />
      </body>
    </html>
  );
}
