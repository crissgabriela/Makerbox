'use client';

import React from 'react';
import { LaserConfig, LaserCutMode } from '@/types';
import { KeyRound, Layers, Bookmark, Check } from 'lucide-react';

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

      {/* 3 Opciones principales en tarjetas grandes y amigables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opción 1: Llavero */}
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
          <span className="text-lg font-bold text-slate-900">Llavero con Barra</span>
          <span className="text-xs font-semibold text-purple-700 mt-0.5">¡El más recomendado!</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Las señas se apoyan en una base firme con un orificio para argolla. Muy resistente para llevar en la mochila.
          </p>
        </button>

        {/* Opción 2: Silueta de Manos */}
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
          <span className="text-lg font-bold text-slate-900">Silueta Continua</span>
          <span className="text-xs font-semibold text-cyan-700 mt-0.5">Forma artística</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Las manos se tocan una al lado de la otra formando una sola silueta recortada muy llamativa.
          </p>
        </button>

        {/* Opción 3: Placa Conmemorativa */}
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
          <span className="text-lg font-bold text-slate-900">Placa de Recuerdo</span>
          <span className="text-xs font-semibold text-amber-800 mt-0.5">Souvenir de la feria</span>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Una tarjeta de madera con los sellos oficiales de la Universidad de Talca y las señas grabadas en la superficie.
          </p>
        </button>
      </div>

      {/* Opciones sencillas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {/* Tamaño */}
        <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Tamaño de las señas:</span>
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
          <span className="text-xs text-slate-400">Recomendado para el stand: 40 mm</span>
        </div>

        {/* Orificio para llavero */}
        {config.mode === 'keychain' && (
          <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-purple-50/40 transition">
            <input
              type="checkbox"
              checked={config.addKeychainHole}
              onChange={(e) => updateConfig('addKeychainHole', e.target.checked)}
              className="w-5 h-5 rounded-md accent-purple-600 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Orificio para colgar</span>
              <span className="text-xs text-slate-500">Agujero para argolla de llavero</span>
            </div>
          </label>
        )}

        {/* Grabar texto legible debajo */}
        <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-purple-50/40 transition">
          <input
            type="checkbox"
            checked={config.includeTextEngraving}
            onChange={(e) => updateConfig('includeTextEngraving', e.target.checked)}
            className="w-5 h-5 rounded-md accent-purple-600 cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">Escribir letras debajo</span>
            <span className="text-xs text-slate-500">Para que oyentes y sordos lo lean</span>
          </div>
        </label>
      </div>
    </div>
  );
};
