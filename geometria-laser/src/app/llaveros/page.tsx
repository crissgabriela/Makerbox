import type { Metadata } from 'next';
import { KeychainsToolSection } from '@/components/KeychainsToolSection';

export const metadata: Metadata = {
  title: '5. Llaveros Inclusivos 3D y Láser | Feria Científica LBN Maipú · MakerBox UTalca',
  description:
    'Generador unificado de llaveros personalizados con Nombre + Braille Español o Lengua de Señas Chilena, exportables en Corte Láser (.SVG MDF 3 mm) e Impresión 3D (.STL / .ZIP PLA).',
};

export default function LlaverosPage() {
  return <KeychainsToolSection />;
}
