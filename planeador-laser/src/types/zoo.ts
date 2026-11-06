export type PuzzlePieceCount = 20 | 30 | 40 | 50 | 60;

export type EngravingStrokeWeight = 'ultra-thin' | 'thin' | 'normal';

export const ENGRAVING_STROKE_OPTIONS: {
  id: EngravingStrokeWeight;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'ultra-thin',
    label: 'Ultra Fina (1 px)',
    badge: 'Máxima Velocidad ⚡',
    description: 'Trazo de línea esqueleto ultra delgado (1 px) para grabado láser rápido.',
  },
  {
    id: 'thin',
    label: 'Estándar (1.5 px)',
    badge: 'Grabado Rápido ✨',
    description: 'Líneas uniformes de 1.5 px optimizadas para grabado láser en contrachapado de 3 mm.',
  },
  {
    id: 'normal',
    label: 'Normal / Original',
    badge: 'Grosor Original',
    description: 'Mantiene el grosor original de los trazos de la imagen.',
  },
];

export const PUZZLE_PIECE_OPTIONS: {
  count: PuzzlePieceCount;
  cols: number;
  rows: number;
  label: string;
  difficulty: string;
  description: string;
}[] = [
  {
    count: 20,
    cols: 5,
    rows: 4,
    label: '20 Piezas',
    difficulty: 'Nivel Inicial',
    description: 'Cuadrícula de 20 piezas con cortes rectos horizontales y verticales para corte rápido en contrachapado de 3 mm.',
  },
  {
    count: 30,
    cols: 6,
    rows: 5,
    label: '30 Piezas',
    difficulty: 'Nivel Explorador',
    description: 'Cuadrícula de 30 piezas sin pestañas de encaje, ideal para corte láser ágil y armado grupal.',
  },
  {
    count: 40,
    cols: 8,
    rows: 5,
    label: '40 Piezas',
    difficulty: 'Nivel Intermedio',
    description: 'Cuadrícula de 40 piezas rectangulares con líneas continuas de lado a lado.',
  },
  {
    count: 50,
    cols: 10,
    rows: 5,
    label: '50 Piezas',
    difficulty: 'Nivel Avanzado',
    description: 'Cuadrícula de 50 piezas mediante trazos rectos horizontales y verticales de alta velocidad.',
  },
  {
    count: 60,
    cols: 10,
    rows: 6,
    label: '60 Piezas',
    difficulty: 'Nivel Maestro',
    description: 'Cuadrícula de 60 piezas rectangulares en contrachapado de 3 mm para mayor desafío visual.',
  },
];

/**
 * Calcula la cuadrícula óptima (columnas x filas) para una cantidad dada de piezas
 * adaptándose automáticamente a la orientación (ancho/alto) del dibujo.
 */
export function getAdaptiveGridForPieceCount(
  count: PuzzlePieceCount,
  aspectRatio = 1.0
): { cols: number; rows: number; totalPieces: number } {
  // aspectRatio = ancho / alto
  if (count === 20) {
    return aspectRatio < 0.95
      ? { cols: 4, rows: 5, totalPieces: 20 }
      : { cols: 5, rows: 4, totalPieces: 20 };
  }
  if (count === 30) {
    return aspectRatio < 0.95
      ? { cols: 5, rows: 6, totalPieces: 30 }
      : { cols: 6, rows: 5, totalPieces: 30 };
  }
  if (count === 40) {
    return aspectRatio < 0.95
      ? { cols: 5, rows: 8, totalPieces: 40 }
      : { cols: 8, rows: 5, totalPieces: 40 };
  }
  if (count === 50) {
    return aspectRatio < 0.95
      ? { cols: 5, rows: 10, totalPieces: 50 }
      : { cols: 10, rows: 5, totalPieces: 50 };
  }
  if (count === 60) {
    return aspectRatio < 0.95
      ? { cols: 6, rows: 10, totalPieces: 60 }
      : { cols: 10, rows: 6, totalPieces: 60 };
  }
  return { cols: 6, rows: 5, totalPieces: 30 };
}

/**
 * Prompt interno obligatorio para la API de visión y generación de imágenes multimodales (Gemini Image Generation)
 */
export const AI_FUSION_INTERNAL_PROMPT =
  'Genera un dibujo lineal en blanco y negro, sin fondo, fusionando las características principales de las imágenes de referencia. El trazo debe ser muy delgado, ultra fino tipo estilógrafo (hairline / fine thin outline), limpio, continuo, simple y sin sombreados ni áreas negras rellenas, optimizado para grabado láser rápido de alta velocidad.';

export interface SketchFeatureAnalysis {
  topDensity: number;
  sideDensity: number;
  centerDensity: number;
  bottomDensity: number;
  contourPoints?: { x: number; y: number }[];
  innerStrokes?: { x: number; y: number }[][];
}

export interface UploadedSketchInput {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  analysis?: SketchFeatureAnalysis;
}

export interface AssistantChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

export interface ZooFusionRequest {
  /** Lista de 3 a 4 dibujos a mano alzada en formato JPG/PNG */
  images: UploadedSketchInput[];
  /** Cantidad de piezas del rompecabezas: 20, 25, 30 o 40 */
  puzzlePieces: PuzzlePieceCount;
  /** Grosor de línea para el grabado láser */
  strokeWeight?: EngravingStrokeWeight;
  /** Instrucción adicional opcional del niño/joven para el asistente IA */
  studentPrompt?: string;
  /** Altura objetivo del rompecabezas en mm (por defecto 120 mm) */
  targetHeightMm?: number;
  /** Si es true, incluye cotas y etiquetas informativas en el SVG de vista previa */
  includeAnnotations?: boolean;
  /** API Key opcional de Google Gemini (habilita gemini-2.5-flash-image / gemini-2.0-flash-preview-image-generation) */
  customApiKey?: string;
}

export interface ZooFusionMetrics {
  imagesCount: number;
  puzzlePieces: PuzzlePieceCount;
  gridCols: number;
  gridRows: number;
  widthMm: number;
  heightMm: number;
  strokeWeight: EngravingStrokeWeight;
  outerContourNodes: number;
  innerVectorPathsCount: number;
  clippedPuzzleSegmentsCount: number;
  vectorizerEngine: string;
  aiModelUsed: string;
}

export interface ZooFusionResponse {
  /** SVG con anotaciones opcionales para previsualización interactiva en el navegador */
  previewSvg: string;
  /** SVG 100% limpio con vectores cerrados y recortados listo para corte láser en LightBurn */
  laserSvg: string;
  /** Imagen rasterizada en blanco y negro generada por Gemini Multimodal Image Generation */
  rasterDataUrl: string;
  /** Si Gemini devolvió directamente un bitmap PNG/JPEG nativo, indica que debe vectorizarse en alta resolución */
  hasNativeGeminiRaster?: boolean;
  /** Respuesta amigable del Asistente IA explicando cómo fusionó los dibujos */
  assistantMessage: string;
  /** Nombre creativo sugerido por la IA para la criatura/diseño híbrido */
  hybridTitle: string;
  /** Prompt interno utilizado en la llamada multimodal */
  internalPromptUsed: string;
  /** Métricas técnicas de vectorización y recorte booleano */
  metrics: ZooFusionMetrics;
}
