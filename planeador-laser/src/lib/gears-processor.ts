import {
  BOARD_HOLE_DIAMETER_MM,
  BoardObstacle,
  GEAR_BORE_DIAMETER_MM,
  GEAR_CATALOG,
  GEAR_MODULE_MM,
  GearBoardSpec,
  GearChallengeConfig,
  GearKinematicsNode,
  GearSizeId,
  GearTrainAnalysis,
  MatrixPatternId,
  PlacedGear,
} from '@/types/gears';
import { buildMakerboxLogoVectorPath } from '@/lib/makerbox-logo-vector';

export interface Vec2 {
  x: number;
  y: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const SQRT3_HALF = Math.sqrt(3) / 2; // 0.8660254037844386

/**
 * Construye dinámicamente la especificación del tablero matricial para cualquier tamaño (Ancho × Alto en cm)
 * y patrón (Matriz Triangular 60° con diagonales exactas o Matriz Cuadrada 90°).
 */
export function buildBoardSpec(
  widthCm: number,
  heightCm: number,
  matrixPattern: MatrixPatternId = 'triangular'
): GearBoardSpec {
  const widthMm = Math.round(Math.max(200, Math.min(460, widthCm * 10)));
  const heightMm = Math.round(Math.max(180, Math.min(460, heightCm * 10)));
  const marginMm = 20;
  const gridPitchMm = 10;

  const usableW = widthMm - marginMm * 2;
  const usableH = heightMm - marginMm * 2;
  const rowPitchY = matrixPattern === 'triangular' ? gridPitchMm * SQRT3_HALF : gridPitchMm;

  const cols = Math.max(12, Math.floor(usableW / gridPitchMm) + 1);
  const rows = Math.max(12, Math.floor(usableH / rowPitchY) + 1);

  // Anclar Inicio en esquina inferior izquierda y Meta en esquina superior derecha
  // con margen suficiente para el engranaje más grande (8 cm -> radio 40 mm = 4 espacios)
  const startCol = Math.min(Math.floor(cols / 4), 4);
  const endCol = Math.max(Math.ceil((cols * 3) / 4), cols - 5);
  const rowMargin = matrixPattern === 'triangular' ? 4 : 4;
  const startRow = Math.max(Math.ceil((rows * 3) / 4), rows - 1 - rowMargin);
  const endRow = Math.min(Math.floor(rows / 4), rowMargin);

  return {
    widthMm,
    heightMm,
    marginMm,
    gridPitchMm,
    matrixPattern,
    cols,
    rows,
    startGrid: { col: startCol, row: startRow },
    endGrid: { col: endCol, row: endRow },
  };
}

export function gridToMm(board: GearBoardSpec, col: number, row: number): { x: number; y: number } {
  if (board.matrixPattern === 'triangular') {
    const rowShift = row % 2 === 1 ? board.gridPitchMm * 0.5 : 0;
    return {
      x: Number((board.marginMm + col * board.gridPitchMm + rowShift).toFixed(3)),
      y: Number((board.marginMm + row * board.gridPitchMm * SQRT3_HALF).toFixed(3)),
    };
  }
  return {
    x: board.marginMm + col * board.gridPitchMm,
    y: board.marginMm + row * board.gridPitchMm,
  };
}

export function getRowColsCount(board: GearBoardSpec, row: number): number {
  if (board.matrixPattern === 'triangular' && row % 2 === 1) {
    // Las filas impares desplazadas +5 mm tienen 1 columna menos si la última se saldría del margen
    const maxX = board.marginMm + (board.cols - 1) * board.gridPitchMm + board.gridPitchMm * 0.5;
    return maxX <= board.widthMm - board.marginMm + 0.1 ? board.cols : board.cols - 1;
  }
  return board.cols;
}

export function getAllBoardHoles(
  board: GearBoardSpec
): { col: number; row: number; x: number; y: number }[] {
  const holes: { col: number; row: number; x: number; y: number }[] = [];
  for (let r = 0; r < board.rows; r++) {
    const colCount = getRowColsCount(board, r);
    for (let c = 0; c < colCount; c++) {
      holes.push({ col: c, row: r, ...gridToMm(board, c, r) });
    }
  }
  return holes;
}

export function getChallengeObstacles(
  challenge: GearChallengeConfig,
  board: GearBoardSpec
): BoardObstacle[] {
  if (!challenge.hasCenterObstacle) return [];
  const w = Math.round(Math.max(44, Math.min(72, board.widthMm * 0.22)));
  const h = Math.round(Math.max(44, Math.min(72, board.heightMm * 0.22)));
  return [
    {
      id: 'obs-center',
      label: 'ZONA BLOQUEADA',
      x: Number(((board.widthMm - w) / 2).toFixed(1)),
      y: Number(((board.heightMm - h) / 2).toFixed(1)),
      width: w,
      height: h,
    },
  ];
}

export function createInitialGearsForChallenge(
  challenge: GearChallengeConfig,
  board: GearBoardSpec
): PlacedGear[] {
  const sPos = gridToMm(board, board.startGrid.col, board.startGrid.row);
  const ePos = gridToMm(board, board.endGrid.col, board.endGrid.row);
  return [
    {
      id: 'gear-start',
      sizeId: challenge.startSizeId,
      col: board.startGrid.col,
      row: board.startGrid.row,
      x: sPos.x,
      y: sPos.y,
      role: 'start',
    },
    {
      id: 'gear-end',
      sizeId: challenge.endSizeId,
      col: board.endGrid.col,
      row: board.endGrid.row,
      x: ePos.x,
      y: ePos.y,
      role: 'end',
    },
  ];
}

// ============================================================================
// 1. Búsqueda Exacta de Hoyos Tangentes (Diagonales 60° + Horizontales + 3-4-5)
// ============================================================================

function circleIntersectsObstacle(cx: number, cy: number, r: number, obs: BoardObstacle): boolean {
  const closestX = Math.max(obs.x, Math.min(cx, obs.x + obs.width));
  const closestY = Math.max(obs.y, Math.min(cy, obs.y + obs.height));
  return Math.hypot(cx - closestX, cy - closestY) < r - 0.5;
}

function isGearInsideBoard(x: number, y: number, outerRadiusMm: number, board: GearBoardSpec): boolean {
  return (
    x - outerRadiusMm >= 2 &&
    x + outerRadiusMm <= board.widthMm - 2 &&
    y - outerRadiusMm >= 2 &&
    y + outerRadiusMm <= board.heightMm - 2
  );
}

/**
 * Encuentra TODOS los hoyos de la matriz (horizontal, vertical y diagonales exactas) donde un
 * engranaje de tamaño `sizeId` queda exactamente tangente a al menos un engranaje existente
 * sin chocar con ningún otro ni salirse del tablero.
 */
export function findValidTangentHoles(
  sizeId: GearSizeId,
  otherGears: PlacedGear[],
  board: GearBoardSpec,
  obstacles: BoardObstacle[]
): { col: number; row: number; x: number; y: number; tangentCount: number }[] {
  const spec = GEAR_CATALOG[sizeId];
  const rMm = spec.pitchRadiusMm;
  const outerRMm = spec.outerDiameterMm / 2;
  const tolMm = 0.55;

  const allHoles = getAllBoardHoles(board);
  const valid: { col: number; row: number; x: number; y: number; tangentCount: number }[] = [];

  for (const h of allHoles) {
    if (!isGearInsideBoard(h.x, h.y, outerRMm, board)) continue;

    let tangentCount = 0;
    let collides = false;

    for (const g of otherGears) {
      const target = GEAR_CATALOG[g.sizeId].pitchRadiusMm + rMm;
      const dist = Math.hypot(h.x - g.x, h.y - g.y);
      if (dist < target - tolMm) {
        collides = true;
        break;
      }
      if (Math.abs(dist - target) <= tolMm) {
        tangentCount += 1;
      }
    }

    if (collides || tangentCount === 0) continue;

    for (const obs of obstacles) {
      if (circleIntersectsObstacle(h.x, h.y, rMm + 1.5, obs)) {
        collides = true;
        break;
      }
    }
    if (!collides) {
      valid.push({ ...h, tangentCount });
    }
  }

  return valid;
}

/**
 * Ajusta cualquier coordenada (rawX, rawY) al hoyo más cercano de la matriz,
 * dando prioridad magnética a los hoyos tangentes exactos (especialmente cierres dobles).
 */
export function snapGearToMatrix(
  rawX: number,
  rawY: number,
  sizeId: GearSizeId,
  otherGears: PlacedGear[],
  board: GearBoardSpec,
  obstacles: BoardObstacle[]
): { col: number; row: number; x: number; y: number; isExactTangent: boolean; tangentCount: number } {
  const validHoles = findValidTangentHoles(sizeId, otherGears, board, obstacles);
  let bestTangent: {
    col: number;
    row: number;
    x: number;
    y: number;
    score: number;
    tangentCount: number;
  } | null = null;

  for (const h of validHoles) {
    const dist = Math.hypot(h.x - rawX, h.y - rawY);
    const threshold = h.tangentCount >= 2 ? 20 : 15;
    if (dist <= threshold) {
      const score = dist - (h.tangentCount >= 2 ? 5 : 0);
      if (!bestTangent || score < bestTangent.score) {
        bestTangent = { ...h, score };
      }
    }
  }

  if (bestTangent) {
    return {
      col: bestTangent.col,
      row: bestTangent.row,
      x: bestTangent.x,
      y: bestTangent.y,
      isExactTangent: true,
      tangentCount: bestTangent.tangentCount,
    };
  }

  // Fallback: hoyo más cercano dentro del tablero
  const outerRMm = GEAR_CATALOG[sizeId].outerDiameterMm / 2;
  const allHoles = getAllBoardHoles(board);
  let nearest = allHoles[0];
  let minD = Infinity;
  for (const h of allHoles) {
    if (!isGearInsideBoard(h.x, h.y, outerRMm, board)) continue;
    const d = Math.hypot(h.x - rawX, h.y - rawY);
    if (d < minD) {
      minD = d;
      nearest = h;
    }
  }

  return {
    col: nearest.col,
    row: nearest.row,
    x: nearest.x,
    y: nearest.y,
    isExactTangent: false,
    tangentCount: 0,
  };
}

// ============================================================================
// 2. Motor Cinemático y Detección de Colisiones / Trabas Mecánicas
// ============================================================================

export function analyzeGearTrain(
  gears: PlacedGear[],
  challenge: GearChallengeConfig,
  board: GearBoardSpec
): GearTrainAnalysis {
  const obstacles = getChallengeObstacles(challenge, board);
  const meshingEdges: [string, string][] = [];
  const collisionPairs: [string, string][] = [];
  const obstacleCollisions: string[] = [];
  const outOfBoundsIds: string[] = [];

  const adj = new Map<string, string[]>();
  for (const g of gears) {
    adj.set(g.id, []);
    const spec = GEAR_CATALOG[g.sizeId];
    if (!isGearInsideBoard(g.x, g.y, spec.outerDiameterMm / 2, board)) {
      outOfBoundsIds.push(g.id);
    }
    for (const obs of obstacles) {
      if (circleIntersectsObstacle(g.x, g.y, spec.pitchRadiusMm + 1.5, obs)) {
        obstacleCollisions.push(g.id);
        break;
      }
    }
  }

  const MESH_TOL_MM = 0.6;
  const OVERLAP_TOL_MM = 0.6;

  for (let i = 0; i < gears.length; i++) {
    const a = gears[i];
    const ra = GEAR_CATALOG[a.sizeId].pitchRadiusMm;
    for (let j = i + 1; j < gears.length; j++) {
      const b = gears[j];
      const rb = GEAR_CATALOG[b.sizeId].pitchRadiusMm;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const target = ra + rb;

      if (dist < target - OVERLAP_TOL_MM) {
        collisionPairs.push([a.id, b.id]);
      } else if (Math.abs(dist - target) <= MESH_TOL_MM) {
        meshingEdges.push([a.id, b.id]);
        adj.get(a.id)!.push(b.id);
        adj.get(b.id)!.push(a.id);
      }
    }
  }

  const gearMap = new Map<string, PlacedGear>();
  for (const g of gears) gearMap.set(g.id, g);

  const nodes: Record<string, GearKinematicsNode> = {};
  for (const g of gears) {
    nodes[g.id] = {
      id: g.id,
      connectedToStart: false,
      rpm: 0,
      direction: 0,
      phaseOffsetRad: 0,
      stepFromStart: -1,
    };
  }

  let isJammed = false;
  let jamReason: string | null = null;

  const startGear = gears.find((g) => g.role === 'start');
  const endGear = gears.find((g) => g.role === 'end');

  if (startGear) {
    const queue: string[] = [startGear.id];
    nodes[startGear.id] = {
      id: startGear.id,
      connectedToStart: true,
      rpm: challenge.startRpm * challenge.startDirection,
      direction: challenge.startDirection,
      phaseOffsetRad: 0,
      stepFromStart: 0,
    };

    while (queue.length > 0) {
      const uId = queue.shift()!;
      const uGear = gearMap.get(uId)!;
      const uNode = nodes[uId];
      const uSpec = GEAR_CATALOG[uGear.sizeId];

      for (const vId of adj.get(uId) || []) {
        const vGear = gearMap.get(vId)!;
        const vNode = nodes[vId];
        const vSpec = GEAR_CATALOG[vGear.sizeId];

        const expectedDir = (uNode.direction * -1) as 1 | -1;
        const expectedRpm = -uNode.rpm * (uSpec.teeth / vSpec.teeth);

        if (!vNode.connectedToStart) {
          const alpha = Math.atan2(vGear.y - uGear.y, vGear.x - uGear.x);
          const uToothPhaseAtContact = (alpha - uNode.phaseOffsetRad) * uSpec.teeth;
          const vPhase = alpha + Math.PI - (Math.PI - uToothPhaseAtContact) / vSpec.teeth;

          nodes[vId] = {
            id: vId,
            connectedToStart: true,
            rpm: expectedRpm,
            direction: expectedDir,
            phaseOffsetRad: vPhase,
            stepFromStart: uNode.stepFromStart + 1,
          };
          queue.push(vId);
        } else if (vNode.direction !== expectedDir) {
          isJammed = true;
          jamReason =
            '¡Tren mecánico trabado! Se formó un ciclo impar (ej. 3 engranajes tocándose en triángulo) que bloquea el giro. Arrastra uno al basurero para destrabarlo.';
        }
      }
    }
  }

  if (collisionPairs.length > 0) {
    isJammed = true;
    jamReason =
      'Hay círculos primitivos superpuestos. Arrástralos hacia un hoyo verde (tangencia exacta) o al basurero.';
  } else if (obstacleCollisions.length > 0) {
    isJammed = true;
    jamReason =
      'Uno o más engranajes invaden la zona bloqueada del tablero. Bordea el obstáculo.';
  }

  if (isJammed) {
    for (const id of Object.keys(nodes)) {
      nodes[id] = { ...nodes[id], rpm: 0, direction: 0 };
    }
  }

  const endNode = endGear ? nodes[endGear.id] : null;
  const endReached = Boolean(!isJammed && endNode && endNode.connectedToStart);
  const endRpm = endReached && endNode ? Number(Math.abs(endNode.rpm).toFixed(1)) : 0;
  const endDirection = endReached && endNode ? endNode.direction : 0;

  const startTeeth = startGear ? GEAR_CATALOG[startGear.sizeId].teeth : 20;
  const endTeeth = endGear ? GEAR_CATALOG[endGear.sizeId].teeth : 20;
  const transmissionRatio = Number((startTeeth / endTeeth).toFixed(2));

  let challengeCompleted = false;
  let statusMessage =
    'Arrastra círculos primitivos (4, 6 u 8 cm) desde la derecha hacia los hoyos verdes (horizontales o diagonales) para conectar Inicio con Meta.';
  let statusType: 'success' | 'warning' | 'error' | 'info' = 'info';

  if (isJammed && jamReason) {
    statusMessage = jamReason;
    statusType = 'error';
  } else if (endReached) {
    if (
      challenge.targetEndDirection !== null &&
      endDirection !== challenge.targetEndDirection
    ) {
      const wantTxt = challenge.targetEndDirection === 1 ? 'Horario (↻)' : 'Antihorario (↺)';
      const gotTxt = endDirection === 1 ? 'Horario (↻)' : 'Antihorario (↺)';
      statusMessage = `¡Conectaste la Meta (${endRpm} RPM ${gotTxt}), pero el desafío pide sentido ${wantTxt}! Modifica el recorrido para cambiar de par a impar.`;
      statusType = 'warning';
    } else {
      challengeCompleted = true;
      const dirTxt = endDirection === 1 ? 'Horario (↻)' : 'Antihorario (↺)';
      statusMessage = `¡Desafío logrado! Tu tren gira hasta la Meta a ${endRpm} RPM (${dirTxt}). Ya puedes descargar el patrón láser (.SVG) y los ejes 3D (.STL).`;
      statusType = 'success';
    }
  } else if (gears.length > 2) {
    const connectedCount = Object.values(nodes).filter((n) => n.connectedToStart).length;
    statusMessage = `Tienes ${connectedCount} de ${gears.length} engranajes girando desde el Inicio. Sigue arrastrando círculos hacia los hoyos verdes hasta alcanzar la Meta.`;
    statusType = 'info';
  }

  const gearsPerimMm = gears.reduce((acc, g) => {
    const spec = GEAR_CATALOG[g.sizeId];
    return acc + spec.pitchDiameterMm * Math.PI * 1.95 + Math.PI * GEAR_BORE_DIAMETER_MM;
  }, 0);
  const gearsLaserSec = Math.max(30, Math.round(gearsPerimMm / 8.5 + gears.length * 4));
  const gMin = Math.floor(gearsLaserSec / 60);
  const gSec = gearsLaserSec % 60;
  const estimatedGearsLaserTimeFormatted = gMin > 0 ? `${gMin} min ${gSec} s` : `${gSec} s`;

  const allHolesCount = getAllBoardHoles(board).length;
  const boardPerimMm =
    2 * (board.widthMm + board.heightMm) + allHolesCount * Math.PI * BOARD_HOLE_DIAMETER_MM;
  const boardLaserMin = Math.max(4, Math.round(boardPerimMm / (11.0 * 60)));
  const estimatedBoardLaserTimeFormatted = `~${boardLaserMin} min (1 vez · reutilizable)`;

  const estimatedPlaGrams = Number((gears.length * 0.7 + 1.5).toFixed(1));
  const estimatedPlaPrintMin = Math.max(9, Math.round(estimatedPlaGrams * 2.5));

  return {
    nodes,
    meshingEdges,
    collisionPairs,
    obstacleCollisions,
    outOfBoundsIds,
    isJammed,
    jamReason,
    endReached,
    endRpm,
    endDirection,
    transmissionRatio,
    challengeCompleted,
    statusMessage,
    statusType,
    estimatedGearsLaserTimeFormatted,
    estimatedBoardLaserTimeFormatted,
    estimatedPlaGrams,
    estimatedPlaPrintMin,
  };
}

// ============================================================================
// 3. Generador de Perfil Dentado Real de Engranaje (Módulo 2.0 mm, MDF 3 mm)
// ============================================================================

export function buildGearToothPolygon(
  teeth: number,
  moduleMm = GEAR_MODULE_MM,
  backlashMm = 0.14
): Vec2[] {
  const rp = (teeth * moduleMm) / 2;
  const ra = rp + 0.92 * moduleMm;
  const rf = Math.max(4.5, rp - 1.2 * moduleMm);

  const pitchStep = (2 * Math.PI) / teeth;
  const halfToothPitchAngle = (Math.PI * moduleMm * 0.5 - backlashMm) / (2 * rp);
  const halfRootAngle = halfToothPitchAngle * 1.26;
  const halfTipAngle = halfToothPitchAngle * 0.62;

  const pts: Vec2[] = [];
  for (let i = 0; i < teeth; i++) {
    const center = i * pitchStep;
    const nextCenter = (i + 1) * pitchStep;

    const aRootL = center - halfRootAngle;
    const aPitchL = center - halfToothPitchAngle;
    const aTipL = center - halfTipAngle;
    const aTipR = center + halfTipAngle;
    const aPitchR = center + halfToothPitchAngle;
    const aRootR = center + halfRootAngle;
    const aValleyMid = (center + halfRootAngle + (nextCenter - halfRootAngle)) / 2;

    pts.push(
      { x: rf * Math.cos(aRootL), y: rf * Math.sin(aRootL) },
      { x: rp * Math.cos(aPitchL), y: rp * Math.sin(aPitchL) },
      { x: ra * Math.cos(aTipL), y: ra * Math.sin(aTipL) },
      { x: ra * Math.cos(aTipR), y: ra * Math.sin(aTipR) },
      { x: rp * Math.cos(aPitchR), y: rp * Math.sin(aPitchR) },
      { x: rf * Math.cos(aRootR), y: rf * Math.sin(aRootR) },
      { x: rf * Math.cos(aValleyMid), y: rf * Math.sin(aValleyMid) }
    );
  }
  return pts;
}

export function gearPolygonToSvgPath(pts: Vec2[]): string {
  if (pts.length === 0) return '';
  return (
    pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`)
      .join(' ') + ' Z'
  );
}

// ============================================================================
// 4. Exportadores SVG para Falcon Design Space (Engranajes + Tablero Matricial)
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateGearsOnlyLaserSvg(gears: PlacedGear[], teamName: string): string {
  const sheetW = 300;
  const margin = 10;
  const topHeader = 16;
  const gap = 5;
  const boreR = GEAR_BORE_DIAMETER_MM / 2;

  let curX = margin;
  let curY = topHeader;
  let rowH = 0;

  const sorted = [...gears].sort(
    (a, b) => GEAR_CATALOG[b.sizeId].outerDiameterMm - GEAR_CATALOG[a.sizeId].outerDiameterMm
  );

  const placed: {
    gear: PlacedGear;
    cx: number;
    cy: number;
    label: string;
    coordLabel: string;
  }[] = [];

  sorted.forEach((g, idx) => {
    const spec = GEAR_CATALOG[g.sizeId];
    const d = spec.outerDiameterMm + 1;
    if (curX + d > sheetW - margin && curX > margin) {
      curX = margin;
      curY += rowH + gap;
      rowH = 0;
    }
    const roleTag =
      g.role === 'start' ? 'INICIO' : g.role === 'end' ? 'META' : `E${idx + 1}`;
    placed.push({
      gear: g,
      cx: Number((curX + d / 2).toFixed(2)),
      cy: Number((curY + d / 2).toFixed(2)),
      label: `${roleTag} ${spec.teeth}T`,
      coordLabel: `(${g.col + 1},${g.row + 1})`,
    });
    curX += d + gap;
    if (d > rowH) rowH = d;
  });

  const totalH = Math.max(115, Math.ceil(curY + rowH + margin));
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}mm" height="${totalH}mm" viewBox="0 0 ${sheetW} ${totalH}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 6 (Falcon Design Space): ${gears.length} Engranajes MDF 3 mm (4/6/8 cm · m=${GEAR_MODULE_MM}mm · eje Ø${GEAR_BORE_DIAMETER_MM}mm) -->`
  );

  lines.push(`  <g id="CAPA_GRABADO_AZUL" fill="#0000FF" stroke="none">`);
  lines.push(
    `    <text x="${margin}" y="8.5" font-family="Arial, sans-serif" font-size="3.3" font-weight="bold">MAKERBOX TALLER 6 · ${gears.length} ENGRANAJES MDF 3MM (4/6/8 CM · EJE Ø${GEAR_BORE_DIAMETER_MM}MM) · ${escapeXml(
      teamName.toUpperCase()
    )}</text>`
  );
  const logoD = buildMakerboxLogoVectorPath(sheetW - 22, 3, 22);
  lines.push(`    <path d="${logoD}" fill="#0000FF" fill-rule="evenodd" />`);

  for (const pg of placed) {
    const spec = GEAR_CATALOG[pg.gear.sizeId];
    const rText = Math.max(8, spec.pitchRadiusMm * 0.56);
    lines.push(
      `    <text x="${pg.cx.toFixed(2)}" y="${(pg.cy + rText).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.7" font-weight="bold">${escapeXml(
        pg.label
      )}</text>`
    );
    lines.push(
      `    <text x="${pg.cx.toFixed(2)}" y="${(pg.cy - rText + 2).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.3" font-weight="bold">Hoyo ${escapeXml(
        pg.coordLabel
      )}</text>`
    );
  }
  lines.push(`  </g>`);

  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  for (const pg of placed) {
    const spec = GEAR_CATALOG[pg.gear.sizeId];
    lines.push(
      `    <circle cx="${pg.cx.toFixed(3)}" cy="${pg.cy.toFixed(3)}" r="${boreR.toFixed(3)}" />`
    );
    if (pg.gear.role === 'start') {
      const offset = Number((spec.pitchRadiusMm * 0.56).toFixed(2));
      lines.push(
        `    <circle cx="${(pg.cx + offset).toFixed(3)}" cy="${pg.cy.toFixed(3)}" r="2.100" />`
      );
    }
    const pts = buildGearToothPolygon(spec.teeth, GEAR_MODULE_MM);
    const polyStr = pts
      .map((p) => `${(pg.cx + p.x).toFixed(3)},${(pg.cy + p.y).toFixed(3)}`)
      .join(' ');
    lines.push(`    <polygon points="${polyStr}" />`);
  }
  lines.push(`  </g>`);
  lines.push(`</svg>`);
  return lines.join('\n');
}

export function generateMatrixPegboardLaserSvg(
  board: GearBoardSpec,
  gears: PlacedGear[],
  mode: 'full_matrix' | 'project_only' = 'full_matrix'
): string {
  const holeR = BOARD_HOLE_DIAMETER_MM / 2;
  const patternName =
    board.matrixPattern === 'triangular' ? 'MATRIZ TRIANGULAR 60°' : 'MATRIZ CUADRADA 90°';

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${board.widthMm}mm" height="${board.heightMm}mm" viewBox="0 0 ${board.widthMm} ${board.heightMm}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 6: Tablero ${board.widthMm}x${board.heightMm} mm · ${patternName} · Paso ${board.gridPitchMm} mm · Hoyos Ø${BOARD_HOLE_DIAMETER_MM} mm -->`
  );

  lines.push(`  <g id="CAPA_GRABADO_AZUL" fill="#0000FF" stroke="none">`);
  lines.push(
    `    <text x="${board.marginMm}" y="10" font-family="Arial, sans-serif" font-size="3.8" font-weight="bold">MAKERBOX · TABLERO ${board.widthMm / 10}×${board.heightMm / 10} CM · ${patternName} (PASO 10 MM)</text>`
  );
  const logoD = buildMakerboxLogoVectorPath(board.widthMm - 34, 4, 26);
  lines.push(`    <path d="${logoD}" fill="#0000FF" fill-rule="evenodd" />`);

  for (let c = 0; c < board.cols; c++) {
    if (c === 0 || (c + 1) % 5 === 0 || c === board.cols - 1) {
      const x = board.marginMm + c * board.gridPitchMm;
      lines.push(
        `    <text x="${x.toFixed(1)}" y="${(board.marginMm - 4.5).toFixed(
          1
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.8" font-weight="bold">${
          c + 1
        }</text>`
      );
    }
  }
  for (let r = 0; r < board.rows; r++) {
    if (r === 0 || (r + 1) % 5 === 0 || r === board.rows - 1) {
      const p = gridToMm(board, 0, r);
      lines.push(
        `    <text x="${(board.marginMm - 6.5).toFixed(1)}" y="${(p.y + 1).toFixed(
          1
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.8" font-weight="bold">${
          r + 1
        }</text>`
      );
    }
  }

  const sPos = gridToMm(board, board.startGrid.col, board.startGrid.row);
  const ePos = gridToMm(board, board.endGrid.col, board.endGrid.row);
  lines.push(
    `    <circle cx="${sPos.x}" cy="${sPos.y}" r="4.8" fill="none" stroke="#0000FF" stroke-width="0.35" />`
  );
  lines.push(
    `    <circle cx="${ePos.x}" cy="${ePos.y}" r="4.8" fill="none" stroke="#0000FF" stroke-width="0.35" />`
  );
  lines.push(`  </g>`);

  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  if (mode === 'full_matrix') {
    for (const h of getAllBoardHoles(board)) {
      lines.push(
        `    <circle cx="${h.x.toFixed(2)}" cy="${h.y.toFixed(2)}" r="${holeR.toFixed(3)}" />`
      );
    }
  } else {
    for (const g of gears) {
      lines.push(
        `    <circle cx="${g.x.toFixed(2)}" cy="${g.y.toFixed(2)}" r="${holeR.toFixed(3)}" />`
      );
    }
  }

  lines.push(
    `    <rect x="0.5" y="0.5" width="${(board.widthMm - 1).toFixed(1)}" height="${(
      board.heightMm - 1
    ).toFixed(1)}" rx="6" ry="6" />`
  );
  lines.push(`  </g>`);
  lines.push(`</svg>`);
  return lines.join('\n');
}

// ============================================================================
// 5. Exportador 3D .STL: Kit de Ejes Escalonados PLA + Manivela (100% 2-Manifold)
// ============================================================================

function pushTri(lines: string[], a: Vec3, b: Vec3, c: Vec3) {
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

function pushQuad(lines: string[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
  pushTri(lines, a, b, c);
  pushTri(lines, a, c, d);
}

function appendSteppedPinSolid(
  lines: string[],
  ox: number,
  oy: number,
  rBase: number,
  hBase: number,
  rShaft: number,
  hTotal: number,
  segs = 24
) {
  const ringBase: Vec2[] = [];
  const ringShaft: Vec2[] = [];
  for (let i = 0; i < segs; i++) {
    const a = (2 * Math.PI * i) / segs;
    const c = Math.cos(a), s = Math.sin(a);
    ringBase.push({ x: ox + rBase * c, y: oy + rBase * s });
    ringShaft.push({ x: ox + rShaft * c, y: oy + rShaft * s });
  }
  const cBot: Vec3 = { x: ox, y: oy, z: 0 };
  const cTop: Vec3 = { x: ox, y: oy, z: hTotal };

  for (let i = 0; i < segs; i++) {
    const inx = (i + 1) % segs;
    const b0 = ringBase[i], b1 = ringBase[inx];
    const s0 = ringShaft[i], s1 = ringShaft[inx];

    pushTri(lines, cBot, { x: b1.x, y: b1.y, z: 0 }, { x: b0.x, y: b0.y, z: 0 });
    pushQuad(
      lines,
      { x: b0.x, y: b0.y, z: 0 },
      { x: b1.x, y: b1.y, z: 0 },
      { x: b1.x, y: b1.y, z: hBase },
      { x: b0.x, y: b0.y, z: hBase }
    );
    pushQuad(
      lines,
      { x: b0.x, y: b0.y, z: hBase },
      { x: b1.x, y: b1.y, z: hBase },
      { x: s1.x, y: s1.y, z: hBase },
      { x: s0.x, y: s0.y, z: hBase }
    );
    pushQuad(
      lines,
      { x: s0.x, y: s0.y, z: hBase },
      { x: s1.x, y: s1.y, z: hBase },
      { x: s1.x, y: s1.y, z: hTotal },
      { x: s0.x, y: s0.y, z: hTotal }
    );
    pushTri(lines, cTop, { x: s0.x, y: s0.y, z: hTotal }, { x: s1.x, y: s1.y, z: hTotal });
  }
}

export function generateGearPinsAndCrankStl(gearCount: number, teamName: string): string {
  const safeName = (teamName || 'Equipo').replace(/[^a-zA-Z0-9]+/g, '_');
  const solidName = `MakerBox_Taller6_EjesPLA_${safeName}`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);

  const totalPins = Math.max(2, gearCount);
  const cols = Math.min(5, totalPins);
  const spacing = 14;

  for (let i = 0; i < totalPins; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    appendSteppedPinSolid(lines, col * spacing, row * spacing, 5.0, 2.0, 2.4, 9.5, 24);
  }

  appendSteppedPinSolid(lines, (cols + 0.35) * spacing, 0, 5.5, 3.0, 1.95, 16.0, 24);

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
