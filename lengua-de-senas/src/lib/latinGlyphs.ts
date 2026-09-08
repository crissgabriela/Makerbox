/**
 * Tipografía redondeada estilo Arial para bajo relieve en fabricación digital 3D.
 * Espesor del trazo: 1.2 mm (exactamente igual al diámetro de los puntos Braille para coherencia estética)
 * Altura del glifo: 6.2 mm (proporción clásica Arial Bold, S/H ≈ 0.19)
 * Curvas redondeadas suaves generadas por parametrización trigonométrica.
 */

export interface GlyphPolygon {
  contour: [number, number][];
  holes?: [number, number][][];
}

export const STROKE_WIDTH = 1.2; // mm (idéntico al diámetro de los puntos braille de 1.2mm)
export const GLYPH_WIDTH = 5.0; // mm
export const GLYPH_HEIGHT = 6.2; // mm

const W = GLYPH_WIDTH;
const H = GLYPH_HEIGHT;
const S = STROKE_WIDTH;
const CX = W / 2;
const MY = H / 2;

/**
 * Genera puntos de un arco elíptico o circular
 */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  steps = 8
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = startAngle + t * (endAngle - startAngle);
    pts.push([
      Math.round((cx + rx * Math.cos(a)) * 1000) / 1000,
      Math.round((cy + ry * Math.sin(a)) * 1000) / 1000
    ]);
  }
  return pts;
}

/**
 * Diccionario de glifos redondeados estilo Arial con trazo uniforme de 1.2 mm
 */
export const ARIAL_GLYPHS: Record<string, GlyphPolygon[]> = {
  // --- I ---
  I: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H],
        [CX - S / 2, H]
      ]
    }
  ],

  // --- L ---
  L: [
    {
      contour: [
        [0, 0],
        [W - 0.4, 0],
        [W - 0.4, S],
        [S, S],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- T ---
  T: [
    {
      contour: [
        [0, H - S],
        [CX - S / 2, H - S],
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    }
  ],

  // --- E ---
  E: [
    {
      contour: [
        [0, 0],
        [W - 0.3, 0],
        [W - 0.3, S],
        [S, S],
        [S, MY - S / 2],
        [W - 0.8, MY - S / 2],
        [W - 0.8, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W - 0.3, H - S],
        [W - 0.3, H],
        [0, H]
      ]
    }
  ],

  // --- F ---
  F: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - 0.8, MY - S / 2],
        [W - 0.8, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W - 0.3, H - S],
        [W - 0.3, H],
        [0, H]
      ]
    }
  ],

  // --- H ---
  H: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - S, MY - S / 2],
        [W - S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [W - S, MY + S / 2],
        [S, MY + S / 2],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- O (Redondeada Arial) ---
  O: [
    {
      // Contorno exterior redondeado
      contour: arc(CX, MY, W / 2, H / 2, 0, Math.PI * 2, 24),
      // Hueco interior concéntrico
      holes: [arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 2, 0, 20)]
    }
  ],

  // --- C (Redondeada Arial) ---
  C: [
    {
      contour: [
        // Extremo superior
        [W - 0.2, H - S],
        // Arco exterior desde ~45° hasta ~315°
        ...arc(CX, MY, W / 2, H / 2, Math.PI * 0.25, Math.PI * 1.75, 20),
        // Extremo inferior
        [W - 0.2, S],
        // Arco interior desde ~315° de regreso a ~45°
        ...arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 1.75, Math.PI * 0.25, 16)
      ]
    }
  ],

  // --- U (Redondeada Arial) ---
  U: [
    {
      contour: [
        [0, H],
        [S, H],
        [S, MY],
        // Arco interior inferior
        ...arc(CX, MY, W / 2 - S, MY - S, Math.PI, 0, 12),
        [W - S, H],
        [W, H],
        [W, MY],
        // Arco exterior inferior
        ...arc(CX, MY, W / 2, MY, 0, Math.PI, 14),
        [0, MY]
      ]
    }
  ],

  // --- D (Redondeada Arial) ---
  D: [
    {
      contour: [
        [0, 0],
        [S, 0],
        // Arco exterior derecho
        ...arc(S, MY, W - S, H / 2, -Math.PI / 2, Math.PI / 2, 16),
        [0, H]
      ],
      holes: [
        [
          [S, S],
          // Arco interior derecho
          ...arc(S, MY, W - 2 * S, H / 2 - S, Math.PI / 2, -Math.PI / 2, 12)
        ]
      ]
    }
  ],

  // --- P (Redondeada Arial) ---
  P: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - 0.2],
        // Arco exterior superior derecho
        ...arc(S, (H + MY) / 2, W - S, (H - MY) / 2 + 0.2, -Math.PI / 2, Math.PI / 2, 14),
        [0, H]
      ],
      holes: [
        [
          [S, MY + S * 0.4],
          // Arco interior
          ...arc(S, (H + MY) / 2, W - 2 * S, (H - MY) / 2 - S * 0.6, Math.PI / 2, -Math.PI / 2, 10)
        ]
      ]
    }
  ],

  // --- R (Redondeada Arial) ---
  R: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - 0.3],
        [W - S - 0.2, MY - 0.3],
        [W, 0],
        [W - S * 0.8, 0],
        [CX, MY - 0.3],
        // Arco exterior
        ...arc(S, (H + MY) / 2, W - S, (H - MY) / 2 + 0.2, -Math.PI / 2, Math.PI / 2, 14),
        [0, H]
      ],
      holes: [
        [
          [S, MY + S * 0.4],
          ...arc(S, (H + MY) / 2, W - 2 * S, (H - MY) / 2 - S * 0.6, Math.PI / 2, -Math.PI / 2, 10)
        ]
      ]
    }
  ],

  // --- B (Redondeada Arial) ---
  B: [
    {
      contour: [
        [0, 0],
        [S, 0],
        // Bucle inferior
        ...arc(S, MY / 2, W - S, MY / 2, -Math.PI / 2, Math.PI / 2, 12),
        // Bucle superior
        ...arc(S, MY + MY / 2, W - S - 0.2, MY / 2, -Math.PI / 2, Math.PI / 2, 12),
        [0, H]
      ],
      holes: [
        // Hueco inferior
        [
          [S, S * 0.6],
          ...arc(S, MY / 2, W - 2 * S, MY / 2 - S * 0.6, Math.PI / 2, -Math.PI / 2, 8)
        ],
        // Hueco superior
        [
          [S, MY + S * 0.4],
          ...arc(S, MY + MY / 2, W - 2 * S - 0.2, MY / 2 - S * 0.6, Math.PI / 2, -Math.PI / 2, 8)
        ]
      ]
    }
  ],

  // --- A (Estilo Arial) ---
  A: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S + 0.3, MY - S * 0.5],
        [W - S - 0.3, MY - S * 0.5],
        [W - S, 0],
        [W, 0],
        [CX + S / 2, H],
        [CX - S / 2, H]
      ],
      holes: [
        [
          [S + 0.5, MY + S * 0.5],
          [W - S - 0.5, MY + S * 0.5],
          [CX, H - S * 1.3]
        ]
      ]
    }
  ],

  // --- N ---
  N: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [W - S, H - S * 1.5],
        [W - S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [S, S * 1.5],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- M ---
  M: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, H - S * 1.6],
        [CX, MY - S * 0.4],
        [W - S, H - S * 1.6],
        [W - S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [CX, MY + S * 0.6],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- S (Curva Suave Arial) ---
  S: [
    {
      contour: [
        // Bucle inferior derecho
        [W - 0.2, S * 1.2],
        ...arc(CX, MY * 0.6, W / 2, MY * 0.6, Math.PI * 0.25, Math.PI * 1.5, 14),
        // Cruce central hacia bucle superior izquierdo
        ...arc(CX, H - MY * 0.6, W / 2, MY * 0.6, Math.PI * 0.5, Math.PI * 1.8, 14),
        [0.2, H - S * 1.2],
        // Retorno interior
        ...arc(CX, H - MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 1.8, Math.PI * 0.5, 10),
        ...arc(CX, MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 1.5, Math.PI * 0.25, 10)
      ]
    }
  ],

  // --- G (Curva Suave Arial) ---
  G: [
    {
      contour: [
        [W - 0.2, H - S],
        ...arc(CX, MY, W / 2, H / 2, Math.PI * 0.25, Math.PI * 1.75, 18),
        [W, MY - 0.2],
        [CX, MY - 0.2],
        [CX, MY + S * 0.6],
        [W - S, MY + S * 0.6],
        [W - S, S * 1.4],
        ...arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 1.7, Math.PI * 0.25, 14)
      ]
    }
  ],

  // --- J (Curva Arial) ---
  J: [
    {
      contour: [
        [0.3, S * 1.5],
        ...arc(CX, S * 1.5, CX, S * 1.5, Math.PI, 0, 10),
        [W, H],
        [W - S, H],
        [W - S, S * 1.5],
        ...arc(CX, S * 1.5, CX - S, S * 0.7, 0, Math.PI, 8)
      ]
    }
  ],

  // --- K ---
  K: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S * 0.4],
        [W - S * 0.5, 0],
        [W, 0],
        [CX, MY],
        [W, H],
        [W - S * 0.5, H],
        [S, MY + S * 0.4],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- V ---
  V: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [W, H],
        [W - S, H],
        [CX, S * 1.2],
        [S, H],
        [0, H]
      ]
    }
  ],

  // --- W ---
  W: [
    {
      contour: [
        [0, H],
        [S, H],
        [W * 0.3, S * 1.2],
        [CX, MY + S * 0.2],
        [W * 0.7, S * 1.2],
        [W - S, H],
        [W, H],
        [W * 0.78, 0],
        [W * 0.62, 0],
        [CX, MY - S * 0.4],
        [W * 0.38, 0],
        [W * 0.22, 0]
      ]
    }
  ],

  // --- X ---
  X: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [CX, MY - S / 2],
        [W - S, 0],
        [W, 0],
        [CX + S / 2, MY],
        [W, H],
        [W - S, H],
        [CX, MY + S / 2],
        [S, H],
        [0, H],
        [CX - S / 2, MY]
      ]
    }
  ],

  // --- Y ---
  Y: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, MY],
        [W, H],
        [W - S, H],
        [CX, MY + S * 0.4],
        [S, H],
        [0, H],
        [CX - S / 2, MY]
      ]
    }
  ],

  // --- Z ---
  Z: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S * 1.6, S],
        [W, H - S],
        [W, H],
        [0, H],
        [0, H - S],
        [W - S * 1.6, H - S],
        [0, S]
      ]
    }
  ],

  // --- Q ---
  Q: [
    {
      contour: [
        ...arc(CX, MY, W / 2, H / 2, 0, Math.PI * 2, 20),
        [W, -0.4],
        [W - 0.4, -0.4],
        [W - S, S * 0.5]
      ],
      holes: [arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 2, 0, 16)]
    }
  ],

  // --- NÚMEROS REDONDEADOS (0-9) ---
  '0': [
    {
      contour: arc(CX, MY, W / 2, H / 2, 0, Math.PI * 2, 20),
      holes: [arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 2, 0, 16)]
    }
  ],

  '1': [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H],
        [CX - S, H - S * 0.8],
        [CX - S, H],
        [CX - S / 2, H]
      ]
    }
  ],

  '2': [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S * 1.5, S],
        [W - S * 0.5, H - MY],
        ...arc(CX, H - MY * 0.7, W / 2, MY * 0.7, 0, Math.PI, 14),
        [0, H - S],
        ...arc(CX, H - MY * 0.7, W / 2 - S, MY * 0.7 - S * 0.4, Math.PI, 0, 10),
        [0, S]
      ]
    }
  ],

  '3': [
    {
      contour: [
        [0.4, S * 1.2],
        ...arc(CX, MY * 0.6, W / 2, MY * 0.6, Math.PI * 0.3, Math.PI * 1.6, 12),
        [CX - 0.4, MY],
        ...arc(CX, H - MY * 0.6, W / 2, MY * 0.6, Math.PI * 0.4, Math.PI * 1.7, 12),
        [0.4, H - S * 1.2],
        ...arc(CX, H - MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 1.7, Math.PI * 0.4, 8),
        ...arc(CX, MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 1.6, Math.PI * 0.3, 8)
      ]
    }
  ],

  '4': [
    {
      contour: [
        [CX + 0.3, 0],
        [CX + 0.3 + S, 0],
        [CX + 0.3 + S, H],
        [CX + 0.3, H],
        [0, MY + S * 0.8],
        [0, MY],
        [W, MY],
        [W, MY + S],
        [CX + 0.3, MY + S]
      ]
    }
  ],

  '5': [
    {
      contour: [
        [0.3, S * 1.2],
        ...arc(CX, MY * 0.6, W / 2, MY * 0.6, Math.PI * 0.3, Math.PI * 1.6, 14),
        [0, MY + S],
        [0, H],
        [W - 0.3, H],
        [W - 0.3, H - S],
        [S, H - S],
        [S, MY + S * 0.2],
        ...arc(CX, MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 1.6, Math.PI * 0.3, 10)
      ]
    }
  ],

  '6': [
    {
      contour: [
        [CX, H],
        ...arc(CX, MY, W / 2, H / 2, Math.PI * 0.5, Math.PI * 1.5, 14),
        ...arc(CX, MY * 0.6, W / 2, MY * 0.6, -Math.PI / 2, Math.PI / 2, 10),
        [S, H]
      ],
      holes: [arc(CX, MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 2, 0, 12)]
    }
  ],

  '7': [
    {
      contour: [
        [0, H - S],
        [W - S, H - S],
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [W, H],
        [0, H]
      ]
    }
  ],

  '8': [
    {
      contour: arc(CX, MY, W / 2, H / 2, 0, Math.PI * 2, 20),
      holes: [
        arc(CX, MY * 0.55, W / 2 - S, MY * 0.55 - S * 0.5, Math.PI * 2, 0, 10),
        arc(CX, H - MY * 0.55, W / 2 - S, MY * 0.55 - S * 0.5, Math.PI * 2, 0, 10)
      ]
    }
  ],

  '9': [
    {
      contour: [
        [W - S, 0],
        [W, 0],
        ...arc(CX, MY, W / 2, H / 2, -Math.PI * 0.5, Math.PI * 0.5, 14),
        [CX, 0]
      ],
      holes: [arc(CX, H - MY * 0.6, W / 2 - S, MY * 0.6 - S * 0.5, Math.PI * 2, 0, 12)]
    }
  ],

  // --- CARACTERES ESPAÑOLES (Ñ Y ACENTOS) ---
  Ñ: [
    // Cuerpo N
    {
      contour: [
        [0, 0],
        [S, 0],
        [W - S, H - S * 1.5],
        [W - S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [S, S * 1.5],
        [S, H],
        [0, H]
      ]
    },
    // Virgulilla / Tilde suave sobre la N
    {
      contour: [
        [0.4, H + 0.3],
        [W - 0.4, H + 0.3],
        [W - 0.4, H + 0.3 + S * 0.7],
        [0.4, H + 0.3 + S * 0.7]
      ]
    }
  ],

  Á: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S + 0.3, MY - S * 0.5],
        [W - S - 0.3, MY - S * 0.5],
        [W - S, 0],
        [W, 0],
        [CX + S / 2, H],
        [CX - S / 2, H]
      ],
      holes: [
        [
          [S + 0.5, MY + S * 0.5],
          [W - S - 0.5, MY + S * 0.5],
          [CX, H - S * 1.3]
        ]
      ]
    },
    {
      contour: [
        [CX - 0.3, H + 0.3],
        [CX + 0.8, H + 1.1],
        [CX + 0.2, H + 1.3],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  É: [
    {
      contour: [
        [0, 0],
        [W - 0.3, 0],
        [W - 0.3, S],
        [S, S],
        [S, MY - S / 2],
        [W - 0.8, MY - S / 2],
        [W - 0.8, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W - 0.3, H - S],
        [W - 0.3, H],
        [0, H]
      ]
    },
    {
      contour: [
        [CX - 0.3, H + 0.3],
        [CX + 0.8, H + 1.1],
        [CX + 0.2, H + 1.3],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Í: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H],
        [CX - S / 2, H]
      ]
    },
    {
      contour: [
        [CX - 0.3, H + 0.3],
        [CX + 0.8, H + 1.1],
        [CX + 0.2, H + 1.3],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Ó: [
    {
      contour: arc(CX, MY, W / 2, H / 2, 0, Math.PI * 2, 20),
      holes: [arc(CX, MY, W / 2 - S, H / 2 - S, Math.PI * 2, 0, 16)]
    },
    {
      contour: [
        [CX - 0.3, H + 0.3],
        [CX + 0.8, H + 1.1],
        [CX + 0.2, H + 1.3],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Ú: [
    {
      contour: [
        [0, H],
        [S, H],
        [S, MY],
        ...arc(CX, MY, W / 2 - S, MY - S, Math.PI, 0, 12),
        [W - S, H],
        [W, H],
        [W, MY],
        ...arc(CX, MY, W / 2, MY, 0, Math.PI, 14),
        [0, MY]
      ]
    },
    {
      contour: [
        [CX - 0.3, H + 0.3],
        [CX + 0.8, H + 1.1],
        [CX + 0.2, H + 1.3],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  '-': [
    {
      contour: [
        [0.3, MY - S / 2],
        [W - 0.3, MY - S / 2],
        [W - 0.3, MY + S / 2],
        [0.3, MY + S / 2]
      ]
    }
  ],

  '.': [
    {
      contour: arc(CX, S / 2, S / 2, S / 2, 0, Math.PI * 2, 10)
    }
  ]
};

/**
 * Obtiene los polígonos del glifo Arial escalado y posicionado en (originX, originY)
 */
export function getArialGlyphAt(
  char: string,
  originX: number,
  originY: number,
  scale = 1.0
): { contour: [number, number][]; holes?: [number, number][][] }[] {
  const upper = char.toUpperCase();
  const glyphs = ARIAL_GLYPHS[upper];
  if (!glyphs) return [];

  return glyphs.map((g) => ({
    contour: g.contour.map(([x, y]) => [originX + x * scale, originY + y * scale]),
    holes: g.holes?.map((h) => h.map(([x, y]) => [originX + x * scale, originY + y * scale]))
  }));
}
