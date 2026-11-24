import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talleres Maker · Plataforma de Fabricación Digital | MakerBox UTalca',
  description:
    'Plataforma multi-taller educativa de fabricación digital (Láser + Impresión 3D): Taller 1 (Dibujo Grupal + Puzzle), Taller 2 (Ingeniería de Vuelo 3D/Láser), Taller 3 (Tangrama CAD Híbrido), Taller 4 (Chapitas Híbridas) y Taller 5 (Laminador 3D a Puzzles MDF 3 mm + Conectores PLA).',
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
