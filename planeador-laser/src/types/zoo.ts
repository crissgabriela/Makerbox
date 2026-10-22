export interface ZooParams {
  /** Contenido XML del archivo SVG subido por el estudiante */
  svgContent: string;
  /** Altura deseada final del animal en mm (ej. 40 a 95 mm para caber vertical en balsa de 100 mm, o hasta 180 mm) */
  targetHeightMm: number;
  /** Espesor del material para el ancho de las 2 ranuras en mm (3 mm madera de balsa 300x100 mm) */
  materialThicknessMm: number;
  /** Profundidad fija de las ranuras en mm (por defecto 15 mm) */
  slotDepthMm?: number;
  /** Posición horizontal relativa (15% a 85%) de la primera ranura respecto al ancho de la base */
  slot1Ratio?: number;
  /** Posición horizontal relativa (15% a 85%) de la segunda ranura respecto al ancho de la base */
  slot2Ratio?: number;
  /** Si es true, incluye las 2 bases de soporte (patitas encastrables) en la lámina de 300x100 mm */
  includeStandBases?: boolean;
  /** Si es true, incluye cotas, borde guía de la plancha de balsa 300x100 mm y etiquetas en la vista previa */
  includeAnnotations?: boolean;
}

export interface ZooMetrics {
  originalWidth: number;
  originalHeight: number;
  scaledWidthMm: number;
  scaledHeightMm: number;
  scaleFactor: number;
  materialThicknessMm: number;
  slotDepthMm: number;
  slot1CenterXMm: number;
  slot2CenterXMm: number;
  balsaSheetWidthMm: number;
  balsaSheetHeightMm: number;
  fitsInStandardBalsaSheet: boolean;
  closedPathsCount: number;
  internalFacetPathsCount: number;
}

export interface ProcessedZooResult {
  svg: string;
  metrics: ZooMetrics;
}

export interface ZooPresetAnimal {
  id: string;
  name: string;
  emoji: string;
  description: string;
  defaultHeightMm: number;
  slot1Ratio: number;
  slot2Ratio: number;
  svg: string;
}

/**
 * Siluetas Low-Poly predefinidas con base plana y facetas internas opcionales para prueba inmediata en el taller
 */
export const ZOO_PRESET_ANIMALS: ZooPresetAnimal[] = [
  {
    id: 'zorro',
    name: 'Zorro Culpeo Low-Poly',
    emoji: '🦊',
    description: 'Silueta geométrica de zorro sentado con facetas poligonales.',
    defaultHeightMm: 82,
    slot1Ratio: 0.32,
    slot2Ratio: 0.72,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">
      <path id="silueta" d="M 22 135 L 14 102 L 20 68 L 16 32 L 36 44 L 54 40 L 72 16 L 80 46 L 102 60 L 86 76 L 94 106 L 108 118 L 98 135 Z" fill="none" stroke="#FF0000" stroke-width="1"/>
      <path id="facetas" data-layer="engrave" d="M 36 44 L 52 66 L 20 68 M 54 40 L 52 66 L 80 46 M 52 66 L 86 76 L 62 98 L 22 135 M 52 66 L 62 98 L 94 106 M 20 68 L 62 98 L 14 102" fill="none" stroke="#0000FF" stroke-width="0.6"/>
    </svg>`,
  },
  {
    id: 'oso',
    name: 'Oso Geométrico Low-Poly',
    emoji: '🐻',
    description: 'Oso robusto caminante con amplia base de apoyo para las 2 ranuras.',
    defaultHeightMm: 78,
    slot1Ratio: 0.28,
    slot2Ratio: 0.74,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110">
      <path id="silueta" d="M 24 102 L 16 68 L 28 34 L 58 20 L 96 22 L 118 32 L 126 22 L 136 30 L 150 48 L 142 62 L 126 66 L 122 102 Z" fill="none" stroke="#FF0000" stroke-width="1"/>
      <path id="facetas" data-layer="engrave" d="M 28 34 L 54 56 L 16 68 M 58 20 L 54 56 L 92 54 L 96 22 M 96 22 L 118 32 L 92 54 M 118 32 L 126 66 L 92 54 M 54 56 L 24 102 M 54 56 L 76 102 L 92 54 L 122 102" fill="none" stroke="#0000FF" stroke-width="0.6"/>
    </svg>`,
  },
  {
    id: 'pudu',
    name: 'Pudú Chileno Low-Poly',
    emoji: '🦌',
    description: 'Ciervo nativo del sur de Chile en estilo poligonal facetado.',
    defaultHeightMm: 85,
    slot1Ratio: 0.30,
    slot2Ratio: 0.70,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 140">
      <path id="silueta" d="M 25 134 L 20 88 L 32 62 L 74 58 L 86 30 L 78 16 L 92 22 L 102 10 L 100 28 L 118 38 L 104 52 L 106 86 L 98 134 Z" fill="none" stroke="#FF0000" stroke-width="1"/>
      <path id="facetas" data-layer="engrave" d="M 32 62 L 58 84 L 20 88 M 74 58 L 58 84 L 106 86 M 74 58 L 104 52 L 106 86 M 58 84 L 25 134 M 58 84 L 98 134 M 86 30 L 104 52" fill="none" stroke="#0000FF" stroke-width="0.6"/>
    </svg>`,
  },
  {
    id: 'pinguino',
    name: 'Pingüino de Humboldt',
    emoji: '🐧',
    description: 'Silueta vertical esbelta ideal para probar estabilidad con ranuras.',
    defaultHeightMm: 86,
    slot1Ratio: 0.33,
    slot2Ratio: 0.67,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140">
      <path id="silueta" d="M 22 134 L 14 96 L 18 54 L 34 22 L 54 14 L 76 26 L 64 36 L 78 68 L 86 98 L 76 134 Z" fill="none" stroke="#FF0000" stroke-width="1"/>
      <path id="facetas" data-layer="engrave" d="M 34 22 L 48 44 L 18 54 M 54 14 L 48 44 L 64 36 M 18 54 L 48 44 L 52 88 L 14 96 M 48 44 L 78 68 L 52 88 L 86 98 M 52 88 L 22 134 M 52 88 L 76 134" fill="none" stroke="#0000FF" stroke-width="0.6"/>
    </svg>`,
  },
];
