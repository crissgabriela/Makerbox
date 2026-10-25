import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
  insetPolygon,
  polygonPerimeterMm,
  polygonToSvgPath,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export type PolyToolMode = 'tangram' | 'regular_polygons';
export type TangramLabelMode = 'fractions' | 'angles_and_fractions' | 'areas_cm2' | 'clean';
export type PolygonPresetId =
  | 'regular_tessellations'
  | 'archimedean_488'
  | 'archimedean_kagome'
  | 'collection_3_to_12';

export interface PolygonsTangramConfig {
  mode: PolyToolMode;
  // Configuración Tangram
  tangramSizeMm: number; // Lado L del cuadrado del Tangram (80 - 150 mm)
  tangramLabelMode: TangramLabelMode;
  tangramIncludeTray: boolean;
  // Configuración Polígonos Regulares y Teselaciones
  polygonPreset: PolygonPresetId;
  polygonSideMm: number; // Arista común exacta s (22 - 42 mm)
  showApothemAndDiagonals: boolean;
  toleranceMm: number;
}

export const DEFAULT_POLYGONS_TANGRAM_CONFIG: PolygonsTangramConfig = {
  mode: 'tangram',
  tangramSizeMm: 110,
  tangramLabelMode: 'angles_and_fractions',
  tangramIncludeTray: true,
  polygonPreset: 'regular_tessellations',
  polygonSideMm: 28,
  showApothemAndDiagonals: true,
  toleranceMm: 0.2,
};

export interface TangramPieceSpec {
  id: string;
  name: string;
  fractionStr: string;
  fractionVal: number;
  anglesStr: string;
  color: string;
  points: [number, number][]; // En cuadrado [0, L] × [0, L]
  labelCenter: [number, number];
}

export function computeTangramPieces(L: number): TangramPieceSpec[] {
  return [
    {
      id: 'tg1',
      name: 'Triángulo Grande A',
      fractionStr: '1/4',
      fractionVal: 0.25,
      anglesStr: '90° · 45° · 45°',
      color: '#ef4444',
      points: [
        [0, 0],
        [L, 0],
        [L / 2, L / 2],
      ],
      labelCenter: [L * 0.5, L * 0.19],
    },
    {
      id: 'tg2',
      name: 'Triángulo Grande B',
      fractionStr: '1/4',
      fractionVal: 0.25,
      anglesStr: '90° · 45° · 45°',
      color: '#f59e0b',
      points: [
        [0, 0],
        [L / 2, L / 2],
        [0, L],
      ],
      labelCenter: [L * 0.19, L * 0.5],
    },
    {
      id: 'tm',
      name: 'Triángulo Mediano',
      fractionStr: '1/8',
      fractionVal: 0.125,
      anglesStr: '90° · 45° · 45°',
      color: '#10b981',
      points: [
        [L / 2, L],
        [L, L / 2],
        [L, L],
      ],
      labelCenter: [L * 0.82, L * 0.82],
    },
    {
      id: 'tp1',
      name: 'Triángulo Pequeño A',
      fractionStr: '1/16',
      fractionVal: 0.0625,
      anglesStr: '90° · 45° · 45°',
      color: '#0ea5e9',
      points: [
        [L, 0],
        [L, L / 2],
        [(3 * L) / 4, L / 4],
      ],
      labelCenter: [L * 0.90, L * 0.25],
    },
    {
      id: 'cq',
      name: 'Cuadrado Central',
      fractionStr: '1/8',
      fractionVal: 0.125,
      anglesStr: '90° × 4',
      color: '#8b5cf6',
      points: [
        [L / 2, L / 2],
        [(3 * L) / 4, L / 4],
        [L, L / 2],
        [(3 * L) / 4, (3 * L) / 4],
      ],
      labelCenter: [L * 0.75, L * 0.5],
    },
    {
      id: 'tp2',
      name: 'Triángulo Pequeño B',
      fractionStr: '1/16',
      fractionVal: 0.0625,
      anglesStr: '90° · 45° · 45°',
      color: '#ec4899',
      points: [
        [L / 2, L / 2],
        [(3 * L) / 4, (3 * L) / 4],
        [L / 4, (3 * L) / 4],
      ],
      labelCenter: [L * 0.5, L * 0.67],
    },
    {
      id: 'rp',
      name: 'Romboide',
      fractionStr: '1/8',
      fractionVal: 0.125,
      anglesStr: '45° · 135°',
      color: '#14b8a6',
      points: [
        [0, L],
        [L / 4, (3 * L) / 4],
        [(3 * L) / 4, (3 * L) / 4],
        [L / 2, L],
      ],
      labelCenter: [L * 0.375, L * 0.875],
    },
  ];
}

export interface RegularPolygonSpec {
  sides: number;
  name: string;
  count: number;
  interiorAngleDeg: number;
  centralAngleDeg: number;
  circumradiusMm: number;
  apothemMm: number;
  areaCm2: number;
  color: string;
  canTessellateAlone: boolean;
}

const POLYGON_NAMES: Record<number, { name: string; color: string }> = {
  3: { name: 'Triángulo', color: '#ef4444' },
  4: { name: 'Cuadrado', color: '#0ea5e9' },
  5: { name: 'Pentágono', color: '#f59e0b' },
  6: { name: 'Hexágono', color: '#10b981' },
  8: { name: 'Octágono', color: '#8b5cf6' },
  10: { name: 'Decágono', color: '#ec4899' },
  12: { name: 'Dodecágono', color: '#14b8a6' },
};

export const POLYGON_PRESET_INFO: Record<
  PolygonPresetId,
  { title: string; subtitle: string; items: { sides: number; count: number }[]; mathRule: string }
> = {
  regular_tessellations: {
    title: 'Teselaciones Regulares Puras {3, 4, 6}',
    subtitle: '6 Triángulos + 4 Cuadrados + 3 Hexágonos de arista idéntica',
    items: [
      { sides: 3, count: 6 },
      { sides: 4, count: 4 },
      { sides: 6, count: 3 },
    ],
    mathRule: '6×60° = 360° · 4×90° = 360° · 3×120° = 360°',
  },
  archimedean_488: {
    title: 'Mosaico Arquimediano Semirregular (4.8.8)',
    subtitle: '4 Octágonos Regulares + 4 Cuadrados con arista compartida',
    items: [
      { sides: 8, count: 4 },
      { sides: 4, count: 4 },
    ],
    mathRule: 'En cada vértice: 90° + 135° + 135° = 360° exactos',
  },
  archimedean_kagome: {
    title: 'Mosaico Kagome y Rombitrihexagonal (3.6.3.6)',
    subtitle: '3 Hexágonos + 6 Triángulos + 3 Cuadrados de igual lado',
    items: [
      { sides: 6, count: 3 },
      { sides: 3, count: 6 },
      { sides: 4, count: 3 },
    ],
    mathRule: 'En cada vértice: 60° + 120° + 60° + 120° = 360°',
  },
  collection_3_to_12: {
    title: 'Laboratorio Comparativo de Polígonos (n = 3 a 12)',
    subtitle: '1 ejemplar de n = 3, 4, 5, 6, 8, 10, 12 (incluye Pentágono 108°)',
    items: [
      { sides: 3, count: 1 },
      { sides: 4, count: 1 },
      { sides: 5, count: 1 },
      { sides: 6, count: 1 },
      { sides: 8, count: 1 },
      { sides: 10, count: 1 },
      { sides: 12, count: 1 },
    ],
    mathRule: 'Ángulo interior α = (n − 2)·180° / n · Suma = (n − 2)·180°',
  },
};

export function createRegularPolygonPoints(
  sides: number,
  sideMm: number,
  cx: number,
  cy: number
): { points: [number, number][]; R: number; apothem: number } {
  const R = sideMm / (2 * Math.sin(Math.PI / sides));
  const apothem = sideMm / (2 * Math.tan(Math.PI / sides));
  // Orientar con base inferior horizontal para apoyar limpio
  const startAngle = Math.PI / 2 - Math.PI / sides;
  const points: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (i * 2 * Math.PI) / sides;
    points.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return { points, R, apothem };
}

export interface PolygonsTangramResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  tangramPieces: TangramPieceSpec[];
  polygonSpecs: RegularPolygonSpec[];
  totalAreaCm2: number;
}

export function generatePolygonsTangramLaser(
  config: PolygonsTangramConfig = DEFAULT_POLYGONS_TANGRAM_CONFIG
): PolygonsTangramResult {
  const margin = 8;
  const gap = 8;
  const inset = config.toleranceMm / 2;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  const tangramPieces = computeTangramPieces(config.tangramSizeMm);
  const polygonSpecs: RegularPolygonSpec[] = [];

  if (config.mode === 'tangram') {
    const L = config.tangramSizeMm;
    const border = 10;
    const trayOuter = L + border * 2;
    const totalAreaCm2 = Math.round(((L * L) / 100) * 10) / 10;

    let cursorX = margin;
    let maxH = 0;

    if (config.tangramIncludeTray) {
      // 1. Base sólida con divisiones guía en azul
      outerCutParts.push(
        `    <rect x="${cursorX.toFixed(2)}" y="${margin.toFixed(
          2
        )}" width="${trayOuter.toFixed(2)}" height="${trayOuter.toFixed(
          2
        )}" rx="4" ry="4" />`
      );
      cutLengthMm += 4 * trayOuter;

      const innerX = cursorX + border;
      const innerY = margin + border;
      tangramPieces.forEach((tp) => {
        const shifted = tp.points.map(
          ([x, y]) => [x + innerX, y + innerY] as [number, number]
        );
        scoreParts.push(
          `    <path d="${polygonToSvgPath(shifted)}" stroke-dasharray="2 1.5" />`
        );
        scoreLengthMm += polygonPerimeterMm(shifted) * 0.5;
      });

      engraveParts.push(
        `    ${renderVectorText('TANGRAM GEOMÉTRICO · LICEO BICENTENARIO DE NIÑAS DE MAIPÚ', {
          x: cursorX + trayOuter / 2,
          y: margin + border / 2,
          fontSizeMm: Math.min(2.6, Math.max(1.8, trayOuter * 0.02)),
        })}`
      );
      engraveParts.push(
        `    ${renderVectorText(`FERIA CIENTÍFICA · ÁREA TOTAL = ${totalAreaCm2} CM² (MDF 3MM)`, {
          x: cursorX + trayOuter / 2,
          y: margin + trayOuter - border / 2,
          fontSizeMm: Math.min(2.4, Math.max(1.7, trayOuter * 0.019)),
        })}`
      );
      engraveAreaMm2 += 90;

      cursorX += trayOuter + gap;

      // 2. Marco superior hueco (cavidad cuadrada L × L)
      innerCutParts.push(
        `    <rect x="${(cursorX + border).toFixed(2)}" y="${(
          margin + border
        ).toFixed(2)}" width="${L.toFixed(2)}" height="${L.toFixed(2)}" />`
      );
      outerCutParts.push(
        `    <rect x="${cursorX.toFixed(2)}" y="${margin.toFixed(
          2
        )}" width="${trayOuter.toFixed(2)}" height="${trayOuter.toFixed(
          2
        )}" rx="4" ry="4" />`
      );
      cutLengthMm += 4 * (trayOuter + L);

      engraveParts.push(
        `    ${renderVectorText('TANGRAM · FRACCIONES Y ÁNGULOS', {
          x: cursorX + trayOuter / 2,
          y: margin + border / 2,
          fontSizeMm: Math.min(2.6, border * 0.34),
        })}`
      );
      engraveParts.push(
        `    ${renderVectorText('MAKERBOX · INGENIERÍA UTALCA', {
          x: cursorX + trayOuter / 2,
          y: margin + trayOuter - border / 2,
          fontSizeMm: Math.min(2.3, border * 0.30),
        })}`
      );
      engraveAreaMm2 += 65;

      maxH = Math.max(maxH, margin * 2 + trayOuter);
      cursorX += trayOuter + gap;
    }

    // 3. Las 7 piezas del Tangram con offset interior `inset` para encaje perfecto
    // Si incluye bandeja doble capa, ubicamos las 7 piezas debajo en una 2ª fila para mantener el ancho < 370 mm (cama CR Falcon 2: 400×415 mm)
    const spread = 4.5;
    const piecesBoxSize = L + spread * 2.4;
    const rowWidthWithTray = margin * 2 + trayOuter * 2 + gap;
    const placeBelowTray = config.tangramIncludeTray;

    const pOriginX = placeBelowTray
      ? (rowWidthWithTray - piecesBoxSize) / 2 + spread * 1.2
      : cursorX + spread * 1.2;
    const pOriginY = placeBelowTray
      ? margin + trayOuter + gap + spread * 1.2
      : margin + spread * 1.2;

    tangramPieces.forEach((tp) => {
      const shrunk = insetPolygon(tp.points, inset);
      const dx = ((tp.labelCenter[0] - L / 2) / (L / 2)) * spread;
      const dy = ((tp.labelCenter[1] - L / 2) / (L / 2)) * spread;
      const placed = shrunk.map(
        ([x, y]) => [x + pOriginX + dx, y + pOriginY + dy] as [number, number]
      );
      outerCutParts.push(`    <path d="${polygonToSvgPath(placed)}" />`);
      cutLengthMm += polygonPerimeterMm(placed);

      const lx = tp.labelCenter[0] + pOriginX + dx;
      const ly = tp.labelCenter[1] + pOriginY + dy;
      const baseFs = Math.max(2.2, L * (tp.fractionVal <= 0.07 ? 0.032 : 0.042));

      if (config.tangramLabelMode === 'fractions') {
        engraveParts.push(
          `    ${renderVectorText(tp.fractionStr, {
            x: lx,
            y: ly,
            fontSizeMm: baseFs * 1.15,
          })}`
        );
        engraveAreaMm2 += 18;
      } else if (config.tangramLabelMode === 'angles_and_fractions') {
        engraveParts.push(
          `    ${renderVectorText(tp.fractionStr, {
            x: lx,
            y: ly - baseFs * 0.55,
            fontSizeMm: baseFs,
          })}`
        );
        engraveParts.push(
          `    ${renderVectorText(tp.anglesStr, {
            x: lx,
            y: ly + baseFs * 0.65,
            fontSizeMm: Math.max(1.7, baseFs * 0.56),
          })}`
        );
        engraveAreaMm2 += 28;
      } else if (config.tangramLabelMode === 'areas_cm2') {
        const pieceArea = Math.round(totalAreaCm2 * tp.fractionVal * 10) / 10;
        engraveParts.push(
          `    ${renderVectorText(`${pieceArea} cm²`, {
            x: lx,
            y: ly,
            fontSizeMm: baseFs * 0.85,
          })}`
        );
        engraveAreaMm2 += 20;
      }
    });

    const totalW = placeBelowTray
      ? rowWidthWithTray
      : cursorX + piecesBoxSize + margin;
    const totalH = placeBelowTray
      ? margin * 2 + trayOuter + gap + piecesBoxSize
      : Math.max(maxH, margin * 2 + piecesBoxSize);

    const svgContent = buildLaserSvgDocument({
      widthMm: totalW,
      heightMm: totalH,
      title: `Feria Científica LBN Maipú · Tangram Geométrico ${L}x${L}mm`,
      description: `7 piezas fraccionarias con tolerancia ${config.toleranceMm}mm en MDF 3mm`,
      engravePathsSvg: engraveParts.join('\n'),
      scorePathsSvg: scoreParts.join('\n'),
      innerCutPathsSvg: innerCutParts.join('\n'),
      outerCutPathsSvg: outerCutParts.join('\n'),
    });

    return {
      svgContent,
      widthMm: Math.round(totalW * 10) / 10,
      heightMm: Math.round(totalH * 10) / 10,
      estimatedMinutes: estimateFalconJobMinutes({
        cutLengthMm,
        scoreLengthMm,
        engraveAreaMm2,
      }),
      tangramPieces,
      polygonSpecs: [],
      totalAreaCm2,
    };
  }

  // =========================================================================
  // MODO B: POLÍGONOS REGULARES Y TESELACIONES DEL PLANO
  // =========================================================================
  const preset = POLYGON_PRESET_INFO[config.polygonPreset];
  const s = config.polygonSideMm;

  interface PlacedTile {
    sides: number;
    R: number;
    apothem: number;
    interiorDeg: number;
    centralDeg: number;
    areaCm2: number;
    w: number;
    h: number;
    rawPts: [number, number][];
  }

  const tiles: PlacedTile[] = [];
  let sumAreaCm2 = 0;

  preset.items.forEach(({ sides, count }) => {
    const interiorDeg = Math.round((((sides - 2) * 180) / sides) * 10) / 10;
    const centralDeg = Math.round((360 / sides) * 10) / 10;
    const { points, R, apothem } = createRegularPolygonPoints(sides, s, 0, 0);
    const areaMm2 = 0.25 * sides * s * s * (1 / Math.tan(Math.PI / sides));
    const areaCm2 = Math.round((areaMm2 / 100) * 100) / 100;
    const meta = POLYGON_NAMES[sides] || { name: `${sides}-gono`, color: '#6366f1' };

    polygonSpecs.push({
      sides,
      name: meta.name,
      count,
      interiorAngleDeg: interiorDeg,
      centralAngleDeg: centralDeg,
      circumradiusMm: Math.round(R * 10) / 10,
      apothemMm: Math.round(apothem * 10) / 10,
      areaCm2,
      color: meta.color,
      canTessellateAlone: 360 % interiorDeg === 0,
    });

    const shrunk = insetPolygon(points, inset);
    const xs = shrunk.map((p) => p[0]);
    const ys = shrunk.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const normalized = shrunk.map(
      ([x, y]) => [x - minX, y - minY] as [number, number]
    );

    for (let k = 0; k < count; k++) {
      tiles.push({
        sides,
        R,
        apothem,
        interiorDeg,
        centralDeg,
        areaCm2,
        w: maxX - minX,
        h: maxY - minY,
        rawPts: normalized,
      });
      sumAreaCm2 += areaCm2;
    }
  });

  // Empaquetado por filas (shelf packing) dentro de máx ~290 mm de ancho
  const maxShelfWidth = 285;
  let curX = margin;
  let curY = margin;
  let rowH = 0;
  let usedMaxW = 0;

  tiles.forEach((tile) => {
    if (curX > margin && curX + tile.w + margin > maxShelfWidth) {
      curX = margin;
      curY += rowH + 6;
      rowH = 0;
    }

    const placed = tile.rawPts.map(
      ([x, y]) => [x + curX, y + curY] as [number, number]
    );
    outerCutParts.push(`    <path d="${polygonToSvgPath(placed)}" />`);
    cutLengthMm += polygonPerimeterMm(placed);

    // Centro geométrico del polígono
    let cx = 0;
    let cy = 0;
    placed.forEach(([x, y]) => {
      cx += x;
      cy += y;
    });
    cx /= placed.length;
    cy /= placed.length;

    if (config.showApothemAndDiagonals) {
      // Apotema desde el centro al punto medio de la arista 0-1
      const mx = (placed[0][0] + placed[1][0]) / 2;
      const my = (placed[0][1] + placed[1][1]) / 2;
      scoreParts.push(
        `    <line x1="${cx.toFixed(2)}" y1="${cy.toFixed(2)}" x2="${mx.toFixed(
          2
        )}" y2="${my.toFixed(2)}" stroke-dasharray="1.5 1.2" />`
      );
      scoreLengthMm += tile.apothem;

      // Diagonales de triangulación (n - 3 diagonales desde el vértice 0) si n >= 4
      if (tile.sides >= 4 && tile.sides <= 8) {
        for (let v = 2; v < tile.sides - 1; v++) {
          scoreParts.push(
            `    <line x1="${placed[0][0].toFixed(2)}" y1="${placed[0][1].toFixed(
              2
            )}" x2="${placed[v][0].toFixed(2)}" y2="${placed[v][1].toFixed(
              2
            )}" stroke-dasharray="1.2 1.8" />`
          );
          scoreLengthMm += tile.R * 1.4;
        }
      }
    }

    const fs = Math.max(2.1, Math.min(4.2, tile.apothem * 0.25));
    engraveParts.push(
      `    ${renderVectorText(`${tile.interiorDeg}°`, {
        x: cx,
        y: cy - fs * 0.48,
        fontSizeMm: fs,
      })}`
    );
    engraveParts.push(
      `    ${renderVectorText(`n=${tile.sides}`, {
        x: cx,
        y: cy + fs * 0.62,
        fontSizeMm: Math.max(1.8, fs * 0.72),
      })}`
    );
    engraveAreaMm2 += 24;

    curX += tile.w + 6;
    rowH = Math.max(rowH, tile.h);
    usedMaxW = Math.max(usedMaxW, curX - 6 + margin);
  });

  const totalW = Math.max(110, usedMaxW);
  const totalH = curY + rowH + margin;

  const svgContent = buildLaserSvgDocument({
    widthMm: totalW,
    heightMm: totalH,
    title: `Feria Científica LBN Maipú · ${preset.title}`,
    description: `${tiles.length} fichas poligonales de arista ${s}mm en MDF 3mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  return {
    svgContent,
    widthMm: Math.round(totalW * 10) / 10,
    heightMm: Math.round(totalH * 10) / 10,
    estimatedMinutes: estimateFalconJobMinutes({
      cutLengthMm,
      scoreLengthMm,
      engraveAreaMm2,
    }),
    tangramPieces,
    polygonSpecs,
    totalAreaCm2: Math.round(sumAreaCm2 * 10) / 10,
  };
}
