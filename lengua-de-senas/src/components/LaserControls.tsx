'use client';

import React from 'react';
import { LaserConfig } from '@/types';
import { Sparkles, KeyRound, Layers, Bookmark, Check } from 'lucide-react';

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
          Elige cómo quieres que la máquina corte tu palabra en una sola pieza de madera o acrílico.
        </p>
      </div>

      {/* Opciones de diseño */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opción 1: Llavero Contorno Desfasado (Tu diseño) */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'organic_contour')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'organic_contour'
              ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-400/20'
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
          <span className="text-base sm:text-lg font-bold text-slate-900">Contorno Desfasado</span>
          <span className="text-xs font-bold text-purple-700 mt-0.5">⭐ Tu diseño oficial</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Silueta orgánica que bordea la altura de cada dedo con orificio para argolla a la izquierda.
          </p>
        </button>

        {/* Opción 2: Llavero Barra */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'keychain')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'keychain'
              ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 font-bold text-lg flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-purple-700" />
            </span>
            {config.mode === 'keychain' && (
              <span className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900">Llavero con Barra</span>
          <span className="text-xs font-semibold text-purple-700 mt-0.5">Base recta</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Las señas se apoyan en una barra recta continua inferior con el agujero a un lado.
          </p>
        </button>

        {/* Opción 3: Silueta de Manos */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'silhouette')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'silhouette'
              ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800 font-bold text-lg flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-700" />
            </span>
            {config.mode === 'silhouette' && (
              <span className="bg-purple-600 text-white rounded-full p-1 shadow-sm">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900">Silueta Solapada</span>
          <span className="text-xs font-semibold text-cyan-700 mt-0.5">Forma artística</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Las manos se tocan directamente unas con otras sin marco exterior adicional.
          </p>
        </button>

        {/* Opción 4: Placa Conmemorativa */}
        <button
          type="button"
          onClick={() => updateConfig('mode', 'plaque')}
          className={`flex flex-col p-5 rounded-2xl border-2 text-left transition-all active:scale-95 relative ${
            config.mode === 'plaque'
              ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-400/20'
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
          <span className="text-base sm:text-lg font-bold text-slate-900">Placa de Recuerdo</span>
          <span className="text-xs font-semibold text-amber-800 mt-0.5">Souvenir de la feria</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Tarjeta de madera rectangular con los sellos oficiales de la Universidad de Talca.
          </p>
        </button>
      </div>

      {/* Opciones y controles de medida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {/* Tamaño de las señas */}
        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Altura de las señas:</span>
            <span className="text-sm font-extrabold text-purple-700">{config.targetHeightMm} mm</span>
          </div>
          <input
            type="range"
            min={30}
            max={65}
            step={1}
            value={config.targetHeightMm}
            onChange={(e) => updateConfig('targetHeightMm', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <span className="text-xs text-slate-400">Recomendado para llavero: 38 - 45 mm</span>
        </div>

        {/* Desfase exterior del contorno (para el modo orgánico) */}
        {config.mode === 'organic_contour' && (
          <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Margen de borde (desfase):</span>
              <span className="text-sm font-extrabold text-purple-700">{config.contourOffsetMm || 5} mm</span>
            </div>
            <input
              type="range"
              min={3}
              max={8}
              step={0.5}
              value={config.contourOffsetMm || 5}
              onChange={(e) => updateConfig('contourOffsetMm', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <span className="text-xs text-slate-400">Grosor del borde alrededor de las manos</span>
          </div>
        )}

        {/* Diámetro del orificio de argolla */}
        {(config.mode === 'organic_contour' || config.mode === 'keychain') && (
          <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Agujero para argolla:</span>
              <span className="text-sm font-extrabold text-purple-700">{config.holeDiameterMm} mm</span>
            </div>
            <input
              type="range"
              min={3}
              max={6}
              step={0.5}
              value={config.holeDiameterMm}
              onChange={(e) => updateConfig('holeDiameterMm', Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <span className="text-xs text-slate-400">Diámetro de corte para el aro de llavero</span>
          </div>
        )}

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
