'use client';

import React from 'react';
import { X, Cpu, Flame, Sparkles, CheckCircle2 } from 'lucide-react';

interface StandGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandGuideModal: React.FC<StandGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Guía de Parámetros de Corte Láser para el Stand
              </h2>
              <p className="text-xs text-slate-400">
                MakerBox · Facultad de Ingeniería UTalca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabla de Parámetros Sugeridos (Tubos CO2 50W-80W típicos de MakerSpace) */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            Parámetros de Referencia (Láser CO2 60W - 80W)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MDF 3mm */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-amber-300">📦 Terciado / MDF (3 mm)</span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-red-400 font-medium">🔴 Corte exterior:</span>
                  <span className="font-mono">Vel: 18 mm/s | Pot: 70%</span>
                </li>
                <li className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-blue-400 font-medium">🔵 Marcado dedos:</span>
                  <span className="font-mono">Vel: 160 mm/s | Pot: 14%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-300 font-medium">⚫ Grabado texto:</span>
                  <span className="font-mono">Vel: 320 mm/s | Pot: 20%</span>
                </li>
              </ul>
            </div>

            {/* Acrílico 3mm */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-cyan-300">✨ Acrílico Cristal (3 mm)</span>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-red-400 font-medium">🔴 Corte exterior:</span>
                  <span className="font-mono">Vel: 14 mm/s | Pot: 75%</span>
                </li>
                <li className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-blue-400 font-medium">🔵 Marcado dedos:</span>
                  <span className="font-mono">Vel: 200 mm/s | Pot: 12%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-300 font-medium">⚫ Grabado texto:</span>
                  <span className="font-mono">Vel: 300 mm/s | Pot: 18%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips para Operar el Stand en la Feria */}
        <div className="bg-slate-950/80 border border-purple-900/40 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-slate-300">
          <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tips para Demostración en Vivo en la Feria:
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tiempo estimado por pieza:</strong> En modo llavero (palabras de 5 a 8 letras), el corte toma entre <strong>40 y 60 segundos</strong>, ideal para fabricar en el momento mientras conversas con los asistentes.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Acabado limpio en MDF:</strong> Cubre la lámina de madera con cinta de enmascarar (masking tape) antes de cortar para evitar manchas de ahumado por resina.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Modo Kiosco:</strong> Puedes pulsar <strong>F11</strong> en el navegador para poner la plataforma en pantalla completa y abrir el teclado táctil flotante para que el público interactúe directamente con su dedo.
              </span>
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition active:scale-95"
          >
            Entendido, volver a la plataforma
          </button>
        </div>
      </div>
    </div>
  );
};
