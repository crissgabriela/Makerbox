'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  CheckCircle2,
  Compass,
  Cpu,
  Download,
  Eye,
  Gauge,
  Info,
  Layers,
  Maximize2,
  Plane,
  Printer,
  RotateCcw,
  Scale,
  Sliders,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import {
  computePlaGliderTelemetry,
  deformPlaGliderMesh,
  generatePlaGlider3mfBlob,
  generatePlaGliderStlString,
  Vec3,
} from '@/lib/glider-3d-processor';
import {
  PLA_GLIDER_MODELS,
  PlaGliderModelId,
  PlaGliderParams,
} from '@/types/glider';

type ViewMode = '3d' | 'top' | 'side';

export function GliderSection() {
  const [modelId, setModelId] = useState<PlaGliderModelId>('x1c');
  const [wingspanMm, setWingspanMm] = useState<number>(PLA_GLIDER_MODELS.x1c.wingspan.default);
  const [fuselageLengthMm, setFuselageLengthMm] = useState<number>(
    PLA_GLIDER_MODELS.x1c.fuselageLength.default
  );
  const [wingChordMm, setWingChordMm] = useState<number>(
    PLA_GLIDER_MODELS.x1c.wingChord.default
  );
  const [fuselageWidthMm, setFuselageWidthMm] = useState<number>(
    PLA_GLIDER_MODELS.x1c.fuselageWidth.default
  );

  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showBedGrid, setShowBedGrid] = useState<boolean>(true);
  const [downloading3mf, setDownloading3mf] = useState<boolean>(false);

  // Interactive 3D camera angles (degrees)
  const [yawDeg, setYawDeg] = useState<number>(-38);
  const [pitchDeg, setPitchDeg] = useState<number>(52);
  const [zoom, setZoom] = useState<number>(1.05);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  const modelLimits = PLA_GLIDER_MODELS[modelId];

  const handleSelectModel = (newId: PlaGliderModelId) => {
    const lim = PLA_GLIDER_MODELS[newId];
    setModelId(newId);
    setWingspanMm(lim.wingspan.default);
    setFuselageLengthMm(lim.fuselageLength.default);
    setWingChordMm(lim.wingChord.default);
    setFuselageWidthMm(lim.fuselageWidth.default);
  };

  const handleResetDefaults = () => {
    handleSelectModel(modelId);
    setYawDeg(-38);
    setPitchDeg(52);
    setZoom(1.05);
  };

  const handleApplyPreset = (preset: 'velero' | 'original' | 'rapido') => {
    const lim = PLA_GLIDER_MODELS[modelId];
    if (preset === 'original') {
      handleSelectModel(modelId);
      return;
    }
    if (preset === 'velero') {
      setWingspanMm(Math.min(lim.wingspan.max, Math.round(lim.wingspan.default * 1.14)));
      setFuselageLengthMm(
        Math.min(lim.fuselageLength.max, Math.round(lim.fuselageLength.default * 1.06))
      );
      setWingChordMm(lim.wingChord.default);
      setFuselageWidthMm(lim.fuselageWidth.default);
    } else {
      setWingspanMm(Math.max(lim.wingspan.min, Math.round(lim.wingspan.default * 0.86)));
      setFuselageLengthMm(
        Math.max(lim.fuselageLength.min, Math.round(lim.fuselageLength.default * 0.92))
      );
      setWingChordMm(Math.min(lim.wingChord.max, Math.round(lim.wingChord.default * 1.12)));
      setFuselageWidthMm(
        Number(Math.min(lim.fuselageWidth.max, lim.fuselageWidth.default * 1.1).toFixed(1))
      );
    }
  };

  const currentParams: PlaGliderParams = useMemo(
    () => ({
      modelId,
      wingspanMm,
      fuselageLengthMm,
      wingChordMm,
      fuselageWidthMm,
    }),
    [modelId, wingspanMm, fuselageLengthMm, wingChordMm, fuselageWidthMm]
  );

  const deformedMesh = useMemo(() => deformPlaGliderMesh(currentParams), [currentParams]);

  const telemetry = useMemo(
    () => computePlaGliderTelemetry(currentParams, deformedMesh),
    [currentParams, deformedMesh]
  );

  // Download .STL
  const handleDownloadStl = () => {
    const stlContent = generatePlaGliderStlString(currentParams);
    const blob = new Blob([stlContent], { type: 'model/stl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planeador-pla-${modelId}-${Math.round(wingspanMm)}x${Math.round(fuselageLengthMm)}mm.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download .3MF (preserving Bambu Studio / PrusaSlicer settings)
  const handleDownload3mf = async () => {
    try {
      setDownloading3mf(true);
      const blob = await generatePlaGlider3mfBlob(currentParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planeador-pla-${modelId}-${Math.round(wingspanMm)}x${Math.round(fuselageLengthMm)}mm.3mf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando archivo .3mf:', error);
      handleDownloadStl();
    } finally {
      setDownloading3mf(false);
    }
  };

  // Project 3D point to 2D SVG viewport (800 x 520)
  const projectedScene = useMemo(() => {
    const { verts, tris, fuselageLengthMm: totalLen } = deformedMesh;
    const halfY = totalLen / 2;

    let yaw = (yawDeg * Math.PI) / 180;
    let pitch = (pitchDeg * Math.PI) / 180;
    if (viewMode === 'top') {
      yaw = 0;
      pitch = Math.PI / 2;
    } else if (viewMode === 'side') {
      yaw = Math.PI / 2;
      pitch = 0;
    }

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    const scale = 2.05 * zoom;
    const cx = 400;
    const cy = viewMode === 'side' ? 300 : 265;

    const projectPoint = (p: Vec3) => {
      const px = p.x;
      const py = p.y - halfY;
      const pz = p.z;

      // Rotate around Z by yaw
      const rx = px * cosY - py * sinY;
      const ry = px * sinY + py * cosY;
      const rz = pz;

      // Tilt by pitch
      const sx = rx;
      const sy = ry * sinP - rz * cosP;
      const depth = ry * cosP + rz * sinP;

      return {
        x: cx + sx * scale,
        y: cy + sy * scale,
        depth,
      };
    };

    const pVerts = verts.map(projectPoint);

    // Light direction (normalized)
    const lx = -0.35;
    const ly = -0.45;
    const lz = 0.82;

    const renderedTris: {
      points: string;
      fill: string;
      stroke: string;
      depth: number;
    }[] = [];

    for (let i = 0; i < tris.length; i++) {
      const [i1, i2, i3] = tris[i];
      const a = verts[i1];
      const b = verts[i2];
      const c = verts[i3];

      const pa = pVerts[i1];
      const pb = pVerts[i2];
      const pc = pVerts[i3];

      // 2D signed area for backface culling or two-sided shading
      const ux = b.x - a.x;
      const uy = b.y - a.y;
      const uz = b.z - a.z;
      const vx = c.x - a.x;
      const vy = c.y - a.y;
      const vz = c.z - a.z;

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;

      const dot = Math.abs(nx * lx + ny * ly + nz * lz);
      const maxZ = Math.max(a.z, b.z, c.z);

      // Color-code by functional 3D layer height in PLA:
      // - Wing skin (Z <= 0.42 mm): Sky/Cyan translucent PLA
      // - Structural ribs / spine (0.42 < Z <= 2.2 mm): Amber/Orange reinforcement
      // - Nose counterweight & vertical fin / winglets (Z > 2.2 mm): Deep Blue / Indigo structural mass
      let baseR = 56;
      let baseG = 189;
      let baseB = 248;

      if (modelId === 'x1c') {
        if (maxZ > 2.2) {
          baseR = 249;
          baseG = 115;
          baseB = 22;
        } else if (maxZ > 0.42) {
          baseR = 251;
          baseG = 146;
          baseB = 60;
        } else {
          baseR = 253;
          baseG = 186;
          baseB = 116;
        }
      } else {
        if (maxZ > 2.5) {
          baseR = 37;
          baseG = 99;
          baseB = 235;
        } else if (maxZ > 0.45) {
          baseR = 59;
          baseG = 130;
          baseB = 246;
        } else {
          baseR = 125;
          baseG = 211;
          baseB = 252;
        }
      }

      const shade = 0.52 + 0.48 * dot;
      const r = Math.min(255, Math.round(baseR * shade));
      const g = Math.min(255, Math.round(baseG * shade));
      const bl = Math.min(255, Math.round(baseB * shade));
      const fill = `rgb(${r},${g},${bl})`;

      const avgDepth = (pa.depth + pb.depth + pc.depth) / 3;
      renderedTris.push({
        points: `${pa.x.toFixed(1)},${pa.y.toFixed(1)} ${pb.x.toFixed(1)},${pb.y.toFixed(1)} ${pc.x.toFixed(1)},${pc.y.toFixed(1)}`,
        fill,
        stroke: fill,
        depth: avgDepth,
      });
    }

    // Painter's algorithm sort (back to front)
    renderedTris.sort((a, b) => a.depth - b.depth);

    // Project key reference points (Nose, Tail, Wingtips, CG, Ideal CG, Build Plate)
    const nosePt = projectPoint({ x: 0, y: 0, z: 1 });
    const tailPt = projectPoint({ x: 0, y: totalLen, z: 1 });
    const leftTipPt = projectPoint({
      x: -wingspanMm / 2,
      y: (deformedMesh.wingLeadingEdgeY + deformedMesh.wingTrailingEdgeY) / 2,
      z: 0.3,
    });
    const rightTipPt = projectPoint({
      x: wingspanMm / 2,
      y: (deformedMesh.wingLeadingEdgeY + deformedMesh.wingTrailingEdgeY) / 2,
      z: 0.3,
    });
    const actualCgPt = projectPoint({ x: 0, y: telemetry.actualCgFromNoseMm, z: 2.5 });
    const idealCgPt = projectPoint({ x: 0, y: telemetry.idealCgFromNoseMm, z: 2.5 });

    // Build plate 220x220 and 180x180 outlines on Z=0
    const makeBedPoly = (size: number) => {
      const h = size / 2;
      const corners = [
        projectPoint({ x: -h, y: halfY - h, z: 0 }),
        projectPoint({ x: h, y: halfY - h, z: 0 }),
        projectPoint({ x: h, y: halfY + h, z: 0 }),
        projectPoint({ x: -h, y: halfY + h, z: 0 }),
      ];
      return corners.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    };

    return {
      renderedTris,
      nosePt,
      tailPt,
      leftTipPt,
      rightTipPt,
      actualCgPt,
      idealCgPt,
      bed220Poly: makeBedPoly(220),
      bed180Poly: makeBedPoly(180),
      projectPoint,
    };
  }, [deformedMesh, yawDeg, pitchDeg, zoom, viewMode, modelId, wingspanMm, telemetry]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (viewMode !== '3d') return;
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active || viewMode !== '3d') return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setYawDeg((prev) => prev + dx * 0.55);
    setPitchDeg((prev) => Math.max(10, Math.min(88, prev + dy * 0.45)));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  const statusColor =
    telemetry.balanceStatus === 'optimo'
      ? 'emerald'
      : telemetry.balanceStatus === 'estable'
        ? 'amber'
        : 'rose';

  return (
    <div className="space-y-6">
      {/* Encabezado Principal del Taller 2 — Impresión 3D en PLA */}
      <div className="bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-sky-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-300/30 text-sky-200 text-xs font-semibold tracking-wide uppercase">
              <Printer className="w-3.5 h-3.5" />
              Taller 2 · Ingeniería de Vuelo & Manufactura Aditiva en PLA (.3MF / .STL)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Laboratorio Paramétrico de Planeadores 3D en PLA
            </h2>
            <p className="text-sky-100/90 text-sm max-w-3xl leading-relaxed">
              Personaliza la geometría 3D de planeadores funcionales de una sola pieza impresos en{' '}
              <strong>PLA</strong>. Modifica la <strong>envergadura</strong>, el{' '}
              <strong>largo del fuselaje</strong> y el <strong>ancho del ala y fuselaje</strong>{' '}
              conservando el espesor laminar de las alas (<code className="text-sky-200">0.2–0.3 mm</code>)
              y el contrapeso frontal integrado para un planeo estable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload3mf}
              disabled={downloading3mf}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading3mf ? 'Empaquetando .3MF...' : 'Descargar Proyecto .3MF (PLA)'}
            </button>

            <button
              onClick={handleDownloadStl}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/40 transition cursor-pointer"
            >
              <Box className="w-4 h-4" />
              Descargar Malla (.STL)
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Modelo Base (.3MF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['x1c', 'b747'] as PlaGliderModelId[]).map((id) => {
          const item = PLA_GLIDER_MODELS[id];
          const active = modelId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectModel(id)}
              className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-start justify-between gap-4 ${
                active
                  ? 'bg-sky-50/90 border-sky-600 shadow-md'
                  : 'bg-white border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5" />
                    {item.shortName}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                <p className="text-[11px] font-mono text-slate-500 pt-1">
                  Base: Envergadura {item.wingspan.default} mm · Fuselaje{' '}
                  {item.fuselageLength.default} mm · Cuerda {item.wingChord.default} mm
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                  active ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                }`}
              >
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Layout Principal: Controles Paramétricos (Izquierda) + Visor 3D/CAD y Telemetría (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Izquierdo: Parámetros Geométricos */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-800 text-base">
                Parámetros Geométricos 3D (PLA)
              </h3>
            </div>
            <button
              onClick={handleResetDefaults}
              title="Restaurar medidas originales del archivo .3mf"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Original
            </button>
          </div>

          {/* Presets Pedagógicos */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Perfiles de Prueba Rápida
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('velero')}
                className="px-2.5 py-2 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-xs font-semibold text-slate-700 transition cursor-pointer text-center"
              >
                🌊 Planeo Largo
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('original')}
                className="px-2.5 py-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-xs font-bold text-sky-800 transition cursor-pointer text-center"
              >
                ⚖️ Original .3MF
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('rapido')}
                className="px-2.5 py-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-semibold text-slate-700 transition cursor-pointer text-center"
              >
                ⚡ Vuelo Veloz
              </button>
            </div>
          </div>

          {/* 1. Envergadura del Ala (mm) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                1. Envergadura Total del Ala
              </label>
              <span className="text-sm font-extrabold text-sky-700 bg-white px-2.5 py-0.5 rounded-md border border-sky-200">
                {wingspanMm} mm
              </span>
            </div>
            <input
              type="range"
              min={modelLimits.wingspan.min}
              max={modelLimits.wingspan.max}
              step={modelLimits.wingspan.step}
              value={wingspanMm}
              onChange={(e) => setWingspanMm(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Mín: {modelLimits.wingspan.min} mm</span>
              <span className="text-sky-700 font-medium">
                Base .3MF: {modelLimits.wingspan.default} mm
              </span>
              <span>Máx: {modelLimits.wingspan.max} mm</span>
            </div>
          </div>

          {/* 2. Largo del Fuselaje (mm) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                2. Largo del Fuselaje (Nariz a Cola)
              </label>
              <span className="text-sm font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200">
                {fuselageLengthMm} mm
              </span>
            </div>
            <input
              type="range"
              min={modelLimits.fuselageLength.min}
              max={modelLimits.fuselageLength.max}
              step={modelLimits.fuselageLength.step}
              value={fuselageLengthMm}
              onChange={(e) => setFuselageLengthMm(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Mín: {modelLimits.fuselageLength.min} mm</span>
              <span className="text-indigo-700 font-medium">
                Base .3MF: {modelLimits.fuselageLength.default} mm
              </span>
              <span>Máx: {modelLimits.fuselageLength.max} mm</span>
            </div>
          </div>

          {/* 3. Ancho (Cuerda) del Ala (mm) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                3. Ancho del Ala (Cuerda Alar)
              </label>
              <span className="text-sm font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
                {wingChordMm} mm
              </span>
            </div>
            <input
              type="range"
              min={modelLimits.wingChord.min}
              max={modelLimits.wingChord.max}
              step={modelLimits.wingChord.step}
              value={wingChordMm}
              onChange={(e) => setWingChordMm(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Mín: {modelLimits.wingChord.min} mm</span>
              <span className="text-emerald-700 font-medium">
                Base .3MF: {modelLimits.wingChord.default} mm
              </span>
              <span>Máx: {modelLimits.wingChord.max} mm</span>
            </div>
          </div>

          {/* 4. Ancho del Fuselaje / Nariz (mm) */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                4. Ancho del Fuselaje y Contrapeso Frontal
              </label>
              <span className="text-sm font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-md border border-amber-200">
                {fuselageWidthMm} mm
              </span>
            </div>
            <input
              type="range"
              min={modelLimits.fuselageWidth.min}
              max={modelLimits.fuselageWidth.max}
              step={modelLimits.fuselageWidth.step}
              value={fuselageWidthMm}
              onChange={(e) => setFuselageWidthMm(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Mín: {modelLimits.fuselageWidth.min} mm</span>
              <span className="text-amber-700 font-medium">
                Base .3MF: {modelLimits.fuselageWidth.default} mm
              </span>
              <span>Máx: {modelLimits.fuselageWidth.max} mm</span>
            </div>
          </div>

          {/* Parámetros Fijos de Capa Z para Vuelo Funcional */}
          <div className="bg-sky-50/80 rounded-xl p-3.5 border border-sky-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
              <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              Espesores Verticales Protegidos (Eje Z)
            </div>
            <p className="text-[11px] text-sky-900/85 leading-relaxed">
              Para que el avión impreso en PLA sea flexible y planeador, el espesor vertical (
              <code>Z</code>) se mantiene fijo en valores óptimos de laminado:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-100">
                <span className="text-slate-500 block">Piel del Ala:</span>
                <strong className="text-slate-800">
                  {modelLimits.wingSkinThicknessMm} mm (2 capas)
                </strong>
              </div>
              <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-100">
                <span className="text-slate-500 block">Nervaduras:</span>
                <strong className="text-slate-800">{modelLimits.ribThicknessMm} mm</strong>
              </div>
              <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-100">
                <span className="text-slate-500 block">Nariz Contrapeso:</span>
                <strong className="text-slate-800">{modelLimits.noseHeightMm} mm</strong>
              </div>
              <div className="bg-white/90 rounded-lg px-2.5 py-1.5 border border-sky-100">
                <span className="text-slate-500 block">Timón Vertical:</span>
                <strong className="text-slate-800">{modelLimits.tailHeightMm} mm</strong>
              </div>
            </div>
          </div>

          {/* Botones de Descarga en el Panel Lateral */}
          <div className="pt-1 space-y-2.5">
            <button
              onClick={handleDownload3mf}
              disabled={downloading3mf}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloading3mf
                ? 'Generando archivo .3MF...'
                : 'Descargar .3MF con Perfil Bambu/Prusa'}
            </button>
            <button
              onClick={handleDownloadStl}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Box className="w-3.5 h-3.5" />
              Descargar Malla Universal (.STL)
            </button>
          </div>
        </div>

        {/* Panel Derecho: Visor 3D/CAD Interactivo + Telemetría Aerodinámica */}
        <div className="lg:col-span-8 space-y-5">
          {/* Visor 3D / CAD */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Barra de herramientas del visor */}
            <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === '3d'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  Vista 3D Interactiva
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('top')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'top'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Planta Superior (XY)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('side')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'side'
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Perfil Lateral (YZ)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDimensions}
                    onChange={(e) => setShowDimensions(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  Cotas y CG
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBedGrid}
                    onChange={(e) => setShowBedGrid(e.target.checked)}
                    className="rounded accent-sky-500"
                  />
                  Cama 3D
                </label>
                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono w-11 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Lienzo SVG 3D interactivo */}
            <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
              <svg
                viewBox="0 0 800 520"
                className={`w-full h-[420px] sm:h-[470px] select-none ${
                  viewMode === '3d' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <defs>
                  <pattern
                    id="plaGridPattern"
                    width="25"
                    height="25"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 25 0 L 0 0 0 25"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                <rect width="800" height="520" fill="url(#plaGridPattern)" />

                {/* Contornos de Cama de Impresión 220x220 y 180x180 */}
                {showBedGrid && viewMode !== 'side' && (
                  <g>
                    <polygon
                      points={projectedScene.bed220Poly}
                      fill="rgba(15, 23, 42, 0.45)"
                      stroke="rgba(56, 189, 248, 0.35)"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <polygon
                      points={projectedScene.bed180Poly}
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.28)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </g>
                )}

                {/* Malla 3D de Triángulos Parametrizados */}
                <g>
                  {projectedScene.renderedTris.map((tri, idx) => (
                    <polygon
                      key={idx}
                      points={tri.points}
                      fill={tri.fill}
                      stroke={tri.stroke}
                      strokeWidth="0.35"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>

                {/* Marcadores de Centro de Gravedad (CG Real vs CG Ideal) y Cotas */}
                {showDimensions && (
                  <g>
                    {/* Línea de Envergadura entre puntas de ala */}
                    <line
                      x1={projectedScene.leftTipPt.x}
                      y1={projectedScene.leftTipPt.y}
                      x2={projectedScene.rightTipPt.x}
                      y2={projectedScene.rightTipPt.y}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={projectedScene.leftTipPt.x}
                      cy={projectedScene.leftTipPt.y}
                      r="3.5"
                      fill="#38bdf8"
                    />
                    <circle
                      cx={projectedScene.rightTipPt.x}
                      cy={projectedScene.rightTipPt.y}
                      r="3.5"
                      fill="#38bdf8"
                    />

                    {/* Etiqueta Envergadura */}
                    <g
                      transform={`translate(${
                        (projectedScene.leftTipPt.x + projectedScene.rightTipPt.x) / 2
                      }, ${(projectedScene.leftTipPt.y + projectedScene.rightTipPt.y) / 2 - 14})`}
                    >
                      <rect
                        x="-72"
                        y="-12"
                        width="144"
                        height="20"
                        rx="5"
                        fill="rgba(2, 132, 199, 0.92)"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10.5"
                        fontWeight="bold"
                      >
                        Envergadura: {wingspanMm} mm
                      </text>
                    </g>

                    {/* Punto de Nariz y Cola */}
                    <circle
                      cx={projectedScene.nosePt.x}
                      cy={projectedScene.nosePt.y}
                      r="3.5"
                      fill="#a855f7"
                    />
                    <circle
                      cx={projectedScene.tailPt.x}
                      cy={projectedScene.tailPt.y}
                      r="3.5"
                      fill="#a855f7"
                    />
                    <g
                      transform={`translate(${projectedScene.nosePt.x}, ${
                        projectedScene.nosePt.y - 14
                      })`}
                    >
                      <rect
                        x="-78"
                        y="-11"
                        width="156"
                        height="19"
                        rx="5"
                        fill="rgba(88, 28, 135, 0.9)"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="#f3e8ff"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        Nariz (Largo: {fuselageLengthMm} mm)
                      </text>
                    </g>

                    {/* Centro Aerodinámico Ideal */}
                    <circle
                      cx={projectedScene.idealCgPt.x}
                      cy={projectedScene.idealCgPt.y}
                      r="6"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />

                    {/* Centro de Gravedad 3D Real (CG) */}
                    <circle
                      cx={projectedScene.actualCgPt.x}
                      cy={projectedScene.actualCgPt.y}
                      r="4.5"
                      fill="#facc15"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <g
                      transform={`translate(${projectedScene.actualCgPt.x + 12}, ${
                        projectedScene.actualCgPt.y + 18
                      })`}
                    >
                      <rect
                        x="0"
                        y="-12"
                        width="148"
                        height="20"
                        rx="5"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke="#facc15"
                        strokeWidth="1"
                      />
                      <text
                        x="74"
                        y="2"
                        textAnchor="middle"
                        fill="#fef08a"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        CG 3D: {telemetry.actualCgFromNoseMm} mm
                      </text>
                    </g>
                  </g>
                )}
              </svg>

              {/* Leyenda flotante inferior en el visor */}
              <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-slate-900" />
                    <strong>CG 3D Real:</strong> {telemetry.actualCgFromNoseMm} mm
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400" />
                    <strong>CG Ideal:</strong> {telemetry.idealCgFromNoseMm} mm
                  </span>
                  <span className="text-slate-400">
                    Malla: {telemetry.vertexCount} vértices · {telemetry.triangleCount} triángulos
                  </span>
                </div>
                <span className="text-sky-300 font-medium">
                  {viewMode === '3d'
                    ? '💡 Arrastra con el mouse para rotar el avión en 3D'
                    : 'Vista ortográfica de ingeniería'}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Telemetría Física y de Impresión 3D */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Peso en PLA</span>
                <Scale className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {telemetry.estimatedWeightGrams} g
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Volumen: {telemetry.volumeCm3} cm³ ({telemetry.estimatedFilamentMeters} m)
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Tiempo Impresión</span>
                <Printer className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                ~{telemetry.estimatedPrintTimeMin} min
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {telemetry.fitsMiniBed180
                  ? 'Cabe en A1 Mini (180×180)'
                  : telemetry.fitsStandardBed220
                    ? 'Cabe en cama 220×220+'
                    : 'Rotar 45° en el laminador'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Centro Gravedad</span>
                <Compass className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {telemetry.actualCgFromNoseMm} mm
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Óptimo: {telemetry.idealCgFromNoseMm} mm (Δ {telemetry.cgOffsetMm > 0 ? '+' : ''}
                {telemetry.cgOffsetMm} mm)
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Sustentación / AR</span>
                <Gauge className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                L/D {telemetry.estimatedGlideRatioLD}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Área: {telemetry.wingAreaCm2} cm² · AR: {telemetry.aspectRatio}
              </div>
            </div>
          </div>

          {/* Diagnóstico Aerodinámico y Guía de Impresión en PLA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`rounded-2xl p-4 border ${
                statusColor === 'emerald'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : statusColor === 'amber'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-rose-50/70 border-rose-200'
              } space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  {statusColor === 'rose' ? (
                    <TriangleAlert className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  Diagnóstico de Equilibrio de Vuelo
                </div>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800">
                  Puntaje: {telemetry.balanceScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {telemetry.flightBehaviorSummary}
              </p>
              <div className="text-[11px] text-slate-600 pt-1 flex flex-wrap gap-3 font-medium">
                <span>Carga Alar: {telemetry.wingLoadingGPerDm2} g/dm²</span>
                <span>Velocidad Planeo: ~{telemetry.estimatedGlideSpeedMs} m/s</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Sparkles className="w-4 h-4 text-sky-600" />
                Instrucciones Clave de Impresión en PLA
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Perfil incluido en el archivo .3MF:</strong> {modelLimits.slicerProfileSummary}
              </p>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>
                  <strong>Importante al terminar de imprimir:</strong> Espera a que la cama se enfríe
                  por completo antes de despegar el avión desde la nariz con espátula para no doblar
                  las alas delgadas.
                </li>
                <li>
                  Puedes curvar suavemente hacia arriba las puntas de las alas (diedro ligero) con
                  los dedos para mejorar aún más la estabilidad de planeo.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
