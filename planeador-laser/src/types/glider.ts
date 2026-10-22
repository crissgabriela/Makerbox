export interface GliderParams {
  /** Largo total del fuselaje en mm (Rango en balsa 300x100: 170 a 260 mm) */
  fuselageLengthMm: number;
  /** Envergadura total de las 2 alas en mm (Rango en balsa 300x100: 170 a 260 mm -> 85 a 130 mm c/u) */
  wingspanMm: number;
  /** Ancho (cuerda) del ala en mm (Rango equilibrado: 28 a 45 mm) */
  wingWidthMm: number;
  /** Espesor del material con tolerancia para ranuras en mm (Madera de balsa 3 mm -> 2.95 / 3.00 mm) */
  slotThicknessMm: number;
  /** Si es true, incluye cotas, bordes de lámina 300x100 y etiquetas pedagógicas */
  includeAnnotations?: boolean;
  /** Qué láminas exportar: 'all' (ambas), 'sheet1' (Lámina 1: 300x100), 'sheet2' (Lámina 2: 300x100) */
  targetSheet?: 'all' | 'sheet1' | 'sheet2';
  /** Color de trazo de corte láser (por defecto #FF0000 para LightBurn/RDWorks) */
  cutStrokeColor?: string;
}

export interface AerodynamicData {
  /** Área alar total efectiva de ambas alas en cm² y mm² (considerando factor elíptico de punta 0.892) */
  wingAreaCm2: number;
  wingAreaMm2: number;
  /** Alargamiento alar (Aspect Ratio AR = b² / Sw) */
  aspectRatio: number;
  /** Relación Envergadura / Largo del Fuselaje (equilibrio longitudinal) */
  spanToFuselageRatio: number;
  /** Relación Largo del Fuselaje / Ancho del Ala */
  finenessRatio: number;
  /** Coeficiente de volumen de cola horizontal (VH) para estabilidad de cabeceo */
  tailVolumeCoefficient: number;
  /** Posición recomendada del Centro de Gravedad (CG) medida desde la punta de la nariz (mm) */
  recommendedCgFromNoseMm: number;
  /** Masa total estimada del planeador armado en madera de balsa de 3 mm (densidad ~0.14 g/cm³) */
  estimatedWeightGrams: number;
  /** Carga alar estimada en g/dm² */
  wingLoadingGPerDm2: number;
  /** Velocidad teórica de planeo estable en m/s */
  estimatedGlideSpeedMs: number;
  /** Razón de planeo estimada (L/D: cuántos metros avanza por cada metro que desciende) */
  estimatedGlideRatioLD: number;
  /** Puntaje de equilibrio global (0 a 100) */
  balanceScore: number;
  /** Estado del diseño: 'optimo' | 'estable' | 'advertencia' */
  balanceStatus: 'optimo' | 'estable' | 'advertencia';
  /** Recomendación pedagógica para los estudiantes */
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

/**
 * Límites de diseño equilibrado para planchas de madera de balsa de 300 x 100 x 3 mm
 */
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
  fuselageHeightMm: 44.94,
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
    recommendedCgFromNoseMm: 75.8,
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
