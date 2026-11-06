import {
  CadSegmentDef,
  CadSnapNode,
  CadSubdivisionVariant,
  TangramPieceId,
  TangramPieceKind,
  TangramSilhouetteDef,
  TangramSilhouetteId,
  VirtualPieceState,
} from '@/types/tangram';

export const SQRT2_4 = Math.SQRT2 / 4; // ~0.3535533905932738

/**
 * Nodos magnéticos del cuadrado unitario CAD [0,1] x [0,1]
 * Sistema cartesiano CAD: (0,0) esquina inferior-izquierda, (1,1) esquina superior-derecha.
 */
export const CAD_SNAP_NODES: CadSnapNode[] = [
  // Esquinas
  { id: 'n_0_0', x: 0, y: 0, label: '(0, 0)', category: 'corner' },
  { id: 'n_1_0', x: 1, y: 0, label: '(1, 0)', category: 'corner' },
  { id: 'n_1_1', x: 1, y: 1, label: '(1, 1)', category: 'corner' },
  { id: 'n_0_1', x: 0, y: 1, label: '(0, 1)', category: 'corner' },
  // Puntos medios
  { id: 'n_0_05', x: 0, y: 0.5, label: '(0, 0.5)', category: 'midpoint' },
  { id: 'n_05_1', x: 0.5, y: 1, label: '(0.5, 1)', category: 'midpoint' },
  // Puntos internos de diagonal
  { id: 'n_025_025', x: 0.25, y: 0.25, label: '(0.25, 0.25)', category: 'diagonal' },
  { id: 'n_05_05', x: 0.5, y: 0.5, label: '(0.5, 0.5)', category: 'diagonal' },
  { id: 'n_025_075', x: 0.25, y: 0.75, label: '(0.25, 0.75)', category: 'diagonal' },
  { id: 'n_075_075', x: 0.75, y: 0.75, label: '(0.75, 0.75)', category: 'diagonal' },
];

export const CAD_NODE_MAP: Record<string, CadSnapNode> = Object.fromEntries(
  CAD_SNAP_NODES.map((n) => [n.id, n])
);

export function makeAtomicKey(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/**
 * Los 3 segmentos estructurales fijos + los 2 segmentos internos de la franja (variante A o B).
 */
export const CAD_CORE_SEGMENTS: CadSegmentDef[] = [
  {
    id: 'seg_main_diag',
    fromId: 'n_0_0',
    toId: 'n_1_1',
    title: 'Diagonal Principal',
    hint: 'Une (0, 0) con (1, 1)',
    atomicPairs: [
      ['n_0_0', 'n_025_025'],
      ['n_025_025', 'n_05_05'],
      ['n_05_05', 'n_075_075'],
      ['n_075_075', 'n_1_1'],
    ],
  },
  {
    id: 'seg_cross_diag',
    fromId: 'n_1_0',
    toId: 'n_025_075',
    title: 'Semidiagonal Transversal (3/4)',
    hint: 'Une (1, 0) con (0.25, 0.75) pasando por (0.5, 0.5)',
    atomicPairs: [
      ['n_1_0', 'n_05_05'],
      ['n_05_05', 'n_025_075'],
    ],
  },
  {
    id: 'seg_med_tri',
    fromId: 'n_0_05',
    toId: 'n_05_1',
    title: 'Hipotenusa Triángulo Mediano',
    hint: 'Une (0, 0.5) con (0.5, 1) pasando por (0.25, 0.75)',
    atomicPairs: [
      ['n_0_05', 'n_025_075'],
      ['n_025_075', 'n_05_1'],
    ],
  },
];

export const CAD_VARIANT_SEGMENTS: Record<CadSubdivisionVariant, CadSegmentDef[]> = {
  A: [
    {
      id: 'seg_strip_left_A',
      fromId: 'n_0_05',
      toId: 'n_025_025',
      title: 'Cierre de Cuadrado Central',
      hint: 'Une (0, 0.5) con (0.25, 0.25)',
      atomicPairs: [['n_0_05', 'n_025_025']],
    },
    {
      id: 'seg_strip_right_A',
      fromId: 'n_025_075',
      toId: 'n_075_075',
      title: 'División de Paralelogramo',
      hint: 'Une (0.25, 0.75) con (0.75, 0.75)',
      atomicPairs: [['n_025_075', 'n_075_075']],
    },
  ],
  B: [
    {
      id: 'seg_strip_left_B',
      fromId: 'n_025_075',
      toId: 'n_025_025',
      title: 'División de Paralelogramo Inferior',
      hint: 'Une (0.25, 0.75) con (0.25, 0.25)',
      atomicPairs: [['n_025_075', 'n_025_025']],
    },
    {
      id: 'seg_strip_right_B',
      fromId: 'n_05_1',
      toId: 'n_075_075',
      title: 'Cierre de Cuadrado Superior',
      hint: 'Une (0.5, 1) con (0.75, 0.75)',
      atomicPairs: [['n_05_1', 'n_075_075']],
    },
  ],
};

const COLLINEAR_CHAINS: string[][] = [
  ['n_0_0', 'n_025_025', 'n_05_05', 'n_075_075', 'n_1_1'],
  ['n_1_0', 'n_05_05', 'n_025_075'],
  ['n_0_05', 'n_025_075', 'n_05_1'],
];

const OUTER_BORDER_CHAINS: string[][] = [
  ['n_0_0', 'n_1_0'],
  ['n_1_0', 'n_1_1'],
  ['n_1_1', 'n_05_1', 'n_0_1'],
  ['n_0_1', 'n_0_05', 'n_0_0'],
];

export interface CadStrokeValidationResult {
  valid: boolean;
  alreadyDrawn?: boolean;
  newAtomicKeys: string[];
  lockedVariant: CadSubdivisionVariant | null;
  message: string;
}

/**
 * Valida un segmento trazado por el usuario entre dos nodos magnéticos en la Fase 1.
 */
export function validateCadStroke(
  fromId: string,
  toId: string,
  activeAtomicKeys: Set<string>,
  currentVariant: CadSubdivisionVariant | null
): CadStrokeValidationResult {
  if (fromId === toId) {
    return {
      valid: false,
      newAtomicKeys: [],
      lockedVariant: currentVariant,
      message: 'Selecciona dos nodos magnéticos distintos para trazar un segmento.',
    };
  }

  // Verificar si intentó trazar sobre el borde exterior del cuadrado 100x100
  for (const borderChain of OUTER_BORDER_CHAINS) {
    if (borderChain.includes(fromId) && borderChain.includes(toId)) {
      return {
        valid: false,
        newAtomicKeys: [],
        lockedVariant: currentVariant,
        message:
          'El perímetro exterior de 100 × 100 mm ya está definido. Traza solo los 5 segmentos internos.',
      };
    }
  }

  // Verificar error clásico: pasar la diagonal hasta (0, 1) partiendo el triángulo mediano
  if (
    (fromId === 'n_0_1' && ['n_1_0', 'n_05_05', 'n_025_075'].includes(toId)) ||
    (toId === 'n_0_1' && ['n_1_0', 'n_05_05', 'n_025_075'].includes(fromId))
  ) {
    return {
      valid: false,
      newAtomicKeys: [],
      lockedVariant: currentVariant,
      message:
        '¡Atención CAD! Esa diagonal dividiría el triángulo mediano en (0, 1). Detén el trazo en el nodo (0.25, 0.75).',
    };
  }

  // 1. Probar en las 3 cadenas colineales principales
  for (const chain of COLLINEAR_CHAINS) {
    const i1 = chain.indexOf(fromId);
    const i2 = chain.indexOf(toId);
    if (i1 !== -1 && i2 !== -1) {
      const start = Math.min(i1, i2);
      const end = Math.max(i1, i2);
      const keys: string[] = [];
      for (let k = start; k < end; k++) {
        keys.push(makeAtomicKey(chain[k], chain[k + 1]));
      }
      const missing = keys.filter((k) => !activeAtomicKeys.has(k));
      if (missing.length === 0) {
        return {
          valid: false,
          alreadyDrawn: true,
          newAtomicKeys: [],
          lockedVariant: currentVariant,
          message: 'Ese tramo geométrico ya se encuentra trazado en el plano.',
        };
      }
      return {
        valid: true,
        newAtomicKeys: missing,
        lockedVariant: currentVariant,
        message: '¡Segmento estructural validado correctamente!',
      };
    }
  }

  // 2. Probar en las divisiones de franja (Variante A o Variante B)
  const strokeKey = makeAtomicKey(fromId, toId);
  for (const variant of ['A', 'B'] as CadSubdivisionVariant[]) {
    for (const seg of CAD_VARIANT_SEGMENTS[variant]) {
      const segKey = makeAtomicKey(seg.fromId, seg.toId);
      if (strokeKey === segKey) {
        if (currentVariant && currentVariant !== variant) {
          return {
            valid: false,
            newAtomicKeys: [],
            lockedVariant: currentVariant,
            message:
              currentVariant === 'A'
                ? 'Para completar las 7 piezas clásicas (1 cuadrado y 1 paralelogramo), une (0, 0.5)–(0.25, 0.25) y (0.25, 0.75)–(0.75, 0.75).'
                : 'Para completar las 7 piezas clásicas con tu trazado actual, une (0.25, 0.75)–(0.25, 0.25) y (0.5, 1)–(0.75, 0.75).',
          };
        }
        if (activeAtomicKeys.has(segKey)) {
          return {
            valid: false,
            alreadyDrawn: true,
            newAtomicKeys: [],
            lockedVariant: currentVariant,
            message: 'Ese segmento interno ya fue trazado.',
          };
        }
        return {
          valid: true,
          newAtomicKeys: [segKey],
          lockedVariant: variant,
          message: `¡Excelente! ${seg.title} validado.`,
        };
      }
    }
  }

  return {
    valid: false,
    newAtomicKeys: [],
    lockedVariant: currentVariant,
    message:
      'Trazo inválido: esa línea no corresponde a la subdivisión geométrica de los 7 polígonos clásicos del Tangrama.',
  };
}

/**
 * Calcula cuáles de los 5 segmentos maestros están completos según los tramos atómicos activos.
 */
export function getCompletedCadSegments(
  activeAtomicKeys: Set<string>,
  variant: CadSubdivisionVariant | null
): {
  completedIds: string[];
  allSegmentsForVariant: CadSegmentDef[];
  completedCount: number;
} {
  const effectiveVariant: CadSubdivisionVariant = variant ?? 'A';
  const allSegments = [...CAD_CORE_SEGMENTS, ...CAD_VARIANT_SEGMENTS[effectiveVariant]];
  const completedIds = allSegments
    .filter((seg) =>
      seg.atomicPairs.every(([a, b]) => activeAtomicKeys.has(makeAtomicKey(a, b)))
    )
    .map((seg) => seg.id);

  return {
    completedIds,
    allSegmentsForVariant: allSegments,
    completedCount: completedIds.length,
  };
}

/**
 * Polígonos resultantes en el cuadrado CAD [0,1]^2 (para colorear al completar Fase 1).
 */
export function getCadSubdivisionPolygons(
  variant: CadSubdivisionVariant = 'A'
): { id: TangramPieceId; points: [number, number][]; color: string; label: string }[] {
  const common = [
    {
      id: 'large-tri-1' as TangramPieceId,
      points: [
        [0, 0],
        [1, 0],
        [0.5, 0.5],
      ] as [number, number][],
      color: '#f97316',
      label: 'Triángulo Grande 1',
    },
    {
      id: 'large-tri-2' as TangramPieceId,
      points: [
        [1, 0],
        [1, 1],
        [0.5, 0.5],
      ] as [number, number][],
      color: '#0ea5e9',
      label: 'Triángulo Grande 2',
    },
    {
      id: 'med-tri' as TangramPieceId,
      points: [
        [0, 0.5],
        [0.5, 1],
        [0, 1],
      ] as [number, number][],
      color: '#10b981',
      label: 'Triángulo Mediano',
    },
  ];

  if (variant === 'B') {
    return [
      ...common,
      {
        id: 'parallelogram',
        points: [
          [0, 0],
          [0.25, 0.25],
          [0.25, 0.75],
          [0, 0.5],
        ],
        color: '#ec4899',
        label: 'Paralelogramo',
      },
      {
        id: 'small-tri-1',
        points: [
          [0.25, 0.25],
          [0.5, 0.5],
          [0.25, 0.75],
        ],
        color: '#eab308',
        label: 'Triángulo Pequeño 1',
      },
      {
        id: 'square',
        points: [
          [0.25, 0.75],
          [0.5, 0.5],
          [0.75, 0.75],
          [0.5, 1],
        ],
        color: '#8b5cf6',
        label: 'Cuadrado',
      },
      {
        id: 'small-tri-2',
        points: [
          [0.5, 1],
          [0.75, 0.75],
          [1, 1],
        ],
        color: '#ef4444',
        label: 'Triángulo Pequeño 2',
      },
    ];
  }

  return [
    ...common,
    {
      id: 'small-tri-1',
      points: [
        [0, 0],
        [0.25, 0.25],
        [0, 0.5],
      ],
      color: '#eab308',
      label: 'Triángulo Pequeño 1',
    },
    {
      id: 'square',
      points: [
        [0.25, 0.25],
        [0.5, 0.5],
        [0.25, 0.75],
        [0, 0.5],
      ],
      color: '#8b5cf6',
      label: 'Cuadrado',
    },
    {
      id: 'small-tri-2',
      points: [
        [0.5, 0.5],
        [0.75, 0.75],
        [0.25, 0.75],
      ],
      color: '#ef4444',
      label: 'Triángulo Pequeño 2',
    },
    {
      id: 'parallelogram',
      points: [
        [0.25, 0.75],
        [0.75, 0.75],
        [1, 1],
        [0.5, 1],
      ],
      color: '#ec4899',
      label: 'Paralelogramo',
    },
  ];
}

// ============================================================================
// FASE 2: PIEZAS CANÓNICAS Y 5 SILUETAS OBJETIVO VERIFICADAS
// ============================================================================

export interface CanonicalPieceMeta {
  id: TangramPieceId;
  kind: TangramPieceKind;
  name: string;
  color: string;
  strokeColor: string;
  /** Vértices locales centrados en el centroide (0, 0) */
  localVertices: [number, number][];
}

function centerPolygon(pts: [number, number][]): [number, number][] {
  const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [x - cx, y - cy]);
}

export function polygonCentroid(pts: [number, number][]): [number, number] {
  const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return [cx, cy];
}

const d = SQRT2_4;

export const CANONICAL_PIECES: CanonicalPieceMeta[] = [
  {
    id: 'large-tri-1',
    kind: 'large-tri',
    name: 'Triángulo Grande 1',
    color: '#f97316',
    strokeColor: '#c2410c',
    localVertices: centerPolygon([
      [-0.5, 0],
      [0.5, 0],
      [0, -0.5],
    ]),
  },
  {
    id: 'large-tri-2',
    kind: 'large-tri',
    name: 'Triángulo Grande 2',
    color: '#0ea5e9',
    strokeColor: '#0369a1',
    localVertices: centerPolygon([
      [-0.5, 0],
      [0.5, 0],
      [0, -0.5],
    ]),
  },
  {
    id: 'med-tri',
    kind: 'med-tri',
    name: 'Triángulo Mediano',
    color: '#10b981',
    strokeColor: '#047857',
    localVertices: centerPolygon([
      [0, 0],
      [0.5, 0],
      [0, -0.5],
    ]),
  },
  {
    id: 'square',
    kind: 'square',
    name: 'Cuadrado',
    color: '#8b5cf6',
    strokeColor: '#6d28d9',
    localVertices: centerPolygon([
      [-0.5 * d, -0.5 * d],
      [0.5 * d, -0.5 * d],
      [0.5 * d, 0.5 * d],
      [-0.5 * d, 0.5 * d],
    ]),
  },
  {
    id: 'small-tri-1',
    kind: 'small-tri',
    name: 'Triángulo Pequeño 1',
    color: '#eab308',
    strokeColor: '#a16207',
    localVertices: centerPolygon([
      [-0.25, 0],
      [0.25, 0],
      [0, -0.25],
    ]),
  },
  {
    id: 'small-tri-2',
    kind: 'small-tri',
    name: 'Triángulo Pequeño 2',
    color: '#ef4444',
    strokeColor: '#b91c1c',
    localVertices: centerPolygon([
      [-0.25, 0],
      [0.25, 0],
      [0, -0.25],
    ]),
  },
  {
    id: 'parallelogram',
    kind: 'parallelogram',
    name: 'Paralelogramo',
    color: '#ec4899',
    strokeColor: '#be185d',
    localVertices: centerPolygon([
      [-0.25, -0.125],
      [0.25, -0.125],
      [0.5, 0.125],
      [0, 0.125],
    ]),
  },
];

export const CANONICAL_PIECE_MAP: Record<TangramPieceId, CanonicalPieceMeta> =
  Object.fromEntries(CANONICAL_PIECES.map((p) => [p.id, p])) as Record<
    TangramPieceId,
    CanonicalPieceMeta
  >;

/**
 * Transforma los vértices locales de una pieza al espacio mundial de Fase 2.
 */
export function getTransformedPieceVertices(
  pieceId: TangramPieceId,
  x: number,
  y: number,
  rotationDeg: number,
  flipped: boolean
): [number, number][] {
  const meta = CANONICAL_PIECE_MAP[pieceId];
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return meta.localVertices.map(([lx, ly]) => {
    const fx = flipped ? -lx : lx;
    const fy = ly;
    const rx = fx * cos - fy * sin;
    const ry = fx * sin + fy * cos;
    return [x + rx, y + ry];
  });
}

/**
 * Centra un conjunto de 7 polígonos objetivo alrededor de (0, 0) según su bounding box.
 */
function recenterSilhouettePieces(
  raw: Record<TangramPieceId, [number, number][]>
): Record<TangramPieceId, [number, number][]> {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pts of Object.values(raw)) {
    for (const [px, py] of pts) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const centered: Partial<Record<TangramPieceId, [number, number][]>> = {};
  for (const [key, pts] of Object.entries(raw) as [
    TangramPieceId,
    [number, number][],
  ][]) {
    centered[key] = pts.map(([px, py]) => [px - cx, py - cy]);
  }
  return centered as Record<TangramPieceId, [number, number][]>;
}

/**
 * Las 5 siluetas clásicas del Tangrama matemáticamente exactas (área total = 1.0000, ángulos múltiplos de 45°, 0 solapamiento).
 */
export const TANGRAM_SILHOUETTES: TangramSilhouetteDef[] = [
  {
    id: 'swan',
    number: 1,
    name: 'Cisne',
    emoji: '🦢',
    difficulty: 'Clásico',
    description: 'Elegante cisne nadando con cuello esbelto y alas desplegadas.',
    pieces: recenterSilhouettePieces({
      'small-tri-1': [
        [-0.5, -0.75],
        [-0.25, -0.5],
        [0, -0.75],
      ],
      parallelogram: [
        [-0.25, 0],
        [0, -0.25],
        [0, -0.75],
        [-0.25, -0.5],
      ],
      square: [
        [-0.25, 0],
        [0, -0.25],
        [0.25, 0],
        [0, 0.25],
      ],
      'small-tri-2': [
        [0, 0.25],
        [0.25, 0],
        [0.5, 0.25],
      ],
      'large-tri-1': [
        [0, -0.25],
        [0.5, -0.75],
        [0.5, 0.25],
      ],
      'med-tri': [
        [0.5, 0.25],
        [0.5, -0.25],
        [1.0, -0.25],
      ],
      'large-tri-2': [
        [0.5, 0.25],
        [1.0, -0.25],
        [1.5, 0.25],
      ],
    }),
  },
  {
    id: 'rocket',
    number: 2,
    name: 'Cohete / Avión',
    emoji: '🚀',
    difficulty: 'Aeroespacial',
    description: 'Cohete supersónico de ala delta simétrica y ojiva cónica.',
    pieces: recenterSilhouettePieces({
      'med-tri': [
        [-d, -2 * d],
        [d, -2 * d],
        [0, -3 * d],
      ],
      square: [
        [-0.5 * d, -2 * d],
        [0.5 * d, -2 * d],
        [0.5 * d, -d],
        [-0.5 * d, -d],
      ],
      'small-tri-1': [
        [-0.5 * d, -d],
        [0.5 * d, -d],
        [-0.5 * d, 0],
      ],
      parallelogram: [
        [0.5 * d, -d],
        [0.5 * d, 0],
        [-0.5 * d, d],
        [-0.5 * d, 0],
      ],
      'small-tri-2': [
        [0.5 * d, 0],
        [0.5 * d, d],
        [-0.5 * d, d],
      ],
      'large-tri-1': [
        [-0.5 * d, -0.5 * d],
        [-0.5 * d, 1.5 * d],
        [-2.5 * d, 1.5 * d],
      ],
      'large-tri-2': [
        [0.5 * d, -0.5 * d],
        [2.5 * d, 1.5 * d],
        [0.5 * d, 1.5 * d],
      ],
    }),
  },
  {
    id: 'cat',
    number: 3,
    name: 'Gato',
    emoji: '🐱',
    difficulty: 'Orgánico',
    description: 'Gato sentado atento con orejas puntiagudas y cola erguida.',
    pieces: recenterSilhouettePieces({
      square: [
        [0, 0],
        [0.25, 0.25],
        [0, 0.5],
        [-0.25, 0.25],
      ],
      'small-tri-1': [
        [-0.25, -0.25],
        [0, 0],
        [-0.25, 0.25],
      ],
      'small-tri-2': [
        [0.25, -0.25],
        [0.25, 0.25],
        [0, 0],
      ],
      'large-tri-1': [
        [-0.25, 0.25],
        [0.25, 0.75],
        [-0.25, 1.25],
      ],
      'large-tri-2': [
        [-0.25, 1.25],
        [0.25, 0.75],
        [0.75, 1.25],
      ],
      'med-tri': [
        [-0.25, 0.75],
        [-0.25, 1.25],
        [-0.75, 1.25],
      ],
      parallelogram: [
        [0.5, 1.0],
        [0.5, 0.5],
        [0.75, 0.75],
        [0.75, 1.25],
      ],
    }),
  },
  {
    id: 'house',
    number: 4,
    name: 'Casa',
    emoji: '🏠',
    difficulty: 'Arquitectura',
    description: 'Vivienda clásica con techo a dos aguas y chimenea vertical.',
    pieces: recenterSilhouettePieces({
      'large-tri-1': [
        [0, 0.5],
        [1.0, 0.5],
        [0.5, 0],
      ],
      'med-tri': [
        [0, 0],
        [0.5, 0],
        [0, 0.5],
      ],
      'small-tri-1': [
        [0.5, 0],
        [1.0, 0],
        [0.75, 0.25],
      ],
      'small-tri-2': [
        [1.0, 0],
        [1.0, 0.5],
        [0.75, 0.25],
      ],
      'large-tri-2': [
        [0.25, 0],
        [1.25, 0],
        [0.75, -0.5],
      ],
      parallelogram: [
        [-0.25, 0],
        [0.25, 0],
        [0.5, -0.25],
        [0.0, -0.25],
      ],
      square: [
        [0.05, -0.25 - d],
        [0.05 + d, -0.25 - d],
        [0.05 + d, -0.25],
        [0.05, -0.25],
      ],
    }),
  },
  {
    id: 'boat',
    number: 5,
    name: 'Barco',
    emoji: '⛵',
    difficulty: 'Náutico',
    description: 'Velero oceánico con casco trapezoidal simétrico, vela mayor y foque.',
    pieces: recenterSilhouettePieces({
      'small-tri-1': [
        [-2 * d, 0],
        [-d, 0],
        [-d, d],
      ],
      square: [
        [-d, 0],
        [0, 0],
        [0, d],
        [-d, d],
      ],
      'small-tri-2': [
        [0, 0],
        [d, d],
        [0, d],
      ],
      parallelogram: [
        [0, 0],
        [d, 0],
        [2 * d, d],
        [d, d],
      ],
      'med-tri': [
        [d, 0],
        [3 * d, 0],
        [2 * d, d],
      ],
      'large-tri-1': [
        [-1.5 * d, 0],
        [0.5 * d, 0],
        [0.5 * d, -2 * d],
      ],
      'large-tri-2': [
        [0.5 * d, 0],
        [0.5 * d, -1.0],
        [0.5 * d + 0.5, -0.5],
      ],
    }),
  },
];

export function getSilhouetteById(id: TangramSilhouetteId): TangramSilhouetteDef {
  return TANGRAM_SILHOUETTES.find((s) => s.id === id) ?? TANGRAM_SILHOUETTES[0];
}

function signedArea2D(pts: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/**
 * Calcula los contornos exteriores cerrados (unión booleana exacta) de los 7 polígonos de una silueta.
 * Se utiliza tanto para dibujar la silueta "fantasma" sin costuras como para el grabado láser #0000FF.
 */
export function computeSilhouetteBoundaryLoops(
  silhouette: TangramSilhouetteDef
): [number, number][][] {
  const polys = Object.values(silhouette.pieces).map((pts) =>
    signedArea2D(pts) > 0 ? pts : [...pts].reverse()
  );

  const allVerts: [number, number][] = [];
  const addVert = (x: number, y: number): [number, number] => {
    for (const v of allVerts) {
      if (Math.hypot(v[0] - x, v[1] - y) < 1e-4) return v;
    }
    const nv: [number, number] = [Number(x.toFixed(6)), Number(y.toFixed(6))];
    allVerts.push(nv);
    return nv;
  };

  for (const pts of polys) {
    for (const [x, y] of pts) addVert(x, y);
  }

  const subEdges: [[number, number], [number, number]][] = [];
  for (const pts of polys) {
    for (let i = 0; i < pts.length; i++) {
      const a = addVert(pts[i][0], pts[i][1]);
      const b = addVert(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len2 = dx * dx + dy * dy;
      const onSeg: { t: number; v: [number, number] }[] = [
        { t: 0, v: a },
        { t: 1, v: b },
      ];
      for (const v of allVerts) {
        if (v === a || v === b) continue;
        const t = ((v[0] - a[0]) * dx + (v[1] - a[1]) * dy) / len2;
        if (t > 1e-4 && t < 1 - 1e-4) {
          const px = a[0] + t * dx;
          const py = a[1] + t * dy;
          if (Math.hypot(v[0] - px, v[1] - py) < 1e-4) {
            onSeg.push({ t, v });
          }
        }
      }
      onSeg.sort((u, w) => u.t - w.t);
      for (let k = 0; k < onSeg.length - 1; k++) {
        if (onSeg[k].v !== onSeg[k + 1].v) {
          subEdges.push([onSeg[k].v, onSeg[k + 1].v]);
        }
      }
    }
  }

  const used = new Array(subEdges.length).fill(false);
  for (let i = 0; i < subEdges.length; i++) {
    if (used[i]) continue;
    for (let j = i + 1; j < subEdges.length; j++) {
      if (used[j]) continue;
      if (subEdges[i][0] === subEdges[j][1] && subEdges[i][1] === subEdges[j][0]) {
        used[i] = true;
        used[j] = true;
        break;
      }
    }
  }

  const boundary = subEdges.filter((_, idx) => !used[idx]);
  const loops: [number, number][][] = [];
  const bUsed = new Array(boundary.length).fill(false);

  for (let i = 0; i < boundary.length; i++) {
    if (bUsed[i]) continue;
    bUsed[i] = true;
    const loop: [number, number][] = [boundary[i][0], boundary[i][1]];
    while (loop[loop.length - 1] !== loop[0]) {
      const curr = loop[loop.length - 1];
      let found = -1;
      for (let j = 0; j < boundary.length; j++) {
        if (!bUsed[j] && boundary[j][0] === curr) {
          found = j;
          break;
        }
      }
      if (found === -1) break;
      bUsed[found] = true;
      loop.push(boundary[found][1]);
    }
    if (loop.length > 1 && loop[loop.length - 1] === loop[0]) {
      loop.pop();
    }
    const simplified: [number, number][] = [];
    for (let k = 0; k < loop.length; k++) {
      const prev = loop[(k - 1 + loop.length) % loop.length];
      const curr = loop[k];
      const next = loop[(k + 1) % loop.length];
      const cross =
        (curr[0] - prev[0]) * (next[1] - curr[1]) -
        (curr[1] - prev[1]) * (next[0] - curr[0]);
      if (Math.abs(cross) > 1e-5) {
        simplified.push(curr);
      }
    }
    if (simplified.length >= 3) {
      loops.push(simplified);
    }
  }

  return loops;
}

/**
 * Compara si dos conjuntos de vértices coinciden como conjunto no ordenado dentro de una tolerancia.
 */
export function vertexSetsMatch(
  ptsA: [number, number][],
  ptsB: [number, number][],
  tol = 0.015
): boolean {
  if (ptsA.length !== ptsB.length) return false;
  const usedB = new Array(ptsB.length).fill(false);
  for (const [ax, ay] of ptsA) {
    let matched = false;
    for (let j = 0; j < ptsB.length; j++) {
      if (!usedB[j] && Math.hypot(ax - ptsB[j][0], ay - ptsB[j][1]) <= tol) {
        usedB[j] = true;
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

/**
 * Crea el estado inicial de las 7 piezas sueltas alrededor de la silueta objetivo en la Fase 2.
 */
export function createInitialLoosePieces(): VirtualPieceState[] {
  const initialLayout: {
    id: TangramPieceId;
    x: number;
    y: number;
    rotationDeg: number;
    flipped: boolean;
  }[] = [
    { id: 'large-tri-1', x: -1.35, y: -0.58, rotationDeg: 45, flipped: false },
    { id: 'large-tri-2', x: 1.35, y: -0.58, rotationDeg: 315, flipped: false },
    { id: 'med-tri', x: -1.38, y: 0.16, rotationDeg: 90, flipped: false },
    { id: 'square', x: 1.38, y: 0.15, rotationDeg: 0, flipped: false },
    { id: 'parallelogram', x: -1.32, y: 0.72, rotationDeg: 0, flipped: false },
    { id: 'small-tri-1', x: 1.24, y: 0.68, rotationDeg: 180, flipped: false },
    { id: 'small-tri-2', x: 1.54, y: 0.68, rotationDeg: 270, flipped: false },
  ];

  return initialLayout.map((item) => {
    const meta = CANONICAL_PIECE_MAP[item.id];
    return {
      id: item.id,
      kind: meta.kind,
      name: meta.name,
      color: meta.color,
      strokeColor: meta.strokeColor,
      x: item.x,
      y: item.y,
      rotationDeg: item.rotationDeg,
      flipped: item.flipped,
      snappedSlotId: null,
    };
  });
}

/**
 * Encuentra la transformación exacta (x, y, rotationDeg, flipped) que posiciona cada pieza en la solución de una silueta.
 */
export function solvePieceTransformForTarget(
  pieceId: TangramPieceId,
  targetVerts: [number, number][]
): { x: number; y: number; rotationDeg: number; flipped: boolean } {
  const [tx, ty] = polygonCentroid(targetVerts);
  const flipOptions = pieceId === 'parallelogram' ? [false, true] : [false, true];
  for (const flipped of flipOptions) {
    for (let rot = 0; rot < 360; rot += 45) {
      const candidate = getTransformedPieceVertices(pieceId, tx, ty, rot, flipped);
      if (vertexSetsMatch(candidate, targetVerts, 1e-3)) {
        return { x: tx, y: ty, rotationDeg: rot, flipped };
      }
    }
  }
  return { x: tx, y: ty, rotationDeg: 0, flipped: false };
}

/**
 * Aplica imantado suave (snapping) hacia:
 * 1) Los slots equivalentes libres de la silueta objetivo (si la orientación coincide y está cerca), o
 * 2) Los vértices de borde de la silueta y de otras piezas ya colocadas (para permitir soluciones internas alternativas).
 */
export function snapVirtualPiece(
  movingPiece: VirtualPieceState,
  allPieces: VirtualPieceState[],
  silhouette: TangramSilhouetteDef,
  snapRadius = 0.14
): { x: number; y: number; snappedSlotId: string | null } {
  // 1. Intentar imantar a un slot objetivo compatible de la misma clase geométrica
  const occupiedSlots = new Set(
    allPieces
      .filter((p) => p.id !== movingPiece.id && p.snappedSlotId)
      .map((p) => p.snappedSlotId as string)
  );

  let bestSlot: { slotId: string; x: number; y: number; dist: number } | null = null;

  for (const [slotId, targetVerts] of Object.entries(silhouette.pieces) as [
    TangramPieceId,
    [number, number][],
  ][]) {
    if (occupiedSlots.has(slotId)) continue;
    const slotMeta = CANONICAL_PIECE_MAP[slotId];
    if (slotMeta.kind !== movingPiece.kind) continue;

    const [tx, ty] = polygonCentroid(targetVerts);
    const dist = Math.hypot(movingPiece.x - tx, movingPiece.y - ty);
    if (dist <= snapRadius) {
      const candidateVerts = getTransformedPieceVertices(
        movingPiece.id,
        tx,
        ty,
        movingPiece.rotationDeg,
        movingPiece.flipped
      );
      if (vertexSetsMatch(candidateVerts, targetVerts, 0.02)) {
        if (!bestSlot || dist < bestSlot.dist) {
          bestSlot = { slotId, x: tx, y: ty, dist };
        }
      }
    }
  }

  if (bestSlot) {
    return {
      x: bestSlot.x,
      y: bestSlot.y,
      snappedSlotId: bestSlot.slotId,
    };
  }

  // 2. Imantado suave vértice-a-vértice (hacia vértices de la silueta fantasma u otras piezas cercanas)
  const currentVerts = getTransformedPieceVertices(
    movingPiece.id,
    movingPiece.x,
    movingPiece.y,
    movingPiece.rotationDeg,
    movingPiece.flipped
  );

  const anchorPoints: [number, number][] = [];
  for (const loop of computeSilhouetteBoundaryLoops(silhouette)) {
    for (const pt of loop) anchorPoints.push(pt);
  }
  for (const other of allPieces) {
    if (other.id === movingPiece.id) continue;
    const otherVerts = getTransformedPieceVertices(
      other.id,
      other.x,
      other.y,
      other.rotationDeg,
      other.flipped
    );
    for (const pt of otherVerts) anchorPoints.push(pt);
  }

  let bestVertexSnap: { dx: number; dy: number; dist: number } | null = null;
  const vertexSnapRadius = 0.075;

  for (const [vx, vy] of currentVerts) {
    for (const [ax, ay] of anchorPoints) {
      const dist = Math.hypot(ax - vx, ay - vy);
      if (dist <= vertexSnapRadius && (!bestVertexSnap || dist < bestVertexSnap.dist)) {
        bestVertexSnap = { dx: ax - vx, dy: ay - vy, dist };
      }
    }
  }

  if (bestVertexSnap) {
    return {
      x: movingPiece.x + bestVertexSnap.dx,
      y: movingPiece.y + bestVertexSnap.dy,
      snappedSlotId: null,
    };
  }

  return {
    x: movingPiece.x,
    y: movingPiece.y,
    snappedSlotId: null,
  };
}

export function pointInPolygonInclusive(
  px: number,
  py: number,
  poly: [number, number][],
  edgeTol = 0.006
): boolean {
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 > 0) {
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
      if (Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) <= edgeTol) {
        return true;
      }
    }
  }

  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Evalúa el porcentaje de cobertura real de la silueta objetivo por las 7 piezas actuales
 * y determina si la silueta está resuelta (ya sea mediante los 7 slots canónicos o mediante un arreglo interno equivalente).
 */
export function evaluateSilhouetteCompletion(
  pieces: VirtualPieceState[],
  silhouette: TangramSilhouetteDef
): { solved: boolean; coveragePercent: number } {
  // Vía rápida: las 7 piezas están imantadas en los 7 slots distintos
  const uniqueSlots = new Set(
    pieces.map((p) => p.snappedSlotId).filter((s): s is string => Boolean(s))
  );
  if (uniqueSlots.size === 7) {
    return { solved: true, coveragePercent: 100 };
  }

  // Evaluación geométrica por muestreo denso dentro de la silueta objetivo
  const targetPolys = Object.values(silhouette.pieces);
  const placedPolys = pieces.map((p) =>
    getTransformedPieceVertices(p.id, p.x, p.y, p.rotationDeg, p.flipped)
  );

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const poly of targetPolys) {
    for (const [x, y] of poly) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const gridN = 28;
  let targetCount = 0;
  let coveredCount = 0;

  for (let r = 0; r < gridN; r++) {
    const py = minY + ((r + 0.5) * (maxY - minY)) / gridN;
    for (let c = 0; c < gridN; c++) {
      const px = minX + ((c + 0.5) * (maxX - minX)) / gridN;
      const inTarget = targetPolys.some((tp) => pointInPolygonInclusive(px, py, tp, 0.002));
      if (inTarget) {
        targetCount++;
        const inPlaced = placedPolys.some((pp) =>
          pointInPolygonInclusive(px, py, pp, 0.008)
        );
        if (inPlaced) coveredCount++;
      }
    }
  }

  const ratio = targetCount > 0 ? coveredCount / targetCount : 0;
  const coveragePercent = Math.min(100, Math.round(ratio * 100));

  // Además verificar que ningún vértice de pieza colocada sobresalga lejos de la silueta objetivo
  let allVerticesInside = true;
  for (const pp of placedPolys) {
    for (const [vx, vy] of pp) {
      const insideTarget = targetPolys.some((tp) =>
        pointInPolygonInclusive(vx, vy, tp, 0.03)
      );
      if (!insideTarget) {
        allVerticesInside = false;
        break;
      }
    }
    if (!allVerticesInside) break;
  }

  const solved = ratio >= 0.975 && allVerticesInside;
  return {
    solved,
    coveragePercent: solved ? 100 : coveragePercent,
  };
}
