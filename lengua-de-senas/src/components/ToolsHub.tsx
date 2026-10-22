'use client';

import React from 'react';
import {
  Scissors,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Layers,
  Printer,
  Plane,
} from 'lucide-react';

export type ToolId = 'laser' | 'lithophane' | 'braille' | 'fractions' | 'glider';

interface ToolsHubProps {
  onSelectTool: (tool: ToolId) => void;
}

/**
 * 1. Ilustración Producto: Llavero de Madera en Lengua de Señas
 */
const KeychainProductMockup: React.FC = () => (
  <svg
    viewBox="0 0 220 130"
    className="w-full h-full drop-shadow-md select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="118" rx="88" ry="8" fill="#000000" fillOpacity="0.12" />
    <rect
      x="20"
      y="30"
      width="180"
      height="72"
      rx="36"
      fill="#dfba8a"
      stroke="#c29660"
      strokeWidth="2.5"
    />
    <path
      d="M 35 48 Q 110 44 185 49 M 40 78 Q 100 82 180 76"
      stroke="#caa26e"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    <circle cx="44" cy="66" r="8.5" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
    <circle cx="44" cy="66" r="5" fill="#cbd5e1" opacity="0.4" />
    <ellipse cx="26" cy="66" rx="10" ry="18" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
    <g transform="translate(72, 45) scale(0.65)" fill="#2c1408">
      <path d="M12 2 C8 2 6 6 6 12 L6 26 C6 30 8 34 12 34 C16 34 18 30 18 26 L18 12 C18 6 16 2 12 2 Z" />
      <path d="M22 6 C18 6 16 10 16 16 L16 26 C16 30 18 34 22 34 C26 34 28 30 28 26 L28 16 C28 10 26 6 22 6 Z" />
      <path d="M8 20 C4 20 2 24 2 28 C2 36 8 44 18 44 C28 44 32 36 32 28 C32 24 30 20 26 20 Z" />
    </g>
    <g transform="translate(108, 44) scale(0.65)" fill="#2c1408">
      <circle cx="18" cy="22" r="14" fill="none" stroke="#2c1408" strokeWidth="6" />
      <path d="M8 24 C8 34 14 42 22 42 C28 42 32 36 32 28" fill="none" stroke="#2c1408" strokeWidth="5" />
    </g>
    <g transform="translate(144, 46) scale(0.65)" fill="#b91c1c">
      <path d="M18 6 C12 -2 2 -2 2 8 C2 18 14 26 18 32 C22 26 34 18 34 8 C34 -2 24 -2 18 6 Z" />
    </g>
    <text
      x="122"
      y="90"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="9.5"
      fontWeight="900"
      fill="#2c1408"
      letterSpacing="2.5"
      textAnchor="middle"
    >
      H O L A ♥
    </text>
  </svg>
);

/**
 * 2. Ilustración Producto: Fotografía Grabada en MDF y Litofanía 3D
 */
const LithophaneProductMockup: React.FC = () => (
  <svg
    viewBox="0 0 220 130"
    className="w-full h-full drop-shadow-md select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="118" rx="80" ry="7" fill="#000000" fillOpacity="0.12" />
    <rect
      x="36"
      y="20"
      width="86"
      height="86"
      rx="8"
      fill="#dfba8a"
      stroke="#c29660"
      strokeWidth="2.5"
    />
    <rect
      x="44"
      y="28"
      width="70"
      height="70"
      rx="5"
      fill="#f4d8b2"
      stroke="#a37640"
      strokeWidth="1.2"
    />
    <circle cx="79" cy="54" r="16" fill="#6f4320" />
    <path d="M59 86 C59 70 68 68 79 68 C90 68 99 70 99 86 Z" fill="#523114" />
    <text
      x="79"
      y="92"
      fontFamily="system-ui, sans-serif"
      fontSize="5.5"
      fontWeight="bold"
      fill="#3a1f0a"
      textAnchor="middle"
    >
      MDF 8×8 cm
    </text>
    <g transform="translate(108, 14)">
      <circle cx="42" cy="48" r="38" fill="#fef08a" opacity="0.45" />
      <rect
        x="6"
        y="6"
        width="76"
        height="84"
        rx="6"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      <rect x="12" y="12" width="64" height="72" rx="4" fill="#f8fafc" />
      <circle cx="44" cy="40" r="14" fill="#cbd5e1" fillOpacity="0.5" />
      <path
        d="M26 72 C26 58 34 56 44 56 C54 56 62 58 62 72 Z"
        fill="#94a3b8"
        fillOpacity="0.5"
      />
      <path d="M10 8 L30 8 L18 80 L6 80 Z" fill="#ffffff" opacity="0.3" />
      <text
        x="44"
        y="80"
        fontFamily="system-ui, sans-serif"
        fontSize="5.5"
        fontWeight="800"
        fill="#64748b"
        textAnchor="middle"
      >
        Litofanía 3D
      </text>
    </g>
  </svg>
);

/**
 * 3. Ilustración Producto: Llavero Braille Impresión 3D
 */
const BrailleProductMockup: React.FC = () => (
  <svg
    viewBox="0 0 220 130"
    className="w-full h-full drop-shadow-md select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="118" rx="85" ry="8" fill="#000000" fillOpacity="0.12" />
    <rect
      x="25"
      y="32"
      width="170"
      height="68"
      rx="16"
      fill="#6366f1"
      stroke="#4338ca"
      strokeWidth="2.5"
    />
    <rect x="28" y="35" width="164" height="30" rx="12" fill="#818cf8" opacity="0.4" />
    <circle cx="46" cy="66" r="8" fill="#f8fafc" stroke="#312e81" strokeWidth="2.5" />
    <ellipse cx="30" cy="66" rx="9" ry="16" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
    <text
      x="125"
      y="50"
      fontFamily="system-ui, sans-serif"
      fontSize="10"
      fontWeight="900"
      fill="#ffffff"
      letterSpacing="1"
      textAnchor="middle"
    >
      B R A I L L E
    </text>
    <g transform="translate(68, 62)">
      <circle cx="6" cy="8" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="6" cy="18" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="16" cy="8" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="16" cy="18" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="32" cy="8" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="32" cy="18" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="42" cy="8" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="42" cy="18" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="58" cy="8" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="58" cy="18" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="68" cy="8" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="68" cy="18" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="84" cy="8" r="2.2" fill="#4338ca" opacity="0.4" />
      <circle cx="84" cy="18" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="94" cy="8" r="3.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="94" cy="18" r="2.2" fill="#4338ca" opacity="0.4" />
    </g>
  </svg>
);

/**
 * 4. Ilustración Producto: Plato de Fracciones en MDF 3mm y PLA
 */
const FractionsProductMockup: React.FC = () => (
  <svg
    viewBox="0 0 220 130"
    className="w-full h-full drop-shadow-md select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="118" rx="70" ry="8" fill="#000000" fillOpacity="0.14" />
    <circle cx="110" cy="65" r="48" fill="#dfba8a" stroke="#b2844d" strokeWidth="2.5" />
    <circle cx="110" cy="65" r="40" fill="#f4d8b2" stroke="#a0723c" strokeWidth="1.8" />
    <path
      d="M 110 65 L 110 27 A 38 38 0 0 1 143 84 Z"
      fill="#10b981"
      stroke="#047857"
      strokeWidth="1.5"
    />
    <text x="124" y="55" fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="900" fill="#ffffff" textAnchor="middle">
      1/3
    </text>
    <path
      d="M 110 65 L 143 84 A 38 38 0 0 1 77 84 Z"
      fill="#0284c7"
      stroke="#0369a1"
      strokeWidth="1.5"
    />
    <text x="110" y="84" fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="900" fill="#ffffff" textAnchor="middle">
      1/3
    </text>
    <g transform="translate(-10, -10)">
      <path
        d="M 110 65 L 77 84 A 38 38 0 0 1 110 27 Z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1.8"
      />
      <text x="95" y="55" fontFamily="system-ui, sans-serif" fontSize="8.5" fontWeight="900" fill="#ffffff" textAnchor="middle">
        1/3
      </text>
    </g>
    <rect x="145" y="16" width="62" height="18" rx="6" fill="#1e293b" />
    <text x="176" y="28" fontFamily="system-ui, sans-serif" fontSize="7" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
      Tol: 0.2 mm
    </text>
  </svg>
);

/**
 * 5. Ilustración Producto: Planeador Paramétrico en Madera / MDF para Corte Láser
 */
const GliderProductMockup: React.FC = () => (
  <svg
    viewBox="0 0 220 130"
    className="w-full h-full drop-shadow-md select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="118" rx="82" ry="7" fill="#000000" fillOpacity="0.12" />
    {/* Fuselaje en MDF */}
    <path
      d="M 28 54 Q 20 50 28 44 L 185 44 L 185 68 Q 170 76 155 62 L 45 58 Z"
      fill="#dfba8a"
      stroke="#b2844d"
      strokeWidth="2"
    />
    {/* Ala Izquierda y Derecha ensambladas con diedro */}
    <path
      d="M 75 48 L 36 22 Q 55 14 95 36 L 105 48 Z"
      fill="#f4d8b2"
      stroke="#c29660"
      strokeWidth="2"
    />
    <path
      d="M 75 48 L 122 86 Q 145 84 115 52 Z"
      fill="#e7c697"
      stroke="#b2844d"
      strokeWidth="2"
    />
    {/* Estabilizador horizontal trasero */}
    <ellipse cx="172" cy="45" rx="18" ry="8" fill="#f4d8b2" stroke="#b2844d" strokeWidth="1.8" />
    {/* Ranura resaltada */}
    <rect x="82" y="43" width="12" height="4" fill="#ef4444" rx="1" />
    <rect x="135" y="16" width="72" height="18" rx="6" fill="#0f172a" />
    <text x="171" y="28" fontFamily="system-ui, sans-serif" fontSize="6.8" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
      Ranura: 3.175 mm
    </text>
  </svg>
);

export const ToolsHub: React.FC<ToolsHubProps> = ({ onSelectTool }) => {
  const tools = [
    {
      id: 'glider' as ToolId,
      name: 'Planeador Paramétrico SVG',
      category: 'Diseño Vectorial · Corte Láser',
      techBadge: '✈️ Ensamble Garantizado · MDF',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      description:
        'Modifica el largo del fuselaje, envergadura y ancho de alas en tiempo real manteniendo intactas las ranuras de ensamble para corte láser.',
      icon: Plane,
      cardBorder: 'border-sky-300 hover:border-sky-600 hover:shadow-sky-100',
      buttonBg: 'bg-sky-600 hover:bg-sky-700 text-white',
      accentColor: 'text-sky-600',
      Mockup: GliderProductMockup,
    },
    {
      id: 'laser' as ToolId,
      name: 'Llavero Lengua de Señas',
      category: 'Corte y Grabado Láser',
      techBadge: '🪵 MDF 3 mm · Corte Láser',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description:
        'Escribe tu nombre o palabra para convertirlo en señas de manos chilenas y cortar un llavero personalizado de madera.',
      icon: Scissors,
      cardBorder: 'border-purple-200 hover:border-purple-500 hover:shadow-purple-100',
      buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
      accentColor: 'text-purple-600',
      Mockup: KeychainProductMockup,
    },
    {
      id: 'lithophane' as ToolId,
      name: 'Imagen Láser y 3D',
      category: 'Litofanía y Fotograbado',
      techBadge: '📷 Sube desde tu Celular QR',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description:
        'Sube una fotografía para fabricar una litofanía 3D translúcida con luz o grabarla con láser en un cuadro de MDF de 8×8 cm.',
      icon: ImageIcon,
      cardBorder: 'border-blue-200 hover:border-blue-500 hover:shadow-blue-100',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      accentColor: 'text-blue-600',
      Mockup: LithophaneProductMockup,
    },
    {
      id: 'braille' as ToolId,
      name: 'Llaveros Braille 3D',
      category: 'Impresión 3D Inclusiva',
      techBadge: '⠇ Relieve Táctil +1.0 mm',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description:
        'Genera llaveros con sistema Braille en sobre relieve para lectura táctil con los dedos, listos para imprimir en filamento PLA.',
      icon: Printer,
      cardBorder: 'border-indigo-200 hover:border-indigo-500 hover:shadow-indigo-100',
      buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      accentColor: 'text-indigo-600',
      Mockup: BrailleProductMockup,
    },
    {
      id: 'fractions' as ToolId,
      name: 'Discos de Fracciones',
      category: 'Material STEM Interactivo',
      techBadge: '🥧 Plato Ø 70 mm · 1/2 a 1/6',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description:
        'Crea platos y discos divididos con tolerancia de 0,2 mm, números y Braille para aprender matemáticas tocando en madera o PLA.',
      icon: Layers,
      cardBorder: 'border-emerald-200 hover:border-emerald-500 hover:shadow-emerald-100',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      accentColor: 'text-emerald-600',
      Mockup: FractionsProductMockup,
    },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center my-auto py-2 sm:py-6 animate-in fade-in duration-300">
      <div className="text-center max-w-3xl flex flex-col items-center gap-2 mb-6 sm:mb-8 px-4">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            MakerBox · Facultad de Ingeniería UTalca
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">
          Plataforma de Fabricación Digital y Diseño Paramétrico
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl leading-relaxed">
          Selecciona una herramienta para personalizar tu diseño y descargar archivos listos para <strong>corte láser</strong> o <strong>impresión 3D</strong>:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-6xl px-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const MockupComponent = tool.Mockup;

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`group bg-white rounded-3xl p-5 sm:p-6 border-3 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.98] flex flex-col justify-between gap-4 ${tool.cardBorder}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border w-fit ${tool.badgeColor}`}
                  >
                    {tool.techBadge}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1 group-hover:text-purple-950 transition-colors">
                    {tool.name}
                  </h2>
                  <span className="text-xs font-bold text-slate-400">
                    {tool.category}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-slate-100 group-hover:bg-purple-50 text-slate-700 group-hover:text-purple-700 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="relative w-full h-32 sm:h-36 bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-2xl p-2 border border-slate-200/80 flex items-center justify-center overflow-hidden group-hover:bg-purple-50/30 transition-colors">
                <MockupComponent />
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs sm:text-[13px] text-slate-600 leading-snug">
                  {tool.description}
                </p>

                <button
                  type="button"
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-lg cursor-pointer ${tool.buttonBg}`}
                >
                  <span>Abrir Herramienta</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
