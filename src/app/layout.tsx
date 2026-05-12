import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'CAPTCHA Shield v4.0 Fortress — The Unbreakable CAPTCHA',
  description: 'Open-source anti-bot verification with 10 AI-proof challenges, 28 behavioral signals, multi-layer verification, and zero-trust architecture. 100% client-side by default.',
  keywords: ['captcha', 'anti-bot', 'security', 'AI-resistant', 'behavioral analysis', 'zero-trust'],
  authors: [{ name: 'CAPTCHA Shield Contributors' }],
  openGraph: {
    title: 'CAPTCHA Shield v4.0 Fortress',
    description: 'The CAPTCHA that nobody breaks. 10 challenges, 28 signals, 7 defense layers.',
    type: 'website',
    url: 'https://smouj.github.io/captcha-shield/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAPTCHA Shield v4.0 Fortress',
    description: 'The CAPTCHA that nobody breaks.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
