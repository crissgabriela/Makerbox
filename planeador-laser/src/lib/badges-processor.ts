export type PedagogicalLevelId = 'nivel1' | 'nivel2' | 'nivel3';
export type FrameGeometryId = 'hexagono' | 'engranaje' | 'circular';
export type BadgeIconId =
  | 'paw'
  | 'star'
  | 'bolt'
  | 'atom'
  | 'rocket'
  | 'heart'
  | 'robot'
  | 'shield';
export type IdeaThemeId = 'animales' | 'espacio' | 'deportes' | 'ciencia';

export interface BadgeMemberConfig {
  id: number;
  primaryText: string;
  secondaryText: string;
  icon: BadgeIconId;
  plaColorHex: string;
}

export interface BadgesTeamParams {
  levelId: PedagogicalLevelId;
  teamName: string;
  memberCount: number; // 2..5
  geometry: FrameGeometryId;
  woodCenterDiameterMm: number; // default 36 mm
  woodThicknessMm: number; // default 3.0 mm
  clearanceMm: number; // default 0.15 mm
  members: BadgeMemberConfig[];
}

export interface PedagogicalLevelInfo {
  id: PedagogicalLevelId;
  grades: string;
  title: string;
  summary: string;
  learningGoal: string;
  badgeColor: string;
}

export const PEDAGOGICAL_LEVELS: Record<PedagogicalLevelId, PedagogicalLevelInfo> = {
  nivel1: {
    id: 'nivel1',
    grades: 'Nivel 1 (5° a 6° Básico)',
    title: 'Inspiración en la Naturaleza (Biomimética)',
    summary:
      'Exploramos cómo las abejas construyen panales hexagonales que se conectan sin dejar espacios vacíos, logrando estructuras fuertes y colaborativas.',
    learningGoal:
      'Comprender cómo las formas geométricas naturales permiten unir piezas individuales en una comunidad.',
    badgeColor: 'amber',
  },
  nivel2: {
    id: 'nivel2',
    grades: 'Nivel 2 (7° Básico)',
    title: 'Polígonos y Protección Estructural Híbrida',
    summary:
      'Combinamos la calidez y rapidez del grabado láser en madera de 3 mm con un exoesqueleto perimetral impreso en 3D (PLA) que absorbe impactos.',
    learningGoal:
      'Analizar la complementariedad de materiales (Madera + Polímero PLA) y el diseño de bordes conectores.',
    badgeColor: 'sky',
  },
  nivel3: {
    id: 'nivel3',
    grades: 'Nivel 3 (8° Básico)',
    title: 'Tolerancias de Fabricación Digital y Ajuste a Presión (Press-Fit)',
    summary:
      'Calculamos la holgura (clearance de 0.15 mm) y el bisel de retención superior para que el disco de madera de 36.0 mm encaje a presión dentro de una cavidad de 36.3 mm sin usar pegamento.',
    learningGoal:
      'Dominar el concepto de tolerancia dimensional, interferencia elástica y ensamble mecánico sin adhesivos.',
    badgeColor: 'purple',
  },
};

export interface FrameGeometryInfo {
  id: FrameGeometryId;
  name: string;
  shortName: string;
  description: string;
  connectionMechanism: string;
}

export const FRAME_GEOMETRIES: Record<FrameGeometryId, FrameGeometryInfo> = {
  hexagono: {
    id: 'hexagono',
    name: 'Hexágono Tipo Panal',
    shortName: 'Panal Hexagonal',
    description:
      'Lados planos con pestañas y muescas laterales complementarias para acoplar las chapitas del grupo como una colmena.',
    connectionMechanism: 'Pestañas trapezoidales macho/hembra en las caras del hexágono',
  },
  engranaje: {
    id: 'engranaje',
    name: 'Engranaje Mecánico',
    shortName: 'Engranaje',
    description:
      'Borde exterior dentado para que las chapitas del grupo engranen entre sí al juntarlas sobre una mesa.',
    connectionMechanism: '12 dientes perimetrales sincronizados que engranan en cualquier ángulo',
  },
  circular: {
    id: 'circular',
    name: 'Circular con Muesca',
    shortName: 'Medallón Circular',
    description:
      'Medallón redondo clásico con pestañas laterales redondeadas y muescas de unión tipo puzzle.',
    connectionMechanism: 'Lengüetas laterales macho y cavidades hembra a ±45° y ±135°',
  },
};

export interface BadgeIconInfo {
  id: BadgeIconId;
  label: string;
  emoji: string;
  /** Elementos SVG centrados en un sistema de coordenadas [-12, 12] x [-12, 12] */
  svgPaths: string[];
}

export const BADGE_ICONS: Record<BadgeIconId, BadgeIconInfo> = {
  paw: {
    id: 'paw',
    label: 'Huella Mascota',
    emoji: '🐾',
    svgPaths: [
      // Almohadilla central
      'M -4.5 2.5 C -5.5 0 -3.5 -2.5 0 -2.5 C 3.5 -2.5 5.5 0 4.5 2.5 C 3.8 4.8 5.2 6.8 3.2 7.8 C 1.5 8.5 -1.5 8.5 -3.2 7.8 C -5.2 6.8 -3.8 4.8 -4.5 2.5 Z',
      // 4 deditos
      'M -6.8 -1.2 A 1.8 2.4 0 1 1 -3.2 -1.2 A 1.8 2.4 0 1 1 -6.8 -1.2 Z',
      'M -3.2 -5.5 A 1.8 2.5 0 1 1 0.4 -5.5 A 1.8 2.5 0 1 1 -3.2 -5.5 Z',
      'M 0.6 -5.5 A 1.8 2.5 0 1 1 4.2 -5.5 A 1.8 2.5 0 1 1 0.6 -5.5 Z',
      'M 3.4 -1.2 A 1.8 2.4 0 1 1 7.0 -1.2 A 1.8 2.4 0 1 1 3.4 -1.2 Z',
    ],
  },
  star: {
    id: 'star',
    label: 'Estrella',
    emoji: '⭐',
    svgPaths: [
      'M 0 -9.5 L 2.6 -3.1 L 9.5 -2.5 L 4.3 2.0 L 5.9 8.8 L 0 5.2 L -5.9 8.8 L -4.3 2.0 L -9.5 -2.5 L -2.6 -3.1 Z',
      'M 0 -5.0 L 1.4 -1.6 L 5.0 -1.3 L 2.2 1.1 L 3.1 4.6 L 0 2.7 L -3.1 4.6 L -2.2 1.1 L -5.0 -1.3 L -1.4 -1.6 Z',
    ],
  },
  bolt: {
    id: 'bolt',
    label: 'Rayo',
    emoji: '⚡',
    svgPaths: [
      'M 1.8 -9.5 L -6.5 0.8 L -0.5 0.8 L -2.2 9.5 L 6.5 -1.2 L 0.4 -1.2 Z',
    ],
  },
  atom: {
    id: 'atom',
    label: 'Átomo',
    emoji: '⚛️',
    svgPaths: [
      'M -1.8 0 A 1.8 1.8 0 1 0 1.8 0 A 1.8 1.8 0 1 0 -1.8 0 Z',
      'M -9.2 0 A 9.2 3.4 0 1 0 9.2 0 A 9.2 3.4 0 1 0 -9.2 0 Z',
      'M -4.6 -7.97 A 9.2 3.4 60 1 0 4.6 7.97 A 9.2 3.4 60 1 0 -4.6 -7.97 Z',
      'M 4.6 -7.97 A 9.2 3.4 120 1 0 -4.6 7.97 A 9.2 3.4 120 1 0 4.6 -7.97 Z',
    ],
  },
  rocket: {
    id: 'rocket',
    label: 'Cohete',
    emoji: '🚀',
    svgPaths: [
      'M 0 -9.5 C 3.5 -5.5 4.2 -0.5 3.8 4.5 L -3.8 4.5 C -4.2 -0.5 -3.5 -5.5 0 -9.5 Z',
      'M -3.8 1.2 L -7.2 4.8 L -3.8 4.5 Z',
      'M 3.8 1.2 L 7.2 4.8 L 3.8 4.5 Z',
      'M -2.0 4.5 L 0 8.8 L 2.0 4.5 Z',
      'M -1.8 -2.2 A 1.8 1.8 0 1 0 1.8 -2.2 A 1.8 1.8 0 1 0 -1.8 -2.2 Z',
    ],
  },
  heart: {
    id: 'heart',
    label: 'Corazón',
    emoji: '❤️',
    svgPaths: [
      'M 0 8.5 C -2.5 6.2 -9.0 1.8 -9.0 -3.2 C -9.0 -6.8 -6.0 -9.0 -3.2 -9.0 C -1.4 -9.0 0 -7.8 0 -6.2 C 0 -7.8 1.4 -9.0 3.2 -9.0 C 6.0 -9.0 9.0 -6.8 9.0 -3.2 C 9.0 1.8 2.5 6.2 0 8.5 Z',
    ],
  },
  robot: {
    id: 'robot',
    label: 'Robot',
    emoji: '🤖',
    svgPaths: [
      'M -6.5 -4.5 L 6.5 -4.5 L 6.5 6.5 L -6.5 6.5 Z',
      'M 0 -4.5 L 0 -8.0',
      'M -1.4 -8.8 A 1.4 1.4 0 1 0 1.4 -8.8 A 1.4 1.4 0 1 0 -1.4 -8.8 Z',
      'M -4.2 -1.0 A 1.4 1.4 0 1 0 -1.4 -1.0 A 1.4 1.4 0 1 0 -4.2 -1.0 Z',
      'M 1.4 -1.0 A 1.4 1.4 0 1 0 4.2 -1.0 A 1.4 1.4 0 1 0 1.4 -1.0 Z',
      'M -3.8 3.2 L 3.8 3.2',
      'M -8.2 -1.5 L -6.5 -1.5 L -6.5 2.5 L -8.2 2.5 Z',
      'M 6.5 -1.5 L 8.2 -1.5 L 8.2 2.5 L 6.5 2.5 Z',
    ],
  },
  shield: {
    id: 'shield',
    label: 'Escudo',
    emoji: '🛡️',
    svgPaths: [
      'M 0 -9.0 L 7.5 -6.2 L 7.5 -0.5 C 7.5 4.2 4.2 7.5 0 9.2 C -4.2 7.5 -7.5 4.2 -7.5 -0.5 L -7.5 -6.2 Z',
      'M 0 -6.2 L 4.8 -4.2 L 4.8 -0.5 C 4.8 2.8 2.6 5.2 0 6.5 C -2.6 5.2 -4.8 2.8 -4.8 -0.5 L -4.8 -4.2 Z',
    ],
  },
};

export interface TeamIdeaSuggestion {
  teamName: string;
  motto: string;
  recommendedGeometry: FrameGeometryId;
  icons: BadgeIconId[];
  sampleMemberNames: string[];
}

export const AI_TEAM_IDEAS_BY_THEME: Record<IdeaThemeId, TeamIdeaSuggestion[]> = {
  animales: [
    {
      teamName: 'Manada Alfa',
      motto: 'Lealtad y naturaleza conectada',
      recommendedGeometry: 'hexagono',
      icons: ['paw', 'heart', 'shield', 'star', 'bolt'],
      sampleMemberNames: ['Max', 'Luna', 'Rocky', 'Kira', 'Toby'],
    },
    {
      teamName: 'Colmena Guardiana',
      motto: 'Unidos como un panal indestructible',
      recommendedGeometry: 'hexagono',
      icons: ['shield', 'paw', 'star', 'heart', 'bolt'],
      sampleMemberNames: ['Miel', 'Rayo', 'Nala', 'Simba', 'Coco'],
    },
    {
      teamName: 'Escuadrón Huellas',
      motto: 'Protegiendo a nuestras mascotas',
      recommendedGeometry: 'circular',
      icons: ['paw', 'heart', 'star', 'shield', 'rocket'],
      sampleMemberNames: ['Bruno', 'Lola', 'Thor', 'Mia', 'Zeus'],
    },
  ],
  espacio: [
    {
      teamName: 'Misión Orión',
      motto: 'Exploradores del cosmos profundo',
      recommendedGeometry: 'hexagono',
      icons: ['rocket', 'star', 'atom', 'robot', 'bolt'],
      sampleMemberNames: ['Nova', 'Apolo', 'Vega', 'Orión', 'Sirius'],
    },
    {
      teamName: 'Flota Galáctica',
      motto: 'Propulsión e ingeniería estelar',
      recommendedGeometry: 'engranaje',
      icons: ['star', 'rocket', 'robot', 'shield', 'atom'],
      sampleMemberNames: ['Cosmos', 'Estela', 'Halley', 'Titán', 'Lyra'],
    },
    {
      teamName: 'Pioneros de Marte',
      motto: 'Colonia tecnológica interplanetaria',
      recommendedGeometry: 'hexagono',
      icons: ['robot', 'rocket', 'atom', 'shield', 'star'],
      sampleMemberNames: ['Ares', 'Fobos', 'Deimos', 'Rover', 'Curiosity'],
    },
  ],
  deportes: [
    {
      teamName: 'Trueno Dorado',
      motto: 'Velocidad, energía y trabajo en equipo',
      recommendedGeometry: 'engranaje',
      icons: ['bolt', 'star', 'shield', 'heart', 'rocket'],
      sampleMemberNames: ['Capitán', 'Flash', 'Titán', 'Victoria', 'Campeón'],
    },
    {
      teamName: 'Escudo Invencible',
      motto: 'Defensa sólida y espíritu deportivo',
      recommendedGeometry: 'hexagono',
      icons: ['shield', 'bolt', 'star', 'heart', 'paw'],
      sampleMemberNames: ['Defensa', 'Goleador', 'Líder', 'Sprint', 'Fénix'],
    },
    {
      teamName: 'Dinamo Unido',
      motto: 'Cada integrante mueve al equipo',
      recommendedGeometry: 'engranaje',
      icons: ['bolt', 'shield', 'star', 'rocket', 'heart'],
      sampleMemberNames: ['Turbo', 'Nitro', 'Impulso', 'Energía', 'Meta'],
    },
  ],
  ciencia: [
    {
      teamName: 'Núcleo Cuántico',
      motto: 'Innovación, átomos y mecatrónica',
      recommendedGeometry: 'engranaje',
      icons: ['atom', 'robot', 'bolt', 'star', 'rocket'],
      sampleMemberNames: ['Tesla', 'Curie', 'Newton', 'Ada', 'Galileo'],
    },
    {
      teamName: 'Red Biónica',
      motto: 'Robótica colaborativa del futuro',
      recommendedGeometry: 'hexagono',
      icons: ['robot', 'atom', 'shield', 'bolt', 'rocket'],
      sampleMemberNames: ['Nexus', 'Ciborg', 'Vector', 'Matriz', 'Quark'],
    },
    {
      teamName: 'Laboratorio Maker',
      motto: 'Co-creación láser e impresión 3D',
      recommendedGeometry: 'circular',
      icons: ['atom', 'robot', 'star', 'bolt', 'shield'],
      sampleMemberNames: ['Prototipo', 'Láser', 'Vóxel', 'Fotón', 'Sinter'],
    },
  ],
};

export const PLA_COLORS_PALETTE = [
  { name: 'Azul Cobalto', hex: '#2563eb' },
  { name: 'Naranja Maker', hex: '#f97316' },
  { name: 'Verde Esmeralda', hex: '#10b981' },
  { name: 'Morado UTalca', hex: '#7c3aed' },
  { name: 'Rojo Carmesí', hex: '#e11d48' },
  { name: 'Amarillo Solar', hex: '#eab308' },
];

/**
 * Calcula los puntos 2D (x, y) del contorno exterior del marco conector en mm
 * para N pasos angulares alrededor del origen (0, 0).
 */
export function computeOuterFrameContourPoints(
  geometry: FrameGeometryId,
  cavityRadiusMm: number,
  clearanceMm: number,
  numSteps = 240
): { x: number; y: number; theta: number }[] {
  const baseOuterRadius = cavityRadiusMm + 5.2; // pared mínima robusta de ~5.2 mm alrededor de la cavidad
  const pts: { x: number; y: number; theta: number }[] = [];

  for (let i = 0; i < numSteps; i++) {
    const theta = (2 * Math.PI * i) / numSteps;

    if (geometry === 'hexagono') {
      // Hexágono regular con lados planos y pestañas/muescas alternadas en las 6 caras
      // Punto sobre hexágono de apotema A = baseOuterRadius
      const apothem = baseOuterRadius;
      const sector = Math.floor(((theta + Math.PI / 6) % (2 * Math.PI)) / (Math.PI / 3));
      const sectorCenterAngle = sector * (Math.PI / 3);
      const localAngle = Math.atan2(
        Math.sin(theta - sectorCenterAngle),
        Math.cos(theta - sectorCenterAngle)
      );

      let rHex = apothem / Math.max(0.5, Math.cos(localAngle));

      // En el centro de cada cara lateral (|localAngle| < 0.20 rad), agregamos pestaña macho o muesca hembra
      // Alternamos caras pares (+pestaña) e impares (-muesca con clearance)
      // Excepto la cara superior (sector === 1 o 2 cerca de pi/2) si lleva ojal, aunque el ojal va en el vértice superior (theta = pi/2)
      const isTabZone = Math.abs(localAngle) < 0.21;
      if (isTabZone) {
        const smooth = Math.cos((localAngle / 0.21) * (Math.PI / 2));
        const isMaleFace = sector % 2 === 0;
        const tabDepth = isMaleFace ? 2.1 : -(2.1 + clearanceMm);
        rHex += tabDepth * Math.pow(smooth, 0.6);
      }

      pts.push({
        x: rHex * Math.cos(theta),
        y: rHex * Math.sin(theta),
        theta,
      });
    } else if (geometry === 'engranaje') {
      // Corona de engranaje de 12 dientes trapezoidales suaves
      const teeth = 12;
      const wave = Math.cos(teeth * theta);
      const shaped = Math.max(-0.75, Math.min(0.75, wave * 1.35)) / 0.75;
      const toothAmplitude = 2.05;
      const rGear = baseOuterRadius + 0.8 + toothAmplitude * shaped - clearanceMm * 0.5;
      pts.push({
        x: rGear * Math.cos(theta),
        y: rGear * Math.sin(theta),
        theta,
      });
    } else {
      // Circular con Muesca: Medallón redondo con 2 pestañas macho (0° y 180°) y 2 muescas hembra (-60° y -120° / laterales)
      // Ubicamos 4 conectores a ±35° y ±145° para dejar despejado el ojal superior a +90°
      const connectorAngles = [
        { angle: 0, sign: 1 }, // Derecha: Pestaña Macho
        { angle: Math.PI, sign: -1 }, // Izquierda: Muesca Hembra
        { angle: -Math.PI / 3, sign: 1 }, // Abajo-Derecha: Pestaña Macho
        { angle: (-2 * Math.PI) / 3, sign: -1 }, // Abajo-Izquierda: Muesca Hembra
      ];

      let rCirc = baseOuterRadius + 0.5;
      for (const conn of connectorAngles) {
        const diff = Math.atan2(Math.sin(theta - conn.angle), Math.cos(theta - conn.angle));
        const halfWidth = 0.24;
        if (Math.abs(diff) < halfWidth) {
          const profile = Math.cos((diff / halfWidth) * (Math.PI / 2));
          const amp = conn.sign > 0 ? 2.3 : -(2.3 + clearanceMm);
          rCirc += amp * Math.pow(profile, 0.55);
        }
      }

      pts.push({
        x: rCirc * Math.cos(theta),
        y: rCirc * Math.sin(theta),
        theta,
      });
    }
  }

  return pts;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera el archivo .SVG unificado con los centros de madera de todos los integrantes del equipo.
 * - Corte Láser Exterior: #FF0000, stroke-width 0.1 mm (círculo de woodCenterDiameterMm, ej. 36 mm)
 * - Grabado Láser Vectorial: #0000FF (ícono central, texto principal, texto secundario y anillo decorativo)
 */
export function generateBadgesLaserSvg(params: BadgesTeamParams): string {
  const { woodCenterDiameterMm, members, teamName } = params;
  const radius = woodCenterDiameterMm / 2;
  const spacing = woodCenterDiameterMm + 8; // 8 mm de separación entre piezas
  const cols = Math.min(3, members.length);
  const rows = Math.ceil(members.length / cols);

  const margin = 10;
  const totalWidth = Number((margin * 2 + cols * spacing - 8).toFixed(2));
  const totalHeight = Number((margin * 2 + rows * spacing - 8 + 10).toFixed(2));

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}">`
  );
  lines.push(
    `  <!-- MakerBox Taller 4: Centros de Madera (${woodCenterDiameterMm} mm x ${params.woodThicknessMm} mm) - Equipo: ${escapeXml(teamName)} -->`
  );

  // Encabezado grabado azul (#0000FF)
  lines.push(`  <g id="CAPA_GRABADO_AZUL" stroke="#0000FF" fill="none">`);
  lines.push(
    `    <text x="${(totalWidth / 2).toFixed(2)}" y="6.5" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.2" font-weight="bold" fill="#0000FF" stroke="none">MAKERBOX · EQUIPO: ${escapeXml(
      teamName.toUpperCase()
    )} (${members.length} CHAPITAS Ø${woodCenterDiameterMm}mm)</text>`
  );

  members.forEach((member, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin + radius + col * spacing;
    const cy = margin + 8 + radius + row * spacing;

    const iconInfo = BADGE_ICONS[member.icon] ?? BADGE_ICONS.paw;
    const iconScale = (woodCenterDiameterMm / 36) * 0.72;
    const iconCenterY = cy - radius * 0.16;

    // Anillo interior decorativo de grabado (#0000FF)
    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(radius - 1.8).toFixed(
        2
      )}" stroke="#0000FF" stroke-width="0.25" stroke-dasharray="1.5 1.0" />`
    );

    // Ícono central vectorial (#0000FF)
    lines.push(
      `    <g transform="translate(${cx.toFixed(2)}, ${iconCenterY.toFixed(
        2
      )}) scale(${iconScale.toFixed(3)})" stroke="#0000FF" stroke-width="0.65" stroke-linecap="round" stroke-linejoin="round" fill="none">`
    );
    for (const d of iconInfo.svgPaths) {
      lines.push(`      <path d="${d}" />`);
    }
    lines.push(`    </g>`);

    // Texto Principal (Nombre de estudiante o mascota)
    const primaryLabel = (member.primaryText || `Integrante ${idx + 1}`).trim();
    const secondaryLabel = (member.secondaryText || teamName).trim();

    const primaryFontSize = Math.min(
      4.2,
      Math.max(2.6, (woodCenterDiameterMm * 0.62) / Math.max(5, primaryLabel.length))
    );
    const secondaryFontSize = Math.min(
      2.7,
      Math.max(2.0, (woodCenterDiameterMm * 0.52) / Math.max(7, secondaryLabel.length))
    );

    lines.push(
      `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.42).toFixed(
        2
      )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${primaryFontSize.toFixed(
        2
      )}" font-weight="bold" fill="#0000FF" stroke="#0000FF" stroke-width="0.12">${escapeXml(
        primaryLabel.toUpperCase()
      )}</text>`
    );

    if (secondaryLabel) {
      lines.push(
        `    <text x="${cx.toFixed(2)}" y="${(cy + radius * 0.64).toFixed(
          2
        )}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${secondaryFontSize.toFixed(
          2
        )}" font-weight="normal" fill="#0000FF" stroke="none">${escapeXml(
          secondaryLabel
        )}</text>`
      );
    }
  });
  lines.push(`  </g>`);

  // Capa de Corte Láser Exterior (#FF0000, 0.1 mm)
  lines.push(`  <g id="CAPA_CORTE_ROJO" stroke="#FF0000" stroke-width="0.1" fill="none">`);
  members.forEach((_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = margin + radius + col * spacing;
    const cy = margin + 8 + radius + row * spacing;
    lines.push(
      `    <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${radius.toFixed(3)}" />`
    );
  });
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

// ============================================================================
// Generador 3D (.STL) de los Marcos Conectores en PLA
// - Altura total: 5.0 mm
// - Cavidad central: D_cav = woodCenterDiameterMm + 2 * clearanceMm (ej. 36.3 mm)
// - Tope inferior de 1.0 mm de alto (Z = 0..1.0 mm) para sostener la madera
// - Zona de alojamiento de madera de 3.1 mm (Z = 1.0..4.1 mm)
// - Bisel superior de retención press-fit (Z = 4.1..5.0 mm)
// - Ojal superior de 4.0 mm de diámetro para argolla de llavero
// - Bordes exteriores conectores según geometría elegida (Hexágono, Engranaje o Circular)
// ============================================================================

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function pushTriangle(lines: string[], a: Vec3, b: Vec3, c: Vec3) {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;

  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz);
  if (len < 1e-8) return;
  nx /= len;
  ny /= len;
  nz /= len;

  lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
  lines.push('    outer loop');
  lines.push(`      vertex ${a.x.toFixed(4)} ${a.y.toFixed(4)} ${a.z.toFixed(4)}`);
  lines.push(`      vertex ${b.x.toFixed(4)} ${b.y.toFixed(4)} ${b.z.toFixed(4)}`);
  lines.push(`      vertex ${c.x.toFixed(4)} ${c.y.toFixed(4)} ${c.z.toFixed(4)}`);
  lines.push('    endloop');
  lines.push('  endfacet');
}

function pushQuad(lines: string[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
  pushTriangle(lines, a, b, c);
  pushTriangle(lines, a, c, d);
}

function appendSingleFrameStlFacets(
  lines: string[],
  params: BadgesTeamParams,
  offsetX: number,
  offsetY: number
) {
  const cavityDiameter = params.woodCenterDiameterMm + 2 * params.clearanceMm; // 36.30 mm por defecto
  const rCavity = cavityDiameter / 2; // 18.15 mm
  const rBottomLip = rCavity - 1.2; // Tope inferior de 1.2 mm de labio (diámetro 33.9 mm)
  const rSnapBevel = rCavity - 0.24; // Labio superior de retención a presión (press-fit)
  const rTopEntry = rCavity + 0.12; // Bisel de entrada superior

  const z0 = 0.0;
  const z1 = 1.0; // Tope inferior de 1 mm
  const z2 = Number((1.0 + params.woodThicknessMm + 0.1).toFixed(3)); // 4.1 mm (espesor cavidad 3.1 mm)
  const z3 = Number((z2 + 0.45).toFixed(3)); // Cresta del bisel de retención (~4.55 mm)
  const z4 = Number(Math.max(5.0, z2 + 0.9).toFixed(3)); // Altura total 5.0 mm

  const numSteps = 180;
  const outerPts = computeOuterFrameContourPoints(
    params.geometry,
    rCavity,
    params.clearanceMm,
    numSteps
  );

  // 1. Anillo Principal Conector con Cavidad Escalonada Press-Fit
  for (let i = 0; i < numSteps; i++) {
    const inext = (i + 1) % numSteps;
    const p0 = outerPts[i];
    const p1 = outerPts[inext];

    const c0 = Math.cos(p0.theta);
    const s0 = Math.sin(p0.theta);
    const c1 = Math.cos(p1.theta);
    const s1 = Math.sin(p1.theta);

    const outA0: Vec3 = { x: offsetX + p0.x, y: offsetY + p0.y, z: z0 };
    const outB0: Vec3 = { x: offsetX + p1.x, y: offsetY + p1.y, z: z0 };
    const outA4: Vec3 = { x: offsetX + p0.x, y: offsetY + p0.y, z: z4 };
    const outB4: Vec3 = { x: offsetX + p1.x, y: offsetY + p1.y, z: z4 };

    const pt = (r: number, c: number, s: number, z: number): Vec3 => ({
      x: offsetX + r * c,
      y: offsetY + r * s,
      z,
    });

    // Pared exterior (z0 -> z4)
    pushQuad(lines, outA0, outB0, outB4, outA4);

    // Cara superior (z4: outer -> rTopEntry)
    const inTopA = pt(rTopEntry, c0, s0, z4);
    const inTopB = pt(rTopEntry, c1, s1, z4);
    pushQuad(lines, outA4, outB4, inTopB, inTopA);

    // Chaflán de entrada superior al bisel press-fit (z4 -> z3)
    const inSnapA = pt(rSnapBevel, c0, s0, z3);
    const inSnapB = pt(rSnapBevel, c1, s1, z3);
    pushQuad(lines, inTopA, inTopB, inSnapB, inSnapA);

    // Rampa inferior del bisel press-fit hacia el techo de la cavidad (z3 -> z2)
    const inCavTopA = pt(rCavity, c0, s0, z2);
    const inCavTopB = pt(rCavity, c1, s1, z2);
    pushQuad(lines, inSnapA, inSnapB, inCavTopB, inCavTopA);

    // Pared cilíndrica de la cavidad de 36.3 mm (z2 -> z1)
    const inCavBotA = pt(rCavity, c0, s0, z1);
    const inCavBotB = pt(rCavity, c1, s1, z1);
    pushQuad(lines, inCavTopA, inCavTopB, inCavBotB, inCavTopA);

    // Escalón/repisa horizontal del tope inferior en z1 (rCavity -> rBottomLip)
    const inLipTopA = pt(rBottomLip, c0, s0, z1);
    const inLipTopB = pt(rBottomLip, c1, s1, z1);
    pushQuad(lines, inCavBotA, inCavBotB, inLipTopB, inLipTopA);

    // Pared interior del tope inferior de 1 mm (z1 -> z0)
    const inLipBotA = pt(rBottomLip, c0, s0, z0);
    const inLipBotB = pt(rBottomLip, c1, s1, z0);
    pushQuad(lines, inLipTopA, inLipTopB, inLipBotB, inLipBotA);

    // Cara inferior plana en la cama de impresión (z0: rBottomLip -> outer)
    pushQuad(lines, inLipBotA, inLipBotB, outB0, outA0);
  }

  // 2. Ojal Superior para Argolla de Llavero (Agujero interior exacto = 4.0 mm de diámetro -> rHole = 2.0 mm)
  const topPointY = Math.max(...outerPts.map((p) => p.y));
  const lugCenterX = offsetX;
  const lugCenterY = offsetY + topPointY + 2.2;
  const rHole = 2.0; // Ø 4.0 mm
  const rLugOuter = 4.6; // Ø 9.2 mm exterior del ojal
  const lugHeight = z4;
  const lugSteps = 48;

  for (let i = 0; i < lugSteps; i++) {
    const a0 = (2 * Math.PI * i) / lugSteps;
    const a1 = (2 * Math.PI * (i + 1)) / lugSteps;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);

    const loA0: Vec3 = { x: lugCenterX + rLugOuter * c0, y: lugCenterY + rLugOuter * s0, z: 0 };
    const loB0: Vec3 = { x: lugCenterX + rLugOuter * c1, y: lugCenterY + rLugOuter * s1, z: 0 };
    const loA1: Vec3 = {
      x: lugCenterX + rLugOuter * c0,
      y: lugCenterY + rLugOuter * s0,
      z: lugHeight,
    };
    const loB1: Vec3 = {
      x: lugCenterX + rLugOuter * c1,
      y: lugCenterY + rLugOuter * s1,
      z: lugHeight,
    };

    const liA0: Vec3 = { x: lugCenterX + rHole * c0, y: lugCenterY + rHole * s0, z: 0 };
    const liB0: Vec3 = { x: lugCenterX + rHole * c1, y: lugCenterY + rHole * s1, z: 0 };
    const liA1: Vec3 = { x: lugCenterX + rHole * c0, y: lugCenterY + rHole * s0, z: lugHeight };
    const liB1: Vec3 = { x: lugCenterX + rHole * c1, y: lugCenterY + rHole * s1, z: lugHeight };

    // Pared externa del ojal
    pushQuad(lines, loA0, loB0, loB1, loA1);
    // Pared interna del agujero de 4 mm
    pushQuad(lines, liB0, liA0, liA1, liB1);
    // Tapa superior del ojal
    pushQuad(lines, loA1, loB1, liB1, liA1);
    // Base inferior del ojal
    pushQuad(lines, liA0, liB0, loB0, loA0);
  }
}

/**
 * Genera el contenido .STL de los marcos conectores 3D en PLA.
 * Si exportAllTeamFrames = true, posiciona los N marcos del equipo en una grilla lista para imprimir.
 */
export function generateBadgesConnectorStl(
  params: BadgesTeamParams,
  exportAllTeamFrames = true
): string {
  const count = exportAllTeamFrames ? params.memberCount : 1;
  const solidName = `MakerBox_Taller4_Marcos_${params.geometry.toUpperCase()}_${count}x`;
  const lines: string[] = [];
  lines.push(`solid ${solidName}`);

  const pitch = params.woodCenterDiameterMm + 24;
  const cols = Math.min(3, count);

  for (let idx = 0; idx < count; idx++) {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const ox = col * pitch;
    const oy = row * pitch;
    appendSingleFrameStlFacets(lines, params, ox, oy);
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}
