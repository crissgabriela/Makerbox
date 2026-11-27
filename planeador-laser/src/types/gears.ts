export type GearSizeId = 's' | 'm' | 'l' | 'xl';
export type GearChallengeId = 'libre' | 'inversor' | 'velocidad' | 'obstaculo';
export type GearBoardPresetId = '30x30' | '40x40';

export interface GearBoardSpec {
  id: GearBoardPresetId;
  label: string;
  widthMm: number;
  heightMm: number;
  marginMm: number;
  /** Paso matricial exacto entre hoyos en mm (10 mm = 1 cm) */
  gridPitchMm: number;
  cols: number;
  rows: number;
  startGrid: { col: number; row: number };
  endGrid: { col: number; row: number };
}

export const GEAR_BOARD_PRESETS: Record<GearBoardPresetId, GearBoardSpec> = {
  '30x30': {
    id: '30x30',
    label: 'Tablero 30 × 30 cm (Matriz 27 × 27)',
    widthMm: 300,
    heightMm: 300,
    marginMm: 20,
    gridPitchMm: 10,
    cols: 27, // índices 0..26 => x = 20..280 mm
    rows: 27, // índices 0..26 => y = 20..280 mm
    startGrid: { col: 4, row: 22 }, // Esquina inferior izquierda (x=60, y=240 mm)
    endGrid: { col: 22, row: 4 },   // Esquina superior derecha (x=240, y=60 mm)
  },
  '40x40': {
    id: '40x40',
    label: 'Tablero 40 × 40 cm (Matriz 37 × 37)',
    widthMm: 400,
    heightMm: 400,
    marginMm: 20,
    gridPitchMm: 10,
    cols: 37, // índices 0..36 => x = 20..380 mm
    rows: 37, // índices 0..36 => y = 20..380 mm
    startGrid: { col: 5, row: 31 }, // Esquina inferior izquierda (x=70, y=330 mm)
    endGrid: { col: 31, row: 5 },   // Esquina superior derecha (x=330, y=70 mm)
  },
};

/**
 * Módulo m = 2.0 mm con Z = 10, 20, 30, 40 dientes:
 * - Diámetros primitivos: 20 mm (2 cm), 40 mm (4 cm), 60 mm (6 cm), 80 mm (8 cm)
 * - Radios primitivos: 10, 20, 30, 40 mm = 1G, 2G, 3G, 4G (múltiplos EXACTOS del paso matricial G = 10 mm!)
 * - TODAS las parejas (S+S, S+M, M+L, L+XL, etc.) engranan EXACTAMENTE en horizontal y vertical,
 *   y además M+L (20+30=50mm) y S+XL (10+40=50mm) engranan EXACTAMENTE en diagonal pitagórica (3,4,5)!
 */
export const GEAR_MODULE_MM = 2.0;
export const GEAR_BORE_DIAMETER_MM = 5.2;      // Orificio central en cada engranaje (giro libre en eje Ø 4.8 mm)
export const BOARD_HOLE_DIAMETER_MM = 5.0;     // Perforación en el tablero MDF (calce firme del eje PLA Ø 4.9 mm)

export interface GearCatalogItem {
  id: GearSizeId;
  name: string;
  shortLabel: string;
  teeth: number;
  /** Diámetro primitivo exacto en mm (D_p = module * teeth) */
  pitchDiameterMm: number;
  pitchRadiusMm: number;
  /** Radio en unidades de la matriz (1, 2, 3 o 4 espacios de 10 mm) */
  gridRadiusUnits: number;
  /** Diámetro exterior en mm (D_e = D_p + 2 * module) */
  outerDiameterMm: number;
  color: string;
}

export const GEAR_CATALOG: Record<GearSizeId, GearCatalogItem> = {
  s: {
    id: 's',
    name: 'Pequeño (S)',
    shortLabel: '2 cm · 10T',
    teeth: 10,
    pitchDiameterMm: 20,
    pitchRadiusMm: 10,
    gridRadiusUnits: 1,
    outerDiameterMm: 24,
    color: '#f59e0b',
  },
  m: {
    id: 'm',
    name: 'Mediano (M)',
    shortLabel: '4 cm · 20T',
    teeth: 20,
    pitchDiameterMm: 40,
    pitchRadiusMm: 20,
    gridRadiusUnits: 2,
    outerDiameterMm: 44,
    color: '#0ea5e9',
  },
  l: {
    id: 'l',
    name: 'Grande (L)',
    shortLabel: '6 cm · 30T',
    teeth: 30,
    pitchDiameterMm: 60,
    pitchRadiusMm: 30,
    gridRadiusUnits: 3,
    outerDiameterMm: 64,
    color: '#10b981',
  },
  xl: {
    id: 'xl',
    name: 'Extra Grande (XL)',
    shortLabel: '8 cm · 40T',
    teeth: 40,
    pitchDiameterMm: 80,
    pitchRadiusMm: 40,
    gridRadiusUnits: 4,
    outerDiameterMm: 84,
    color: '#8b5cf6',
  },
};

export const GEAR_CATALOG_LIST: GearCatalogItem[] = [
  GEAR_CATALOG.s,
  GEAR_CATALOG.m,
  GEAR_CATALOG.l,
  GEAR_CATALOG.xl,
];

export interface PlacedGear {
  id: string;
  sizeId: GearSizeId;
  /** Coordenadas enteras en la matriz del tablero (col: 0..cols-1, row: 0..rows-1) */
  col: number;
  row: number;
  /** Coordenadas físicas en mm sobre el tablero (x = margin + col*10, y = margin + row*10) */
  x: number;
  y: number;
  role: 'start' | 'end' | 'idler';
}

export interface BoardObstacle {
  id: string;
  label: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
}

export interface GearChallengeConfig {
  id: GearChallengeId;
  levelBadge: string;
  title: string;
  description: string;
  learningGoal: string;
  startSizeId: GearSizeId;
  endSizeId: GearSizeId;
  startRpm: number;
  /** +1 = Horario (CW), -1 = Antihorario (CCW) */
  startDirection: 1 | -1;
  /** null = cualquier sentido */
  targetEndDirection: 1 | -1 | null;
  targetEndRpmHint: string | null;
  hasCenterObstacle: boolean;
}

export const GEAR_CHALLENGES: Record<GearChallengeId, GearChallengeConfig> = {
  libre: {
    id: 'libre',
    levelBadge: 'Nivel 1 · Explorador',
    title: 'Conecta Inicio y Meta (Camino Libre)',
    description:
      'Toma círculos primitivos desde la derecha (2, 4, 6 u 8 cm) y ubícalos en los hoyos de la matriz para conectar la esquina inferior izquierda (Inicio) con la esquina superior derecha (Meta) y hacer girar todo el tren.',
    learningGoal:
      'Comprender que dos engranajes engranan exactamente en una matriz cuando la distancia entre sus hoyos equivale a la suma de sus radios primitivos (R1 + R2).',
    startSizeId: 'm',
    endSizeId: 'm',
    startRpm: 30,
    startDirection: 1,
    targetEndDirection: null,
    targetEndRpmHint: null,
    hasCenterObstacle: false,
  },
  inversor: {
    id: 'inversor',
    levelBadge: 'Nivel 2 · Inversor de Giro',
    title: 'Invierte el Sentido (Horario ↻ → Antihorario ↺)',
    description:
      'El Inicio gira en sentido Horario (↻) a 30 RPM. Construye un camino de círculos tangentes sobre la matriz que haga girar la Meta en sentido Antihorario (↺). ¡Pista: cuenta si el total de engranajes es par o impar!',
    learningGoal:
      'Comprobar la ley de paridad de un tren de engranajes: una cantidad par de ruedas invierte el giro; una impar lo conserva.',
    startSizeId: 'm',
    endSizeId: 'm',
    startRpm: 30,
    startDirection: 1,
    targetEndDirection: -1,
    targetEndRpmHint: '30 RPM Antihorario (↺)',
    hasCenterObstacle: false,
  },
  velocidad: {
    id: 'velocidad',
    levelBadge: 'Nivel 3 · Multiplicador 4×',
    title: 'Multiplica la Velocidad (20 → 80 RPM)',
    description:
      'El Inicio es Extra Grande (XL · 8 cm · 40T a 20 RPM Horario ↻) y la Meta es Pequeña (S · 2 cm · 10T). Conéctalos sobre la matriz para lograr 80 RPM (4 veces más rápido) en sentido Horario (↻).',
    learningGoal:
      'Aplicar la relación de transmisión exacta (i = Z_inicio / Z_meta = 40 / 10 = 4×) y usar la diagonal pitagórica 3-4-5 (M+L o S+XL = 5 cm).',
    startSizeId: 'xl',
    endSizeId: 's',
    startRpm: 20,
    startDirection: 1,
    targetEndDirection: 1,
    targetEndRpmHint: '80 RPM Horario (↻)',
    hasCenterObstacle: false,
  },
  obstaculo: {
    id: 'obstaculo',
    levelBadge: 'Nivel 4 · Trayectoria con Obstáculo',
    title: 'Rodea la Zona Bloqueada',
    description:
      'Un obstáculo bloquea el centro del tablero matricial. Combina engranajes de 2, 4, 6 y 8 cm para bordearlo por arriba o por abajo y activar la Meta sin colisiones.',
    learningGoal:
      'Optimizar el trazado mecánico sobre una retícula física de perforaciones minimizando el número de piezas y el tiempo de corte láser.',
    startSizeId: 'l',
    endSizeId: 's',
    startRpm: 20,
    startDirection: 1,
    targetEndDirection: null,
    targetEndRpmHint: '60 RPM (relación 3×)',
    hasCenterObstacle: true,
  },
};

export interface GearKinematicsNode {
  id: string;
  connectedToStart: boolean;
  rpm: number;
  direction: 1 | -1 | 0;
  phaseOffsetRad: number;
  stepFromStart: number;
}

export interface GearTrainAnalysis {
  nodes: Record<string, GearKinematicsNode>;
  meshingEdges: [string, string][];
  collisionPairs: [string, string][];
  obstacleCollisions: string[];
  outOfBoundsIds: string[];
  isJammed: boolean;
  jamReason: string | null;
  endReached: boolean;
  endRpm: number;
  endDirection: 1 | -1 | 0;
  transmissionRatio: number;
  challengeCompleted: boolean;
  statusMessage: string;
  statusType: 'success' | 'warning' | 'error' | 'info';
  estimatedGearsLaserTimeFormatted: string;
  estimatedBoardLaserTimeFormatted: string;
  estimatedPlaGrams: number;
  estimatedPlaPrintMin: number;
}
