import {
  NestedSheet,
  PlacedPieceOnSheet,
  SlicerConfig,
  SlicerResult,
  Vec2,
  Vec3,
} from '@/types/slicer3d';
import { buildMakerboxLogoVectorPath } from '@/lib/makerbox-logo-vector';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mapPiecePointToSheet(pt: Vec2, placed: PlacedPieceOnSheet, sheetOffsetY: number): Vec2 {
  const { piece, sheetX, sheetY, rotated90 } = placed;
  // Normalizar coordenada local con Y invertida (en CAD Z sube; en SVG Y baja)
  const localU = pt.x - piece.minU;
  const localV = piece.maxV - pt.y; // top = 0, bottom = heightMm

  if (!rotated90) {
    return {
      x: sheetX + localU,
      y: sheetOffsetY + sheetY + localV,
    };
  }
  // Rotación 90° horario: (localU, localV) -> (piece.heightMm - localV, localU)
  return {
    x: sheetX + (piece.heightMm - localV),
    y: sheetOffsetY + sheetY + localU,
  };
}

/**
 * Genera el archivo .SVG listo para corte láser en MDF de 3 mm (Falcon Design Space / LightBurn).
 * - Rojo (#FF0000, 0.1 mm): Orificios internos (cortados primero) y contornos exteriores con ranuras.
 * - Azul (#0000FF): Etiquetas de ensamble (X1, Y2, C01...), logo MakerBox y rótulo superior.
 */
export function generateSlicerLaserSvg(
  result: SlicerResult,
  config: SlicerConfig,
  options: { targetSheetIndex?: number; includeSheetGuides?: boolean } = {}
): string {
  const sheetsToExport: NestedSheet[] =
    typeof options.targetSheetIndex === 'number'
      ? result.sheets.filter((_, idx) => idx === options.targetSheetIndex)
      : result.sheets;

  if (sheetsToExport.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300mm" height="200mm" viewBox="0 0 300 200"></svg>`;
  }

  const sheetGapY = 12;
  const totalWidth = sheetsToExport[0].widthMm;
  const totalHeight =
    sheetsToExport.reduce((acc, s) => acc + s.heightMm, 0) +
    Math.max(0, sheetsToExport.length - 1) * sheetGapY;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth.toFixed(
      2
    )}mm" height="${totalHeight.toFixed(2)}mm" viewBox="0 0 ${totalWidth.toFixed(
      2
    )} ${totalHeight.toFixed(2)}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 5 (Falcon Design Space): Puzzle 3D Laminado MDF ${config.materialThicknessMm}mm · ${escapeXml(
      config.projectName
    )} · ${result.telemetry.totalPieces} piezas -->`
  );

  // 1. Guías opcionales de borde de plancha (solo para vista previa en pantalla)
  if (options.includeSheetGuides) {
    lines.push(`  <g id="GUIA_PLANCHAS_MDF" fill="none">`);
    let offsetY = 0;
    for (const sheet of sheetsToExport) {
      lines.push(
        `    <rect x="0.4" y="${(offsetY + 0.4).toFixed(2)}" width="${(
          sheet.widthMm - 0.8
        ).toFixed(2)}" height="${(sheet.heightMm - 0.8).toFixed(
          2
        )}" stroke="#94a3b8" stroke-width="0.6" stroke-dasharray="4 3" rx="1.5" />`
      );
      offsetY += sheet.heightMm + sheetGapY;
    }
    lines.push(`  </g>`);
  }

  // 2. Capa de Grabado Azul (#0000FF): Rótulo + Logo MakerBox + Numeración de Piezas
  lines.push(`  <g id="CAPA_GRABADO_AZUL" fill="#0000FF" stroke="none">`);
  let offsetY = 0;
  for (const sheet of sheetsToExport) {
    const modeLabel =
      config.cutMode === 'waffle'
        ? `COSTILLAS ENCAJABLES (RANURA ${config.slotWidthMm.toFixed(2)}mm)`
        : `PLANOS SERIADOS (PASO ${config.stackedStepMm.toFixed(1)}mm)`;

    lines.push(
      `    <text x="8" y="${(offsetY + 6.5).toFixed(
        2
      )}" font-family="Arial, sans-serif" font-size="3.2" font-weight="bold">MAKERBOX TALLER 5 · ${escapeXml(
        config.projectName.toUpperCase()
      )} · LÁMINA ${sheet.sheetIndex}/${result.sheets.length} · ${modeLabel}</text>`
    );

    // Logo vectorial MakerBox en esquina superior derecha de la lámina
    const logoD = buildMakerboxLogoVectorPath(sheet.widthMm - 18, offsetY + 2.2, 20);
    lines.push(`    <path d="${logoD}" fill="#0000FF" fill-rule="evenodd" />`);

    if (config.engraveLabels) {
      for (const placed of sheet.placements) {
        const lp = mapPiecePointToSheet(placed.piece.labelPoint, placed, offsetY);
        const fontSize = Math.max(
          2.6,
          Math.min(4.8, Math.min(placed.piece.widthMm, placed.piece.heightMm) * 0.14)
        );
        lines.push(
          `    <text x="${lp.x.toFixed(2)}" y="${(lp.y + fontSize * 0.35).toFixed(
            2
          )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize.toFixed(
            2
          )}" font-weight="bold">${escapeXml(placed.piece.label)}</text>`
        );
      }
    }
    offsetY += sheet.heightMm + sheetGapY;
  }
  lines.push(`  </g>`);

  // 3. Capa de Corte Rojo (#FF0000, 0.1 mm): Primero orificios internos, luego contornos exteriores
  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  offsetY = 0;
  for (const sheet of sheetsToExport) {
    for (const placed of sheet.placements) {
      // 3A. Orificios de alineación internos primero
      for (const hole of placed.piece.holes) {
        const hp = mapPiecePointToSheet({ x: hole.x, y: hole.y }, placed, offsetY);
        lines.push(
          `    <circle cx="${hp.x.toFixed(3)}" cy="${hp.y.toFixed(3)}" r="${hole.r.toFixed(
            3
          )}" />`
        );
      }

      // 3B. Contornos exteriores con ranuras exactas
      for (const contour of placed.piece.contours) {
        if (contour.length < 3) continue;
        const ptsStr = contour
          .map((pt) => {
            const mp = mapPiecePointToSheet(pt, placed, offsetY);
            return `${mp.x.toFixed(3)},${mp.y.toFixed(3)}`;
          })
          .join(' ');
        lines.push(`    <polygon points="${ptsStr}" />`);
      }
    }
    offsetY += sheet.heightMm + sheetGapY;
  }
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

// ============================================================================
// Generador de Kit de Ensamble Híbrido 3D en PLA (.STL 100% Cerrado 2-Manifold)
// ============================================================================

function pushTriStl(lines: string[], a: Vec3, b: Vec3, c: Vec3) {
  const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
  const vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-9) return;
  nx /= len; ny /= len; nz /= len;
  const f = (n: number) => (Math.abs(n) < 1e-6 ? '0.0000' : n.toFixed(4));
  lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  lines.push('    outer loop');
  lines.push(`      vertex ${f(a.x)} ${f(a.y)} ${f(a.z)}`);
  lines.push(`      vertex ${f(b.x)} ${f(b.y)} ${f(b.z)}`);
  lines.push(`      vertex ${f(c.x)} ${f(c.y)} ${f(c.z)}`);
  lines.push('    endloop');
  lines.push('  endfacet');
}

function pushQuadStl(lines: string[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
  pushTriStl(lines, a, b, c);
  pushTriStl(lines, a, c, d);
}

/**
 * Triangulación Ear-Clipping segura para polígonos simples 2D (CCW).
 */
function earClip2D(poly: Vec2[]): [number, number, number][] {
  const cross = (a: Vec2, b: Vec2, c: Vec2) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const inTri = (p: Vec2, a: Vec2, b: Vec2, c: Vec2) =>
    cross(a, b, p) >= -1e-7 && cross(b, c, p) >= -1e-7 && cross(c, a, p) >= -1e-7;

  const active = poly.map((_, i) => i);
  const tris: [number, number, number][] = [];
  let guard = poly.length * poly.length * 2;

  while (active.length > 3 && guard-- > 0) {
    const m = active.length;
    let found = -1;
    for (let i = 0; i < m; i++) {
      const i0 = active[(i - 1 + m) % m];
      const i1 = active[i];
      const i2 = active[(i + 1) % m];
      const a = poly[i0], b = poly[i1], c = poly[i2];
      if (cross(a, b, c) <= 1e-6) continue;
      let hasInside = false;
      for (let j = 0; j < m; j++) {
        const idx = active[j];
        if (idx === i0 || idx === i1 || idx === i2) continue;
        if (inTri(poly[idx], a, b, c)) {
          hasInside = true;
          break;
        }
      }
      if (!hasInside) {
        found = i;
        break;
      }
    }
    if (found === -1) found = 0;
    const i0 = active[(found - 1 + m) % m];
    const i1 = active[found];
    const i2 = active[(found + 1) % m];
    tris.push([i0, i1, i2]);
    active.splice(found, 1);
  }
  if (active.length === 3) tris.push([active[0], active[1], active[2]]);
  return tris;
}

/**
 * Extruye cualquier polígono simple 2D (CCW) desde z0 hasta z1 como un sólido 100% cerrado (2-manifold).
 */
function appendExtrudedPolygonSolid(
  lines: string[],
  polyCCW: Vec2[],
  z0: number,
  z1: number,
  ox = 0,
  oy = 0
) {
  const tris = earClip2D(polyCCW);
  const to3 = (p: Vec2, z: number): Vec3 => ({ x: ox + p.x, y: oy + p.y, z });
  for (const [ia, ib, ic] of tris) {
    const a = polyCCW[ia], b = polyCCW[ib], c = polyCCW[ic];
    pushTriStl(lines, to3(a, z1), to3(b, z1), to3(c, z1));
    pushTriStl(lines, to3(a, z0), to3(c, z0), to3(b, z0));
  }
  const n = polyCCW.length;
  for (let i = 0; i < n; i++) {
    const a = polyCCW[i];
    const b = polyCCW[(i + 1) % n];
    pushQuadStl(lines, to3(a, z0), to3(b, z0), to3(b, z1), to3(a, z1));
  }
}

/**
 * Perfil U-Clip (traba elástica en PLA) que abraza una lámina de MDF de `thicknessMm` (3.0 mm)
 * para fijar uniones encajables en modo Costillas.
 */
function buildUClipPolygon(slotGapMm: number): Vec2[] {
  const wall = 2.6;
  const halfGap = slotGapMm / 2;
  const outerHalf = halfGap + wall;
  const depth = 11.0;
  const backH = 3.2;
  // Polígono en forma de U (CCW), apoyado plano en XY y extruido 7 mm en Z
  return [
    { x: -outerHalf, y: 0 },
    { x: outerHalf, y: 0 },
    { x: outerHalf, y: backH + depth },
    { x: halfGap, y: backH + depth },
    { x: halfGap, y: backH },
    { x: -halfGap, y: backH },
    { x: -halfGap, y: backH + depth },
    { x: -outerHalf, y: backH + depth },
  ];
}

/**
 * Perfil de Pedestal Exhibidor Ranurado (CCW) para sostener el puzzle 3D armado sobre la mesa.
 */
function buildPedestalProfilePolygon(slotGapMm: number): Vec2[] {
  const baseW = 68;
  const topW = 36;
  const totalH = 15;
  const slotDepth = 8.5;
  const halfSlot = slotGapMm / 2;
  return [
    { x: -baseW / 2, y: 0 },
    { x: baseW / 2, y: 0 },
    { x: topW / 2, y: totalH },
    { x: halfSlot, y: totalH },
    { x: halfSlot, y: totalH - slotDepth },
    { x: -halfSlot, y: totalH - slotDepth },
    { x: -halfSlot, y: totalH },
    { x: -topW / 2, y: totalH },
  ];
}

/**
 * Perfil en T de Eje / Pasador Guía Horizontal en PLA para Planos Seriados (se imprime acostado
 * en XY para máxima resistencia a la flexión, sin soportes).
 */
function buildAlignmentPinPolygon(pinDiameterMm: number, pinLengthMm: number): Vec2[] {
  const halfPin = pinDiameterMm / 2;
  const headHalf = halfPin + 2.8;
  const headThick = 3.2;
  const tipTaper = 1.6;
  return [
    { x: -headHalf, y: 0 },
    { x: headHalf, y: 0 },
    { x: headHalf, y: headThick },
    { x: halfPin, y: headThick },
    { x: halfPin, y: headThick + pinLengthMm - tipTaper },
    { x: halfPin * 0.72, y: headThick + pinLengthMm },
    { x: -halfPin * 0.72, y: headThick + pinLengthMm },
    { x: -halfPin, y: headThick + pinLengthMm - tipTaper },
    { x: -halfPin, y: headThick },
    { x: -headHalf, y: headThick },
  ];
}

/**
 * Tapa de Bloqueo en C para el extremo del pasador PLA en Planos Seriados.
 */
function buildPinLockCapPolygon(pinDiameterMm: number): Vec2[] {
  const slotHalf = (pinDiameterMm - 0.1) / 2;
  const outerHalf = slotHalf + 3.0;
  const h = outerHalf * 2;
  return [
    { x: -outerHalf, y: 0 },
    { x: outerHalf, y: 0 },
    { x: outerHalf, y: h },
    { x: slotHalf, y: h },
    { x: slotHalf, y: h * 0.42 },
    { x: -slotHalf, y: h * 0.42 },
    { x: -slotHalf, y: h },
    { x: -outerHalf, y: h },
  ];
}

/**
 * Genera el archivo .STL del Kit de Ensamble Híbrido 3D (PLA) correspondiente al modo de laminado.
 * Todas las piezas son sólidos 100% cerrados (2-manifold) apoyados planos sobre Z = 0.
 */
export function generateSlicerAssemblyKitStl(
  result: SlicerResult,
  config: SlicerConfig
): string {
  const safeName = (config.projectName || 'Puzzle3D').replace(/[^a-zA-Z0-9]+/g, '_');
  const solidName = `MakerBox_Taller5_KitPLA_${safeName}`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);

  const mdfSlotGap = Number((config.materialThicknessMm + 0.15).toFixed(2));

  if (config.cutMode === 'stacked') {
    const pinDiam = Number(Math.max(3.2, config.alignmentHoleDiameterMm - 0.25).toFixed(2));
    const stackSpan = Math.max(
      24,
      Math.min(160, result.telemetry.stackedPiecesCount * config.stackedStepMm + 6)
    );
    const pinPoly = buildAlignmentPinPolygon(pinDiam, stackSpan);
    const lockPoly = buildPinLockCapPolygon(pinDiam);
    const pedestalPoly = buildPedestalProfilePolygon(mdfSlotGap);

    // 2 ejes guía horizontales acostados (espesor Z = pinDiam * 0.88 para deslizar suave)
    const pinZ = Number((pinDiam * 0.88).toFixed(2));
    appendExtrudedPolygonSolid(lines, pinPoly, 0, pinZ, -20, 0);
    appendExtrudedPolygonSolid(lines, pinPoly, 0, pinZ, 0, 0);

    // 2 tapas traba de bloqueo
    appendExtrudedPolygonSolid(lines, lockPoly, 0, 4.0, 22, 4);
    appendExtrudedPolygonSolid(lines, lockPoly, 0, 4.0, 22, 22);

    // 1 pedestal exhibidor ranurado (acostado, extruido 14 mm de profundidad)
    appendExtrudedPolygonSolid(lines, pedestalPoly, 0, 14.0, 0, -24);
  } else {
    // Modo Costillas Encajables: 4 clips traba en U + 1 pedestal exhibidor ranurado
    const clipPoly = buildUClipPolygon(mdfSlotGap);
    const pedestalPoly = buildPedestalProfilePolygon(mdfSlotGap);

    appendExtrudedPolygonSolid(lines, clipPoly, 0, 7.5, -24, 8);
    appendExtrudedPolygonSolid(lines, clipPoly, 0, 7.5, -8, 8);
    appendExtrudedPolygonSolid(lines, clipPoly, 0, 7.5, 8, 8);
    appendExtrudedPolygonSolid(lines, clipPoly, 0, 7.5, 24, 8);

    // Pedestal exhibidor ranurado
    appendExtrudedPolygonSolid(lines, pedestalPoly, 0, 16.0, 0, -18);
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
