export type GearSizeId = 'm' | 'l' | 'xl';
export type GearChallengeId = 'libre' | 'inversor' | 'velocidad' | 'obstaculo';
export type MatrixPatternId = 'triangular' | 'square';

export interface GearBoardSpec {
  widthMm: number;
  heightMm: number;
  marginMm: number;
  /** Paso matricial exacto entre hoyos en mm (10 mm = 1 cm) */
  gridPitchMm: number;
  matrixPattern: MatrixPatternId;
  cols: number;
  rows: number;
  startGrid: { col: number; row: number };
  endGrid: { col: number; row: number };
}

export const BOARD_SIZE_PRESETS: { label: string; widthCm: number; heightCm: number }[] = [
  { label: '25 × 20 cm', widthCm: 25, heightCm: 20 },
  { label: '30 × 30 cm', widthCm: 30, heightCm: 30 },
  { label: '40 × 30 cm', widthCm: 40, heightCm: 30 },
  { label: '40 × 40 cm', widthCm: 40, heightCm: 40 },
];

/**
 * Módulo m = 2.0 mm con 3 tamaños óptimos (4, 6 y 8 cm):
 * - M (4 cm · 20T): radio = 20 mm = 2 espacios de 10 mm
 * - L (6 cm · 30T): radio = 30 mm = 3 espacios de 10 mm
 * - XL (8 cm · 40T): radio = 40 mm = 4 espacios de 10 mm
 * En Matriz Triangular (60°), TODOS los pares (4+4, 4+6, 4+8, 6+6, 6+8, 8+8) engranan
 * con precisión exacta tanto en horizontal como en diagonales (±60° y ±120°)!
 */
export const GEAR_MODULE_MM = 2.0;
export const GEAR_BORE_DIAMETER_MM = 5.2;  // Orificio central en cada engranaje (giro libre en eje Ø 4.8 mm)
export const BOARD_HOLE_DIAMETER_MM = 5.0; // Perforación en el tablero MDF (calce firme del eje PLA Ø 4.9 mm)

export interface GearCatalogItem {
  id: GearSizeId;
  name: string;
  shortLabel: string;
  teeth: number;
  pitchDiameterMm: number;
  pitchRadiusMm: number;
  /** Radio en unidades de la matriz (2, 3 o 4 espacios de 10 mm) */
  gridRadiusUnits: number;
  outerDiameterMm: number;
  color: string;
}

export const GEAR_CATALOG: Record<GearSizeId, GearCatalogItem> = {
  m: {
    id: 'm',
    name: 'Pequeño (4 cm)',
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
    name: 'Mediano (6 cm)',
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
    name: 'Grande (8 cm)',
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
  GEAR_CATALOG.m,
  GEAR_CATALOG.l,
  GEAR_CATALOG.xl,
];

export interface PlacedGear {
  id: string;
  sizeId: GearSizeId;
  col: number;
  row: number;
  x: number;
  y: number;
  role: 'start' | 'end' | 'idler';
}

export interface BoardObstacle {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
      'Arrastra círculos primitivos (4, 6 u 8 cm) desde la derecha hacia los hoyos verdes (horizontales o diagonales) para conectar la esquina inferior izquierda con la superior derecha.',
    learningGoal:
      'Comprender la tangencia de diámetros primitivos en horizontal y diagonal (60°) sobre una matriz física perforada.',
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
    levelBadge: 'Nivel 2 · Sentido de Giro',
    title: 'Invierte el Sentido (Horario ↻ → Antihorario ↺)',
    description:
      'El Inicio gira en sentido Horario (↻) a 30 RPM. Construye un camino en diagonal o recto que haga girar la Meta en sentido Antihorario (↺). ¡Recuerda la regla par vs. impar!',
    learningGoal:
      'Comprobar la ley de paridad: un tren con cantidad par de engranajes invierte el sentido de giro; uno impar lo conserva.',
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
    levelBadge: 'Nivel 3 · Multiplicador 2×',
    title: 'Duplica la Velocidad (30 → 60 RPM)',
    description:
      'El Inicio es Grande (8 cm · 40T a 30 RPM Horario ↻) y la Meta es Pequeña (4 cm · 20T). Conéctalos para duplicar la velocidad a 60 RPM manteniendo el giro Horario (↻).',
    learningGoal:
      'Aplicar la relación de transmisión exacta (i = Z_inicio / Z_meta = 40 / 20 = 2×) y verificar que las ruedas intermedias no alteran la velocidad final.',
    startSizeId: 'xl',
    endSizeId: 'm',
    startRpm: 30,
    startDirection: 1,
    targetEndDirection: 1,
    targetEndRpmHint: '60 RPM Horario (↻)',
    hasCenterObstacle: false,
  },
  obstaculo: {
    id: 'obstaculo',
    levelBadge: 'Nivel 4 · Trayectoria con Obstáculo',
    title: 'Rodea la Zona Bloqueada',
    description:
      'Una zona bloqueada impide cruzar por el centro del tablero. Combina engranajes de 4, 6 y 8 cm aprovechando los pasos diagonales para bordear el obstáculo hasta la Meta.',
    learningGoal:
      'Planificar trayectorias mecánicas eficientes sobre una matriz física minimizando el número de ruedas a cortar.',
    startSizeId: 'l',
    endSizeId: 'm',
    startRpm: 30,
    startDirection: 1,
    targetEndDirection: null,
    targetEndRpmHint: '45 RPM (relación 1.5×)',
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
