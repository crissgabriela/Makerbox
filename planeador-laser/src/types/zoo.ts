export type PuzzlePieceCount = 4 | 6 | 9 | 12;

export const PUZZLE_PIECE_OPTIONS: {
  count: PuzzlePieceCount;
  cols: number;
  rows: number;
  label: string;
  difficulty: string;
  description: string;
}[] = [
  {
    count: 4,
    cols: 2,
    rows: 2,
    label: '4 Piezas (2×2)',
    difficulty: 'Nivel Inicial',
    description: 'Piezas grandes y fáciles de armar para los más pequeños.',
  },
  {
    count: 6,
    cols: 3,
    rows: 2,
    label: '6 Piezas (3×2)',
    difficulty: 'Nivel Explorador',
    description: 'Equilibrio ideal entre detalle del dibujo y armado rápido.',
  },
  {
    count: 9,
    cols: 3,
    rows: 3,
    label: '9 Piezas (3×3)',
    difficulty: 'Nivel Intermedio',
    description: 'Cuadrícula clásica con pieza central completamente encastrada.',
  },
  {
    count: 12,
    cols: 4,
    rows: 3,
    label: '12 Piezas (4×3)',
    difficulty: 'Nivel Desafío',
    description: 'Mayor cantidad de encastres para jóvenes y desafíos en equipo.',
  },
];

/**
 * Prompt interno obligatorio para la API de visión y generación de imágenes multimodales
 */
export const AI_FUSION_INTERNAL_PROMPT =
  'Genera un dibujo lineal en blanco y negro, sin fondo, fusionando las características principales de las imágenes de referencia. El trazo debe ser limpio, continuo, simple y sin sombreados, optimizado para trazado vectorial.';

export interface SketchFeatureAnalysis {
  /** Densidad de trazos en el tercio superior (cabeza/orejas/cuernos/antenas) */
  topDensity: number;
  /** Densidad de trazos en la zona media lateral (alas/brazos/aletas) */
  sideDensity: number;
  /** Densidad de trazos en la zona central (torso/caparazón/patrones) */
  centerDensity: number;
  /** Densidad de trazos en el tercio inferior (patas/cola/tentáculos) */
  bottomDensity: number;
  /** Puntos de contorno extraídos del dibujo a mano alzada normalizado (0..1) */
  contourPoints?: { x: number; y: number }[];
  /** Trazos internos extraídos del dibujo a mano alzada */
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
  /** Cantidad de piezas del rompecabezas: 4, 6, 9 o 12 */
  puzzlePieces: PuzzlePieceCount;
  /** Instrucción adicional opcional del niño/joven para el asistente IA */
  studentPrompt?: string;
  /** Altura objetivo del rompecabezas en mm (por defecto 90 mm para plancha de balsa) */
  targetHeightMm?: number;
  /** Si es true, incluye cotas y etiquetas informativas en el SVG de vista previa */
  includeAnnotations?: boolean;
  /** API Key opcional de Gemini u OpenAI si el docente desea usar su propia clave en el navegador */
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
  /** Imagen rasterizada en blanco y negro generada por la etapa de IA antes de Potrace */
  rasterDataUrl: string;
  /** Respuesta amigable del Asistente IA explicando cómo fusionó los dibujos */
  assistantMessage: string;
  /** Nombre creativo sugerido por la IA para la criatura/diseño híbrido */
  hybridTitle: string;
  /** Prompt interno utilizado en la llamada multimodal */
  internalPromptUsed: string;
  /** Métricas técnicas de vectorización y recorte booleano */
  metrics: ZooFusionMetrics;
}
