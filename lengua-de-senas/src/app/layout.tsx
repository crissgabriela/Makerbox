import type { Metadata, Viewport } from 'next';
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
  title: 'MakerBox UTalca | Festival de Ciencia y Tecnología 2026',
  description:
    'Plataforma interactiva de fabricación digital (Corte Láser en Lengua de Señas, Litofanías 3D e Impresión Braille) para el Festival de Ciencia y Tecnología 2026 · MakerBox, Universidad de Talca.',
  icons: {
    icon: '/logos/makerbox-color.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
