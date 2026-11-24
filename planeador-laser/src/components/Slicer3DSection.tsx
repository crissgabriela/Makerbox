'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Flame,
  GraduationCap,
  Grid,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Sliders,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  Users,
} from 'lucide-react';
import {
  CadPrimitive,
  PrimitiveKind,
  SlicerConfig,
  SlicerLevelId,
  SlicerSourceMode,
  SlicerWorkMode,
  UploadedMeshModel,
} from '@/types/slicer3d';
import {
  CAD_COLORS,
  CAD_PRESET_TEMPLATES,
  DEFAULT_SLICER_CONFIG,
  GROUP_ROLES,
  PEDAGOGICAL_CHALLENGE_QUESTIONS,
  PRIMITIVE_CATALOG,
  SLICER_PEDAGOGICAL_LEVELS,
} from '@/lib/slicer3d-presets';
import { parseUploaded3DModel, runSlicer3D } from '@/lib/slicer3d-processor';
import {
  generateSlicerAssemblyKitStl,
  generateSlicerLaserSvg,
} from '@/lib/slicer3d-exporters';
import { Slicer3DViewport } from '@/components/Slicer3DViewport';

export function Slicer3DSection() {
  // 1. Estado de Actividad Pedagógica Previa
  const [levelId, setLevelId] = useState<SlicerLevelId>('intermedio');
  const [workMode, setWorkMode] = useState<SlicerWorkMode>('grupal');
  const [studentOrTeamName, setStudentOrTeamName] = useState<string>('Equipo Maker 3D');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [teacherUnlocked, setTeacherUnlocked] = useState<boolean>(false);
  const [showPedagogyPanel, setShowPedagogyPanel] = useState<boolean>(true);

  // 2. Estado del Estudio CAD / Carga de Archivo 3D
  const [sourceMode, setSourceMode] = useState<SlicerSourceMode>('cad');
  const [activePresetId, setActivePresetId] = useState<string>('gato');
  const [primitives, setPrimitives] = useState<CadPrimitive[]>(
    () => CAD_PRESET_TEMPLATES[0].primitives.map((p) => ({ ...p }))
  );
  const [selectedPrimId, setSelectedPrimId] = useState<string | null>(
    CAD_PRESET_TEMPLATES[0].primitives[0].id
  );
  const [uploadedModel, setUploadedModel] = useState<UploadedMeshModel | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 3. Configuración del Laminador MDF 3 mm + Kit PLA
  const [config, setConfig] = useState<SlicerConfig>({
    ...DEFAULT_SLICER_CONFIG,
    projectName: CAD_PRESET_TEMPLATES[0].name,
    cutMode: CAD_PRESET_TEMPLATES[0].recommendedCutMode,
    xSliceCount: CAD_PRESET_TEMPLATES[0].recommendedXCount,
    ySliceCount: CAD_PRESET_TEMPLATES[0].recommendedYCount,
  });

  // 4. Visor Interactivo
  const [previewTab, setPreviewTab] = useState<'solid' | 'sliced' | 'laser'>('sliced');
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [selectedSheetPreview, setSelectedSheetPreview] = useState<number>(0);

  // Evaluación del Reto Pedagógico Previo
  const correctAnswersCount = useMemo(() => {
    return PEDAGOGICAL_CHALLENGE_QUESTIONS.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
    }, 0);
  }, [answers]);

  const downloadsUnlocked = teacherUnlocked || correctAnswersCount >= 2;
  const currentLevel = SLICER_PEDAGOGICAL_LEVELS[levelId];

  // Ejecutar Motor de Laminado 3D -> 2D en tiempo real
  const slicerResult = useMemo(() => {
    if (sourceMode === 'upload' && !uploadedModel) return null;
    if (sourceMode === 'cad' && primitives.length === 0) return null;
    return runSlicer3D(sourceMode, primitives, uploadedModel, config);
  }, [sourceMode, primitives, uploadedModel, config]);

  // SVG de vista previa de la lámina seleccionada
  const laserPreviewSvg = useMemo(() => {
    if (!slicerResult || slicerResult.sheets.length === 0) return '';
    const safeIdx = Math.min(selectedSheetPreview, slicerResult.sheets.length - 1);
    return generateSlicerLaserSvg(slicerResult, config, {
      targetSheetIndex: safeIdx,
      includeSheetGuides: true,
    });
  }, [slicerResult, config, selectedSheetPreview]);

  const selectedPrim = useMemo(
    () => primitives.find((p) => p.id === selectedPrimId) ?? null,
    [primitives, selectedPrimId]
  );

  // Manejadores de Plantillas CAD
  const handleLoadPreset = (presetId: string) => {
    const preset = CAD_PRESET_TEMPLATES.find((t) => t.id === presetId);
    if (!preset) return;
    setSourceMode('cad');
    setActivePresetId(preset.id);
    const cloned = preset.primitives.map((p) => ({
      ...p,
      position: [...p.position] as [number, number, number],
      size: [...p.size] as [number, number, number],
      rotation: [...p.rotation] as [number, number, number],
    }));
    setPrimitives(cloned);
    setSelectedPrimId(cloned[0]?.id ?? null);
    setConfig((prev) => ({
      ...prev,
      projectName: preset.name,
      cutMode: preset.recommendedCutMode,
      xSliceCount: preset.recommendedXCount,
      ySliceCount: preset.recommendedYCount,
    }));
    setSelectedSheetPreview(0);
  };

  const handleAddPrimitive = (kind: PrimitiveKind) => {
    const cat = PRIMITIVE_CATALOG.find((c) => c.kind === kind)!;
    const newId = `prim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const offset = ((primitives.length % 4) - 1.5) * 14;
    const newPrim: CadPrimitive = {
      id: newId,
      name: `${cat.label.split(' ')[0]} #${primitives.length + 1}`,
      kind,
      operation: 'add',
      position: [offset, 0, Math.round(cat.defaultSize[2] / 2) + 10],
      size: [...cat.defaultSize] as [number, number, number],
      rotation: [0, 0, 0],
      color: CAD_COLORS[primitives.length % CAD_COLORS.length],
    };
    setPrimitives((prev) => [...prev, newPrim]);
    setSelectedPrimId(newId);
    setPreviewTab('solid');
  };

  const handleUpdatePrimitive = (id: string, patch: Partial<CadPrimitive>) => {
    setPrimitives((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleDuplicatePrimitive = (prim: CadPrimitive) => {
    const newId = `prim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const copy: CadPrimitive = {
      ...prim,
      id: newId,
      name: `${prim.name} (Copia)`,
      position: [prim.position[0] + 12, prim.position[1], prim.position[2]],
      size: [...prim.size] as [number, number, number],
      rotation: [...prim.rotation] as [number, number, number],
    };
    setPrimitives((prev) => [...prev, copy]);
    setSelectedPrimId(newId);
  };

  const handleDeletePrimitive = (id: string) => {
    setPrimitives((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedPrimId === id) {
        setSelectedPrimId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  // Manejador de Carga de Archivo 3D (.STL / .OBJ)
  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.stl') && !lower.endsWith('.obj')) {
      setUploadError('Formato no compatible. Sube un archivo 3D en formato .STL o .OBJ.');
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseUploaded3DModel(buf, file.name);
      setUploadedModel(parsed);
      setSourceMode('upload');
      setConfig((prev) => ({
        ...prev,
        projectName: file.name.replace(/\.(stl|obj)$/i, '').slice(0, 28),
      }));
      setSelectedSheetPreview(0);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'No se pudo leer el modelo 3D cargado.'
      );
    }
  };

  // Descargas de Fabricación
  const triggerDownload = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const safeSlug = (config.projectName || 'puzzle-3d')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const handleDownloadLaserSvg = (sheetIdx?: number) => {
    if (!slicerResult) return;
    const svg = generateSlicerLaserSvg(slicerResult, config, {
      targetSheetIndex: sheetIdx,
      includeSheetGuides: false,
    });
    const sheetSuffix = typeof sheetIdx === 'number' ? `-lamina${sheetIdx + 1}` : '-completo';
    triggerDownload(
      svg,
      'image/svg+xml;charset=utf-8',
      `puzzle3d-${safeSlug}-${config.cutMode}-mdf3mm${sheetSuffix}.svg`
    );
  };

  const handleDownloadPlaKitStl = () => {
    if (!slicerResult) return;
    const stl = generateSlicerAssemblyKitStl(slicerResult, config);
    triggerDownload(
      stl,
      'model/stl;charset=utf-8',
      `kit-ensamble-pla-${safeSlug}-${config.cutMode}.stl`
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal Taller 5 */}
      <div className="bg-gradient-to-r from-orange-950 via-amber-900 to-rose-950 rounded-2xl p-6 text-white shadow-xl border border-amber-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold tracking-wide uppercase">
              <Layers className="w-3.5 h-3.5" />
              Taller 5 · Laminador 3D a Puzzles MDF 3 mm (.SVG) + Kit Ensamble PLA (.STL)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Estudio CAD 3D & Laminador de Planos Seriados y Costillas
            </h2>
            <p className="text-amber-100/90 text-sm max-w-3xl leading-relaxed">
              Modela animales, planetas o vehículos combinando figuras 3D (estilo Tinkercad) o
              importa tu propio archivo <strong>.STL / .OBJ</strong>. La herramienta lamina tu
              escultura en <strong>piezas planas de MDF de 3 mm</strong> con ranuras encajables o
              planos seriados listos para cortar en <strong>Falcon Design Space (.SVG)</strong>, más
              un <strong>kit liviano de ensamble en 3D (PLA)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={!downloadsUnlocked || !slicerResult}
              onClick={() => handleDownloadLaserSvg()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 disabled:text-slate-300 text-slate-950 shadow-lg transition cursor-pointer disabled:cursor-not-allowed"
            >
              {downloadsUnlocked ? (
                <Scissors className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Patrón Láser MDF (.SVG)</span>
            </button>

            <button
              type="button"
              disabled={!downloadsUnlocked || !slicerResult}
              onClick={handleDownloadPlaKitStl}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 disabled:bg-slate-600 disabled:text-slate-300 text-slate-950 shadow-lg transition cursor-pointer disabled:cursor-not-allowed"
            >
              {downloadsUnlocked ? <Box className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>Kit Ensamble 3D (.STL)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ETAPA 1: ACTIVIDAD PEDAGÓGICA PREVIA (INDIVIDUAL O GRUPAL) */}
      <div className="bg-white rounded-2xl border-2 border-amber-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base">
                  Paso 1 · Actividad Pedagógica Previa (Planificación y Reto Espacial)
                </h3>
                {downloadsUnlocked ? (
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Descargas Desbloqueadas
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                    Reto: {correctAnswersCount}/3 (mín. 2 para descargar)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Antes de cortar en MDF, definan sus roles y resuelvan el mini-desafío sobre cómo un
                cuerpo 3D se transforma en planos 2D encajables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!downloadsUnlocked && (
              <button
                type="button"
                onClick={() => setTeacherUnlocked(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer inline-flex items-center gap-1.5"
                title="Permite al docente descargar archivos inmediatamente en modo demostración"
              >
                <Unlock className="w-3.5 h-3.5" />
                Modo Docente
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPedagogyPanel((v) => !v)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
            >
              {showPedagogyPanel ? 'Ocultar Paso 1' : 'Mostrar Paso 1'}
            </button>
          </div>
        </div>

        {showPedagogyPanel && (
          <div className="space-y-4">
            {/* Selector de Nivel y Modalidad (Individual vs Grupal) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['basico', 'intermedio', 'avanzado'] as SlicerLevelId[]).map((id) => {
                    const lv = SLICER_PEDAGOGICAL_LEVELS[id];
                    const active = levelId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setLevelId(id);
                          setConfig((prev) => ({ ...prev, cutMode: lv.recommendedMode }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          active
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        {lv.grades}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-1.5">
                  <div className="text-xs font-black text-amber-950">
                    {currentLevel.grades} · {currentLevel.title}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{currentLevel.summary}</p>
                  <p className="text-[11px] font-bold text-amber-900 pt-0.5">
                    🎯 Meta de Aprendizaje: {currentLevel.learningGoal}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    Modalidad de Taller:
                  </span>
                  <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setWorkMode('individual')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        workMode === 'individual'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkMode('grupal')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        workMode === 'grupal'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Grupal (2–4)
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={studentOrTeamName}
                  onChange={(e) => setStudentOrTeamName(e.target.value)}
                  placeholder={
                    workMode === 'grupal' ? 'Nombre del equipo...' : 'Nombre del estudiante...'
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />

                {workMode === 'grupal' && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {GROUP_ROLES.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-lg p-2 border border-slate-200/80 text-[10px]"
                      >
                        <div className="font-extrabold text-slate-900">
                          {r.emoji} {r.name}
                        </div>
                        <p className="text-slate-500 leading-tight mt-0.5">{r.task}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mini-Desafío Interactivo de Pensamiento Espacial */}
            <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Desafío Previo al Corte (Responde al menos 2 de 3 para habilitar la fabricación)
                </div>
                <span className="text-[11px] font-extrabold text-indigo-800">
                  Puntaje: {correctAnswersCount} / {PEDAGOGICAL_CHALLENGE_QUESTIONS.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PEDAGOGICAL_CHALLENGE_QUESTIONS.map((q, qIdx) => {
                  const chosen = answers[q.id];
                  const isCorrect = chosen === q.correctIndex;
                  const answered = typeof chosen === 'number';
                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-xl p-3 border space-y-2 ${
                        answered
                          ? isCorrect
                            ? 'border-emerald-400 bg-emerald-50/30'
                            : 'border-rose-300 bg-rose-50/30'
                          : 'border-indigo-200/80'
                      }`}
                    >
                      <p className="text-[11px] font-extrabold text-slate-900 leading-snug">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-1">
                        {q.options.map((opt, optIdx) => {
                          const selected = chosen === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
                                selected
                                  ? optIdx === q.correctIndex
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <p
                          className={`text-[10px] leading-snug font-semibold ${
                            isCorrect ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {isCorrect ? '✓ ¡Correcto! ' : '✗ Intenta otra opción: '}
                          {isCorrect && q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ÁREA PRINCIPAL DE TRABAJO: ESTUDIO CAD / LAMINADOR (IZQUIERDA) + VISOR 3D Y SVG (DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (5 cols): Paso 2 (Estudio CAD o Carga 3D) + Paso 3 (Parámetros de Laminado) */}
        <div className="lg:col-span-5 space-y-5">
          {/* PASO 2: FUENTE DEL MODELO 3D */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Paso 2 · Objeto 3D (Estudio CAD o .STL/.OBJ)
                </h3>
              </div>
            </div>

            {/* Selector CAD Básico vs Subir 3D */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceMode('cad')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  sourceMode === 'cad'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Estudio CAD (Tinkercad)
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  sourceMode === 'upload'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-sky-300'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Cargar 3D (.STL / .OBJ)
              </button>
            </div>

            {sourceMode === 'cad' ? (
              <div className="space-y-4">
                {/* Galería de Plantillas Base Editables */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Plantillas Base Editables (Animales, Espacio, Vehículos):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {CAD_PRESET_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleLoadPreset(t.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          activePresetId === t.id
                            ? 'bg-amber-50 border-amber-500 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {t.emoji} {t.name.split(' ')[0]}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {t.primitives.length} figuras
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barra de Primitivas (Agregar Figuras 3D) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    Agregar Figura Geométrica 3D:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PRIMITIVE_CATALOG.map((cat) => (
                      <button
                        key={cat.kind}
                        type="button"
                        onClick={() => handleAddPrimitive(cat.kind)}
                        className="px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 text-[11px] font-bold text-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-amber-600" />
                        <span>
                          {cat.emoji} {cat.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Primitivas del Modelo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      Piezas en el Escenario ({primitives.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(activePresetId)}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reiniciar Plantilla
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {primitives.map((p) => {
                      const active = p.id === selectedPrimId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPrimId(p.id)}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                            active
                              ? 'bg-amber-50 border-amber-500 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-slate-900/20"
                              style={{
                                backgroundColor:
                                  p.operation === 'subtract' ? '#94a3b8' : p.color,
                              }}
                            />
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {p.name}
                            </span>
                            {p.operation === 'subtract' && (
                              <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                Hueco
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Duplicar figura"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicatePrimitive(p);
                              }}
                              className="p-1 rounded-lg hover:bg-amber-200/60 text-slate-600 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {primitives.length > 1 && (
                              <button
                                type="button"
                                title="Eliminar figura"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePrimitive(p.id);
                                }}
                                className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector de la Figura Seleccionada */}
                {selectedPrim && (
                  <div className="rounded-xl bg-slate-50 border-2 border-amber-200 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={selectedPrim.name}
                        onChange={(e) =>
                          handleUpdatePrimitive(selectedPrim.id, { name: e.target.value })
                        }
                        className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 w-40 focus:outline-none focus:border-amber-500"
                      />
                      {/* Sólido vs Hueco (estilo Tinkercad) */}
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePrimitive(selectedPrim.id, { operation: 'add' })
                          }
                          className={`px-2 py-1 rounded-md text-[10px] font-extrabold cursor-pointer ${
                            selectedPrim.operation === 'add'
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-600'
                          }`}
                        >
                          Sólido
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePrimitive(selectedPrim.id, { operation: 'subtract' })
                          }
                          className={`px-2 py-1 rounded-md text-[10px] font-extrabold cursor-pointer ${
                            selectedPrim.operation === 'subtract'
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-600'
                          }`}
                        >
                          Hueco
                        </button>
                      </div>
                    </div>

                    {/* Posición X, Y, Z */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                        Posición (mm) — X (Ancho) · Y (Largo) · Z (Altura)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['X', 'Y', 'Z'] as const).map((axisLabel, idx) => (
                          <div key={axisLabel} className="bg-white p-1.5 rounded-lg border border-slate-200">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>{axisLabel}</span>
                              <span>{selectedPrim.position[idx]}</span>
                            </div>
                            <input
                              type="range"
                              min={idx === 2 ? 4 : -90}
                              max={idx === 2 ? 140 : 90}
                              step={2}
                              value={selectedPrim.position[idx]}
                              onChange={(e) => {
                                const nextPos = [...selectedPrim.position] as [
                                  number,
                                  number,
                                  number,
                                ];
                                nextPos[idx] = Number(e.target.value);
                                handleUpdatePrimitive(selectedPrim.id, { position: nextPos });
                              }}
                              className="w-full accent-amber-600 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tamaño SX, SY, SZ */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                        Tamaño (mm) — Ancho · Profundidad · Alto
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Ancho', 'Largo', 'Alto'] as const).map((lbl, idx) => (
                          <div key={lbl} className="bg-white p-1.5 rounded-lg border border-slate-200">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>{lbl}</span>
                              <span>{selectedPrim.size[idx]}</span>
                            </div>
                            <input
                              type="range"
                              min={8}
                              max={140}
                              step={2}
                              value={selectedPrim.size[idx]}
                              onChange={(e) => {
                                const nextSize = [...selectedPrim.size] as [
                                  number,
                                  number,
                                  number,
                                ];
                                nextSize[idx] = Number(e.target.value);
                                handleUpdatePrimitive(selectedPrim.id, { size: nextSize });
                              }}
                              className="w-full accent-sky-600 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rotación y Color */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase">
                        Inclinación / Rotación (Grados °)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Rx', 'Ry', 'Rz'] as const).map((lbl, idx) => (
                          <div key={lbl} className="bg-white p-1.5 rounded-lg border border-slate-200">
                            <div className="flex justify-between text-[10px] font-bold text-slate-600">
                              <span>{lbl}</span>
                              <span>{selectedPrim.rotation[idx]}°</span>
                            </div>
                            <input
                              type="range"
                              min={-90}
                              max={90}
                              step={5}
                              value={selectedPrim.rotation[idx]}
                              onChange={(e) => {
                                const nextRot = [...selectedPrim.rotation] as [
                                  number,
                                  number,
                                  number,
                                ];
                                nextRot[idx] = Number(e.target.value);
                                handleUpdatePrimitive(selectedPrim.id, { rotation: nextRot });
                              }}
                              className="w-full accent-purple-600 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[10px] font-bold text-slate-500">Color visual CAD:</span>
                      <div className="flex items-center gap-1.5">
                        {CAD_COLORS.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => handleUpdatePrimitive(selectedPrim.id, { color: hex })}
                            className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                              selectedPrim.color === hex
                                ? 'scale-125 ring-2 ring-slate-900'
                                : 'opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MODO CARGAR MODELO CAD 3D (.STL / .OBJ) */
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl,.obj"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
                >
                  <Upload className="w-8 h-8 text-sky-600 mx-auto" />
                  <div className="text-xs font-extrabold text-slate-900">
                    Haz clic o arrastra tu archivo CAD 3D aquí (.STL o .OBJ)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Compatible con modelos exportados desde Tinkercad, Fusion 360, Blender,
                    Printables o Thingiverse.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                    {uploadError}
                  </div>
                )}

                {uploadedModel && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate max-w-[210px]">
                          📦 {uploadedModel.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {uploadedModel.triangleCount.toLocaleString()} triángulos · Formato{' '}
                          {uploadedModel.format.toUpperCase()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Escala máxima en mm */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Tamaño Final del Puzzle (Lado mayor)</span>
                        <span className="text-sky-700">{uploadedModel.targetMaxDimMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min={70}
                        max={200}
                        step={5}
                        value={uploadedModel.targetMaxDimMm}
                        onChange={(e) =>
                          setUploadedModel((prev) =>
                            prev ? { ...prev, targetMaxDimMm: Number(e.target.value) } : null
                          )
                        }
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                    </div>

                    {/* Rotación rápida 90° para enderezar modelos importados */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Orientar Modelo (Rotar 90°):
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['X', 'Y', 'Z'] as const).map((ax, idx) => (
                          <button
                            key={ax}
                            type="button"
                            onClick={() =>
                              setUploadedModel((prev) => {
                                if (!prev) return null;
                                const nextRot = [...prev.rotationDeg] as [number, number, number];
                                nextRot[idx] = (nextRot[idx] + 90) % 360;
                                return { ...prev, rotationDeg: nextRot };
                              })
                            }
                            className="py-1.5 px-2 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              {ax} ({uploadedModel.rotationDeg[idx]}°)
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PASO 3: PARÁMETROS DEL LAMINADOR MDF 3 MM */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">
                  Paso 3 · Laminador a MDF 3 mm + Ensamble PLA
                </h3>
              </div>
            </div>

            {/* Selector de Técnica de Laminado */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfig((prev) => ({ ...prev, cutMode: 'waffle' }));
                  setSelectedSheetPreview(0);
                }}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  config.cutMode === 'waffle'
                    ? 'bg-emerald-50 border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="text-xs font-black text-slate-900">🧩 Costillas Encajables</div>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                  Retícula ortogonal X + Y con ranuras a media madera (como tus referencias de gato
                  y caballo).
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfig((prev) => ({ ...prev, cutMode: 'stacked' }));
                  setSelectedSheetPreview(0);
                }}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  config.cutMode === 'stacked'
                    ? 'bg-sky-50 border-sky-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="text-xs font-black text-slate-900">📚 Planos Seriados</div>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                  Capas paralelas de 3 mm apiladas y alineadas con ejes pasantes impresos en 3D
                  (PLA).
                </p>
              </button>
            </div>

            {/* Controles específicos según método */}
            {config.cutMode === 'waffle' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Planos X (Columna)</span>
                      <span className="text-emerald-700">{config.xSliceCount}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={7}
                      step={1}
                      value={config.xSliceCount}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, xSliceCount: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Planos Y (Costillas)</span>
                      <span className="text-emerald-700">{config.ySliceCount}</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      step={1}
                      value={config.ySliceCount}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, ySliceCount: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calibración de Ranura Kerf para MDF 3 mm */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950">
                      Ancho de Ranura (Ajuste Kerf MDF 3.0 mm)
                    </span>
                    <span className="text-xs font-black text-amber-900 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                      {config.slotWidthMm.toFixed(2)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.75}
                    max={3.15}
                    step={0.05}
                    value={config.slotWidthMm}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        slotWidthMm: Number(Number(e.target.value).toFixed(2)),
                      }))
                    }
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Firme (2.90)', val: 2.9 },
                      { label: 'Ideal MDF (2.95)', val: 2.95 },
                      { label: 'Suave (3.00)', val: 3.0 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, slotWidthMm: opt.val }))}
                        className={`py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                          Math.abs(config.slotWidthMm - opt.val) < 0.01
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-amber-900 border-amber-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-xs font-bold text-slate-800 block">Eje de Rebanado</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['x', 'y', 'z'] as const).map((ax) => (
                        <button
                          key={ax}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, stackedAxis: ax }))}
                          className={`py-1 rounded-lg text-xs font-black uppercase border cursor-pointer ${
                            config.stackedAxis === ax
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {ax}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Paso entre Capas</span>
                      <span className="text-sky-700">{config.stackedStepMm.toFixed(1)} mm</span>
                    </div>
                    <input
                      type="range"
                      min={3.0}
                      max={8.0}
                      step={0.5}
                      value={config.stackedStepMm}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stackedStepMm: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-2 bg-sky-50 border border-sky-200 rounded-xl p-3 cursor-pointer">
                  <div className="text-xs text-sky-950">
                    <span className="font-extrabold block">
                      Perforar Orificios Guía (Ø {config.alignmentHoleDiameterMm} mm) para Ejes PLA
                    </span>
                    <span className="text-[10px] text-sky-800">
                      Permite ensartar y alinear todas las láminas con el kit 3D en PLA sin error.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeAlignmentHoles}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        includeAlignmentHoles: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-sky-600"
                  />
                </label>
              </div>
            )}

            {/* Plancha MDF y Grabado de Numeración */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">
                  Plancha MDF (Falcon)
                </span>
                <select
                  value={`${config.sheetWidthMm}x${config.sheetHeightMm}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split('x').map(Number);
                    setConfig((prev) => ({ ...prev, sheetWidthMm: w, sheetHeightMm: h }));
                    setSelectedSheetPreview(0);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
                >
                  <option value="300x200">300 × 200 mm (Estándar)</option>
                  <option value="400x300">400 × 300 mm (Grande)</option>
                  <option value="300x100">300 × 100 mm (Compacta)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.engraveLabels}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, engraveLabels: e.target.checked }))
                  }
                  className="accent-blue-600"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  Grabar IDs (#0000FF)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): VISOR 3D / PUZZLE MDF / PLANO LÁSER + TELEMETRÍA + DESCARGAS */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Pestañas del Visor */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('solid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'solid'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  1. Sólido 3D (CAD)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('sliced')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'sliced'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  2. Puzzle 3D MDF (3 mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('laser')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'laser'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  3. Plano Láser (.SVG)
                </button>
              </div>

              {previewTab === 'sliced' && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-amber-300">Explosión 3D:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(Number(e.target.value))}
                    className="w-24 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-8">
                    {Math.round(explodeFactor * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Lienzo Activo */}
            <div className="p-4 space-y-3">
              {previewTab !== 'laser' ? (
                <Slicer3DViewport
                  sourceMode={sourceMode}
                  primitives={primitives}
                  selectedPrimId={selectedPrimId}
                  uploadedModel={uploadedModel}
                  slicerResult={slicerResult}
                  config={config}
                  viewType={previewTab}
                  explodeFactor={explodeFactor}
                />
              ) : (
                <div className="bg-white rounded-xl p-4 space-y-3 min-h-[380px] flex flex-col justify-between">
                  {slicerResult && slicerResult.sheets.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {slicerResult.sheets.map((sh, idx) => (
                        <button
                          key={sh.sheetIndex}
                          type="button"
                          onClick={() => setSelectedSheetPreview(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                            selectedSheetPreview === idx
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Lámina {sh.sheetIndex} ({sh.placements.length} piezas)
                        </button>
                      ))}
                    </div>
                  )}

                  {laserPreviewSvg ? (
                    <div
                      className="w-full rounded-xl bg-amber-50/80 border border-amber-200 p-3 overflow-auto [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[350px]"
                      dangerouslySetInnerHTML={{
                        __html: laserPreviewSvg.replace(
                          /stroke-width="0\.1"/g,
                          'stroke-width="0.65"'
                        ),
                      }}
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-bold">
                      Sube un modelo 3D o elige una plantilla CAD para generar el plano de corte.
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 text-center font-medium">
                    Plano listo para <strong>Falcon Design Space</strong>: Corte MDF 3 mm en{' '}
                    <strong className="text-red-600">#FF0000 (0.1 mm)</strong> · Numeración de
                    ensamble y logo MakerBox en <strong className="text-blue-600">#0000FF</strong>.
                  </div>
                </div>
              )}

              {/* Advertencias del Slicer si existen */}
              {slicerResult && slicerResult.warnings.length > 0 && (
                <div className="rounded-xl bg-amber-950/60 border border-amber-500/40 px-3.5 py-2.5 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>{slicerResult.warnings.join(' ')}</div>
                </div>
              )}

              {/* Telemetría de Fabricación Híbrida */}
              {slicerResult && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="rounded-xl bg-amber-950/50 border border-amber-500/30 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-300 block">
                          Piezas MDF 3 mm
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          {slicerResult.telemetry.totalPieces} piezas ·{' '}
                          {slicerResult.telemetry.sheetsRequired}{' '}
                          {slicerResult.telemetry.sheetsRequired === 1 ? 'plancha' : 'planchas'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-amber-200">
                      {config.cutMode === 'waffle'
                        ? `${slicerResult.telemetry.totalInterlockingSlots / 2} encajes`
                        : `${config.stackedStepMm} mm paso`}
                    </div>
                  </div>

                  <div className="rounded-xl bg-rose-950/50 border border-rose-500/30 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-300 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-rose-300 block">
                          Corte Láser (.SVG)
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          ~{slicerResult.telemetry.estimatedLaserTimeFormatted}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-rose-200">
                      {slicerResult.telemetry.estimatedMdfAreaCm2} cm²
                    </div>
                  </div>

                  <div className="rounded-xl bg-indigo-950/60 border border-indigo-400/30 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-300 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-indigo-300 block">
                          Kit Ensamble PLA
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          ~{slicerResult.telemetry.estimatedPlaPrintMin} min ·{' '}
                          {slicerResult.telemetry.estimatedPlaGrams} g
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-sky-200">
                      .STL 2-Manifold
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PANEL DE DESCARGAS DE FABRICACIÓN HÍBRIDA (LÁSER MDF + CONECTORES 3D PLA) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  Paso 4 · Descarga de Archivos (Láser MDF 3 mm + Ensamble 3D PLA)
                </h3>
                <p className="text-xs text-slate-600">
                  {slicerResult
                    ? `Incluye ${slicerResult.telemetry.totalPieces} piezas MDF (${slicerResult.telemetry.boundingBoxMm.x} × ${slicerResult.telemetry.boundingBoxMm.y} × ${slicerResult.telemetry.boundingBoxMm.z} mm) + Kit PLA: ${slicerResult.telemetry.plaKitSummary}.`
                    : 'Configura tu objeto 3D para habilitar los archivos de fabricación.'}
                </p>
              </div>
            </div>

            {!downloadsUnlocked && (
              <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 text-xs text-amber-950">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Actividad previa pendiente:</strong> Responde correctamente al menos{' '}
                    <strong>2 de las 3 preguntas</strong> del Paso 1 para desbloquear tus archivos
                    de corte láser e impresión 3D.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTeacherUnlocked(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shrink-0 cursor-pointer"
                >
                  Desbloquear (Docente)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!downloadsUnlocked || !slicerResult}
                onClick={() => handleDownloadLaserSvg()}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <Scissors className="w-4 h-4" />
                <span>
                  1. Descargar Patrón Láser MDF (.SVG ·{' '}
                  {slicerResult?.telemetry.sheetsRequired ?? 1}{' '}
                  {slicerResult?.telemetry.sheetsRequired === 1 ? 'lámina' : 'láminas'})
                </span>
              </button>

              <button
                type="button"
                disabled={!downloadsUnlocked || !slicerResult}
                onClick={handleDownloadPlaKitStl}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <Box className="w-4 h-4" />
                <span>2. Descargar Kit Ensamble 3D PLA (.STL)</span>
              </button>
            </div>

            {slicerResult && slicerResult.sheets.length > 1 && downloadsUnlocked && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Descargar láminas por separado:
                </span>
                {slicerResult.sheets.map((sh, idx) => (
                  <button
                    key={sh.sheetIndex}
                    type="button"
                    onClick={() => handleDownloadLaserSvg(idx)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Lámina {sh.sheetIndex} (.SVG)
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                <strong>Guía de Ensamble:</strong> En modo <em>Costillas Encajables</em>, une las
                piezas <strong>X</strong> (ranuras superiores) bajando sobre ellas las costillas{' '}
                <strong>Y</strong> (ranuras inferiores) en orden numérico y usa las trabas PLA en U
                para asegurar cualquier unión floja. En modo <em>Planos Seriados</em>, ordena las
                láminas <strong>C01 → C{String(slicerResult?.telemetry.totalPieces ?? 1).padStart(2, '0')}</strong>{' '}
                sobre los ejes guía PLA y fíjalas con las tapas de bloqueo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Slicer3DSection;
