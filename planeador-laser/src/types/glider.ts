export interface GliderParams {
  /** Largo total del fuselaje en mm (Base PDF: 546.10 mm) */
  fuselageLengthMm: number;
  /** Envergadura total de las 2 alas en mm (Base PDF: 508.00 mm -> 254.00 mm cada ala) */
  wingspanMm: number;
  /** Ancho (cuerda) del ala en mm (Base PDF: 76.20 mm) */
  wingWidthMm: number;
  /** Espesor del material para las ranuras de ensamble en mm (Fijo en PDF: 3.175 mm) */
  slotThicknessMm: number;
  /** Si es true, incluye cotas y etiquetas pedagógicas (modo previsualización) */
  includeAnnotations?: boolean;
  /** Color de trazo de corte láser (por defecto #FF0000 para LightBurn/RDWorks) */
  cutStrokeColor?: string;
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
  sheetWidthMm: number;
  sheetHeightMm: number;
}

export interface ProcessedGliderResult {
  svg: string;
  metrics: GliderMetrics;
  baseMetrics: GliderMetrics;
}

/**
 * Parámetros base extraídos matemáticamente del PDF original (1728 x 576 pt @ 72 pt/in)
 */
export const BASE_GLIDER_PARAMS: GliderMetrics = {
  fuselageLengthMm: 546.10,
  fuselageHeightMm: 91.31,
  wingSaddleLengthMm: 76.20,
  wingspanTotalMm: 508.00,
  singleWingLengthMm: 254.00,
  wingWidthMm: 76.20,
  slotThicknessMm: 3.175,
  wingSlotDepthMm: 25.40,
  fuselageWingSlotDepthMm: 12.70,
  fuselageTailSlotDepthMm: 4.7625,
  stabilizerSpanMm: 203.26,
  stabilizerChordMm: 50.80,
  stabilizerCenterSlotLengthMm: 38.10,
  dihedralBraceWidthMm: 62.17,
  dihedralAngleDeg: 7.5,
  tailBraceWidthMm: 44.45,
  sheetWidthMm: 609.60,
  sheetHeightMm: 203.20,
};
