import type { Metadata } from 'next';
import './globals.css';
import { ScienceFairShell } from '@/components/ScienceFairShell';

export const metadata: Metadata = {
  title:
    'Geometría Láser · Feria Científica Liceo Bicentenario de Niñas de Maipú | MakerBox UTalca',
  description:
    'Laboratorio interactivo de herramientas geométricas y matemáticas para generar archivos .SVG listos para cortar y grabar en MDF 3mm con una Creality CR-Laser Falcon 2 10W.',
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
