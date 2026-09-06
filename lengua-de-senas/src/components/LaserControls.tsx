'use client';

import React from 'react';
import { LaserConfig } from '@/types';
import { Sparkles, KeyRound, Bookmark, Check, Shield } from 'lucide-react';

interface LaserControlsProps {
  config: LaserConfig;
  onChange: (newConfig: LaserConfig) => void;
}

export const LaserControls: React.FC<LaserControlsProps> = ({ config, onChange }) => {
  const updateConfig = <K extends keyof LaserConfig>(key: K, value: LaserConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 flex flex-col gap-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-base font-extrabold">
            3
          </span>
          <span>Elige el diseño de tu recuerdo:</span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Elige la forma de corte exterior para tu llavero o placa de madera en la máquina láser.
        </p>
      </div>

      {/* Opciones de diseño */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Opción 1: Llavero Cápsula / Ranura CAD (Recomendado oficial) */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'capsule')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'capsule'
              ? 'bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 font-bold text-lg flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-700" />
            </span>
            {config.mode === 'capsule' && (
              <span className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="text-lg font-bold text-slate-900">Llavero Cápsula (Ranura)</span>
          <span className="text-xs font-bold text-purple-700 mt-0.5">⭐ Modelo CAD Recomendado</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Forma ergonómica redondeada en ambos extremos con orificio a la izquierda y grabado de las señas oficiales. ¡Corte perfecto garantizado!
          </p>
        </button>

        {/* Opción 2: Silueta Ondulada Suave */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'organic_contour')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'organic_contour'
              ? 'bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-700" />
            </span>
            {config.mode === 'organic_contour' && (
              <span className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="text-lg font-bold text-slate-900">Silueta Ondulada</span>
          <span className="text-xs font-semibold text-purple-700 mt-0.5">Borde orgánico envolvente</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Curva suave continua que rodea las señas a distancia segura sin tocar los dedos.
          </p>
        </button>

        {/* Opción 3: Placa Conmemorativa */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'plaque')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'plaque'
              ? 'bg-purple-50/80 border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="p-2.5 rounded-xl bg-amber-100 text-amber-800 font-bold text-lg flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-amber-700" />
            </span>
            {config.mode === 'plaque' && (
              <span className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="text-lg font-bold text-slate-900">Placa de Recuerdo</span>
          <span className="text-xs font-semibold text-amber-800 mt-0.5">Souvenir de la feria</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tarjeta de madera rectangular con los sellos oficiales de la Universidad de Talca.
          </p>
        </button>
      </div>

      {/* Opciones y controles de medida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {/* Altura de las señas */}
        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Altura del llavero:</span>
            <span className="text-sm font-extrabold text-purple-700">{config.targetHeightMm} mm</span>
          </div>
          <input
            type="range"
            min={30}
            max={60}
            step={1}
            value={config.targetHeightMm}
            onChange={(e) => updateConfig('targetHeightMm', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <span className="text-xs text-slate-400">Recomendado para llavero: 36 - 42 mm</span>
        </div>

        {/* Diámetro del orificio de argolla */}
        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Agujero para argolla:</span>
            <span className="text-sm font-extrabold text-purple-700">{config.holeDiameterMm || 4.5} mm</span>
          </div>
          <input
            type="range"
            min={3}
            max={6}
            step={0.5}
            value={config.holeDiameterMm || 4.5}
            onChange={(e) => updateConfig('holeDiameterMm', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <span className="text-xs text-slate-400">Diámetro para el aro de llavero</span>
        </div>

        {/* Grabar letras normales debajo */}
        <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-purple-50/40 transition">
          <input
            type="checkbox"
            checked={config.includeTextEngraving}
            onChange={(e) => updateConfig('includeTextEngraving', e.target.checked)}
            className="w-5 h-5 rounded-md accent-purple-600 cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">Grabar letras debajo</span>
            <span className="text-xs text-slate-500">Texto en alfabeto latino visible</span>
          </div>
        </label>
      </div>
    </div>
  );
};
