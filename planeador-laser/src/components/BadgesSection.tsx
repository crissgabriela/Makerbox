'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  Bot,
  Box,
  Clock,
  Download,
  Eye,
  Flame,
  GraduationCap,
  Grid,
  Hexagon,
  Info,
  Layers,
  Loader2,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import {
  AI_TEAM_IDEAS_BY_THEME,
  BADGE_ICONS,
  BadgeIconId,
  BadgeMemberConfig,
  BadgesTeamParams,
  buildMakerboxLogoVectorPath,
  computeOuterFrameContourPoints,
  estimateBadgesManufacturingTimes,
  FIXED_PRESS_FIT_CLEARANCE_MM,
  FIXED_WOOD_THICKNESS_MM,
  FRAME_GEOMETRIES,
  FrameGeometryId,
  generateBadgesConnectorStl,
  generateBadgesLaserSvg,
  getBadgeHoneycombApothem,
  getInternalKeychainHoleSpec,
  IdeaThemeId,
  PEDAGOGICAL_LEVELS,
  PedagogicalLevelId,
  PLA_COLORS_PALETTE,
  TeamIdeaSuggestion,
} from '@/lib/badges-processor';

const INITIAL_MEMBERS: BadgeMemberConfig[] = [
  {
    id: 1,
    primaryText: 'Sofía',
    secondaryText: 'Equipo Alfa',
    icon: 'paw',
    plaColorHex: '#2563eb',
  },
  {
    id: 2,
    primaryText: 'Valentina',
    secondaryText: 'Equipo Alfa',
    icon: 'star',
    plaColorHex: '#10b981',
  },
  {
    id: 3,
    primaryText: 'Mateo',
    secondaryText: 'Equipo Alfa',
    icon: 'rocket',
    plaColorHex: '#f97316',
  },
  {
    id: 4,
    primaryText: 'Martina',
    secondaryText: 'Equipo Alfa',
    icon: 'atom',
    plaColorHex: '#e11d48',
  },
  {
    id: 5,
    primaryText: 'Lucas',
    secondaryText: 'Equipo Alfa',
    icon: 'robot',
    plaColorHex: '#7c3aed',
  },
];

export function BadgesSection() {
  const [levelId, setLevelId] = useState<PedagogicalLevelId>('nivel1');
  const [teamName, setTeamName] = useState<string>('Equipo Alfa');
  const [memberCount, setMemberCount] = useState<number>(5);
  const [geometry, setGeometry] = useState<FrameGeometryId>('hexagono');

  // 3 Parámetros Técnicos con Barras Deslizantes (Sliders) y Vista Previa en Vivo
  const [woodCenterDiameterMm, setWoodCenterDiameterMm] = useState<number>(36); // 36 a 44 mm
  const [holeDiameterMm, setHoleDiameterMm] = useState<number>(4.0); // 3.8 a 4.4 mm
  const [dovetailSizeMm, setDovetailSizeMm] = useState<number>(2.4); // 1.8 a 3.4 mm

  // Tarjetas de Integrantes
  const [members, setMembers] = useState<BadgeMemberConfig[]>(INITIAL_MEMBERS);

  // Asistente IA Creativo (Google Gemini 2.5 Flash + Banco Instantáneo)
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<IdeaThemeId>('animales');
  const [customAiTopic, setCustomAiTopic] = useState<string>('');
  const [aiIdeas, setAiIdeas] = useState<TeamIdeaSuggestion[]>(
    AI_TEAM_IDEAS_BY_THEME.animales
  );
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAgentLabel, setAiAgentLabel] = useState<string>(
    'Agente Google Gemini 2.5 Flash · Listo para asistir'
  );

  // Previsualización en Pantalla
  const [previewTab, setPreviewTab] = useState<'grupal' | 'individual' | 'laser'>('grupal');
  const [assembledOnTable, setAssembledOnTable] = useState<boolean>(true);

  const activeMembers = useMemo(
    () => members.slice(0, memberCount),
    [members, memberCount]
  );

  const currentParams: BadgesTeamParams = useMemo(
    () => ({
      levelId,
      teamName: teamName.trim() || 'Equipo Maker',
      memberCount,
      geometry,
      woodCenterDiameterMm,
      holeDiameterMm,
      dovetailSizeMm,
      woodThicknessMm: FIXED_WOOD_THICKNESS_MM,
      clearanceMm: FIXED_PRESS_FIT_CLEARANCE_MM,
      members: activeMembers,
    }),
    [
      levelId,
      teamName,
      memberCount,
      geometry,
      woodCenterDiameterMm,
      holeDiameterMm,
      dovetailSizeMm,
      activeMembers,
    ]
  );

  const cavityDiameterMm = Number(
    (woodCenterDiameterMm + 2 * FIXED_PRESS_FIT_CLEARANCE_MM).toFixed(2)
  );
  const cavityDepthMm = Number((FIXED_WOOD_THICKNESS_MM + 0.1).toFixed(2));

  // Telemetría de tiempos de Corte/Grabado en Falcon Design Space e Impresión 3D en PLA
  const telemetry = useMemo(
    () => estimateBadgesManufacturingTimes(currentParams),
    [currentParams]
  );

  // Comparativa de eficiencia de las 3 geometrías para la cápsula educativa
  const geometryComparison = useMemo(() => {
    return (['hexagono', 'pentagono', 'triangulo'] as FrameGeometryId[]).map((gId) => {
      const m = estimateBadgesManufacturingTimes({
        ...currentParams,
        geometry: gId,
      });
      return {
        id: gId,
        info: FRAME_GEOMETRIES[gId],
        telemetry: m,
      };
    });
  }, [currentParams]);

  const handleUpdateMember = (
    index: number,
    patch: Partial<BadgeMemberConfig>
  ) => {
    setMembers((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, ...patch } : m))
    );
  };

  const handleTeamNameChange = (newName: string) => {
    const oldName = teamName;
    setTeamName(newName);
    setMembers((prev) =>
      prev.map((m) =>
        m.secondaryText === oldName || !m.secondaryText
          ? { ...m, secondaryText: newName }
          : m
      )
    );
  };

  const handleSelectAiTheme = (theme: IdeaThemeId) => {
    setSelectedTheme(theme);
    setAiIdeas(AI_TEAM_IDEAS_BY_THEME[theme]);
  };

  const handleGenerateAiIdeasWithGemini = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/chapitas/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          customTopic: customAiTopic,
          memberCount,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.ideas) && data.ideas.length > 0) {
        setAiIdeas(data.ideas);
      }
      if (data?.agentUsed) {
        setAiAgentLabel(data.agentUsed);
      }
    } catch {
      setAiIdeas(AI_TEAM_IDEAS_BY_THEME[selectedTheme]);
      setAiAgentLabel('Banco Creativo MakerBox IA (Modo Instantáneo)');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiIdea = (idea: TeamIdeaSuggestion) => {
    setTeamName(idea.teamName);
    setMembers((prev) =>
      prev.map((m, idx) => ({
        ...m,
        primaryText: idea.sampleMemberNames[idx] || m.primaryText || `Integrante ${idx + 1}`,
        secondaryText: idea.teamName,
        icon: idea.icons[idx % idea.icons.length],
      }))
    );
  };

  const handleResetTechnicalParams = () => {
    setWoodCenterDiameterMm(36);
    setHoleDiameterMm(4.0);
    setDovetailSizeMm(2.4);
  };

  const handleDownloadLaserSvg = () => {
    const svgContent = generateBadgesLaserSvg(currentParams);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTeam = (teamName || 'equipo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.download = `chapitas-falcon-${safeTeam}-${memberCount}chapas-${woodCenterDiameterMm}mm.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadConnectorStl = () => {
    const stlContent = generateBadgesConnectorStl(currentParams);
    const blob = new Blob([stlContent], { type: 'model/stl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTeam = (teamName || 'equipo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.download = `chapitas-marcos-3d-${geometry}-${safeTeam}-${memberCount}marcos.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pre-compute outer contour SVG polygon points & internal keychain hole spec
  const singleFrameGeometryData = useMemo(() => {
    const rCav = cavityDiameterMm / 2;
    const pts = computeOuterFrameContourPoints(
      geometry,
      rCav,
      FIXED_PRESS_FIT_CLEARANCE_MM,
      dovetailSizeMm
    );
    const polyStr = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const holeSpec = getInternalKeychainHoleSpec(geometry, rCav, holeDiameterMm);
    const apothem = getBadgeHoneycombApothem(rCav, dovetailSizeMm, geometry);
    return { polyStr, rCav, holeSpec, apothem };
  }, [geometry, cavityDiameterMm, dovetailSizeMm, holeDiameterMm]);

  // Posiciones exactas de acople en la mesa según la geometría elegida (Hexágono, Pentágono o Triángulo)
  const groupAssemblyPositions = useMemo(() => {
    const { apothem } = singleFrameGeometryData;
    const gap = assembledOnTable ? 0.35 : 16.0;
    const dist = 2 * apothem + gap;

    if (geometry === 'triangulo') {
      // En el Triángulo Equilátero (caras en -30° Macho, +90° Macho, -150° Hembra):
      // Para conectar caras planas es obligatorio alternar triángulos rotados (+60° / -60° / +120°),
      // demostrando visualmente la alternancia ▲▼▲ y el mayor tamaño de las puntas.
      const deg = (d: number) => (d * Math.PI) / 180;
      const p1x = dist * Math.cos(deg(-150));
      const p1y = dist * Math.sin(deg(-150));
      const coords = [
        { x: 0, y: 0, rot: 0 },
        { x: p1x, y: p1y, rot: 60 }, // Acopla su cara +30° Macho en la cara -150° Hembra de #0
        {
          x: dist * Math.cos(deg(-30)),
          y: dist * Math.sin(deg(-30)),
          rot: -60, // Acopla su cara +150° Hembra en la cara -30° Macho de #0
        },
        {
          x: 0,
          y: dist,
          rot: 60, // Acopla su cara -90° Hembra en la cara +90° Macho de #0
        },
        {
          x: p1x + dist * Math.cos(deg(150)),
          y: p1y + dist * Math.sin(deg(150)),
          rot: 120, // Acopla su cara -30° Hembra en la cara +150° Macho de #1
        },
      ];
      return coords.slice(0, memberCount);
    }

    if (geometry === 'pentagono') {
      // En el Pentágono Regular (caras en -54° M, +18° M, +90° M, +162° H, -126° H):
      // Los vecinos se conectan a las caras del pentágono central (#0), pero como el ángulo interior es 108°
      // (3 x 108° = 324° != 360°), aparece la brecha geométrica de 36° entre vecinos.
      const deg = (d: number) => (d * Math.PI) / 180;
      const coords = [
        { x: 0, y: 0, rot: 0 },
        {
          x: dist * Math.cos(deg(-126)),
          y: dist * Math.sin(deg(-126)),
          rot: 36, // Su cara +18°+36°=+54° (Macho) entra en -126° (Hembra) de #0
        },
        {
          x: dist * Math.cos(deg(-54)),
          y: dist * Math.sin(deg(-54)),
          rot: -36, // Su cara +162°-36°=+126° (Hembra) recibe -54° (Macho) de #0
        },
        {
          x: dist * Math.cos(deg(162)),
          y: dist * Math.sin(deg(162)),
          rot: -36, // Su cara +18°-36°=-18° (Macho) entra en +162° (Hembra) de #0
        },
        {
          x: dist * Math.cos(deg(18)),
          y: dist * Math.sin(deg(18)),
          rot: 36, // Su cara +162°+36°=-162° (Hembra) recibe +18° (Macho) de #0
        },
      ];
      return coords.slice(0, memberCount);
    }

    // Hexágono Tipo Panal (Óptimo en la naturaleza: teselación 100% continua a 120° sin rotar piezas)
    const sin60 = Math.sqrt(3) / 2;
    const coords = [
      { x: 0, y: 0, rot: 0 },
      { x: -0.5 * dist, y: -sin60 * dist, rot: 0 },
      { x: 0.5 * dist, y: -sin60 * dist, rot: 0 },
      { x: -dist, y: 0, rot: 0 },
      { x: dist, y: 0, rot: 0 },
    ];
    return coords.slice(0, memberCount);
  }, [geometry, singleFrameGeometryData, memberCount, assembledOnTable]);

  // ViewBox adaptativo según el tamaño y geometría
  const groupViewBox = useMemo(() => {
    if (geometry === 'triangulo') {
      return '-145 -98 275 215';
    }
    if (woodCenterDiameterMm >= 41) {
      return '-122 -102 244 178';
    }
    return '-110 -94 220 162';
  }, [geometry, woodCenterDiameterMm]);

  const currentLevel = PEDAGOGICAL_LEVELS[levelId];

  // Renderizado vectorial de una chapita híbrida:
  // - Marco conector PLA con Cola de Milano + Orificio interno parametrizado
  // - Centro de madera de 3 mm con:
  //   1. Arriba: Nombre del Equipo (secondaryText)
  //   2. Centro: Ícono Emblema
  //   3. Debajo del ícono: Nombre del Estudiante (primaryText)
  //   4. Abajo: Logo oficial de MakerBox
  const renderBadgeSvgGroup = (
    member: BadgeMemberConfig,
    key: string | number,
    tx: number,
    ty: number,
    rotDeg = 0
  ) => {
    const woodRadius = woodCenterDiameterMm / 2;
    const { polyStr, rCav, holeSpec } = singleFrameGeometryData;
    const iconInfo = BADGE_ICONS[member.icon] ?? BADGE_ICONS.paw;
    const iconScale = (woodCenterDiameterMm / 36) * 0.56;

    const secondaryLabel = (member.secondaryText || teamName).trim();
    const primaryLabel = (member.primaryText || 'NOMBRE').trim();

    const logoWidthMm = woodRadius * 0.88;
    const logoTopY = woodRadius * 0.45;
    const logoPathD = buildMakerboxLogoVectorPath(0, logoTopY, logoWidthMm);

    return (
      <g key={key} transform={`translate(${tx.toFixed(2)}, ${ty.toFixed(2)})`}>
        {/* Marco exterior conector PLA + Orificio interno (giran juntos si el polígono se invierte) */}
        <g transform={rotDeg !== 0 ? `rotate(${rotDeg})` : undefined}>
          <polygon
            points={polyStr}
            fill={member.plaColorHex}
            stroke="#0f172a"
            strokeWidth="0.45"
            strokeLinejoin="round"
          />

          {/* Orificio interno para argolla de llavero (Ø 3.8 a 4.4 mm) */}
          <circle
            cx="0"
            cy={-holeSpec.offsetFromCenterMm}
            r={holeSpec.holeRadiusMm + 0.55}
            fill="rgba(15, 23, 42, 0.25)"
          />
          <circle
            cx="0"
            cy={-holeSpec.offsetFromCenterMm}
            r={holeSpec.holeRadiusMm}
            fill="#0f172a"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="0.35"
          />
        </g>

        {/* Bisel de retención superior Press-Fit */}
        <circle
          cx="0"
          cy="0"
          r={rCav}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.75"
          strokeDasharray="2 1.2"
        />

        {/* Centro de Madera de 3 mm (Corte Láser #FF0000 + Grabado) */}
        <circle
          cx="0"
          cy="0"
          r={woodRadius}
          fill="#f3d5a5"
          stroke="#dc2626"
          strokeWidth="0.45"
        />
        <circle
          cx="0"
          cy="0"
          r={woodRadius - 1.8}
          fill="none"
          stroke="#78350f"
          strokeWidth="0.28"
          strokeDasharray="1.4 0.9"
          opacity="0.65"
        />

        {/* 1. ARRIBA (Sobre el ícono): Nombre del Equipo / Texto Secundario */}
        {secondaryLabel && (
          <text
            x="0"
            y={-woodRadius * 0.52}
            textAnchor="middle"
            fill="#78350f"
            fontSize={Math.min(
              2.5,
              Math.max(1.8, (woodCenterDiameterMm * 0.45) / Math.max(7, secondaryLabel.length))
            )}
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {secondaryLabel.toUpperCase()}
          </text>
        )}

        {/* 2. CENTRO: Ícono Central Grabado */}
        <g
          transform={`translate(0, ${(-woodRadius * 0.13).toFixed(
            2
          )}) scale(${iconScale.toFixed(3)})`}
          stroke="#451a03"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(69, 26, 3, 0.12)"
        >
          {iconInfo.svgPaths.map((d, idx) => (
            <path key={idx} d={d} />
          ))}
        </g>

        {/* 3. DEBAJO DEL ÍCONO: Nombre del Estudiante o Mascota */}
        <text
          x="0"
          y={woodRadius * 0.34}
          textAnchor="middle"
          fill="#451a03"
          fontSize={Math.min(
            3.65,
            Math.max(2.3, (woodCenterDiameterMm * 0.54) / Math.max(5, primaryLabel.length))
          )}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {primaryLabel.toUpperCase()}
        </text>

        {/* 4. ABAJO (Bajo el nombre del estudiante): Logo Oficial de MakerBox */}
        <path
          d={logoPathD}
          fill="#451a03"
          fillRule="evenodd"
          opacity="0.92"
        />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal del Taller 4 */}
      <div className="bg-gradient-to-r from-fuchsia-950 via-purple-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-purple-700/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-300/30 text-fuchsia-200 text-xs font-semibold tracking-wide uppercase">
              <Award className="w-3.5 h-3.5" />
              Taller 4 · Co-creación de Chapitas Híbridas (Falcon Design Space + 3D PLA)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Estación de Diseño de Chapitas & Panales Conectables
            </h2>
            <p className="text-purple-100/90 text-sm max-w-3xl leading-relaxed">
              Diseña en equipo un set de chapitas híbridas: un{' '}
              <strong>
                centro de madera de {FIXED_WOOD_THICKNESS_MM.toFixed(1)} mm (Ø{' '}
                {woodCenterDiameterMm} mm)
              </strong>{' '}
              con el nombre del equipo, emblema, tu nombre y el <strong>logo MakerBox</strong> que
              encaja a presión (<em>press-fit</em>) dentro de un{' '}
              <strong>marco conector 3D (PLA)</strong> con encaje <strong>cola de milano</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadLaserSvg}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-950/50 transition cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              Descargar {memberCount} Chapas (.SVG)
            </button>
            <button
              type="button"
              onClick={handleDownloadConnectorStl}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/40 transition cursor-pointer"
            >
              <Box className="w-4 h-4" />
              Descargar {memberCount} Marcos 3D (.STL)
            </button>
          </div>
        </div>
      </div>

      {/* 1. Selector de Nivel Pedagógico (5° a 8° Básico) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-base">
              1. Nivel Pedagógico del Curso (5° a 8° Básico)
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['nivel1', 'nivel2', 'nivel3'] as PedagogicalLevelId[]).map((id) => {
              const info = PEDAGOGICAL_LEVELS[id];
              const active = levelId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLevelId(id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    active
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                  }`}
                >
                  {info.grades}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50/70 to-amber-50/60 border border-purple-200/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md">
              {currentLevel.grades} · {currentLevel.title}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
              {currentLevel.summary}
            </p>
          </div>
          <div className="bg-white/90 rounded-xl p-3 border border-purple-200/70 md:max-w-xs shrink-0">
            <span className="text-[11px] font-bold uppercase text-purple-700 block">
              Meta de Aprendizaje:
            </span>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              {currentLevel.learningGoal}
            </p>
          </div>
        </div>
      </div>

      {/* Layout Principal: Configuración del Equipo y Sliders (Izquierda) + Previsualización Interactiva y Tiempos (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Configuración del Equipo, Botón IA Llamativo, Geometría y Sliders */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta de Configuración del Equipo y Geometría Conectora */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Datos del Equipo y Asistente Creativo IA
              </h3>
            </div>

            {/* Súper Botón Llamativo de Sugerir Ideas con IA (Google Gemini) */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-600 p-0.5 shadow-lg">
              <div className="bg-gradient-to-br from-amber-50 via-orange-50/90 to-fuchsia-50 rounded-[14px] p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md shrink-0 animate-pulse">
                      <Wand2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-600 text-white">
                          ✨ IA Creativa Gemini
                        </span>
                        <span className="text-[10px] font-bold text-amber-900">
                          ¡Inspira a tu equipo!
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                        ¿Sin ideas de nombre o emblemas?
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAiPanel((v) => !v)}
                    className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-white text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    {showAiPanel ? 'Ocultar IA' : '¡Sugerir Ideas con IA!'}
                  </button>
                </div>

                {/* Panel desplegable de Sugerencias con IA */}
                {showAiPanel && (
                  <div className="pt-2 border-t border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-amber-950 bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <span className="font-bold flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-fuchsia-600" />
                        {aiAgentLabel}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Activo
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'animales', label: '🐾 Animales' },
                          { id: 'espacio', label: '🚀 Espacio' },
                          { id: 'deportes', label: '⚡ Deportes' },
                          { id: 'ciencia', label: '⚛️ Ciencia' },
                        ] as { id: IdeaThemeId; label: string }[]
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectAiTheme(t.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            selectedTheme === t.id
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/60'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Campo opcional para pedirle a Gemini un tema libre */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customAiTopic}
                        onChange={(e) => setCustomAiTopic(e.target.value)}
                        placeholder="O escribe qué les gusta (ej. dinosaurios, fútbol, anime)..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-fuchsia-500"
                      />
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={handleGenerateAiIdeasWithGemini}
                        className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-60 text-white text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Generar con Gemini
                      </button>
                    </div>

                    <div className="space-y-2">
                      {aiIdeas.map((idea, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-2.5 border border-amber-200/80 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                              <span>{idea.teamName}</span>
                              <span className="text-[11px] font-normal text-slate-500">
                                (
                                {idea.icons
                                  .slice(0, memberCount)
                                  .map((ic) => BADGE_ICONS[ic]?.emoji || '⭐')
                                  .join(' ')}
                                )
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{idea.motto}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyAiIdea(idea)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-extrabold shrink-0 transition cursor-pointer"
                          >
                            Usar Idea
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nombre del Equipo y Cantidad de Integrantes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del Equipo (se graba sobre el ícono)
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="Ej. Equipo Alfa"
                  maxLength={22}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Integrantes (2 a 5)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMemberCount(n)}
                      className={`py-2 rounded-xl font-extrabold text-xs border transition cursor-pointer ${
                        memberCount === n
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Geometría del Marco Conector: Hexágono (Panal), Pentágono y Triángulo */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Geometría del Marco Conector 3D (Experimento de Eficiencia Natural)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(['hexagono', 'pentagono', 'triangulo'] as FrameGeometryId[]).map((geoId) => {
                  const g = FRAME_GEOMETRIES[geoId];
                  const active = geometry === geoId;
                  return (
                    <button
                      key={geoId}
                      type="button"
                      onClick={() => setGeometry(geoId)}
                      className={`text-left p-3 rounded-xl border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                        active
                          ? 'bg-purple-50/90 border-purple-600 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {geoId === 'hexagono'
                              ? '⬢'
                              : geoId === 'pentagono'
                                ? '⬠'
                                : '▲'}{' '}
                            {g.name}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              geoId === 'hexagono'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : geoId === 'pentagono'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-sky-100 text-sky-800 border border-sky-300'
                            }`}
                          >
                            {g.natureBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {g.description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center ${
                          active ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                        }`}
                      >
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cápsula Explicativa: ¿Por qué el Hexágono es la forma más eficiente en la naturaleza? */}
              <div className="rounded-xl bg-emerald-50/90 border border-emerald-200 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ¿Por qué el Hexágono es la forma más eficiente en la naturaleza?
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  {FRAME_GEOMETRIES[geometry].whyEfficiencyNote}
                </p>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {geometryComparison.map(({ id, info, telemetry: m }) => (
                    <div
                      key={id}
                      className={`rounded-lg p-2 text-center border ${
                        geometry === id
                          ? 'bg-white border-emerald-500 shadow-2xs'
                          : 'bg-emerald-100/50 border-emerald-200/80 opacity-80'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-slate-900">
                        {info.shortName} ({info.interiorAngleDeg}°)
                      </div>
                      <div className="text-[11px] font-black text-emerald-700">
                        {m.plaWeightPerFrameGrams} g PLA / marco
                      </div>
                      <div className="text-[9px] text-slate-600 font-semibold">
                        {info.tessellatesPlane ? 'Sin huecos (360°)' : 'Hueco de 36°'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Parámetros Técnicos con Barras Deslizantes (Sliders) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  2. Parámetros Técnicos (Barras Deslizantes)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetTechnicalParams}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Por Defecto
              </button>
            </div>

            <div className="space-y-4">
              {/* Slider 1: Diámetro del centro de madera (36 a 44 mm) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    1. Diámetro Centro de Madera (Ø)
                  </label>
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    {woodCenterDiameterMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={36}
                  max={44}
                  step={1}
                  value={woodCenterDiameterMm}
                  onChange={(e) => setWoodCenterDiameterMm(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>36 mm (Estándar)</span>
                  <span>40 mm</span>
                  <span>44 mm (Grande)</span>
                </div>
              </div>

              {/* Slider 2: Diámetro del orificio interno para llavero (3.8 a 4.4 mm) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    2. Diámetro del Orificio Interno (Llavero)
                  </label>
                  <span className="text-xs font-black text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                    Ø {holeDiameterMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={3.8}
                  max={4.4}
                  step={0.1}
                  value={holeDiameterMm}
                  onChange={(e) => setHoleDiameterMm(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>3.8 mm</span>
                  <span>4.1 mm</span>
                  <span>4.4 mm</span>
                </div>
              </div>

              {/* Slider 3: Tamaño del encaje Cola de Milano (1.8 a 3.4 mm) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    3. Tamaño Encaje Cola de Milano
                  </label>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    {dovetailSizeMm.toFixed(1)} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={1.8}
                  max={3.4}
                  step={0.2}
                  value={dovetailSizeMm}
                  onChange={(e) => setDovetailSizeMm(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                  <span>1.8 mm (Compacta)</span>
                  <span>2.4 mm (Óptima)</span>
                  <span>3.4 mm (Profunda)</span>
                </div>
              </div>
            </div>

            {/* Parámetros Fijos por Material y Ajuste Press-Fit */}
            <div className="rounded-xl bg-sky-50/80 border border-sky-200 p-3 text-[11px] text-sky-950 space-y-1">
              <div className="font-extrabold flex flex-wrap items-center justify-between gap-1">
                <span>Parámetros Fijos de Calce Press-Fit:</span>
                <span className="text-sky-700 font-mono">
                  Madera {FIXED_WOOD_THICKNESS_MM.toFixed(1)} mm · Tolerancia{' '}
                  {FIXED_PRESS_FIT_CLEARANCE_MM} mm
                </span>
              </div>
              <p className="text-sky-900/80 leading-relaxed">
                Cavidad PLA generada automáticamente: <strong>Ø {cavityDiameterMm} mm</strong> ×{' '}
                <strong>{cavityDepthMm} mm</strong> (con tope inferior de 1.0 mm y bisel superior de
                retención para encaje a presión sin pegamento).
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Previsualización en Pantalla + Tiempos de Fabricación + Descargas */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Barra de pestañas de previsualización */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('grupal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'grupal'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  Vista Grupal ({FRAME_GEOMETRIES[geometry].shortName})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('individual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'individual'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  Vista Individual ({memberCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('laser')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'laser'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Plano Falcon Design Space (.SVG)
                </button>
              </div>

              {previewTab === 'grupal' && (
                <button
                  type="button"
                  onClick={() => setAssembledOnTable((v) => !v)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition cursor-pointer"
                >
                  {assembledOnTable ? '🔓 Separar Chapitas' : '🧲 Conectar Cola de Milano'}
                </button>
              )}
            </div>

            {/* Contenido del Lienzo de Previsualización */}
            <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 min-h-[395px] flex flex-col justify-between">
              {previewTab === 'grupal' && (
                <svg viewBox={groupViewBox} className="w-full h-[355px] select-none">
                  <defs>
                    <pattern
                      id="badgeTableGrid"
                      width="15"
                      height="15"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 15 0 L 0 0 0 15"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.08)"
                        strokeWidth="0.6"
                      />
                    </pattern>
                  </defs>
                  <rect x="-180" y="-140" width="360" height="280" fill="url(#badgeTableGrid)" />

                  {activeMembers.map((member, idx) => {
                    const pos = groupAssemblyPositions[idx] ?? { x: 0, y: 0, rot: 0 };
                    return renderBadgeSvgGroup(member, member.id, pos.x, pos.y, pos.rot);
                  })}
                </svg>
              )}

              {previewTab === 'individual' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2">
                  {activeMembers.map((member, idx) => (
                    <div
                      key={member.id}
                      className="bg-slate-800/70 rounded-xl border border-slate-700 p-3 flex flex-col items-center"
                    >
                      <span className="text-[11px] font-bold text-slate-300 mb-1">
                        Chapita #{idx + 1}: {member.primaryText || `Integrante ${idx + 1}`}
                      </span>
                      <svg viewBox="-46 -46 92 92" className="w-36 h-36">
                        {renderBadgeSvgGroup(member, member.id, 0, 0, 0)}
                      </svg>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {FRAME_GEOMETRIES[geometry].shortName} · Ø{woodCenterDiameterMm}mm
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {previewTab === 'laser' && (
                <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center min-h-[340px]">
                  <div
                    className="w-full max-w-md flex justify-center overflow-auto"
                    dangerouslySetInnerHTML={{
                      __html: generateBadgesLaserSvg(currentParams),
                    }}
                  />
                  <p className="text-xs text-slate-600 mt-3 font-medium text-center">
                    Archivo <strong>.SVG para Falcon Design Space</strong> con las{' '}
                    <strong>{memberCount} chapas</strong>: Corte exterior en{' '}
                    <strong className="text-red-600">#FF0000 (0.1 mm)</strong> y grabado (Equipo +
                    Ícono + Estudiante + Logo MakerBox) en{' '}
                    <strong className="text-blue-600">#0000FF</strong>.
                  </p>
                </div>
              )}

              {/* Barra de Tiempos Estimados de Impresión 3D y Corte/Grabado Láser bajo la Vista Previa */}
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Tarjeta Tiempo Corte y Grabado Láser (Falcon Design Space) */}
                  <div className="rounded-xl bg-rose-950/50 border border-rose-500/30 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                          Tiempo Corte + Grabado Láser
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          Falcon Design Space ({memberCount} chapas)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-300 block">
                        ~{telemetry.laserTotalTimeFormatted}
                      </span>
                      <span className="text-[10px] text-rose-200/80 font-mono">
                        ({telemetry.laserTimePerBadgeSec} s c/u)
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta Tiempo Impresión 3D (PLA) */}
                  <div className="rounded-xl bg-indigo-950/60 border border-indigo-400/30 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                          Tiempo Impresión 3D PLA
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          {memberCount} Marcos ({telemetry.plaTotalWeightGrams} g PLA)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-300 block">
                        ~{telemetry.printTotalTimeFormatted}
                      </span>
                      <span className="text-[10px] text-indigo-200/80 font-mono">
                        ({telemetry.printTimePerFrameMin} min · {telemetry.plaWeightPerFrameGrams} g c/u)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                  <span>
                    <strong>Geometría:</strong> {FRAME_GEOMETRIES[geometry].shortName} ·{' '}
                    <strong>Cola Milano:</strong> {dovetailSizeMm.toFixed(1)} mm ·{' '}
                    <strong>Orificio:</strong> Ø{holeDiameterMm.toFixed(1)} mm
                  </span>
                  <span className="text-emerald-300 font-semibold">
                    Aprovechamiento Geométrico: {telemetry.efficiencyScorePct}% (Madera Ø
                    {woodCenterDiameterMm} mm → Cavidad Ø{cavityDiameterMm} mm)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Panel de Descarga de Archivos de Fabricación (.SVG y .STL siempre con todas las piezas) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  5. Descarga de Archivos de Fabricación (Equipo Completo: {memberCount} Piezas)
                </h3>
                <p className="text-xs text-slate-600">
                  Archivos parametrizados en milímetros listos para{' '}
                  <strong>Falcon Design Space</strong> (corte y grabado láser de las {memberCount}{' '}
                  chapas) y laminador 3D (con los {memberCount} marcos conectores en PLA).
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                ✓ Incluye las {memberCount} chapas y {memberCount} marcos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadLaserSvg}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar {memberCount} Centros para Falcon Design Space (.SVG)
              </button>

              <button
                type="button"
                onClick={handleDownloadConnectorStl}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Box className="w-4 h-4" />
                Descargar {memberCount} Marcos Conectores 3D (.STL)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Personalización de cada Chapita (Tarjetas por Integrante) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              3. Personalización de cada Chapita (Centro de Madera de Ø {woodCenterDiameterMm} mm)
            </h3>
            <p className="text-xs text-slate-600">
              Cada chapa graba automáticamente: <strong>Nombre del Equipo arriba</strong>,{' '}
              <strong>Emblema al centro</strong>, <strong>Nombre del Estudiante abajo</strong> y el{' '}
              <strong>Logo Oficial de MakerBox en la base</strong>.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
            Mostrando {memberCount} de 5 integrantes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMembers.map((member, idx) => (
            <div
              key={member.id}
              className="rounded-2xl border-2 border-slate-200 hover:border-purple-300 bg-slate-50/60 p-4 space-y-3 transition"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-900/20"
                    style={{ backgroundColor: member.plaColorHex }}
                  />
                  Chapita Integrante #{idx + 1}
                </span>

                {/* Selector rápido de color PLA de vista previa */}
                <div className="flex items-center gap-1">
                  {PLA_COLORS_PALETTE.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      title={`Color marco PLA: ${col.name}`}
                      onClick={() => handleUpdateMember(idx, { plaColorHex: col.hex })}
                      className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                        member.plaColorHex === col.hex
                          ? 'scale-125 ring-2 ring-slate-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Campo 1: Texto Principal (Bajo el ícono y sobre el logo MakerBox) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  1. Nombre Estudiante o Mascota (Bajo el ícono)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={member.primaryText}
                  onChange={(e) => handleUpdateMember(idx, { primaryText: e.target.value })}
                  placeholder="Ej. Sofía o Max"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Campo 2: Texto Secundario (Sobre el ícono) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  2. Nombre del Equipo o Contacto (Sobre el ícono)
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={member.secondaryText}
                  onChange={(e) => handleUpdateMember(idx, { secondaryText: e.target.value })}
                  placeholder="Ej. Equipo Alfa / +569..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Campo 3: Ícono Central (Emblema) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  3. Ícono Central para Grabado Láser
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(BADGE_ICONS) as BadgeIconId[]).map((iconKey) => {
                    const ic = BADGE_ICONS[iconKey];
                    const selected = member.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => handleUpdateMember(idx, { icon: iconKey })}
                        className={`py-1.5 px-1 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                          selected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="text-base leading-none">{ic.emoji}</span>
                        <span className="text-[10px] font-bold leading-tight truncate w-full">
                          {ic.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BadgesSection;
