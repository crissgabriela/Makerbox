import type { Metadata } from 'next';
import './globals.css';
import { ScienceFairShell } from '@/components/ScienceFairShell';

export const metadata: Metadata = {
  title:
    'Geometría Láser · Feria Científica Liceo Bicentenario de Niñas de Maipú | MakerBox UTalca',
  description:
    'Plataforma interactiva para la Feria Científica del Liceo Bicentenario de Niñas de Maipú junto a MakerBox UTalca: Geometría en MDF 3mm (.SVG CR-Laser Falcon 2 10W), Fotograbado Láser, Litofanías 3D (.STL) y Llaveros Inclusivos en Braille y Lengua de Señas Chilena.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900">
        <ScienceFairShell>{children}</ScienceFairShell>
      </body>
    </html>
  );
}
