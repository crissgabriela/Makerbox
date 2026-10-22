'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  Download,
  Ruler,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RotateCcw,
  ArrowLeft,
  Scissors,
  FileCode2,
  Info,
} from 'lucide-react';
import { ZOO_PRESET_ANIMALS, type ZooMetrics, type ZooPresetAnimal } from '@/types/zoo';

interface ZooSectionProps {
  onBackToMenu?: () => void;
}

export function ZooSection({ onBackToMenu }: ZooSectionProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ZOO_PRESET_ANIMALS[0].id);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>(ZOO_PRESET_ANIMALS[0].svg);

  // Parámetros del usuario
  const [targetHeightMm, setTargetHeightMm] = useState<number>(ZOO_PRESET_ANIMALS[0].defaultHeightMm);
  const [materialThicknessMm, setMaterialThicknessMm] = useState<number>(3.0);
  const [slotDepthMm] = useState<number>(15);
  const [slot1Ratio, setSlot1Ratio] = useState<number>(ZOO_PRESET_ANIMALS[0].slot1Ratio);
  const [slot2Ratio, setSlot2Ratio] = useState<number>(ZOO_PRESET_ANIMALS[0].slot2Ratio);
  const [includeStandBases, setIncludeStandBases] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Estado de procesamiento y drag & drop
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewSvg, setPreviewSvg] = useState<string>('');
  const [metrics, setMetrics] = useState<ZooMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProcessedZooSvg = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/zoologico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svgContent,
          targetHeightMm,
          materialThicknessMm,
          slotDepthMm,
          slot1Ratio,
          slot2Ratio,
          includeStandBases,
          includeAnnotations: showAnnotations,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error procesando el archivo SVG.');
      }

      setPreviewSvg(data.svg);
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo procesar el SVG subido. Asegúrate de que sea un archivo vectorial válido.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    svgContent,
    targetHeightMm,
    materialThicknessMm,
    slotDepthMm,
    slot1Ratio,
    slot2Ratio,
    includeStandBases,
    showAnnotations,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProcessedZooSvg();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchProcessedZooSvg]);

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setErrorMsg('Por favor sube un archivo en formato vectorial .SVG');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string' && content.includes('<svg')) {
        setUploadedFileName(file.name);
        setSelectedPresetId('custom');
        setSvgContent(content);
        setErrorMsg(null);
      } else {
        setErrorMsg('El archivo seleccionado no contiene código SVG válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSelectPreset = (preset: ZooPresetAnimal) => {
    setSelectedPresetId(preset.id);
    setUploadedFileName(null);
    setSvgContent(preset.svg);
    setTargetHeightMm(preset.defaultHeightMm);
    setSlot1Ratio(preset.slot1Ratio);
    setSlot2Ratio(preset.slot2Ratio);
    setErrorMsg(null);
  };

  const handleDownloadLaserSvg = async () => {
    setDownloading(true);
    try {
      // Solicitamos el SVG limpio sin cotas ni bordes guía para importar directo a LightBurn
      const response = await fetch('/api/zoologico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          svgContent,
          targetHeightMm,
          materialThicknessMm,
          slotDepthMm,
          slot1Ratio,
          slot2Ratio,
          includeStandBases,
          includeAnnotations: false,
        }),
      });

      if (!response.ok) throw new Error('Error generando el SVG limpio para corte láser.');
      const data = await response.json();

      const blob = new Blob([data.svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = uploadedFileName
        ? uploadedFileName.replace(/\.svg$/i, '')
        : `animal-${selectedPresetId}`;
      a.href = url;
      a.download = `zoologico-lowpoly-${baseName}-${Math.round(targetHeightMm)}mm-balsa3mm.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorMsg('Hubo un problema al preparar el archivo SVG para descarga.');
    } finally {
      setDownloading(false);
    }
  };

  const clampNumber = (val: number, min: number, max: number) =>
    Math.min(max, Math.max(min, val));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra Superior de Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToMenu ? (
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold text-xs sm:text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Menú Principal
            </Link>
          )}
          <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            🦊 Taller 1 · Zoológico Low-Poly
          </span>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Material: <strong className="text-slate-700">Madera de Balsa 300 × 100 × 3 mm</strong>
        </div>
      </div>

      {/* Banner Hero del Taller 1 */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Taller 1 · Geometría Poligonal y Corte Láser
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Zoológico Low-Poly 🦊 · Escalador y Generador de Ranuras
            </h1>
            <p className="text-amber-50 text-sm sm:text-base leading-relaxed">
              Sube la silueta vectorial <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-xs">.SVG</code> de tu animal,
              define su <strong>altura final en milímetros</strong> y el sistema generará automáticamente las{' '}
              <strong>2 ranuras inferiores de {materialThicknessMm.toFixed(2)} × {slotDepthMm} mm</strong> listas para cortar en láser.
            </p>
          </div>

          {/* Resumen rápido de dimensiones */}
          {metrics && (
            <div className="grid grid-cols-2 gap-2.5 bg-slate-950/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shrink-0">
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Tamaño Final Escalado
                </div>
                <div className="text-lg font-black text-white">
                  {metrics.scaledWidthMm} × {metrics.scaledHeightMm}{' '}
                  <span className="text-xs font-normal">mm</span>
                </div>
                <div className="text-[10px] text-amber-100">
                  Escala aplicada: {metrics.scaleFactor}x
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/10">
                <div className="text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                  Ranuras en la Base (×2)
                </div>
                <div className="text-lg font-black text-white">
                  {metrics.materialThicknessMm.toFixed(2)} × {metrics.slotDepthMm}{' '}
                  <span className="text-xs font-normal">mm</span>
                </div>
                <div className="text-[10px] text-emerald-200 font-semibold">
                  ✓ Trazo cerrado para LightBurn
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grilla Principal: Controles a la izquierda (5 cols) + Visor en tiempo real a la derecha (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Entradas del Usuario */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          {/* 1. Zona de Carga (Dropzone) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                1. Sube la Silueta SVG de tu Animal
              </label>
              {uploadedFileName && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Archivo cargado
                </span>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                  : uploadedFileName
                  ? 'border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60'
                  : 'border-slate-300 bg-slate-50/70 hover:border-amber-400 hover:bg-amber-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                {uploadedFileName ? (
                  <FileCode2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              {uploadedFileName ? (
                <div>
                  <p className="text-sm font-extrabold text-emerald-900 truncate max-w-xs mx-auto">
                    {uploadedFileName}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Haz clic o arrastra otro archivo <code className="font-mono">.svg</code> para reemplazarlo
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Arrastra tu archivo <span className="text-amber-600 underline">.SVG</span> aquí o haz clic para buscar
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Acepta cualquier silueta vectorial cerrada o con facetas Low-Poly
                  </p>
                </div>
              )}
            </div>

            {/* Selector rápido de animales de ejemplo */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                O prueba con un animal Low-Poly de ejemplo:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ZOO_PRESET_ANIMALS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id && !uploadedFileName;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-2xs ring-2 ring-amber-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl shrink-0">{preset.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Altura sugerida: {preset.defaultHeightMm} mm
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* 2. Altura Deseada (mm) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="target-height-input"
                className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5"
              >
                <Ruler className="w-4 h-4 text-amber-600" />
                2. Altura Deseada del Animal (mm)
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="target-height-input"
                  type="number"
                  min={35}
                  max={180}
                  step={1}
                  value={targetHeightMm}
                  onChange={(e) =>
                    setTargetHeightMm(clampNumber(Number(e.target.value) || 35, 35, 180))
                  }
                  className="w-20 px-2.5 py-1 text-right font-extrabold text-sm text-amber-900 bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-500">mm</span>
              </div>
            </div>

            <input
              type="range"
              min={35}
              max={140}
              step={1}
              value={Math.min(140, targetHeightMm)}
              onChange={(e) => setTargetHeightMm(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Mín: 35 mm</span>
              <span className="text-emerald-700 font-semibold">
                Óptimo en plancha 300×100: 45–92 mm
              </span>
              <span>140+ mm</span>
            </div>
          </div>

          {/* 3. Espesor del Material (mm) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label
                htmlFor="material-thickness-input"
                className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                3. Espesor del Material (Ranuras)
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="material-thickness-input"
                  type="number"
                  min={2.5}
                  max={5.0}
                  step={0.05}
                  value={materialThicknessMm}
                  onChange={(e) =>
                    setMaterialThicknessMm(clampNumber(Number(e.target.value) || 3.0, 2.5, 5.0))
                  }
                  className="w-20 px-2.5 py-1 text-right font-extrabold text-sm text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-500">mm</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 2.95, label: '2.95 mm (Ajuste Firme)', desc: 'Compensa el kerf láser' },
                { val: 3.0, label: '3.00 mm (Nominal Balsa)', desc: 'Medida exacta 3 mm' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMaterialThicknessMm(opt.val)}
                  className={`py-2 px-3 rounded-xl text-left border transition-all cursor-pointer ${
                    Math.abs(materialThicknessMm - opt.val) < 0.01
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-600" />
                  Especificación de las 2 Ranuras Inferiores:
                </span>
                <span className="text-amber-700">Automáticas</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Se sustraen <strong>2 ranuras rectangulares verticales</strong> en el borde inferior de la silueta con{' '}
                <strong>ancho = {materialThicknessMm.toFixed(2)} mm</strong> y{' '}
                <strong>profundidad fija = {slotDepthMm} mm</strong>.
              </p>
            </div>
          </div>

          {/* 4. Ajuste opcional de separación de ranuras y patitas de soporte */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Posición en la Base y Patitas de Soporte
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Ranura Izquierda</span>
                  <span>{Math.round(slot1Ratio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.18}
                  max={0.45}
                  step={0.01}
                  value={slot1Ratio}
                  onChange={(e) => setSlot1Ratio(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Ranura Derecha</span>
                  <span>{Math.round(slot2Ratio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.55}
                  max={0.82}
                  step={0.01}
                  value={slot2Ratio}
                  onChange={(e) => setSlot2Ratio(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStandBases}
                onChange={(e) => setIncludeStandBases(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600"
              />
              <span className="text-xs font-bold text-amber-950">
                Incluir las 2 bases de soporte encastrables en la plancha
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={(e) => setShowAnnotations(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600"
              />
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Mostrar cotas y borde de plancha 300×100 mm en vista previa
              </span>
            </label>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadLaserSvg}
              disabled={downloading || loading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generando archivo láser...' : 'Descargar SVG para Láser (LightBurn)'}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset(ZOO_PRESET_ANIMALS[0])}
              className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer valores por defecto
            </button>
          </div>
        </div>

        {/* Panel Derecho: Previsualización en Tiempo Real */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  Previsualización en Tiempo Real · Plancha de Balsa 300 × 100 mm
                </h3>
                <p className="text-xs text-slate-500">
                  Las líneas <strong className="text-red-600">rojas (#FF0000)</strong> son trazos cerrados de corte exterior con las 2 ranuras integradas; las{' '}
                  <strong className="text-blue-600">azules (#0000FF)</strong> son grabado/marcado Low-Poly.
                </p>
              </div>

              {metrics && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    metrics.fitsInStandardBalsaSheet
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`}
                >
                  {metrics.fitsInStandardBalsaSheet ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Cabe en 1 plancha de 300 × 100 mm
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Supera los 100 mm de alto de la plancha
                    </>
                  )}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Lienzo SVG */}
            <div className="relative w-full min-h-[340px] sm:min-h-[400px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {loading && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-800/90 text-amber-300 text-[11px] font-bold animate-pulse z-10">
                  Calculando geometría y ranuras...
                </div>
              )}

              {previewSvg ? (
                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[420px] [&>svg]:bg-amber-50/95 [&>svg]:rounded-xl [&>svg]:p-3 [&>svg]:shadow-lg"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <div className="text-slate-400 text-sm">Cargando previsualización vectorial...</div>
              )}
            </div>

            {/* Tarjetas de Verificación Geométrica */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Caja Delimitadora (BBox)
                  </div>
                  <div className="text-sm font-extrabold text-slate-800 mt-1">
                    {metrics.scaledWidthMm} mm (ancho) × {metrics.scaledHeightMm} mm (alto)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Original: {metrics.originalWidth} × {metrics.originalHeight} u
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">
                    2 Ranuras Inferiores
                  </div>
                  <div className="text-sm font-extrabold text-amber-950 mt-1">
                    {metrics.materialThicknessMm.toFixed(2)} mm × {metrics.slotDepthMm} mm
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Centros a {metrics.slot1CenterXMm} mm y {metrics.slot2CenterXMm} mm
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">
                    Compatibilidad LightBurn
                  </div>
                  <div className="text-sm font-extrabold text-emerald-900 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Trazos Cerrados
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Unidades reales en milímetros (mm)
                  </div>
                </div>
              </div>
            )}

            {/* Nota pedagógica para estudiantes */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
                <div className="font-extrabold">
                  ¿Cómo funciona el algoritmo de ranuras automáticas?
                </div>
                <p className="text-amber-900">
                  El sistema calcula la caja delimitadora (<em>bounding box</em>) de tu dibujo SVG, escala todos los vértices proporcionalmente para alcanzar exactamente{' '}
                  <strong>{targetHeightMm} mm de altura</strong> e inyecta dos ranuras rectangulares de{' '}
                  <strong>{materialThicknessMm.toFixed(2)} mm de ancho por {slotDepthMm} mm de profundidad</strong> en el borde inferior para que tu animal Low-Poly se mantenga de pie sobre sus patitas de madera de balsa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
