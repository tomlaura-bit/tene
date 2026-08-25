import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TENE — CS2 competitivo en Perú',
  description: 'Salas privadas 5v5 de Counter-Strike 2 con equipos balanceados y premios reales.',
  openGraph: {
    title: 'TENE — Juega. Compite. Gana.',
    description: 'Salas privadas 5v5 de CS2 con equipos balanceados y premios reales.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'TENE — Juega. Compite. Gana.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TENE — Juega. Compite. Gana.',
    description: 'CS2 competitivo en Perú.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
