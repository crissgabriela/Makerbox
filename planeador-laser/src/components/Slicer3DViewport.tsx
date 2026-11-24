'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CadPrimitive,
  SlicerConfig,
  SlicerResult,
  UploadedMeshModel,
  Vec3,
} from '@/types/slicer3d';
import {
  getTransformedUploadedTriangles,
  PreviewTri3D,
  tessellateCadPrimitive,
} from '@/lib/slicer3d-processor';

interface Slicer3DViewportProps {
  sourceMode: 'cad' | 'upload';
  primitives: CadPrimitive[];
  selectedPrimId: string | null;
  uploadedModel: UploadedMeshModel | null;
  slicerResult: SlicerResult | null;
  config: SlicerConfig;
  viewType: 'solid' | 'sliced';
  explodeFactor: number; // 0 a 1
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function Slicer3DViewport({
  sourceMode,
  primitives,
  selectedPrimId,
  uploadedModel,
  slicerResult,
  config,
  viewType,
  explodeFactor,
}: Slicer3DViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yawDeg, setYawDeg] = useState<number>(-42);
  const [pitchDeg, setPitchDeg] = useState<number>(28);
  const [zoom, setZoom] = useState<number>(1.0);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  // Pre-teselar triángulos sólidos 3D (para modo CAD o archivo subido)
  const solidTriangles: PreviewTri3D[] = useMemo(() => {
    if (sourceMode === 'cad') {
      const all: PreviewTri3D[] = [];
      for (const p of primitives) {
        all.push(...tessellateCadPrimitive(p));
      }
      return all;
    }
    if (!uploadedModel) return [];
    const { triangles } = getTransformedUploadedTriangles(uploadedModel);
    // Limitar a máx ~6500 triángulos en la vista previa para fluidez 60fps en cualquier equipo escolar
    const totalTris = triangles.length / 9;
    const stride = Math.max(1, Math.floor(totalTris / 6500));
    const out: PreviewTri3D[] = [];
    for (let t = 0; t < totalTris; t += stride) {
      const i = t * 9;
      out.push({
        a: { x: triangles[i], y: triangles[i + 1], z: triangles[i + 2] },
        b: { x: triangles[i + 3], y: triangles[i + 4], z: triangles[i + 5] },
        c: { x: triangles[i + 6], y: triangles[i + 7], z: triangles[i + 8] },
        color: '#38bdf8',
      });
    }
    return out;
  }, [sourceMode, primitives, uploadedModel]);

  // Centro vertical de cámara según bounding box actual
  const targetCenterZ = useMemo(() => {
    if (slicerResult) {
      return Math.max(20, slicerResult.telemetry.boundingBoxMm.z * 0.48);
    }
    return 45;
  }, [slicerResult]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 420;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Fondo degradado estudio CAD
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

    const bbox = slicerResult?.telemetry.boundingBoxMm ?? { x: 100, y: 120, z: 100 };
    const maxSpan = Math.max(95, bbox.x, bbox.y, bbox.z);
    const scale = (Math.min(width, height) * 0.56 * zoom) / maxSpan;
    const cx = width / 2;
    const cy = height * 0.54;

    const project = (pt: Vec3): { sx: number; sy: number; depth: number } => {
      const x = pt.x;
      const y = pt.y;
      const z = pt.z - targetCenterZ;
      // Rotar en Z (yaw)
      const rx = x * cosY - y * sinY;
      const ry = x * sinY + y * cosY;
      // Rotar en X (pitch)
      const py = ry * sinP - z * cosP;
      const depth = ry * cosP + z * sinP;
      const persp = 1 / (1 + depth / (maxSpan * 6.5));
      return {
        sx: cx + rx * scale * persp,
        sy: cy + py * scale * persp,
        depth,
      };
    };

    // 1. Grilla de mesa de trabajo 200 x 200 mm en Z = 0
    const gridHalf = 100;
    const gridStep = 20;
    ctx.lineWidth = 1;
    for (let g = -gridHalf; g <= gridHalf; g += gridStep) {
      const isCenter = g === 0;
      ctx.strokeStyle = isCenter ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.12)';
      const p1 = project({ x: g, y: -gridHalf, z: 0 });
      const p2 = project({ x: g, y: gridHalf, z: 0 });
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();

      const q1 = project({ x: -gridHalf, y: g, z: 0 });
      const q2 = project({ x: gridHalf, y: g, z: 0 });
      ctx.beginPath();
      ctx.moveTo(q1.sx, q1.sy);
      ctx.lineTo(q2.sx, q2.sy);
      ctx.stroke();
    }

    // Ejes XYZ
    const o = project({ x: -gridHalf, y: -gridHalf, z: 0 });
    const axX = project({ x: -gridHalf + 30, y: -gridHalf, z: 0 });
    const axY = project({ x: -gridHalf, y: -gridHalf + 30, z: 0 });
    const axZ = project({ x: -gridHalf, y: -gridHalf, z: 30 });
    const drawAxis = (end: { sx: number; sy: number }, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(o.sx, o.sy);
      ctx.lineTo(end.sx, end.sy);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(label, end.sx + 4, end.sy + 3);
    };
    drawAxis(axX, '#f87171', 'X');
    drawAxis(axY, '#34d399', 'Y');
    drawAxis(axZ, '#60a5fa', 'Z');

    // Luz direccional fija en espacio de cámara
    const lightDir = { x: 0.45, y: -0.55, z: 0.7 };
    const lLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    lightDir.x /= lLen;
    lightDir.y /= lLen;
    lightDir.z /= lLen;

    if (viewType === 'solid') {
      // Renderizado 3D de sólidos CAD o malla .STL/.OBJ (algoritmo del pintor)
      const renderItems: {
        pa: { sx: number; sy: number };
        pb: { sx: number; sy: number };
        pc: { sx: number; sy: number };
        depth: number;
        fill: string;
        stroke: string;
        isSelected: boolean;
        isHole: boolean;
      }[] = [];

      for (const tri of solidTriangles) {
        const pa = project(tri.a);
        const pb = project(tri.b);
        const pc = project(tri.c);

        // Normal del triángulo para iluminación Lambertiana
        const ux = tri.b.x - tri.a.x, uy = tri.b.y - tri.a.y, uz = tri.b.z - tri.a.z;
        const vx = tri.c.x - tri.a.x, vy = tri.c.y - tri.a.y, vz = tri.c.z - tri.a.z;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const nLen = Math.hypot(nx, ny, nz) || 1;
        nx /= nLen; ny /= nLen; nz /= nLen;

        const shade = 0.42 + 0.58 * Math.abs(nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
        const [r, g, b] = hexToRgb(tri.color);
        const isSelected = Boolean(selectedPrimId && tri.primId === selectedPrimId);
        const isHole = Boolean(tri.isHole);

        const alpha = isHole ? 0.35 : 0.96;
        const fill = `rgba(${Math.min(255, Math.round(r * shade))}, ${Math.min(
          255,
          Math.round(g * shade)
        )}, ${Math.min(255, Math.round(b * shade))}, ${alpha})`;

        const stroke = isSelected
          ? 'rgba(250, 204, 21, 0.85)'
          : isHole
            ? 'rgba(248, 113, 113, 0.55)'
            : 'rgba(15, 23, 42, 0.16)';

        renderItems.push({
          pa,
          pb,
          pc,
          depth: (pa.depth + pb.depth + pc.depth) / 3,
          fill,
          stroke,
          isSelected,
          isHole,
        });
      }

      renderItems.sort((a, b) => b.depth - a.depth);
      for (const item of renderItems) {
        ctx.beginPath();
        ctx.moveTo(item.pa.sx, item.pa.sy);
        ctx.lineTo(item.pb.sx, item.pb.sy);
        ctx.lineTo(item.pc.sx, item.pc.sy);
        ctx.closePath();
        ctx.fillStyle = item.fill;
        ctx.fill();
        ctx.lineWidth = item.isSelected ? 1.1 : 0.5;
        ctx.strokeStyle = item.stroke;
        ctx.stroke();
      }
    } else if (slicerResult) {
      // VISTA PUZZLE 3D LAMINADO EN MDF 3 MM (con soporte de Explosión 3D)
      const halfT = config.materialThicknessMm / 2;
      const explodeDist = explodeFactor * 55;

      interface SliceDrawPoly {
        pts: { sx: number; sy: number }[];
        depth: number;
        fill: string;
        stroke: string;
        lineWidth: number;
      }

      const drawList: SliceDrawPoly[] = [];

      const map2Dto3D = (axis: 'x' | 'y' | 'z', planeCoord: number, u: number, v: number): Vec3 => {
        if (axis === 'x') return { x: planeCoord, y: u, z: v };
        if (axis === 'y') return { x: u, y: planeCoord, z: v };
        return { x: u, y: v, z: planeCoord };
      };

      const nPieces = slicerResult.pieces.length;
      const midIdx = (nPieces - 1) / 2;

      slicerResult.pieces.forEach((piece, pIdx) => {
        // Desplazamiento de explosión según eje para mostrar cómo encaja el puzzle
        let explodeOffset = 0;
        let liftZ = 0;
        if (config.cutMode === 'waffle') {
          if (piece.axis === 'x') {
            explodeOffset = (piece.planeCoordMm / Math.max(25, bbox.x / 2)) * explodeDist * 0.65;
          } else {
            explodeOffset = (piece.planeCoordMm / Math.max(25, bbox.y / 2)) * explodeDist * 0.65;
            liftZ = explodeFactor * 36; // Las costillas Y bajan desde arriba al ensamblar!
          }
        } else {
          explodeOffset = (pIdx - midIdx) * explodeFactor * 7.5;
        }

        const cFront = piece.planeCoordMm + explodeOffset + halfT;
        const cBack = piece.planeCoordMm + explodeOffset - halfT;

        const isX = piece.axis === 'x';
        const isY = piece.axis === 'y';
        const faceColor =
          config.cutMode === 'waffle'
            ? isX
              ? 'rgba(217, 160, 102, 0.94)' // MDF tono cálido (columna X)
              : 'rgba(238, 198, 145, 0.94)' // MDF tono claro (costillas Y)
            : pIdx % 2 === 0
              ? 'rgba(222, 170, 114, 0.93)'
              : 'rgba(202, 146, 88, 0.93)';

        const edgeColor =
          config.cutMode === 'waffle'
            ? isX
              ? 'rgba(120, 53, 15, 0.9)'
              : 'rgba(146, 64, 14, 0.85)'
            : 'rgba(120, 53, 15, 0.8)';

        for (const poly of piece.contours) {
          if (poly.length < 3) continue;

          // Cara frontal y cara trasera de la lámina de 3 mm
          for (const planeC of [cBack, cFront]) {
            const projPts: { sx: number; sy: number }[] = [];
            let depthSum = 0;
            for (const pt of poly) {
              const w = map2Dto3D(piece.axis, planeC, pt.x, pt.y);
              w.z += liftZ;
              const pr = project(w);
              projPts.push({ sx: pr.sx, sy: pr.sy });
              depthSum += pr.depth;
            }
            drawList.push({
              pts: projPts,
              depth: depthSum / poly.length,
              fill: faceColor,
              stroke: edgeColor,
              lineWidth: 1.15,
            });
          }

          // Borde lateral quemado del láser (muestra el espesor real de 3 mm!)
          const stepEdge = Math.max(1, Math.floor(poly.length / 40));
          for (let i = 0; i < poly.length; i += stepEdge) {
            const a = poly[i];
            const b = poly[(i + stepEdge) % poly.length];
            const w0 = map2Dto3D(piece.axis, cBack, a.x, a.y);
            const w1 = map2Dto3D(piece.axis, cBack, b.x, b.y);
            const w2 = map2Dto3D(piece.axis, cFront, b.x, b.y);
            const w3 = map2Dto3D(piece.axis, cFront, a.x, a.y);
            w0.z += liftZ; w1.z += liftZ; w2.z += liftZ; w3.z += liftZ;
            const p0 = project(w0), p1 = project(w1), p2 = project(w2), p3 = project(w3);
            drawList.push({
              pts: [p0, p1, p2, p3],
              depth: (p0.depth + p1.depth + p2.depth + p3.depth) / 4,
              fill: isY ? 'rgba(146, 64, 14, 0.78)' : 'rgba(120, 53, 15, 0.82)',
              stroke: 'rgba(69, 26, 3, 0.45)',
              lineWidth: 0.6,
            });
          }
        }
      });

      drawList.sort((a, b) => b.depth - a.depth);
      for (const poly of drawList) {
        ctx.beginPath();
        poly.pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.closePath();
        ctx.fillStyle = poly.fill;
        ctx.fill();
        ctx.strokeStyle = poly.stroke;
        ctx.lineWidth = poly.lineWidth;
        ctx.stroke();
      }

      // En modo Planos Seriados, dibujar los ejes guía 3D PLA pasando por los orificios
      if (config.cutMode === 'stacked' && config.includeAlignmentHoles && nPieces >= 2) {
        const firstHoles = slicerResult.pieces.find((p) => p.holes.length > 0)?.holes ?? [];
        const firstCoord = slicerResult.pieces[0].planeCoordMm - midIdx * explodeFactor * 7.5 - 6;
        const lastCoord =
          slicerResult.pieces[nPieces - 1].planeCoordMm + midIdx * explodeFactor * 7.5 + 6;

        for (const h of firstHoles) {
          const pStart = project(map2Dto3D(config.stackedAxis, firstCoord, h.x, h.y));
          const pEnd = project(map2Dto3D(config.stackedAxis, lastCoord, h.x, h.y));
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pStart.sx, pStart.sy);
          ctx.lineTo(pEnd.sx, pEnd.sy);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [
    solidTriangles,
    selectedPrimId,
    slicerResult,
    config,
    viewType,
    explodeFactor,
    yawDeg,
    pitchDeg,
    zoom,
    targetCenterZ,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { active: true, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    setYawDeg((prev) => prev + dx * 0.65);
    setPitchDeg((prev) => Math.max(-75, Math.min(88, prev + dy * 0.55)));
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[430px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Controles rápidos de cámara */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
        {[
          { label: 'Isométrica', yaw: -42, pitch: 28 },
          { label: 'Frontal', yaw: 0, pitch: 8 },
          { label: 'Lateral', yaw: -90, pitch: 8 },
          { label: 'Superior', yaw: -45, pitch: 85 },
        ].map((v) => (
          <button
            key={v.label}
            type="button"
            onClick={() => {
              setYawDeg(v.yaw);
              setPitchDeg(v.pitch);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold transition cursor-pointer backdrop-blur-xs"
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Controles de Zoom */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-lg p-1 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))))}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer"
        >
          -
        </button>
        <span className="text-[10px] font-mono text-slate-300 w-9 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer"
        >
          +
        </button>
      </div>

      {/* Leyenda inferior */}
      <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[10px] text-slate-300">
        <span className="bg-slate-950/75 px-2.5 py-1 rounded-md border border-slate-800">
          💡 Arrastra para rotar en 3D · Mesa de trabajo 200 × 200 mm
        </span>
        {viewType === 'sliced' && config.cutMode === 'stacked' && config.includeAlignmentHoles && (
          <span className="bg-sky-950/85 text-sky-200 px-2.5 py-1 rounded-md border border-sky-700/50 font-bold">
            🔵 Ejes guía 3D PLA incluidos
          </span>
        )}
      </div>
    </div>
  );
}
