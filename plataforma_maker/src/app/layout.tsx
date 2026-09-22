import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MakerBox 3D | Solicitudes de Impresión — Universidad de Talca',
  description: 'Plataforma institucional de gestión y solicitudes de impresión 3D para MakerBox, Facultad de Ingeniería UTalca.',
  icons: {
    icon: '/logos/makerbox-color.jpg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900">
        {children}
      </body>
    </html>
  );
}
