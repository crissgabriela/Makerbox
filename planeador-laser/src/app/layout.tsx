import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talleres de Fabricación Láser: Zoológico Low-Poly y Planeadores | MakerBox UTalca',
  description:
    'Plataforma multi-taller para estudiantes: Taller 1 (Zoológico Low-Poly con escalado y ranuras automáticas) y Taller 2 (Ingeniería de Vuelo - Planeadores paramétricos) para corte láser en madera de balsa de 300x100x3 mm.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
