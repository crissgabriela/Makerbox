/**
 * Definiciones vectoriales exactas de glifos latinos para grabado en bajorrelieve
 * Trazo constante: espesor = 0.8 mm (solicitado por usuario)
 * Profundidad: 0.4 mm en la placa de 1.0 mm
 */

export interface GlyphPolygon {
  // Puntos [x, y] del contorno exterior
  contour: [number, number][];
  // Huecos interiores opcionales (para letras como O, A, D, R, P, B, etc.)
  holes?: [number, number][][];
}

// Dimensiones de referencia de cada glifo
export const GLYPH_WIDTH = 3.6; // mm
export const GLYPH_HEIGHT = 5.2; // mm
export const STROKE_WIDTH = 0.8; // mm (solicitado exactamente 0.8)

const W = GLYPH_WIDTH;
const H = GLYPH_HEIGHT;
const S = STROKE_WIDTH;
const CX = W / 2;
const MY = H / 2;

/**
 * Diccionario de polígonos vectoriales para cada carácter (A-Z, 0-9, caracteres españoles)
 */
export const LATIN_GLYPHS: Record<string, GlyphPolygon[]> = {
  // --- LETRAS BÁSICAS ---
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

  L: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S, S],
        [S, H],
        [0, H]
      ]
    }
  ],

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

  E: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S, S],
        [S, MY - S / 2],
        [W - 0.5, MY - S / 2],
        [W - 0.5, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    }
  ],

  F: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - 0.5, MY - S / 2],
        [W - 0.5, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    }
  ],

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

  C: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S, S],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    }
  ],

  U: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [W - S, S],
        [S, S],
        [S, H],
        [0, H]
      ]
    }
  ],

  O: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  A: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - S, MY - S / 2],
        [W - S, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, MY + S / 2],
          [W - S, MY + S / 2],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

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

  M: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, H - S * 1.5],
        [CX, MY - S / 2],
        [W - S, H - S * 1.5],
        [W - S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [CX, MY + S / 2],
        [S, H],
        [0, H]
      ]
    }
  ],

  V: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [W, H],
        [W - S, H],
        [CX, S],
        [S, H],
        [0, H]
      ]
    }
  ],

  W: [
    {
      contour: [
        [0, H],
        [S, H],
        [W * 0.3, S],
        [CX, MY],
        [W * 0.7, S],
        [W - S, H],
        [W, H],
        [W * 0.75, 0],
        [W * 0.65, 0],
        [CX, MY - S / 2],
        [W * 0.35, 0],
        [W * 0.25, 0]
      ]
    }
  ],

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

  Y: [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
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

  Z: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S * 1.5, S],
        [W, H - S],
        [W, H],
        [0, H],
        [0, H - S],
        [W - S * 1.5, H - S],
        [0, S]
      ]
    }
  ],

  S: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H],
        [0, MY - S / 2],
        [W - S, MY - S / 2],
        [W - S, S],
        [0, S]
      ]
    }
  ],

  P: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY],
        [W, MY],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, MY + S],
          [W - S, MY + S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  R: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY],
        [W - S, MY],
        [W, 0],
        [W - S, 0],
        [CX, MY - S / 2],
        [W, MY],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, MY + S],
          [W - S, MY + S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  D: [
    {
      contour: [
        [0, 0],
        [W - 0.5, 0],
        [W, S],
        [W, H - S],
        [W - 0.5, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S - 0.3, S],
          [W - S, S + 0.3],
          [W - S, H - S - 0.3],
          [W - S - 0.3, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  B: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, MY - S / 4],
        [W - 0.5, MY],
        [W, MY + S / 4],
        [W, H],
        [0, H]
      ],
      holes: [
        // Hueco inferior
        [
          [S, S],
          [W - S, S],
          [W - S, MY - S / 2],
          [S, MY - S / 2]
        ],
        // Hueco superior
        [
          [S, MY + S / 2],
          [W - S, MY + S / 2],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  G: [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, MY],
        [CX, MY],
        [CX, MY - S],
        [W - S, MY - S],
        [W - S, S],
        [S, S],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    }
  ],

  J: [
    {
      contour: [
        [0, S],
        [S, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [W - S, S],
        [S, S],
        [0, S * 1.5]
      ]
    }
  ],

  K: [
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - S, 0],
        [W, 0],
        [CX, MY],
        [W, H],
        [W - S, H],
        [S, MY + S / 2],
        [S, H],
        [0, H]
      ]
    }
  ],

  Q: [
    {
      contour: [
        [0, 0],
        [W - S, 0],
        [W, -0.4],
        [W - 0.3, -0.4],
        [W - S, S / 2],
        [0, S / 2],
        [0, H],
        [W, H],
        [W, S],
        [W - S / 2, S]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  // --- NÚMEROS (0-9) ---
  '0': [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  '1': [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H],
        [CX - S, H - S],
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
        [S * 1.5, MY],
        [W, MY],
        [W, H],
        [0, H],
        [0, H - S],
        [W - S, H - S],
        [W - S, MY + S],
        [0, MY + S]
      ]
    }
  ],

  '3': [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H],
        [0, H - S],
        [W - S, H - S],
        [W - S, MY + S / 2],
        [S, MY + S / 2],
        [S, MY - S / 2],
        [W - S, MY - S / 2],
        [W - S, S],
        [0, S]
      ]
    }
  ],

  '4': [
    {
      contour: [
        [CX, 0],
        [CX + S, 0],
        [CX + S, H],
        [CX, H],
        [0, MY + S],
        [0, MY],
        [W, MY],
        [W, MY + S],
        [CX, MY + S]
      ]
    }
  ],

  '5': [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, MY + S],
        [S, MY + S],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H],
        [0, MY],
        [W - S, MY],
        [W - S, S],
        [0, S]
      ]
    }
  ],

  '6': [
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, MY + S / 2],
        [S, MY + S / 2],
        [S, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, MY - S / 2],
          [S, MY - S / 2]
        ]
      ]
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
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, MY - S / 2],
          [S, MY - S / 2]
        ],
        [
          [S, MY + S / 2],
          [W - S, MY + S / 2],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  '9': [
    {
      contour: [
        [W - S, 0],
        [W, 0],
        [W, H],
        [0, H],
        [0, MY - S / 2],
        [W - S, MY - S / 2]
      ],
      holes: [
        [
          [S, MY + S / 2],
          [W - S, MY + S / 2],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    }
  ],

  // --- CARACTERES ESPAÑOLES CON TILDE Y Ñ ---
  Ñ: [
    // Cuerpo 'N'
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
    // Tilde sobre la N
    {
      contour: [
        [0.4, H + 0.3],
        [W - 0.4, H + 0.3],
        [W - 0.4, H + 0.3 + S * 0.75],
        [0.4, H + 0.3 + S * 0.75]
      ]
    }
  ],

  Á: [
    // Cuerpo A
    {
      contour: [
        [0, 0],
        [S, 0],
        [S, MY - S / 2],
        [W - S, MY - S / 2],
        [W - S, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, MY + S / 2],
          [W - S, MY + S / 2],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    },
    // Acento agudo
    {
      contour: [
        [CX - 0.4, H + 0.3],
        [CX + 0.6, H + 1.0],
        [CX + 0.1, H + 1.2],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  É: [
    // Cuerpo E
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, S],
        [S, S],
        [S, MY - S / 2],
        [W - 0.5, MY - S / 2],
        [W - 0.5, MY + S / 2],
        [S, MY + S / 2],
        [S, H - S],
        [W, H - S],
        [W, H],
        [0, H]
      ]
    },
    // Acento agudo
    {
      contour: [
        [CX - 0.4, H + 0.3],
        [CX + 0.6, H + 1.0],
        [CX + 0.1, H + 1.2],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Í: [
    // Cuerpo I
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, H],
        [CX - S / 2, H]
      ]
    },
    // Acento agudo
    {
      contour: [
        [CX - 0.4, H + 0.3],
        [CX + 0.6, H + 1.0],
        [CX + 0.1, H + 1.2],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Ó: [
    // Cuerpo O
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ],
      holes: [
        [
          [S, S],
          [W - S, S],
          [W - S, H - S],
          [S, H - S]
        ]
      ]
    },
    // Acento agudo
    {
      contour: [
        [CX - 0.4, H + 0.3],
        [CX + 0.6, H + 1.0],
        [CX + 0.1, H + 1.2],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  Ú: [
    // Cuerpo U
    {
      contour: [
        [0, 0],
        [W, 0],
        [W, H],
        [W - S, H],
        [W - S, S],
        [S, S],
        [S, H],
        [0, H]
      ]
    },
    // Acento agudo
    {
      contour: [
        [CX - 0.4, H + 0.3],
        [CX + 0.6, H + 1.0],
        [CX + 0.1, H + 1.2],
        [CX - 0.9, H + 0.5]
      ]
    }
  ],

  '-': [
    {
      contour: [
        [0.2, MY - S / 2],
        [W - 0.2, MY - S / 2],
        [W - 0.2, MY + S / 2],
        [0.2, MY + S / 2]
      ]
    }
  ],

  '.': [
    {
      contour: [
        [CX - S / 2, 0],
        [CX + S / 2, 0],
        [CX + S / 2, S],
        [CX - S / 2, S]
      ]
    }
  ]
};

/**
 * Obtiene los polígonos de un carácter escalados y desplazados a la posición (x, y)
 */
export function getGlyphPolygonsAt(
  char: string,
  originX: number,
  originY: number,
  scale = 1.0
): { contour: [number, number][]; holes?: [number, number][][] }[] {
  const upper = char.toUpperCase();
  const glyphs = LATIN_GLYPHS[upper];
  if (!glyphs) return [];

  return glyphs.map((g) => ({
    contour: g.contour.map(([x, y]) => [originX + x * scale, originY + y * scale]),
    holes: g.holes?.map((h) => h.map(([x, y]) => [originX + x * scale, originY + y * scale]))
  }));
}
