export type TangramSilhouetteId = 'swan' | 'rocket' | 'cat' | 'house' | 'boat';

export type TangramPieceId =
  | 'large-tri-1'
  | 'large-tri-2'
  | 'med-tri'
  | 'square'
  | 'small-tri-1'
  | 'small-tri-2'
  | 'parallelogram';

export type TangramPieceKind =
  | 'large-tri'
  | 'med-tri'
  | 'square'
  | 'small-tri'
  | 'parallelogram';

export type TangramPhase = 'setup' | 'phase1-cad' | 'phase2-puzzle' | 'completed';

export type CadSubdivisionVariant = 'A' | 'B';

export interface TangramParams {
  /** Lado del cuadrado de Tangrama L en mm (por defecto 100 mm) */
  sideMm: number;
  /** Margen perimetral libre de la base para el borde 3D en mm (por defecto 5 mm -> base 110x110 mm) */
  baseMarginMm: number;
  /** Espesor nominal del material en mm (por defecto 3 mm -> ranura 3.1 mm, tope superior 3 mm) */
  thicknessMm: number;
}

export interface CadSnapNode {
  id: string;
  /** Coordenada X proporcional [0..1] (0 = izquierda, 1 = derecha) */
  x: number;
  /** Coordenada Y proporcional [0..1] en ejes CAD (0 = abajo, 1 = arriba) */
  y: number;
  label: string;
  category: 'corner' | 'midpoint' | 'diagonal';
}

export interface CadSegmentDef {
  id: string;
  fromId: string;
  toId: string;
  title: string;
  hint: string;
  /** Sub-tramos atómicos colineales entre nodos intermedios para permitir trazado directo o por partes */
  atomicPairs: [string, string][];
}

export interface VirtualPieceState {
  id: TangramPieceId;
  kind: TangramPieceKind;
  name: string;
  color: string;
  strokeColor: string;
  /** Posición X en unidades normalizadas del canvas de Fase 2 (1.0 = lado L del tangrama) */
  x: number;
  /** Posición Y en unidades normalizadas del canvas de Fase 2 (hacia abajo en pantalla) */
  y: number;
  /** Ángulo de rotación en pasos de 45° (0..315) */
  rotationDeg: number;
  /** Espejado horizontal (habilitado especialmente para el paralelogramo) */
  flipped: boolean;
  /** ID del slot objetivo al que está imantada la pieza, o null si está libre */
  snappedSlotId: string | null;
}

export interface TangramSilhouetteDef {
  id: TangramSilhouetteId;
  number: number;
  name: string;
  emoji: string;
  difficulty: string;
  description: string;
  /** Polígonos objetivo (en unidades donde 1.0 = L, Y hacia abajo, centrados alrededor de (0,0)) */
  pieces: Record<TangramPieceId, [number, number][]>;
}
