import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Configurador Paramétrico de Planeador SVG | MakerBox UTalca',
  description:
    'Plataforma interactiva para modificar una plantilla SVG base de un planeador ajustando longitud del fuselaje, envergadura y ancho de ala manteniendo intactas las ranuras de ensamble para corte láser.',
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
