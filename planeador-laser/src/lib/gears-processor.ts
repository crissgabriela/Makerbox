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

export function gridToMm(board: GearBoardSpec, col: number, row: number): { x: number; y: number } {
  return {
    x: board.marginMm + col * board.gridPitchMm,
    y: board.marginMm + row * board.gridPitchMm,
  };
}

export function getChallengeObstacles(
  challenge: GearChallengeConfig,
  board: GearBoardSpec
): BoardObstacle[] {
  if (!challenge.hasCenterObstacle) return [];
  const midC = Math.floor(board.cols / 2);
  const midR = Math.floor(board.rows / 2);
  const span = board.id === '40x40' ? 9 : 7;
  const half = Math.floor(span / 2);
  return [
    {
      id: 'obs-center',
      label: 'ZONA BLOQUEADA',
      colStart: midC - half,
      rowStart: midR - half,
      colSpan: span,
      rowSpan: span,
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
// 1. Cálculo de Hoyos Tangentes Exactos en la Matriz (Ortogonales + Pitagóricos 3-4-5)
// ============================================================================

/**
 * Encuentra todos los hoyos válidos (col, row) de la matriz donde un engranaje de tamaño `sizeId`
 * queda EXACTAMENTE tangente a al menos un engranaje existente sin chocar con ningún otro ni salirse del tablero.
 */
export function findValidTangentHoles(
  sizeId: GearSizeId,
  otherGears: PlacedGear[],
  board: GearBoardSpec,
  obstacles: BoardObstacle[]
): { col: number; row: number; x: number; y: number; tangentCount: number }[] {
  const rUnits = GEAR_CATALOG[sizeId].gridRadiusUnits;
  const rMm = GEAR_CATALOG[sizeId].pitchRadiusMm;
  const candidateMap = new Map<string, { col: number; row: number; tangentCount: number }>();

  for (const g of otherGears) {
    const targetUnits = GEAR_CATALOG[g.sizeId].gridRadiusUnits + rUnits;
    const targetSq = targetUnits * targetUnits;

    // Buscar desplazamientos enteros (dc, dr) tales que dc^2 + dr^2 === targetUnits^2
    // Incluye ortogonales (±targetUnits, 0), (0, ±targetUnits) Y diagonales exactas (ej. (±3, ±4) para suma = 5!)
    for (let dc = -targetUnits; dc <= targetUnits; dc++) {
      const rem = targetSq - dc * dc;
      if (rem < 0) continue;
      const dr = Math.round(Math.sqrt(rem));
      if (dr * dr !== rem) continue;

      const drOpts = dr === 0 ? [0] : [dr, -dr];
      for (const dRow of drOpts) {
        const col = g.col + dc;
        const row = g.row + dRow;
        if (col < rUnits || col > board.cols - 1 - rUnits) continue;
        if (row < rUnits || row > board.rows - 1 - rUnits) continue;

        const key = `${col},${row}`;
        const prev = candidateMap.get(key);
        if (prev) prev.tangentCount += 1;
        else candidateMap.set(key, { col, row, tangentCount: 1 });
      }
    }
  }

  const valid: { col: number; row: number; x: number; y: number; tangentCount: number }[] = [];
  for (const cand of candidateMap.values()) {
    const { x, y } = gridToMm(board, cand.col, cand.row);
    // Verificar que no choque con ningún otro engranaje ni obstáculo
    let collides = false;
    for (const g of otherGears) {
      const dist = Math.hypot(x - g.x, y - g.y);
      const minAllowed = GEAR_CATALOG[g.sizeId].pitchRadiusMm + rMm - 0.5;
      if (dist < minAllowed) {
        collides = true;
        break;
      }
    }
    if (collides) continue;
    for (const obs of obstacles) {
      if (circleIntersectsObstacle(x, y, rMm + 1.5, obs, board)) {
        collides = true;
        break;
      }
    }
    if (!collides) {
      valid.push({ ...cand, x, y });
    }
  }
  return valid;
}

/**
 * Ajusta cualquier coordenada arrastrada (rawX, rawY) al hoyo entero más cercano de la matriz,
 * dando prioridad magnética a los hoyos tangentes exactos si el cursor está cerca.
 */
export function snapGearToMatrix(
  rawX: number,
  rawY: number,
  sizeId: GearSizeId,
  otherGears: PlacedGear[],
  board: GearBoardSpec,
  obstacles: BoardObstacle[]
): { col: number; row: number; x: number; y: number; isExactTangent: boolean } {
  const validHoles = findValidTangentHoles(sizeId, otherGears, board, obstacles);
  let bestTangent: { col: number; row: number; x: number; y: number; dist: number; bonus: number } | null = null;

  for (const h of validHoles) {
    const dist = Math.hypot(h.x - rawX, h.y - rawY);
    const threshold = h.tangentCount >= 2 ? 18 : 13;
    if (dist <= threshold) {
      const score = dist - (h.tangentCount >= 2 ? 4 : 0);
      if (!bestTangent || score < bestTangent.bonus) {
        bestTangent = { col: h.col, row: h.row, x: h.x, y: h.y, dist, bonus: score };
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
    };
  }

  // Si no está cerca de un hoyo tangente, ajustar al hoyo matricial más cercano
  const rUnits = GEAR_CATALOG[sizeId].gridRadiusUnits;
  const col = Math.max(
    rUnits,
    Math.min(board.cols - 1 - rUnits, Math.round((rawX - board.marginMm) / board.gridPitchMm))
  );
  const row = Math.max(
    rUnits,
    Math.min(board.rows - 1 - rUnits, Math.round((rawY - board.marginMm) / board.gridPitchMm))
  );
  const pos = gridToMm(board, col, row);
  return { col, row, x: pos.x, y: pos.y, isExactTangent: false };
}

// ============================================================================
// 2. Motor Cinemático y Detección de Colisiones / Trabas Mecánicas
// ============================================================================

function circleIntersectsObstacle(
  cx: number,
  cy: number,
  r: number,
  obs: BoardObstacle,
  board: GearBoardSpec
): boolean {
  const rx = board.marginMm + obs.colStart * board.gridPitchMm;
  const ry = board.marginMm + obs.rowStart * board.gridPitchMm;
  const rw = obs.colSpan * board.gridPitchMm;
  const rh = obs.rowSpan * board.gridPitchMm;
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  return Math.hypot(cx - closestX, cy - closestY) < r - 0.5;
}

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
    const outerR = spec.outerDiameterMm / 2;

    if (
      g.x - outerR < 2 ||
      g.x + outerR > board.widthMm - 2 ||
      g.y - outerR < 2 ||
      g.y + outerR > board.heightMm - 2
    ) {
      outOfBoundsIds.push(g.id);
    }

    for (const obs of obstacles) {
      if (circleIntersectsObstacle(g.x, g.y, spec.pitchRadiusMm + 1.5, obs, board)) {
        obstacleCollisions.push(g.id);
        break;
      }
    }
  }

  // En la matriz de 10 mm, la tangencia exacta tiene |dist - (ra + rb)| < 0.05 mm
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
            '¡Tren mecánico trabado! Se formó un ciclo impar (ej. 3 engranajes tocándose entre sí) que intenta girar un engranaje en ambos sentidos a la vez.';
        }
      }
    }
  }

  if (collisionPairs.length > 0) {
    isJammed = true;
    jamReason =
      'Hay círculos primitivos superpuestos en la matriz. Muévelos a un hoyo verde (tangencia exacta).';
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
    'Haz clic en un tamaño a la derecha o arrástralo hacia los hoyos verdes (tangentes exactos) para conectar Inicio con Meta.';
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
      statusMessage = `¡Conectaste la Meta (${endRpm} RPM ${gotTxt}), pero el desafío pide sentido ${wantTxt}! Cambia la cantidad de ruedas (par vs. impar) para invertir el giro.`;
      statusType = 'warning';
    } else {
      challengeCompleted = true;
      const dirTxt = endDirection === 1 ? 'Horario (↻)' : 'Antihorario (↺)';
      statusMessage = `¡Desafío logrado! Tu tren gira continuamente hasta la Meta a ${endRpm} RPM (${dirTxt}). Ya puedes cortar tus engranajes (.SVG) y montarlos en el tablero matricial con los ejes PLA (.STL).`;
      statusType = 'success';
    }
  } else if (gears.length > 2) {
    const connectedCount = Object.values(nodes).filter((n) => n.connectedToStart).length;
    statusMessage = `Tienes ${connectedCount} de ${gears.length} engranajes girando desde el Inicio. Ubica nuevos círculos en los hoyos verdes hasta alcanzar la Meta.`;
    statusType = 'info';
  }

  // Tiempos estimados (separando el corte rápido de engranajes vs el tablero reutilizable)
  const gearsPerimMm = gears.reduce((acc, g) => {
    const spec = GEAR_CATALOG[g.sizeId];
    return acc + spec.pitchDiameterMm * Math.PI * 1.95 + Math.PI * GEAR_BORE_DIAMETER_MM;
  }, 0);
  const gearsLaserSec = Math.max(30, Math.round(gearsPerimMm / 8.5 + gears.length * 4));
  const gMin = Math.floor(gearsLaserSec / 60);
  const gSec = gearsLaserSec % 60;
  const estimatedGearsLaserTimeFormatted = gMin > 0 ? `${gMin} min ${gSec} s` : `${gSec} s`;

  const totalBoardHoles = board.cols * board.rows;
  const boardPerimMm =
    2 * (board.widthMm + board.heightMm) + totalBoardHoles * Math.PI * BOARD_HOLE_DIAMETER_MM;
  const boardLaserMin = Math.max(5, Math.round(boardPerimMm / (11.0 * 60)));
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
// 4. Exportador SVG 1: SOLO ENGRANAJES DEL TREN (Corte ultra-rápido MDF 3 mm)
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateGearsOnlyLaserSvg(
  gears: PlacedGear[],
  teamName: string
): string {
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

  const totalH = Math.max(110, Math.ceil(curY + rowH + margin));
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}mm" height="${totalH}mm" viewBox="0 0 ${sheetW} ${totalH}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 6 (Falcon Design Space): ${gears.length} Engranajes MDF 3 mm (m=${GEAR_MODULE_MM}mm, orificio central Ø${GEAR_BORE_DIAMETER_MM}mm) -->`
  );

  // Capa Grabado Azul (#0000FF)
  lines.push(`  <g id="CAPA_GRABADO_AZUL" fill="#0000FF" stroke="none">`);
  lines.push(
    `    <text x="${margin}" y="8.5" font-family="Arial, sans-serif" font-size="3.3" font-weight="bold">MAKERBOX TALLER 6 · ${gears.length} ENGRANAJES MDF 3MM (MÓDULO ${GEAR_MODULE_MM}MM · EJE Ø${GEAR_BORE_DIAMETER_MM}MM) · ${escapeXml(
      teamName.toUpperCase()
    )}</text>`
  );
  const logoD = buildMakerboxLogoVectorPath(sheetW - 22, 3, 22);
  lines.push(`    <path d="${logoD}" fill="#0000FF" fill-rule="evenodd" />`);

  for (const pg of placed) {
    const spec = GEAR_CATALOG[pg.gear.sizeId];
    const rText = Math.max(5.5, spec.pitchRadiusMm * 0.56);
    const fontSize = spec.teeth <= 10 ? 2.1 : 2.7;
    lines.push(
      `    <text x="${pg.cx.toFixed(2)}" y="${(pg.cy + rText).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${escapeXml(
        pg.label
      )}</text>`
    );
    if (spec.teeth >= 20) {
      lines.push(
        `    <text x="${pg.cx.toFixed(2)}" y="${(pg.cy - rText + 2).toFixed(
          2
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.3" font-weight="bold">Hoyo ${escapeXml(
          pg.coordLabel
        )}</text>`
      );
    }
  }
  lines.push(`  </g>`);

  // Capa Corte Rojo (#FF0000, 0.1 mm): primero orificios interiores, luego dientes exteriores
  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  for (const pg of placed) {
    const spec = GEAR_CATALOG[pg.gear.sizeId];
    // 1. Orificio central del eje
    lines.push(
      `    <circle cx="${pg.cx.toFixed(3)}" cy="${pg.cy.toFixed(3)}" r="${boreR.toFixed(3)}" />`
    );
    // 2. Orificio excéntrico Ø 4.2 mm para la manivela en el engranaje de Inicio
    if (pg.gear.role === 'start' && spec.pitchRadiusMm >= 14) {
      const offset = Number((spec.pitchRadiusMm * 0.56).toFixed(2));
      lines.push(
        `    <circle cx="${(pg.cx + offset).toFixed(3)}" cy="${pg.cy.toFixed(3)}" r="2.100" />`
      );
    }
    // 3. Contorno exterior dentado exacto
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

// ============================================================================
// 5. Exportador SVG 2: TABLERO MATRICIAL PERFORADO REUTILIZABLE (30x30 o 40x40 cm)
// ============================================================================

export function generateMatrixPegboardLaserSvg(
  board: GearBoardSpec,
  gears: PlacedGear[],
  mode: 'full_matrix' | 'project_only' = 'full_matrix'
): string {
  const holeR = BOARD_HOLE_DIAMETER_MM / 2;
  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${board.widthMm}mm" height="${board.heightMm}mm" viewBox="0 0 ${board.widthMm} ${board.heightMm}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 6: Tablero Matricial ${board.widthMm}x${board.heightMm} mm · Paso ${board.gridPitchMm} mm · Perforaciones Ø${BOARD_HOLE_DIAMETER_MM} mm -->`
  );

  // Capa Grabado Azul (#0000FF): Coordenadas de columnas/filas y logo MakerBox
  lines.push(`  <g id="CAPA_GRABADO_AZUL" fill="#0000FF" stroke="none">`);
  lines.push(
    `    <text x="${board.marginMm}" y="10" font-family="Arial, sans-serif" font-size="4.0" font-weight="bold">MAKERBOX · TABLERO MATRICIAL DE ENGRANAJES (${board.widthMm / 10}×${board.heightMm / 10} CM · PASO 10 MM)</text>`
  );
  const logoD = buildMakerboxLogoVectorPath(board.widthMm - 34, 4, 26);
  lines.push(`    <path d="${logoD}" fill="#0000FF" fill-rule="evenodd" />`);

  // Numeración cada 5 columnas y filas en los bordes del tablero para ubicar ejes fácilmente
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
      const y = board.marginMm + r * board.gridPitchMm;
      lines.push(
        `    <text x="${(board.marginMm - 6.5).toFixed(1)}" y="${(y + 1).toFixed(
          1
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.8" font-weight="bold">${
          r + 1
        }</text>`
      );
    }
  }

  // Marcar INICIO y META sobre el tablero
  const sPos = gridToMm(board, board.startGrid.col, board.startGrid.row);
  const ePos = gridToMm(board, board.endGrid.col, board.endGrid.row);
  lines.push(
    `    <circle cx="${sPos.x}" cy="${sPos.y}" r="4.6" fill="none" stroke="#0000FF" stroke-width="0.35" />`
  );
  lines.push(
    `    <circle cx="${ePos.x}" cy="${ePos.y}" r="4.6" fill="none" stroke="#0000FF" stroke-width="0.35" />`
  );
  lines.push(`  </g>`);

  // Capa Corte Rojo (#FF0000, 0.1 mm): Perforaciones de matriz y borde exterior
  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  if (mode === 'full_matrix') {
    for (let r = 0; r < board.rows; r++) {
      const cy = board.marginMm + r * board.gridPitchMm;
      for (let c = 0; c < board.cols; c++) {
        const cx = board.marginMm + c * board.gridPitchMm;
        lines.push(
          `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${holeR.toFixed(3)}" />`
        );
      }
    }
  } else {
    for (const g of gears) {
      lines.push(
        `    <circle cx="${g.x.toFixed(2)}" cy="${g.y.toFixed(2)}" r="${holeR.toFixed(3)}" />`
      );
    }
  }

  // Contorno exterior del tablero rectangular
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
// 6. Exportador 3D .STL: Kit de Ejes Escalonados PLA + Manivela (100% 2-Manifold)
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

/**
 * Genera un eje de 2 escalones (sólido 100% cerrado 2-manifold apoyado sobre Z = 0):
 * - Base ancha inferior (Z=0 -> hBase): tope que apoya bajo el tablero MDF.
 * - Vástago de giro (Z=hBase -> hTotal): atraviesa el tablero (3 mm) y sostiene el engranaje (3 mm) con giro libre.
 */
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

/**
 * Genera el archivo .STL con:
 * - `gearCount` ejes PLA (Base Ø 10 mm × 2 mm + Eje Ø 4.8 mm × 9.5 mm) que encajan en los hoyos Ø 5.0 mm
 *   del tablero matricial y dejan girar libremente los engranajes de orificio central Ø 5.2 mm.
 * - 1 manivela ergonómica (Base Ø 11 mm × 3 mm + Mango Ø 3.9 mm × 16 mm) para el engranaje de Inicio.
 */
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

  // Perilla / Manivela para el orificio excéntrico Ø 4.2 mm del engranaje de inicio
  appendSteppedPinSolid(lines, (cols + 0.35) * spacing, 0, 5.5, 3.0, 1.95, 16.0, 24);

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
