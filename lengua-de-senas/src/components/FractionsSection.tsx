'use client';

import React, { useState, useMemo } from 'react';
import {
  FractionsConfig,
  DEFAULT_FRACTIONS_CONFIG,
  FractionDenominator,
  MarkingMode,
  MaterialStyle,
  generateFractions,
  downloadFractionsStl,
  downloadFractionsSvg,
  downloadFractionsZip,
  FRACTION_BRAILLE_CELLS
} from '@/lib/fractionsGenerator';
import { Fractions3DViewer } from './Fractions3DViewer';
import {
  Sparkles,
  Download,
  Printer,
  Scissors,
  Flame,
  Info,
  Check,
  Layers,
  Sliders,
  CheckCircle2,
  Box,
  CircleDot,
  FolderArchive,
  Eye,
  Award,
  Ruler,
  Cpu,
  RefreshCw,
  Compass,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FractionPresetInfo {
  den: FractionDenominator;
  label: string;
  name: string;
  angle: number;
  percent: string;
  color: string;
  accentBg: string;
}

const FRACTION_PRESETS: FractionPresetInfo[] = [
  { den: 2, label: '1/2', name: 'Medios', angle: 180, percent: '50%', color: '#0284c7', accentBg: 'from-sky-500 to-blue-600' },
  { den: 3, label: '1/3', name: 'Tercios', angle: 120, percent: '33.3%', color: '#10b981', accentBg: 'from-emerald-500 to-teal-600' },
  { den: 4, label: '1/4', name: 'Cuartos', angle: 90, percent: '25%', color: '#f59e0b', accentBg: 'from-amber-500 to-yellow-600' },
  { den: 5, label: '1/5', name: 'Quintos', angle: 72, percent: '20%', color: '#f97316', accentBg: 'from-orange-500 to-amber-600' },
  { den: 6, label: '1/6', name: 'Sextos', angle: 60, percent: '16.7%', color: '#ec4899', accentBg: 'from-pink-500 to-rose-600' }
];

/**
 * Diagrama circular SVG dinámico para cada botón de fracción
 * Ilustra la división del disco y resalta 1 sector pedagógicamente
 */
const FractionPieSvg: React.FC<{
  denominator: FractionDenominator;
  isSelected: boolean;
  color: string;
  size?: number;
}> = ({ denominator, isSelected, color, size = 56 }) => {
  const center = size / 2;
  const radius = size / 2 - 4;
  const angleRad = (Math.PI * 2) / denominator;

  // Coordenadas del sector destacado (empezando arriba en -PI/2)
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + angleRad;
  const x1 = center + radius * Math.cos(startAngle);
  const y1 = center + radius * Math.sin(startAngle);
  const x2 = center + radius * Math.cos(endAngle);
  const y2 = center + radius * Math.sin(endAngle);

  // Líneas divisorias radiales
  const dividers: { x: number; y: number }[] = [];
  for (let i = 0; i < denominator; i++) {
    const a = startAngle + i * angleRad;
    dividers.push({
      x: center + radius * Math.cos(a),
      y: center + radius * Math.sin(a)
    });
  }

  // Ruta del sector 1
  let slicePath = '';
  if (denominator === 2) {
    // Semicírculo
    slicePath = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  } else {
    const largeArc = angleRad > Math.PI ? 1 : 0;
    slicePath = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 transition-transform duration-200">
      {/* Fondo del círculo base */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill={isSelected ? '#ffffff' : '#f1f5f9'}
        stroke={isSelected ? color : '#cbd5e1'}
        strokeWidth="2"
      />

      {/* Sector destacado coloreado */}
      <path
        d={slicePath}
        fill={color}
        fillOpacity={isSelected ? 0.95 : 0.75}
        stroke={isSelected ? '#ffffff' : color}
        strokeWidth="1.5"
      />

      {/* Radios divisorios de las demás partes */}
      {dividers.map((pt, idx) => (
        <line
          key={idx}
          x1={center}
          y1={center}
          x2={pt.x}
          y2={pt.y}
          stroke={isSelected ? '#475569' : '#94a3b8'}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      ))}

      {/* Punto de centro */}
      <circle cx={center} cy={center} r="2.5" fill="#1e293b" />
    </svg>
  );
};

export const FractionsSection: React.FC = () => {
  const [config, setConfig] = useState<FractionsConfig>(DEFAULT_FRACTIONS_CONFIG);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const updateConfig = <K extends keyof FractionsConfig>(key: K, value: FractionsConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Cambio de material con sincronización automática de espesores de plato
  const handleMaterialChange = (mat: MaterialStyle) => {
    if (mat === 'mdf') {
      // Especificación técnica para MDF 3 mm:
      // Base 3 mm + Anillo 3 mm = 6 mm total. Fichas 3 mm a ras.
      setConfig((prev) => ({
        ...prev,
        materialStyle: 'mdf',
        trayTotalHeightMm: 6,
        trayFloorThicknessMm: 3,
        pieceThicknessMm: 3,
        trayPocketDepthMm: 3
      }));
    } else {
      // Modo Impresión 3D PLA:
      // Base 2 mm + Pared 3 mm = 5 mm total. Fichas 3 mm.
      setConfig((prev) => ({
        ...prev,
        materialStyle: mat,
        trayTotalHeightMm: 5,
        trayFloorThicknessMm: 2,
        pieceThicknessMm: 3,
        trayPocketDepthMm: 3
      }));
    }
  };

  // Cálculo del modelo 3D y archivos de descarga con memoization
  const modelResult = useMemo(() => {
    try {
      return generateFractions(config);
    } catch (err) {
      console.error('Error generando modelo de fracciones:', err);
      return null;
    }
  }, [config]);

  // Manejadores de descarga
  const handleDownloadFullSetStl = () => {
    if (!modelResult) return;
    const filename = `Fracciones_Set_Completo_1_${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.fullSetStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('FULL_STL');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadTrayStl = () => {
    if (!modelResult) return;
    const filename = `Plato_Base_D70mm_Cavidad60mm_${config.materialStyle === 'mdf' ? 'MDF6mm' : 'PLA5mm'}.stl`;
    downloadFractionsStl(modelResult.trayStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('TRAY_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadPiecesStl = () => {
    if (!modelResult) return;
    const filename = `Piezas_Fraccion_1_${config.denominator}_x${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.piecesStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('PIECES_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadSinglePieceStl = () => {
    if (!modelResult) return;
    const filename = `Pieza_Individual_1_${config.denominator}_${config.mode}.stl`;
    downloadFractionsStl(modelResult.singlePieceStlBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('SINGLE_STL');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadSvg = () => {
    if (!modelResult) return;
    const filename = `Corte_Laser_MDF_3mm_Plato_y_Fracciones_1_${config.denominator}.svg`;
    downloadFractionsSvg(modelResult.laserSvgContent, filename);
    triggerCelebration();
    setDownloadSuccess('LASER_SVG');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownloadZip = () => {
    if (!modelResult) return;
    const filename = `MakerBox_Fracciones_1_${config.denominator}_MDF_y_PLA_Completo.zip`;
    downloadFractionsZip(modelResult.zipBuffer, filename);
    triggerCelebration();
    setDownloadSuccess('ZIP');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
      });
    } catch {
      // Ignorar
    }
  };

  const currentPreset = FRACTION_PRESETS.find((p) => p.den === config.denominator) || FRACTION_PRESETS[1];
  const brailleCellsData = FRACTION_BRAILLE_CELLS[config.denominator];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* BANNER PRINCIPAL: FESTIVAL DE CIENCIA Y TECNOLOGÍA 2026                   */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-purple-400/30">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Festival de Ciencia y Tecnología 2026
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold border border-amber-300/30">
              📺 Pizarra Interactiva Táctil STEM
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xs">
            Discos de Fracciones Táctiles y Corte Láser
          </h1>

          <p className="text-sm sm:text-base text-purple-100 font-medium leading-relaxed">
            Diseña y fabrica platos didácticos de <strong>Ø 70 mm</strong> con alojamiento interior de <strong>60 mm</strong> y tolerancia mecánica calibrada de <strong>0,2 mm</strong>. Compatible con corte láser en <strong>MDF 3 mm (espesor 6 mm)</strong> e <strong>impresión 3D PLA</strong> con lectura en bajo relieve o <strong>Braille táctil universal</strong>.
          </p>
        </div>

        {/* Chip flotante con la selección actual en tiempo real */}
        <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[170px] text-center shadow-lg">
          <span className="text-xs uppercase tracking-wider text-purple-200 font-bold">
            Selección Activa
          </span>
          <span className="text-4xl font-black text-yellow-300 my-0.5">
            {currentPreset.label}
          </span>
          <span className="text-xs font-bold text-white">
            {currentPreset.name} ({currentPreset.angle}°)
          </span>
          <span className="text-[11px] text-purple-200 mt-1 font-mono">
            {config.materialStyle === 'mdf' ? '🪵 MDF 3 mm (Total 6mm)' : '🖨️ PLA Impresión 3D'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: SELECCIÓN DE FRACCIÓN CON GRÁFICO CIRCULAR INTERACTIVO             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              1
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Selecciona la Fracción para Explorar:
            </h2>
          </div>
          <span className="text-xs font-mono font-black text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200">
            {modelResult?.anglePerPieceDeg}° por cada pieza ({config.denominator} partes iguales)
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600">
          Toca en la pizarra interactiva la fracción que deseas armar en el plato circular:
        </p>

        {/* Botones táctiles XL con diagramas de pizza/fracción */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-1">
          {FRACTION_PRESETS.map((p) => {
            const isSelected = config.denominator === p.den;
            return (
              <button
                key={p.den}
                type="button"
                onClick={() => updateConfig('denominator', p.den)}
                className={`relative flex flex-col items-center justify-between p-4 rounded-3xl border-3 transition-all cursor-pointer active:scale-95 min-h-[145px] ${
                  isSelected
                    ? 'border-violet-600 bg-violet-50/80 shadow-md shadow-violet-200 ring-4 ring-violet-200/50'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                }`}
              >
                {/* Badge de selección */}
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}

                {/* Diagrama circular visual interactivo */}
                <FractionPieSvg
                  denominator={p.den}
                  isSelected={isSelected}
                  color={p.color}
                  size={58}
                />

                <div className="flex flex-col items-center mt-2">
                  <span
                    className={`text-2xl font-black tracking-tight ${
                      isSelected ? 'text-violet-950 font-black' : 'text-slate-800'
                    }`}
                  >
                    {p.label}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {p.name} · {p.percent}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {p.angle}° c/u
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 2 Y 3: MATERIAL DE FABRICACIÓN Y TIPO DE MARCADO (NÚMEROS / BRAILLE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PASO 2: MATERIAL (MDF 3 mm vs PLA 3D) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              2
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Material y Proceso de Fabricación:
              </h2>
              <p className="text-xs text-slate-500">
                Determina el espesor del disco y las propiedades físicas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opción Madera MDF 3 mm */}
            <button
              type="button"
              onClick={() => handleMaterialChange('mdf')}
              className={`p-4 rounded-2xl border-3 flex flex-col gap-2 transition-all cursor-pointer active:scale-95 text-left ${
                config.materialStyle === 'mdf'
                  ? 'border-amber-700 bg-amber-50/80 shadow-md ring-3 ring-amber-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🪵</span>
                {config.materialStyle === 'mdf' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-black">
                    ACTIVO
                  </span>
                )}
              </div>
              <div>
                <span className="text-base font-black text-amber-950 block">
                  Madera MDF 3 mm
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  Corte y grabado láser
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-amber-200/60 font-medium">
                <li>• Disco total: <strong>6 mm</strong> de espesor</li>
                <li>• Plato base 3 mm + Anillo 3 mm</li>
                <li>• Fichas MDF 3 mm (al ras)</li>
                <li>• Grabado quemado tostado oscuro</li>
              </ul>
            </button>

            {/* Opción Filamento PLA Impresión 3D */}
            <button
              type="button"
              onClick={() => handleMaterialChange('pla_color')}
              className={`p-4 rounded-2xl border-3 flex flex-col gap-2 transition-all cursor-pointer active:scale-95 text-left ${
                config.materialStyle !== 'mdf'
                  ? 'border-violet-600 bg-violet-50/80 shadow-md ring-3 ring-violet-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🖨️</span>
                {config.materialStyle !== 'mdf' && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black">
                    ACTIVO
                  </span>
                )}
              </div>
              <div>
                <span className="text-base font-black text-violet-950 block">
                  Impresión 3D PLA
                </span>
                <span className="text-xs font-semibold text-violet-800">
                  Filamento plástico sólido
                </span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-violet-200/60 font-medium">
                <li>• Disco total: <strong>5 mm</strong> (Base 2 + Aro 3)</li>
                <li>• Cavidad interior: 3 mm</li>
                <li>• Puntos Braille esféricos (+1 mm)</li>
                <li>• Monolítico en una sola impresión</li>
              </ul>
            </button>
          </div>
        </div>

        {/* PASO 3: TIPO DE MARCADO (NÚMEROS O BRAILLE) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              3
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Lectura y Marcado Superficial:
              </h2>
              <p className="text-xs text-slate-500">
                Elige la identificación pedagógica en cada pieza de la fracción
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opción Números */}
            <button
              type="button"
              onClick={() => updateConfig('mode', 'numbers')}
              className={`p-4 rounded-2xl border-3 flex flex-col gap-2 transition-all cursor-pointer active:scale-95 text-left ${
                config.mode === 'numbers'
                  ? 'border-purple-600 bg-purple-50/80 shadow-md ring-3 ring-purple-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🔢</span>
                {config.mode === 'numbers' && (
                  <Check className="w-5 h-5 text-purple-700" />
                )}
              </div>
              <span className="text-base font-black text-slate-900">
                Números en Relieve
              </span>
              <p className="text-xs text-slate-500 leading-snug">
                Texto <strong>1/{config.denominator}</strong> tallado en bajo relieve (-0,8 mm) o grabado láser quemado.
              </p>
            </button>

            {/* Opción Braille Táctil */}
            <button
              type="button"
              onClick={() => updateConfig('mode', 'braille')}
              className={`p-4 rounded-2xl border-3 flex flex-col gap-2 transition-all cursor-pointer active:scale-95 text-left ${
                config.mode === 'braille'
                  ? 'border-purple-600 bg-purple-50/80 shadow-md ring-3 ring-purple-200'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">⠇</span>
                {config.mode === 'braille' && (
                  <Check className="w-5 h-5 text-purple-700" />
                )}
              </div>
              <span className="text-base font-black text-slate-900">
                Braille Táctil Inclusivo
              </span>
              <p className="text-xs text-slate-500 leading-snug">
                Puntos semiesféricos en sobre relieve (<strong>Ø 2 mm × 1 mm alt</strong>) para lectura táctil con los dedos.
              </p>
            </button>
          </div>

          {/* Banner Braille Educativo si está activo */}
          {config.mode === 'braille' && brailleCellsData && (
            <div className="bg-purple-950 text-white rounded-2xl p-4 flex flex-col gap-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-yellow-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Descifrador Braille: Fracción 1/{config.denominator}
                </span>
                <span className="text-[11px] text-purple-200 font-mono">
                  4 celdas táctiles
                </span>
              </div>

              {/* Visualizador de las 4 celdas Braille con puntos iluminados */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {brailleCellsData.cells.map((activeDots, cIdx) => {
                  const cellLabels = ['Signo #', 'Num 1', 'Barra /', `Denom ${config.denominator}`];
                  return (
                    <div
                      key={cIdx}
                      className="bg-purple-900/80 border border-purple-700 rounded-xl p-2 flex flex-col items-center gap-1.5"
                    >
                      {/* Cuadrícula 2 columnas x 3 filas */}
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-purple-950/60 rounded-lg">
                        {[1, 4, 2, 5, 3, 6].map((dotNum) => {
                          const isActive = activeDots.includes(dotNum);
                          return (
                            <div
                              key={dotNum}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                                isActive
                                  ? 'bg-yellow-300 text-purple-950 shadow-sm shadow-yellow-200 scale-110'
                                  : 'bg-purple-800/40 text-purple-500'
                              }`}
                              title={`Punto ${dotNum}`}
                            >
                              {dotNum}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-purple-200 text-center leading-tight">
                        {cellLabels[cIdx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 4: DIMENSIONES CALIBRADAS Y TOLERANCIA DE INGENIERÍA MECÁNICA        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              4
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Dimensiones de Fabricación y Tolerancia Mecánica (0,2 mm):
              </h2>
              <p className="text-xs text-slate-500">
                Garantiza que las partes encajen suavemente en el plato central sin trabarse
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tolerancia de {config.toleranceMm.toFixed(2)} mm activa</span>
          </div>
        </div>

        {/* Grid de cotas dimensionales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="flex flex-col p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">Plato Exterior:</span>
            <span className="text-lg font-black text-slate-900">
              Ø {config.trayOuterDiameterMm} mm
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Espesor total {config.trayTotalHeightMm} mm ({config.materialStyle === 'mdf' ? 'MDF' : 'PLA'})
            </span>
          </div>

          <div className="flex flex-col p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">Cavidad Interior:</span>
            <span className="text-lg font-black text-purple-700">
              Ø {config.trayInnerDiameterMm} mm
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Profundidad {config.trayPocketDepthMm} mm
            </span>
          </div>

          <div className="flex flex-col p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">Plato Base Fondo:</span>
            <span className="text-lg font-black text-slate-900">
              {config.trayFloorThicknessMm} mm espesor
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Pared sólida hermética
            </span>
          </div>

          <div className="flex flex-col p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500">Fichas Fracciones:</span>
            <span className="text-lg font-black text-amber-700">
              {config.pieceThicknessMm} mm espesor
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              A ras de la superficie
            </span>
          </div>
        </div>

        {/* Tarjeta interactiva sobre el por qué de la tolerancia 0.2 mm */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-blue-950">
                ¿Por qué necesitamos 0,2 mm de tolerancia mecánica?
              </h3>
              <p className="text-xs text-blue-900/80 mt-0.5 leading-relaxed max-w-2xl">
                Al cortar en láser o imprimir en 3D, el material presenta dilatación térmica y fricción en los cantos. Con <strong>0,2 mm de holgura</strong>, las {config.denominator} fichas tienen un radio efectivo de {(config.trayInnerDiameterMm / 2 - config.toleranceMm).toFixed(2)} mm y un recorte central de bisectriz que evita que choquen en el ápice, permitiendo retirarlas fácilmente con las manos en el taller.
              </p>
            </div>
          </div>

          {/* Selector rápido táctil de tolerancia para la pantalla táctil */}
          <div className="flex items-center gap-1.5 shrink-0 bg-white p-1.5 rounded-2xl border border-blue-200 shadow-xs">
            {[
              { val: 0.15, label: '0.15mm (Ajustada)' },
              { val: 0.20, label: '0.20mm (Óptima)' },
              { val: 0.30, label: '0.30mm (Holgada)' }
            ].map((t) => (
              <button
                key={t.val}
                type="button"
                onClick={() => updateConfig('toleranceMm', t.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                  config.toleranceMm === t.val
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 5: VISOR 3D INTERACTIVO THREE.JS CON TEXTURAS REALES                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
              5
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Visor 3D en Tiempo Real (Pizarra Interactiva):
              </h2>
              <p className="text-xs text-slate-500">
                Rota con un dedo o stylus. Cambia entre ensamble completo o despiece.
              </p>
            </div>
          </div>
        </div>

        <Fractions3DViewer
          modelResult={modelResult}
          config={config}
          onExplodeChange={(val) => updateConfig('explodeDistanceMm', val)}
          onMaterialChange={handleMaterialChange}
        />
      </div>

      {/* ========================================================================= */}
      {/* PASO 6: PANEL DE DESCARGAS Y FABRICACIÓN (CORTE LÁSER Y 3D)                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
            6
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Descargar Archivos de Fabricación Digital:
            </h2>
            <p className="text-xs text-slate-500">
              Archivos listos para enviar a la cortadora láser o impresora 3D del festival
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ======================================== */}
          {/* COLUMNA A: CORTE LÁSER (.SVG LIGHTBURN) */}
          {/* ======================================== */}
          <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border-2 border-amber-300 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  Corte Láser MDF 3 mm (.SVG)
                </h3>
                <p className="text-xs text-slate-500">
                  Listo para LightBurn, RDWorks o LaserCAD
                </p>
              </div>
            </div>

            {/* Botón táctil XL para descargar SVG */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="w-full min-h-[58px] py-4 px-5 rounded-2xl font-black text-base bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white shadow-lg shadow-orange-300/50 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Descargar Archivo Láser .SVG (MDF 3 mm)</span>
            </button>

            {/* Guía visual de capas láser */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-amber-200 text-xs text-slate-700 space-y-2">
              <span className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                <Flame className="w-4 h-4 text-orange-600" />
                Especificaciones Técnicas para LightBurn (MDF 3 mm):
              </span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-red-600">🔴 Línea Roja (#FF0000, 0.2mm):</strong> CORTE exterior (Plato base, anillo exterior y contorno de las {config.denominator} fichas).
                </li>
                <li>
                  <strong className="text-slate-950">⚫ Relleno Negro (#000000):</strong> GRABADO quemado oscuro (números o círculos Braille).
                </li>
                <li>
                  <strong>Ensamblado del Plato (6 mm total):</strong> Pega con cola fría el aro hueco sobre el plato base para crear la cavidad de 3 mm.
                </li>
              </ul>
            </div>
          </div>

          {/* ======================================== */}
          {/* COLUMNA B: IMPRESIÓN 3D (.STL)           */}
          {/* ======================================== */}
          <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 border-2 border-violet-300 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Modelos 3D (.STL) para Impresora
                </h3>
                <p className="text-xs text-slate-500">
                  Compatible con Bambu Studio, OrcaSlicer, PrusaSlicer, Cura
                </p>
              </div>
            </div>

            {/* Botón táctil XL para descargar Set STL */}
            <button
              type="button"
              onClick={handleDownloadFullSetStl}
              className="w-full min-h-[58px] py-4 px-5 rounded-2xl font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-300/50 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Descargar Set Completo en Bandeja (.STL)</span>
            </button>

            {/* Botones secundarios STL para repuestos */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownloadTrayStl}
                className="py-3 px-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer shadow-xs"
                title="Solo el plato base circular de 70 mm"
              >
                <Box className="w-4 h-4 text-violet-600" />
                <span>Solo Plato</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPiecesStl}
                className="py-3 px-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer shadow-xs"
                title={`Las ${config.denominator} piezas de la fracción juntas`}
              >
                <Layers className="w-4 h-4 text-violet-600" />
                <span>{config.denominator} Piezas</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSinglePieceStl}
                className="py-3 px-2 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer shadow-xs"
                title="1 sola pieza de repuesto"
              >
                <CircleDot className="w-4 h-4 text-violet-600" />
                <span>1 Pieza</span>
              </button>
            </div>

            {/* Botón Todo-en-uno ZIP */}
            <button
              type="button"
              onClick={handleDownloadZip}
              className="py-2.5 px-3 rounded-xl text-xs font-black text-violet-800 hover:text-violet-950 hover:bg-violet-100/70 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FolderArchive className="w-4 h-4 text-violet-600" />
              <span>Descargar Paquete ZIP con todos los STL y el archivo Láser SVG</span>
            </button>
          </div>
        </div>

        {/* Ficha técnica de fabricación */}
        {modelResult && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500">Tiempo de Impresión 3D:</span>
              <span className="text-sm font-black text-slate-800">
                ~{modelResult.estimatedPrintTimeMinutes} min (Bambu / Ender)
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500">Material Estimado PLA:</span>
              <span className="text-sm font-black text-violet-700">
                ~{modelResult.estimatedWeightGrams} gramos
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500">Malla 3D Watertight:</span>
              <span className="text-sm font-black text-slate-800">
                {modelResult.triangleCount.toLocaleString()} triángulos
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500">Corte Láser MDF 3 mm:</span>
              <span className="text-sm font-black text-emerald-700">
                Espesor Total: 6 mm (3+3)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* NOTIFICACIÓN TOAST FLOTANTE DE DESCARGA EXITOSA                           */}
      {/* ========================================================================= */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-black text-sm px-5 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-200 border-2 border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡Archivo descargado con éxito para fabricación en el festival!</span>
        </div>
      )}
    </div>
  );
};
