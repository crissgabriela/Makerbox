export type SlicerWorkMode = 'individual' | 'grupal';
export type SlicerLevelId = 'basico' | 'intermedio' | 'avanzado';
export type SlicerSourceMode = 'cad' | 'upload';
export type SlicerCutMode = 'waffle' | 'stacked';
export type StackedAxis = 'x' | 'y' | 'z';

export type PrimitiveKind =
  | 'sphere'
  | 'box'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'pyramid';

export type BooleanOperation = 'add' | 'subtract';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CadPrimitive {
  id: string;
  name: string;
  kind: PrimitiveKind;
  operation: BooleanOperation;
  /** Centro de la figura en mm (X: ancho, Y: largo/profundidad, Z: altura desde mesa Z=0) */
  position: [number, number, number];
  /** Dimensiones totales [anchoX, largoY, altoZ] en mm */
  size: [number, number, number];
  /** Rotación Euler [rx, ry, rz] en grados */
  rotation: [number, number, number];
  color: string;
}

export interface CadPresetTemplate {
  id: string;
  name: string;
  category: 'animales' | 'espacio' | 'vehiculos' | 'libre';
  emoji: string;
  description: string;
  recommendedCutMode: SlicerCutMode;
  recommendedXCount: number;
  recommendedYCount: number;
  primitives: CadPrimitive[];
}

export interface UploadedMeshModel {
  fileName: string;
  format: 'stl' | 'obj';
  /** Triángulos normalizados [x0,y0,z0, x1,y1,z1, x2,y2,z2, ...] en coordenadas centradas en XY y base en Z=0 con dimensión máxima = 1 */
  normalizedTriangles: Float32Array;
  triangleCount: number;
  normalizedDims: [number, number, number];
  /** Escala objetivo para la dimensión máxima en mm (60 a 220 mm) */
  targetMaxDimMm: number;
  /** Rotación en pasos de 90° o libre [rx, ry, rz] */
  rotationDeg: [number, number, number];
}

export interface SlicerConfig {
  projectName: string;
  cutMode: SlicerCutMode;
  /** Espesor nominal del MDF (fijo 3.0 mm por defecto) */
  materialThicknessMm: number;
  /** Ancho de ranura compensado por kerf láser (ej. 2.95 mm para encaje firme en MDF 3.0 mm) */
  slotWidthMm: number;
  /** Cantidad de planos longitudinales (eje X) en modo Retícula / Costillas */
  xSliceCount: number;
  /** Cantidad de planos transversales (eje Y) en modo Retícula / Costillas */
  ySliceCount: number;
  /** Eje de apilamiento en modo Planos Seriados */
  stackedAxis: StackedAxis;
  /** Paso entre láminas en Planos Seriados (3.0 mm = pegado/sólido, >3.0 mm = espaciado con separadores) */
  stackedStepMm: number;
  /** Diámetro del orificio de alineación para varilla/eje PLA (mm) */
  alignmentHoleDiameterMm: number;
  /** Incluir orificios de alineación para ejes PLA en Planos Seriados */
  includeAlignmentHoles: boolean;
  /** Ancho de plancha de MDF en la cortadora láser (mm) */
  sheetWidthMm: number;
  /** Alto de plancha de MDF en la cortadora láser (mm) */
  sheetHeightMm: number;
  /** Grabar numeración de ensamble (X1, Y2, C01...) en azul #0000FF */
  engraveLabels: boolean;
}

export interface SliceSlotInfo {
  /** Posición horizontal (en coordenadas 2D de la pieza) del centro de la ranura */
  uCenter: number;
  /** Altura de inicio/fin de la intersección */
  zMin: number;
  zMax: number;
  zMid: number;
  width: number;
  fromTop: boolean;
  partnerLabel: string;
}

export interface SlicedPiece2D {
  id: string;
  label: string;
  axis: 'x' | 'y' | 'z';
  /** Coordenada 3D del plano de corte en mm */
  planeCoordMm: number;
  /** Contornos exteriores cerrados (CCW) ya con ranuras cortadas exactamente */
  contours: Vec2[][];
  /** Orificios interiores circulares (ej. pasadores PLA en Planos Seriados) */
  holes: { x: number; y: number; r: number }[];
  /** Información de ranuras de encaje generadas en esta pieza */
  slots: SliceSlotInfo[];
  /** Punto interior garantizado para grabar el texto de la pieza */
  labelPoint: Vec2;
  /** Caja delimitadora 2D original */
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  widthMm: number;
  heightMm: number;
  areaMm2: number;
  perimeterMm: number;
}

export interface PlacedPieceOnSheet {
  piece: SlicedPiece2D;
  /** Esquina superior-izquierda en la lámina (mm) */
  sheetX: number;
  sheetY: number;
  rotated90: boolean;
}

export interface NestedSheet {
  sheetIndex: number;
  widthMm: number;
  heightMm: number;
  placements: PlacedPieceOnSheet[];
}

export interface SlicerTelemetry {
  totalPieces: number;
  xPiecesCount: number;
  yPiecesCount: number;
  stackedPiecesCount: number;
  totalInterlockingSlots: number;
  sheetsRequired: number;
  boundingBoxMm: { x: number; y: number; z: number };
  totalCutPerimeterMm: number;
  estimatedLaserSec: number;
  estimatedLaserTimeFormatted: string;
  estimatedMdfAreaCm2: number;
  estimatedPlaGrams: number;
  estimatedPlaPrintMin: number;
  plaKitSummary: string;
}

export interface SlicerResult {
  pieces: SlicedPiece2D[];
  sheets: NestedSheet[];
  telemetry: SlicerTelemetry;
  warnings: string[];
}

export interface PedagogicalChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
