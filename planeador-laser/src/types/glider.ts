export type PlaGliderModelId = 'x1c' | 'b747';

export interface PlaGliderParams {
  modelId: PlaGliderModelId;
  /** Envergadura total de punta a punta de las alas en mm */
  wingspanMm: number;
  /** Largo total del fuselaje desde la nariz hasta la cola en mm */
  fuselageLengthMm: number;
  /** Ancho (cuerda) del ala principal en mm */
  wingChordMm: number;
  /** Ancho central del fuselaje / nariz en mm */
  fuselageWidthMm: number;
}

export interface PlaGliderModelLimits {
  id: PlaGliderModelId;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  wingspan: { min: number; max: number; default: number; step: number };
  fuselageLength: { min: number; max: number; default: number; step: number };
  wingChord: { min: number; max: number; default: number; step: number };
  fuselageWidth: { min: number; max: number; default: number; step: number };
  wingSkinThicknessMm: number;
  ribThicknessMm: number;
  noseHeightMm: number;
  tailHeightMm: number;
  slicerProfileSummary: string;
}

export const PLA_GLIDER_MODELS: Record<PlaGliderModelId, PlaGliderModelLimits> = {
  x1c: {
    id: 'x1c',
    name: 'Planeador Ligero X1C (Ala Recta Nervada)',
    shortName: 'X1C Ala Recta',
    badge: '4.9 g · 25 min · Relleno 100%',
    description:
      'Planeador de alta eficiencia con alas rectas ultra-delgadas (0.2–0.3 mm), nervaduras estructurales de 0.6 mm, contrapeso de nariz integrado con muesca de lanzamiento y estabilizador de cola nervado.',
    wingspan: { min: 140, max: 240, default: 200, step: 2 },
    fuselageLength: { min: 140, max: 220, default: 177, step: 1 },
    wingChord: { min: 22, max: 48, default: 32, step: 1 },
    fuselageWidth: { min: 3.6, max: 7.6, default: 4.6, step: 0.2 },
    wingSkinThicknessMm: 0.25,
    ribThicknessMm: 0.6,
    noseHeightMm: 10.14,
    tailHeightMm: 25.2,
    slicerProfileSummary:
      'PLA · Capas 1–2 a 0.1 mm y resto a 0.2 mm · 2 perímetros · 100% relleno · Sin soportes',
  },
  b747: {
    id: 'b747',
    name: 'Planeador Jet Boeing 747 (Ala en Flecha + Winglets)',
    shortName: 'Boeing 747 Jet',
    badge: '4.6 g · 22 min · Relleno 15%',
    description:
      'Diseño tipo jet comercial con alas en flecha regresiva (0.3 mm de espesor), winglets verticales de 5 mm en puntas de ala y estabilizador, nervio central de rigidez (2 mm) y cabina frontal de contrapeso.',
    wingspan: { min: 120, max: 220, default: 158, step: 2 },
    fuselageLength: { min: 140, max: 220, default: 174, step: 1 },
    wingChord: { min: 24, max: 48, default: 33.5, step: 0.5 },
    fuselageWidth: { min: 11.0, max: 22.0, default: 15.4, step: 0.5 },
    wingSkinThicknessMm: 0.3,
    ribThicknessMm: 2.0,
    noseHeightMm: 5.0,
    tailHeightMm: 14.77,
    slicerProfileSummary:
      'PLA · Altura de capa 0.2 mm · 2 perímetros · 15% relleno · Sin soportes',
  },
};

export interface PlaGliderTelemetry {
  /** Volumen real 3D calculado sobre la malla cerrada (cm³) */
  volumeCm3: number;
  volumeMm3: number;
  /** Masa estimada en gramos de PLA según volumen y perfil de relleno */
  estimatedWeightGrams: number;
  /** Tiempo estimado de impresión en minutos */
  estimatedPrintTimeMin: number;
  /** Longitud estimada de filamento PLA 1.75 mm en metros */
  estimatedFilamentMeters: number;
  /** Área alar proyectada en cm² y mm² */
  wingAreaCm2: number;
  wingAreaMm2: number;
  /** Relación de aspecto (AR = b² / Sw) */
  aspectRatio: number;
  /** Relación Envergadura / Largo del Fuselaje */
  spanToFuselageRatio: number;
  /** Carga alar en g/dm² */
  wingLoadingGPerDm2: number;
  /** Posición real del Centro de Gravedad 3D (CG) desde la nariz (mm) */
  actualCgFromNoseMm: number;
  /** Posición ideal del Centro Aerodinámico / CG óptimo desde la nariz (mm) */
  idealCgFromNoseMm: number;
  /** Desviación del CG en mm (negativo = nariz ligeramente pesada, positivo = cola pesada) */
  cgOffsetMm: number;
  /** Velocidad estimada de planeo (m/s) */
  estimatedGlideSpeedMs: number;
  /** Razón de planeo estimada (L/D) */
  estimatedGlideRatioLD: number;
  /** Puntaje global de equilibrio aerodinámico (0 a 100) */
  balanceScore: number;
  /** Estado del diseño */
  balanceStatus: 'optimo' | 'estable' | 'advertencia';
  /** Explicación del comportamiento de vuelo */
  flightBehaviorSummary: string;
  /** Si cabe recto en una cama estándar de 256x256 mm (X1C/P1S/Prusa/Ender) */
  fitsStandardBed220: boolean;
  /** Si cabe recto en una cama compacta de 180x180 mm (A1 Mini) */
  fitsMiniBed180: boolean;
  /** Número de vértices y triángulos de la malla 3D */
  vertexCount: number;
  triangleCount: number;
  /** Altura máxima en eje Z (mm) */
  maxHeightMm: number;
}

// Legacy types kept for backward compatibility with /api/planeador route
export interface GliderParams {
  fuselageLengthMm: number;
  wingspanMm: number;
  wingWidthMm: number;
  slotThicknessMm: number;
  includeAnnotations?: boolean;
  targetSheet?: 'all' | 'sheet1' | 'sheet2';
  cutStrokeColor?: string;
}

export interface AerodynamicData {
  wingAreaCm2: number;
  wingAreaMm2: number;
  aspectRatio: number;
  spanToFuselageRatio: number;
  finenessRatio: number;
  tailVolumeCoefficient: number;
  recommendedCgFromNoseMm: number;
  unbalancedCgFromNoseMm: number;
  recommendedNoseWeightGrams: number;
  estimatedWeightGrams: number;
  wingLoadingGPerDm2: number;
  estimatedGlideSpeedMs: number;
  estimatedGlideRatioLD: number;
  balanceScore: number;
  balanceStatus: 'optimo' | 'estable' | 'advertencia';
  flightBehaviorSummary: string;
}

export interface GliderMetrics {
  fuselageLengthMm: number;
  fuselageHeightMm: number;
  wingSaddleLengthMm: number;
  wingspanTotalMm: number;
  singleWingLengthMm: number;
  wingWidthMm: number;
  slotThicknessMm: number;
  wingSlotDepthMm: number;
  fuselageWingSlotDepthMm: number;
  fuselageTailSlotDepthMm: number;
  stabilizerSpanMm: number;
  stabilizerChordMm: number;
  stabilizerCenterSlotLengthMm: number;
  dihedralBraceWidthMm: number;
  dihedralAngleDeg: number;
  tailBraceWidthMm: number;
  balsaSheetWidthMm: number;
  balsaSheetHeightMm: number;
  balsaMaterialThicknessMm: number;
  sheetsRequired: 1 | 2;
  sheetWidthMm: number;
  sheetHeightMm: number;
  zeroCrossingsVerified: boolean;
  aerodynamics: AerodynamicData;
}

export interface ProcessedGliderResult {
  svg: string;
  sheet1Svg: string;
  sheet2Svg: string | null;
  metrics: GliderMetrics;
  baseMetrics: GliderMetrics;
}

export const BALSA_DESIGN_LIMITS = {
  sheetWidthMm: 300,
  sheetHeightMm: 100,
  materialThicknessMm: 3.0,
  fuselage: { min: 170, max: 260, default: 230, pdfScaled: 268.75 },
  wingspan: { min: 170, max: 260, default: 240, pdfScaled: 250.0 },
  wingWidth: { min: 28, max: 45, default: 36, pdfScaled: 37.5 },
  slotThickness: { min: 2.8, max: 3.2, default: 2.95, nominal: 3.0 },
};

export const BASE_GLIDER_PARAMS: GliderMetrics = {
  fuselageLengthMm: 230.0,
  fuselageHeightMm: 46.94,
  wingSaddleLengthMm: 36.0,
  wingspanTotalMm: 240.0,
  singleWingLengthMm: 120.0,
  wingWidthMm: 36.0,
  slotThicknessMm: 2.95,
  wingSlotDepthMm: 12.5,
  fuselageWingSlotDepthMm: 6.25,
  fuselageTailSlotDepthMm: 3.0,
  stabilizerSpanMm: 100.03,
  stabilizerChordMm: 25.0,
  stabilizerCenterSlotLengthMm: 18.75,
  dihedralBraceWidthMm: 32.0,
  dihedralAngleDeg: 7.5,
  tailBraceWidthMm: 23.3,
  balsaSheetWidthMm: 300.0,
  balsaSheetHeightMm: 100.0,
  balsaMaterialThicknessMm: 3.0,
  sheetsRequired: 2,
  sheetWidthMm: 300.0,
  sheetHeightMm: 215.0,
  zeroCrossingsVerified: true,
  aerodynamics: {
    wingAreaCm2: 77.07,
    wingAreaMm2: 7706.88,
    aspectRatio: 7.47,
    spanToFuselageRatio: 1.04,
    finenessRatio: 6.39,
    tailVolumeCoefficient: 0.48,
    recommendedCgFromNoseMm: 57.0,
    unbalancedCgFromNoseMm: 94.2,
    recommendedNoseWeightGrams: 4.5,
    estimatedWeightGrams: 6.8,
    wingLoadingGPerDm2: 8.82,
    estimatedGlideSpeedMs: 3.4,
    estimatedGlideRatioLD: 8.6,
    balanceScore: 96,
    balanceStatus: 'optimo',
    flightBehaviorSummary:
      'Equilibrio aerodinámico óptimo: excelente sustentación, centro de gravedad estable y planeo largo y recto.',
  },
};
