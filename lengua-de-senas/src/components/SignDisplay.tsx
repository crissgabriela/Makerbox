'use client';

import React from 'react';
import { SIGNS_DICTIONARY, normalizeText } from '@/lib/signsData';
import { Sparkles, Info } from 'lucide-react';

interface SignDisplayProps {
  text: string;
  onSelectLetter?: (letter: string) => void;
}

export const SignDisplay: React.FC<SignDisplayProps> = ({ text, onSelectLetter }) => {
  const letters = normalizeText(text);

  if (letters.length === 0) {
    return (
      <div className="w-full bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Visualizador de Dactilología en Vivo
        </h3>
        <p className="text-xs text-slate-400 max-w-md">
          Escribe cualquier palabra arriba o usa el teclado táctil para ver las señas correspondientes y el vector de corte láser resultante.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span>Señas Generadas:</span>
          <span className="text-xs font-normal text-purple-400">
            ({letters.length} {letters.length === 1 ? 'seña' : 'señas'})
          </span>
        </h3>
        <span className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" /> Toca una seña para ver su descripción
        </span>
      </div>

      {/* Tira horizontal de señas con desplazamiento suave */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-slate-900">
        <div className="flex items-center gap-3 min-w-min py-1">
          {letters.map((char, index) => {
            if (char === ' ') {
              return (
                <div
                  key={`space-${index}`}
                  className="w-10 h-32 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-slate-500 text-xs font-mono select-none"
                  title="Espacio"
                >
                  <span className="text-[10px] rotate-90 tracking-wider">ESPACIO</span>
                </div>
              );
            }

            const sign = SIGNS_DICTIONARY[char];
            if (!sign) return null;

            return (
              <div
                key={`${char}-${index}`}
                onClick={() => onSelectLetter?.(char)}
                className="group relative flex flex-col items-center bg-slate-900 border border-slate-800 hover:border-purple-500/80 rounded-xl p-2.5 shadow-lg transition-all hover:-translate-y-1 cursor-pointer flex-shrink-0 w-24 sm:w-28 active:scale-95"
              >
                {/* Letra badge */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition">
                  {char}
                </div>

                {/* SVG de la seña */}
                <div className="w-20 h-24 flex items-center justify-center bg-slate-950/60 rounded-lg p-1 border border-slate-800/80">
                  <svg
                    viewBox={sign.viewBox}
                    className="w-full h-full object-contain"
                    aria-label={sign.name}
                  >
                    {/* Silueta exterior (Capa corte) */}
                    <path
                      d={sign.outerPath}
                      fill="#8b5cf6"
                      fillOpacity="0.15"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                    />
                    {/* Detalles interiores (Capa grabado) */}
                    {sign.innerPaths.map((innerD, i) => (
                      <path
                        key={i}
                        d={innerD}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                </div>

                {/* Nombre de la seña */}
                <span className="mt-2 text-[11px] font-medium text-slate-300 truncate w-full text-center">
                  {sign.name}
                </span>

                {/* Tooltip con descripción en hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 w-44 p-2 bg-slate-800 text-slate-200 text-[11px] rounded-lg shadow-xl border border-slate-700 pointer-events-none text-center">
                  {sign.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
