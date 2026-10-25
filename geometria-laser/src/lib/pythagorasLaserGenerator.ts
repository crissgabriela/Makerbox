import {
  buildLaserSvgDocument,
  estimateFalconJobMinutes,
  insetPolygon,
  polygonPerimeterMm,
  polygonToSvgPath,
} from './falconLaserSpec';
import { renderVectorText } from './vectorFont';

export interface PythagoreanPreset {
  id: string;
  name: string;
  a: number;
  b: number;
  cLabel: string;
  defaultUnitMm: number;
  badge: string;
}

export const PYTHAGORAS_PRESETS: PythagoreanPreset[] = [
  {
    id: '3-4-5',
    name: 'Terna Egipcia Clásica (3, 4, 5)',
    a: 3,
    b: 4,
    cLabel: '5',
    defaultUnitMm: 12,
    badge: '9 + 16 = 25',
  },
  {
    id: '6-8-10',
    name: 'Terna Escalada (6, 8, 10)',
    a: 6,
    b: 8,
    cLabel: '10',
    defaultUnitMm: 6.5,
    badge: '36 + 64 = 100',
  },
  {
    id: '5-12-13',
    name: 'Terna Esbelta (5, 12, 13)',
    a: 5,
    b: 12,
    cLabel: '13',
    defaultUnitMm: 4.8,
    badge: '25 + 144 = 169',
  },
  {
    id: '1-1-sqrt2',
    name: 'Isósceles Rectángulo (1, 1, √2)',
    a: 4,
    b: 4,
    cLabel: '4√2 ≈ 5.66',
    defaultUnitMm: 12,
    badge: '45° - 45° - 90°',
  },
];

export type PythagorasBoardMode = 'double_tray' | 'engraved_base_plus_pieces';

export interface PythagorasLaserConfig {
  aUnits: number;
  bUnits: number;
  unitScaleMm: number; // mm por cada unidad matemática
  toleranceMm: number; // 0.20 mm por defecto
  boardMode: PythagorasBoardMode;
  engraveFormulas: boolean;
}

export const DEFAULT_PYTHAGORAS_CONFIG: PythagorasLaserConfig = {
  aUnits: 3,
  bUnits: 4,
  unitScaleMm: 12,
  toleranceMm: 0.2,
  boardMode: 'engraved_base_plus_pieces',
  engraveFormulas: true,
};

export interface PerigalPiece {
  id: string;
  label: string;
  subLabel?: string;
  color: string;
  sourcePoints: [number, number][]; // Posición exacta en a² o b² (t = 0)
  targetPoints: [number, number][]; // Posición exacta dentro de c² (t = 1)
  sourceCenter: [number, number];
  targetCenter: [number, number];
}

export interface PythagorasSimulationGeometry {
  trianglePoints: [number, number][];
  squareAPoints: [number, number][];
  squareBPoints: [number, number][];
  squareCPoints: [number, number][];
  pieces: PerigalPiece[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  aMm: number;
  bMm: number;
  cMm: number;
  cUnits: number;
  alphaDeg: number;
  betaDeg: number;
}

function polygonCentroid(pts: [number, number][]): [number, number] {
  let sx = 0;
  let sy = 0;
  pts.forEach(([x, y]) => {
    sx += x;
    sy += y;
  });
  return [sx / pts.length, sy / pts.length];
}

function shiftPoints(
  pts: [number, number][],
  dx: number,
  dy: number
): [number, number][] {
  return pts.map(([x, y]) => [x + dx, y + dy]);
}

/**
 * Calcula la geometría analítica exacta de la Disección de Perigal (1873).
 * Garantiza que las 5 piezas rellenen a² + b² en t=0 y se trasladen (¡sin rotación!)
 * para rellenar exactamente c² en t=1.
 */
export function computePerigalGeometry(
  config: PythagorasLaserConfig
): PythagorasSimulationGeometry {
  // Aseguramos internamente que el cateto B sea el mayor o igual (el que se diseca en 4 cuadriláteros)
  const rawA = Math.max(1, config.aUnits);
  const rawB = Math.max(1, config.bUnits);
  const aU = Math.min(rawA, rawB);
  const bU = Math.max(rawA, rawB);
  const cU = Math.hypot(aU, bU);

  const A = aU * config.unitScaleMm;
  const B = bU * config.unitScaleMm;
  const C = Math.hypot(A, B);

  // Triángulo central rectángulo en C0 = (0, 0), B0 = (A, 0), A0 = (0, B)
  const trianglePoints: [number, number][] = [
    [0, 0],
    [A, 0],
    [0, B],
  ];

  // Cuadrado sobre cateto menor A (hacia -Y)
  const squareAPoints: [number, number][] = [
    [0, 0],
    [0, -A],
    [A, -A],
    [A, 0],
  ];
  const Oa: [number, number] = [A / 2, -A / 2];

  // Cuadrado sobre cateto mayor B (hacia -X)
  const squareBPoints: [number, number][] = [
    [0, 0],
    [-B, 0],
    [-B, B],
    [0, B],
  ];
  const Ob: [number, number] = [-B / 2, B / 2];

  // Cuadrado sobre la hipotenusa (desde A0=(0,B) y B0=(A,0) hacia afuera (+B, +A))
  const H0: [number, number] = [0, B];
  const H1: [number, number] = [A, 0];
  const H2: [number, number] = [A + B, A];
  const H3: [number, number] = [B, A + B];
  const squareCPoints: [number, number][] = [H0, H1, H2, H3];
  const Oc: [number, number] = [(A + B) / 2, (A + B) / 2];

  // Puntos de corte de Perigal en los 4 bordes del cuadrado B (relativos a Ob)
  const PT: [number, number] = [A / 2, -B / 2];
  const PR: [number, number] = [B / 2, A / 2];
  const PB: [number, number] = [-A / 2, B / 2];
  const PL: [number, number] = [-B / 2, -A / 2];

  const KTR: [number, number] = [B / 2, -B / 2];
  const KBR: [number, number] = [B / 2, B / 2];
  const KBL: [number, number] = [-B / 2, B / 2];
  const KTL: [number, number] = [-B / 2, -B / 2];

  const q1Local: [number, number][] = [[0, 0], PT, KTR, PR];
  const q2Local: [number, number][] = [[0, 0], PR, KBR, PB];
  const q3Local: [number, number][] = [[0, 0], PB, KBL, PL];
  const q4Local: [number, number][] = [[0, 0], PL, KTL, PT];

  const pieces: PerigalPiece[] = [
    {
      id: 'sq_a',
      label: `a² = ${Math.round(aU * aU * 10) / 10}`,
      subLabel: `${aU}×${aU}`,
      color: '#0ea5e9',
      sourcePoints: squareAPoints,
      targetPoints: shiftPoints(squareAPoints, Oc[0] - Oa[0], Oc[1] - Oa[1]),
      sourceCenter: Oa,
      targetCenter: Oc,
    },
    {
      id: 'q1',
      label: 'P1',
      subLabel: `b²/4`,
      color: '#8b5cf6',
      sourcePoints: shiftPoints(q1Local, Ob[0], Ob[1]),
      targetPoints: shiftPoints(q1Local, H0[0], H0[1]),
      sourceCenter: polygonCentroid(shiftPoints(q1Local, Ob[0], Ob[1])),
      targetCenter: polygonCentroid(shiftPoints(q1Local, H0[0], H0[1])),
    },
    {
      id: 'q2',
      label: 'P2',
      subLabel: `b²/4`,
      color: '#10b981',
      sourcePoints: shiftPoints(q2Local, Ob[0], Ob[1]),
      targetPoints: shiftPoints(q2Local, H1[0], H1[1]),
      sourceCenter: polygonCentroid(shiftPoints(q2Local, Ob[0], Ob[1])),
      targetCenter: polygonCentroid(shiftPoints(q2Local, H1[0], H1[1])),
    },
    {
      id: 'q3',
      label: 'P3',
      subLabel: `b²/4`,
      color: '#f59e0b',
      sourcePoints: shiftPoints(q3Local, Ob[0], Ob[1]),
      targetPoints: shiftPoints(q3Local, H2[0], H2[1]),
      sourceCenter: polygonCentroid(shiftPoints(q3Local, Ob[0], Ob[1])),
      targetCenter: polygonCentroid(shiftPoints(q3Local, H2[0], H2[1])),
    },
    {
      id: 'q4',
      label: 'P4',
      subLabel: `b²/4`,
      color: '#ec4899',
      sourcePoints: shiftPoints(q4Local, Ob[0], Ob[1]),
      targetPoints: shiftPoints(q4Local, H3[0], H3[1]),
      sourceCenter: polygonCentroid(shiftPoints(q4Local, Ob[0], Ob[1])),
      targetCenter: polygonCentroid(shiftPoints(q4Local, H3[0], H3[1])),
    },
  ];

  const allPts = [
    ...trianglePoints,
    ...squareAPoints,
    ...squareBPoints,
    ...squareCPoints,
  ];
  const xs = allPts.map((p) => p[0]);
  const ys = allPts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const alphaDeg = Math.round(((Math.atan2(aU, bU) * 180) / Math.PI) * 10) / 10;
  const betaDeg = Math.round((90 - alphaDeg) * 10) / 10;

  return {
    trianglePoints,
    squareAPoints,
    squareBPoints,
    squareCPoints,
    pieces,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
    aMm: Math.round(A * 10) / 10,
    bMm: Math.round(B * 10) / 10,
    cMm: Math.round(C * 10) / 10,
    cUnits: Math.round(cU * 100) / 100,
    alphaDeg,
    betaDeg,
  };
}

export interface PythagorasLaserResult {
  svgContent: string;
  widthMm: number;
  heightMm: number;
  estimatedMinutes: number;
  geometry: PythagorasSimulationGeometry;
}

export function generatePythagorasLaser(
  config: PythagorasLaserConfig = DEFAULT_PYTHAGORAS_CONFIG
): PythagorasLaserResult {
  const geo = computePerigalGeometry(config);
  const padBoard = 10;
  const margin = 8;
  const gap = 10;
  const inset = config.toleranceMm / 2;

  const boardW = geo.bounds.width + padBoard * 2;
  const boardH = geo.bounds.height + padBoard * 2 + 12; // +12mm para encabezado grabado

  // Offset para transformar coordenadas geométricas al Tablero 1
  const bx = margin + padBoard - geo.bounds.minX;
  const by = margin + 12 + padBoard - geo.bounds.minY;

  const engraveParts: string[] = [];
  const scoreParts: string[] = [];
  const innerCutParts: string[] = [];
  const outerCutParts: string[] = [];

  let cutLengthMm = 0;
  let scoreLengthMm = 0;
  let engraveAreaMm2 = 0;

  const aU = Math.min(config.aUnits, config.bUnits);
  const bU = Math.max(config.aUnits, config.bUnits);
  const cSq = Math.round((aU * aU + bU * bU) * 10) / 10;

  // TABLERO 1: Base / Tablero Principal
  const boardRect = `<rect x="${margin.toFixed(2)}" y="${margin.toFixed(
    2
  )}" width="${boardW.toFixed(2)}" height="${boardH.toFixed(2)}" rx="5" ry="5" />`;
  outerCutParts.push(`    ${boardRect}`);
  cutLengthMm += 2 * (boardW + boardH);

  // Encabezado institucional y ecuación en el tablero
  engraveParts.push(
    `    ${renderVectorText(`TEOREMA DE PITÁGORAS · a² + b² = c² (${aU}² + ${bU}² = ${cSq})`, {
      x: margin + boardW / 2,
      y: margin + 5.2,
      fontSizeMm: Math.min(3.3, Math.max(2.2, boardW * 0.025)),
    })}`
  );
  engraveParts.push(
    `    ${renderVectorText('FERIA CIENTÍFICA · LICEO BICENTENARIO DE NIÑAS DE MAIPÚ · MAKERBOX', {
      x: margin + boardW / 2,
      y: margin + 9.2,
      fontSizeMm: Math.min(2.2, Math.max(1.7, boardW * 0.017)),
    })}`
  );
  engraveAreaMm2 += 140;

  // Contornos guía de a², b², c² y triángulo en la base (marcado azul rápido)
  const basePolys = [
    geo.trianglePoints,
    geo.squareAPoints,
    geo.squareBPoints,
    geo.squareCPoints,
  ];
  basePolys.forEach((poly) => {
    const shifted = shiftPoints(poly, bx, by);
    scoreParts.push(`    <path d="${polygonToSvgPath(shifted)}" />`);
    scoreLengthMm += polygonPerimeterMm(shifted);
  });

  // Guías punteadas de cómo encajan las piezas tanto en b² como en c²
  geo.pieces.forEach((p) => {
    const sPts = shiftPoints(p.sourcePoints, bx, by);
    const tPts = shiftPoints(p.targetPoints, bx, by);
    scoreParts.push(
      `    <path d="${polygonToSvgPath(sPts)}" stroke-dasharray="1.6 1.6" />`
    );
    scoreParts.push(
      `    <path d="${polygonToSvgPath(tPts)}" stroke-dasharray="1.6 1.6" />`
    );
    scoreLengthMm += polygonPerimeterMm(sPts) + polygonPerimeterMm(tPts);
  });

  if (config.engraveFormulas) {
    const triC = polygonCentroid(shiftPoints(geo.trianglePoints, bx, by));
    engraveParts.push(
      `    ${renderVectorText('90°', {
        x: triC[0],
        y: triC[1],
        fontSizeMm: Math.max(2.2, Math.min(3.8, geo.aMm * 0.12)),
      })}`
    );
    const cCenter = shiftPoints([ [ (geo.aMm + geo.bMm) / 2, (geo.aMm + geo.bMm) / 2 ] ], bx, by)[0];
    engraveParts.push(
      `    ${renderVectorText(`c² = ${cSq}`, {
        x: cCenter[0],
        y: cCenter[1],
        fontSizeMm: Math.max(2.6, Math.min(4.8, geo.cMm * 0.09)),
      })}`
    );
    engraveAreaMm2 += 45;
  }

  let rightCursorX = margin + boardW + gap;
  let totalHeight = margin * 2 + boardH;

  // Si elige Bandeja de Doble Capa (Marco Superior con cavidades huecas de 3mm para encajar)
  if (config.boardMode === 'double_tray') {
    const frameOriginX = rightCursorX;
    const frameOriginY = margin;
    outerCutParts.push(
      `    <rect x="${frameOriginX.toFixed(2)}" y="${frameOriginY.toFixed(
        2
      )}" width="${boardW.toFixed(2)}" height="${boardH.toFixed(2)}" rx="5" ry="5" />`
    );
    cutLengthMm += 2 * (boardW + boardH);

    const fx = frameOriginX + padBoard - geo.bounds.minX;
    const fy = frameOriginY + 12 + padBoard - geo.bounds.minY;

    // Separamos levemente las 4 cavidades en el marco dejando puentes sólidos de 2.2mm?
    // ¡O mejor! Retraemos cada cavidad hacia afuera/adentro? No: si los cuadrados se tocan en los vértices del triángulo,
    // cortar los 4 polígonos exactos abriría una sola ventana unificada. Si retraemos las paredes del marco 1.8mm? No, entonces las piezas no entran.
    // ¡Solución inteligente de ingeniería láser!: El triángulo central se queda FIJO como isla pegada o encajada, y las 3 ventanas cuadradas (a², b², c²) se cortan como cavidades interiores exactas!
    // Verifiquemos: a², b² y c² SOLO se tocan en los 3 vértices puntuales (0,0), (A,0), (0,B). Si dejamos un micro-puente redondeado de 1.5mm en las esquinas exteriores o cortamos las 3 cavidades cuadradas + triángulo unido, ¡queda una sola ventana en forma de trébol pitagórico donde el triángulo central encaja al centro y bloquea exactamente los 3 cuadrados!
    // ¡Exacto! En los tableros comerciales de Pitágoras en MDF, la ventana central es la unión exacta de (Triángulo + a² + b² + c²): al poner la pieza del Triángulo Rectángulo en el centro, quedan delimitadas perfectamente las 3 cavidades cuadradas a², b² y c²!
    // Construyamos el contorno exterior único de esa ventana unificada (Triángulo + a² + b² + c²):
    // Recorriendo el perímetro en orden:
    // (0,0) -> (0,-A) -> (A,-A) -> (A,0) [borde de a²]
    // -> (A+B, A) -> (B, A+B) -> (0, B) [borde exterior de c²]
    // -> (-B, B) -> (-B, 0) -> (0,0) [borde de b²]!
    // ¡¡MIRA QUÉ LIMPIO!! ¡Es UN SOLO polígono simple cerrado de 9 vértices sin auto-intersecciones!
    const unifiedCavityPts: [number, number][] = [
      [0, -geo.aMm],
      [geo.aMm, -geo.aMm],
      [geo.aMm, 0],
      [geo.aMm + geo.bMm, geo.aMm],
      [geo.bMm, geo.aMm + geo.bMm],
      [0, geo.bMm],
      [-geo.bMm, geo.bMm],
      [-geo.bMm, 0],
      [0, 0],
    ];
    const shiftedCavity = shiftPoints(unifiedCavityPts, fx, fy);
    innerCutParts.push(`    <path d="${polygonToSvgPath(shiftedCavity)}" />`);
    cutLengthMm += polygonPerimeterMm(shiftedCavity);

    engraveParts.push(
      `    ${renderVectorText('MARCO SUPERIOR ENCAJABLE (PEGAR SOBRE BASE)', {
        x: frameOriginX + boardW / 2,
        y: frameOriginY + 6.5,
        fontSizeMm: Math.min(2.6, Math.max(1.8, boardW * 0.019)),
      })}`
    );

    rightCursorX += boardW + gap;
  }

  // PIEZAS MÓVILES CORTABLES EN MDF 3MM (Triángulo Central + a² + P1..P4 con tolerancia `inset`)
  // Si es bandeja doble capa (2 tableros arriba), ubicamos las 6 piezas debajo en una fila horizontal para no superar los 400 mm de ancho de la CR Falcon 2 10W.
  const allMobilePolys = [
    {
      label: `a=${aU} b=${bU}`,
      pts: insetPolygon(geo.trianglePoints, inset),
    },
    ...geo.pieces.map((piece) => ({
      label: piece.label,
      pts: insetPolygon(piece.sourcePoints, inset),
    })),
  ].map((item) => {
    const xs = item.pts.map((pt) => pt[0]);
    const ys = item.pts.map((pt) => pt[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      ...item,
      minX,
      minY,
      w: Math.max(...xs) - minX,
      h: Math.max(...ys) - minY,
    };
  });

  let totalWidth = 0;

  if (config.boardMode === 'double_tray') {
    const topRowWidth = rightCursorX - gap + margin;
    let shelfX = margin;
    let shelfY = margin + boardH + gap;
    let shelfRowH = 0;
    let maxShelfW = topRowWidth;

    allMobilePolys.forEach((box) => {
      if (shelfX > margin && shelfX + box.w + margin > Math.max(topRowWidth, 340)) {
        shelfX = margin;
        shelfY += shelfRowH + 6;
        shelfRowH = 0;
      }
      const placed = shiftPoints(box.pts, shelfX - box.minX, shelfY - box.minY);
      outerCutParts.push(`    <path d="${polygonToSvgPath(placed)}" />`);
      cutLengthMm += polygonPerimeterMm(placed);

      const c = polygonCentroid(placed);
      engraveParts.push(
        `    ${renderVectorText(box.label, {
          x: c[0],
          y: c[1],
          fontSizeMm: Math.max(2.0, Math.min(3.5, Math.min(box.w, box.h) * 0.2)),
        })}`
      );
      engraveAreaMm2 += 18;

      shelfX += box.w + 6;
      shelfRowH = Math.max(shelfRowH, box.h);
      maxShelfW = Math.max(maxShelfW, shelfX - 6 + margin);
    });

    totalWidth = maxShelfW;
    totalHeight = shelfY + shelfRowH + margin;
  } else {
    let pieceCursorY = margin + 2;
    let maxPieceColW = 0;
    const triBox = allMobilePolys[0];
    const placedTri = shiftPoints(
      triBox.pts,
      rightCursorX - triBox.minX,
      pieceCursorY - triBox.minY
    );
    outerCutParts.push(`    <path d="${polygonToSvgPath(placedTri)}" />`);
    cutLengthMm += polygonPerimeterMm(placedTri);

    const placedTriC = polygonCentroid(placedTri);
    engraveParts.push(
      `    ${renderVectorText(triBox.label, {
        x: placedTriC[0],
        y: placedTriC[1],
        fontSizeMm: Math.max(2.0, Math.min(3.2, geo.aMm * 0.09)),
      })}`
    );
    engraveAreaMm2 += 20;

    pieceCursorY += triBox.h + 6;
    maxPieceColW = Math.max(maxPieceColW, triBox.w);

    const pieceBoxes = allMobilePolys.slice(1);
    const subColGap = 6;
    const col0Width = Math.max(
      ...pieceBoxes.filter((_, idx) => idx % 2 === 0).map((b) => b.w)
    );
    const colPieceX = [rightCursorX, rightCursorX + col0Width + subColGap];
    let rowY = pieceCursorY;
    let rowMaxH = 0;

    pieceBoxes.forEach((box, idx) => {
      const subCol = idx % 2;
      if (subCol === 0 && idx > 0) {
        rowY += rowMaxH + 6;
        rowMaxH = 0;
      }
      const px = colPieceX[subCol] - box.minX;
      const py = rowY - box.minY;
      const placed = shiftPoints(box.pts, px, py);

      outerCutParts.push(`    <path d="${polygonToSvgPath(placed)}" />`);
      cutLengthMm += polygonPerimeterMm(placed);

      const c = polygonCentroid(placed);
      engraveParts.push(
        `    ${renderVectorText(box.label, {
          x: c[0],
          y: c[1],
          fontSizeMm: Math.max(2.2, Math.min(3.8, Math.min(box.w, box.h) * 0.22)),
        })}`
      );
      engraveAreaMm2 += 18;

      rowMaxH = Math.max(rowMaxH, box.h);
      maxPieceColW = Math.max(
        maxPieceColW,
        subCol === 0 ? box.w : col0Width + subColGap + box.w
      );
    });

    const piecesTotalBottom = rowY + rowMaxH + margin;
    totalHeight = Math.max(totalHeight, piecesTotalBottom);
    totalWidth = rightCursorX + maxPieceColW + margin;
  }

  const svgContent = buildLaserSvgDocument({
    widthMm: totalWidth,
    heightMm: totalHeight,
    title: `Feria Científica LBN Maipú · Teorema de Pitágoras (${aU}, ${bU}, ${geo.cUnits})`,
    description: `Disección geométrica de Perigal en MDF 3mm con tolerancia ${config.toleranceMm}mm`,
    engravePathsSvg: engraveParts.join('\n'),
    scorePathsSvg: scoreParts.join('\n'),
    innerCutPathsSvg: innerCutParts.join('\n'),
    outerCutPathsSvg: outerCutParts.join('\n'),
  });

  return {
    svgContent,
    widthMm: Math.round(totalWidth * 10) / 10,
    heightMm: Math.round(totalHeight * 10) / 10,
    estimatedMinutes: estimateFalconJobMinutes({
      cutLengthMm,
      scoreLengthMm,
      engraveAreaMm2,
    }),
    geometry: geo,
  };
}
