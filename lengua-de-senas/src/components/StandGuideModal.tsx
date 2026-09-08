'use client';

import React from 'react';
import { X, Flame, Sparkles, CheckCircle2, Heart } from 'lucide-react';

interface StandGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandGuideModal: React.FC<StandGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Guía de Corte Láser para el Stand
              </h2>
              <p className="text-sm text-slate-500">
                Parámetros para MakerBox · Facultad de Ingeniería UTalca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tarjetas de parámetros en lenguaje simple */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* MDF 3mm */}
          <div className="bg-[#fcf8f2] border-2 border-[#f0dfc8] rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              📦 Madera / MDF (3 mm)
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex justify-between border-b border-amber-200/60 pb-1">
                <span className="text-red-600 font-bold">🔴 Corte:</span>
                <span className="font-mono text-slate-800">Vel: 18 | Pot: 70%</span>
              </li>
              <li className="flex justify-between border-b border-amber-200/60 pb-1">
                <span className="text-blue-600 font-bold">🔵 Marcado:</span>
                <span className="font-mono text-slate-800">Vel: 160 | Pot: 14%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-800 font-bold">⚫ Grabado:</span>
                <span className="font-mono text-slate-800">Vel: 320 | Pot: 20%</span>
              </li>
            </ul>
          </div>

          {/* Acrílico 3mm */}
          <div className="bg-cyan-50/60 border-2 border-cyan-200 rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-sm font-bold text-cyan-900 flex items-center gap-1.5">
              ✨ Acrílico (3 mm)
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex justify-between border-b border-cyan-200/60 pb-1">
                <span className="text-red-600 font-bold">🔴 Corte:</span>
                <span className="font-mono text-slate-800">Vel: 14 | Pot: 75%</span>
              </li>
              <li className="flex justify-between border-b border-cyan-200/60 pb-1">
                <span className="text-blue-600 font-bold">🔵 Marcado:</span>
                <span className="font-mono text-slate-800">Vel: 200 | Pot: 12%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-800 font-bold">⚫ Grabado:</span>
                <span className="font-mono text-slate-800">Vel: 300 | Pot: 18%</span>
              </li>
            </ul>
          </div>

          {/* Impresión 3D (Braille y Litofanía) */}
          <div className="bg-amber-50/60 border-2 border-amber-200 rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              🖨️ Impresión 3D (PLA)
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5">
              <li className="flex justify-between border-b border-amber-200/60 pb-1">
                <span className="text-slate-800 font-bold">⠇ Braille:</span>
                <span className="font-mono text-amber-800">1mm base · +0.36mm domos</span>
              </li>
              <li className="flex justify-between border-b border-amber-200/60 pb-1">
                <span className="text-slate-800 font-bold">📏 Capa:</span>
                <span className="font-mono text-slate-800">0.12 - 0.16 mm</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-800 font-bold">🧱 Infill:</span>
                <span className="font-mono text-slate-800">100% sólido</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Consejos prácticos para la atención al público */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 text-sm text-slate-700">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Consejos para la atención en el Stand:
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tiempo rápido:</strong> Cada llavero demora entre <strong>40 y 60 segundos</strong> en cortarse, lo que permite entregar recuerdos casi de inmediato a las personas que visiten el stand.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Acabado sin manchas:</strong> Colocar cinta de enmascarar (masking tape) sobre la madera evita que el humo deje marcas oscuras alrededor de las señas.
              </span>
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition active:scale-95"
          >
            Volver a la plataforma
          </button>
        </div>
      </div>
    </div>
  );
};
