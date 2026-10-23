export type PuzzlePieceCount = 20 | 25 | 30 | 40;

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
    label: '20 Piezas (5×4)',
    difficulty: 'Nivel Inicial',
    description: 'Cuadrícula de 5×4 encastres clásicos ideal para armado rápido en taller.',
  },
  {
    count: 25,
    cols: 5,
    rows: 5,
    label: '25 Piezas (5×5)',
    difficulty: 'Nivel Explorador',
    description: 'Distribución simétrica de 5×5 piezas con excelente nivel de detalle.',
  },
  {
    count: 30,
    cols: 6,
    rows: 5,
    label: '30 Piezas (6×5)',
    difficulty: 'Nivel Intermedio',
    description: 'Mayor densidad de lengüetas sobre la silueta del dibujo híbrido.',
  },
  {
    count: 40,
    cols: 8,
    rows: 5,
    label: '40 Piezas (8×5)',
    difficulty: 'Nivel Desafío',
    description: 'Máximo desafío de armado con 40 piezas recortadas al contorno exterior.',
  },
];

/**
 * Prompt interno obligatorio para la API de visión y generación de imágenes multimodales (Gemini Image Generation)
 */
export const AI_FUSION_INTERNAL_PROMPT =
  'Genera un dibujo lineal en blanco y negro, sin fondo, fusionando las características principales de las imágenes de referencia. El trazo debe ser limpio, continuo, simple y sin sombreados, optimizado para trazado vectorial.';

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
