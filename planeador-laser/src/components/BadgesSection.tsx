'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  Box,
  CheckCircle2,
  Download,
  Eye,
  GraduationCap,
  Grid,
  Hexagon,
  Layers,
  RotateCcw,
  Scissors,
  Settings2,
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
  computeOuterFrameContourPoints,
  FRAME_GEOMETRIES,
  FrameGeometryId,
  generateBadgesConnectorStl,
  generateBadgesLaserSvg,
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
    primaryText: 'Mateo',
    secondaryText: 'Equipo Alfa',
    icon: 'rocket',
    plaColorHex: '#f97316',
  },
  {
    id: 3,
    primaryText: 'Valentina',
    secondaryText: 'Equipo Alfa',
    icon: 'star',
    plaColorHex: '#10b981',
  },
  {
    id: 4,
    primaryText: 'Lucas',
    secondaryText: 'Equipo Alfa',
    icon: 'robot',
    plaColorHex: '#7c3aed',
  },
  {
    id: 5,
    primaryText: 'Martina',
    secondaryText: 'Equipo Alfa',
    icon: 'atom',
    plaColorHex: '#e11d48',
  },
];

export function BadgesSection() {
  const [levelId, setLevelId] = useState<PedagogicalLevelId>('nivel1');
  const [teamName, setTeamName] = useState<string>('Equipo Alfa');
  const [memberCount, setMemberCount] = useState<number>(3);
  const [geometry, setGeometry] = useState<FrameGeometryId>('hexagono');

  // Parámetros Técnicos de Calce (editables)
  const [woodCenterDiameterMm, setWoodCenterDiameterMm] = useState<number>(36);
  const [woodThicknessMm, setWoodThicknessMm] = useState<number>(3.0);
  const [clearanceMm, setClearanceMm] = useState<number>(0.15);

  // Tarjetas de Integrantes
  const [members, setMembers] = useState<BadgeMemberConfig[]>(INITIAL_MEMBERS);

  // Sugerencias IA
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);
  const [selectedTheme, setSelectedTheme] = useState<IdeaThemeId>('animales');

  // Previsualización en Pantalla
  const [previewTab, setPreviewTab] = useState<'grupal' | 'individual' | 'laser'>('grupal');
  const [assembledOnTable, setAssembledOnTable] = useState<boolean>(true);
  const [stlExportAll, setStlExportAll] = useState<boolean>(true);

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
      woodThicknessMm,
      clearanceMm,
      members: activeMembers,
    }),
    [
      levelId,
      teamName,
      memberCount,
      geometry,
      woodCenterDiameterMm,
      woodThicknessMm,
      clearanceMm,
      activeMembers,
    ]
  );

  const cavityDiameterMm = Number((woodCenterDiameterMm + 2 * clearanceMm).toFixed(2));
  const cavityDepthMm = Number((woodThicknessMm + 0.1).toFixed(2));

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

  const handleApplyAiIdea = (idea: TeamIdeaSuggestion) => {
    setTeamName(idea.teamName);
    setGeometry(idea.recommendedGeometry);
    setMembers((prev) =>
      prev.map((m, idx) => ({
        ...m,
        primaryText: m.primaryText || idea.sampleMemberNames[idx] || `Integrante ${idx + 1}`,
        secondaryText: idea.teamName,
        icon: idea.icons[idx % idea.icons.length],
      }))
    );
  };

  const handleResetTechnicalParams = () => {
    setWoodCenterDiameterMm(36);
    setWoodThicknessMm(3.0);
    setClearanceMm(0.15);
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
    a.download = `chapitas-centros-madera-${safeTeam}-${memberCount}x-${woodCenterDiameterMm}mm.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadConnectorStl = () => {
    const stlContent = generateBadgesConnectorStl(currentParams, stlExportAll);
    const blob = new Blob([stlContent], { type: 'model/stl;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTeam = (teamName || 'equipo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const qtyLabel = stlExportAll ? `${memberCount}marcos` : '1marco';
    a.download = `chapitas-marcos-3d-${geometry}-${safeTeam}-${qtyLabel}.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pre-compute outer contour SVG polygon points for a single badge in local mm
  const singleFramePolygonPoints = useMemo(() => {
    const rCav = cavityDiameterMm / 2;
    const pts = computeOuterFrameContourPoints(geometry, rCav, clearanceMm, 180);
    const polyStr = pts.map((p) => `${p.x.toFixed(2)},${(-p.y).toFixed(2)}`).join(' ');
    const minY = Math.min(...pts.map((p) => -p.y));
    return { polyStr, minY, rCav };
  }, [geometry, cavityDiameterMm, clearanceMm]);

  // Calculate positions for the Group Honeycomb / Gear / Medallion assembly view
  const groupAssemblyPositions = useMemo(() => {
    const rCav = cavityDiameterMm / 2;
    const baseOuterR = rCav + 5.2;
    const gap = assembledOnTable ? 0.4 : 18.0;

    if (geometry === 'hexagono') {
      // Honeycomb cluster offsets (flat face-to-face distance = 2 * apothem)
      const dist = 2 * baseOuterR + gap;
      const coords = [
        { x: 0, y: 0, rot: 0 },
        { x: dist * Math.cos(Math.PI / 6), y: -dist * Math.sin(Math.PI / 6), rot: 0 },
        { x: -dist * Math.cos(Math.PI / 6), y: -dist * Math.sin(Math.PI / 6), rot: 0 },
        { x: dist * Math.cos(Math.PI / 6), y: dist * Math.sin(Math.PI / 6), rot: 0 },
        { x: -dist * Math.cos(Math.PI / 6), y: dist * Math.sin(Math.PI / 6), rot: 0 },
      ];
      return coords.slice(0, memberCount);
    } else if (geometry === 'engranaje') {
      // Meshing gears (12 teeth -> 15 deg phase offset on neighbor so tooth fits into valley!)
      const pitchDist = 2 * (baseOuterR + 0.9) + gap;
      const coords = [
        { x: 0, y: 0, rot: 0 },
        { x: pitchDist, y: 0, rot: 15 },
        { x: -pitchDist, y: 0, rot: 15 },
        { x: pitchDist * 0.5, y: pitchDist * 0.866, rot: 15 },
        { x: -pitchDist * 0.5, y: pitchDist * 0.866, rot: 15 },
      ];
      return coords.slice(0, memberCount);
    } else {
      // Circular medallion cluster interlocking tabs/notches
      const pitchDist = 2 * (baseOuterR + 0.5) + gap;
      const coords = [
        { x: 0, y: 0, rot: 0 },
        { x: pitchDist, y: 0, rot: 0 },
        { x: -pitchDist, y: 0, rot: 0 },
        { x: pitchDist * 0.5, y: pitchDist * 0.866, rot: 0 },
        { x: -pitchDist * 0.5, y: pitchDist * 0.866, rot: 0 },
      ];
      return coords.slice(0, memberCount);
    }
  }, [geometry, cavityDiameterMm, memberCount, assembledOnTable]);

  const currentLevel = PEDAGOGICAL_LEVELS[levelId];

  // Helper to render a single hybrid badge (PLA frame + keychain lug + wood center + icon + texts)
  const renderBadgeSvgGroup = (
    member: BadgeMemberConfig,
    key: string | number,
    tx: number,
    ty: number,
    rotDeg = 0
  ) => {
    const woodRadius = woodCenterDiameterMm / 2;
    const lugY = singleFramePolygonPoints.minY - 2.2;
    const iconInfo = BADGE_ICONS[member.icon] ?? BADGE_ICONS.paw;
    const iconScale = (woodCenterDiameterMm / 36) * 0.68;

    return (
      <g key={key} transform={`translate(${tx.toFixed(2)}, ${ty.toFixed(2)})`}>
        {/* Ojal superior de 4 mm para argolla de llavero */}
        <g>
          <circle
            cx="0"
            cy={lugY}
            r="4.6"
            fill={member.plaColorHex}
            stroke="#0f172a"
            strokeWidth="0.4"
          />
          <circle cx="0" cy={lugY} r="2.0" fill="#0f172a" />
        </g>

        {/* Cuerpo exterior conector PLA (rotado si es engranaje acoplado) */}
        <g transform={rotDeg !== 0 ? `rotate(${rotDeg})` : undefined}>
          <polygon
            points={singleFramePolygonPoints.polyStr}
            fill={member.plaColorHex}
            stroke="#0f172a"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </g>

        {/* Bisel de retención superior Press-Fit */}
        <circle
          cx="0"
          cy="0"
          r={singleFramePolygonPoints.rCav}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="0.8"
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

        {/* Ícono Central Grabado */}
        <g
          transform={`translate(0, ${(-woodRadius * 0.18).toFixed(
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

        {/* Texto Principal */}
        <text
          x="0"
          y={woodRadius * 0.43}
          textAnchor="middle"
          fill="#451a03"
          fontSize={Math.min(
            4.1,
            Math.max(2.5, (woodCenterDiameterMm * 0.6) / Math.max(5, member.primaryText.length))
          )}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {(member.primaryText || 'NOMBRE').toUpperCase()}
        </text>

        {/* Texto Secundario */}
        {member.secondaryText && (
          <text
            x="0"
            y={woodRadius * 0.65}
            textAnchor="middle"
            fill="#78350f"
            fontSize={Math.min(
              2.6,
              Math.max(
                1.9,
                (woodCenterDiameterMm * 0.5) / Math.max(7, member.secondaryText.length)
              )
            )}
            fontWeight="600"
            fontFamily="Arial, sans-serif"
          >
            {member.secondaryText}
          </text>
        )}
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
              Taller 4 · Co-creación de Chapitas Híbridas (Corte Láser + Impresión 3D PLA)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Estación de Diseño de Chapitas & Llaveros Conectables
            </h2>
            <p className="text-purple-100/90 text-sm max-w-3xl leading-relaxed">
              Diseña en equipo un set de chapitas o llaveros híbridos: un{' '}
              <strong>centro de madera de {woodThicknessMm} mm</strong> grabado y cortado con láser
              que encaja a presión (<em>press-fit</em>) dentro de un{' '}
              <strong>marco conector impreso en 3D (PLA)</strong> capaz de acoplarse con los marcos
              de tus compañeros sobre la mesa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadLaserSvg}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-950/50 transition cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              Descargar Centros Láser (.SVG)
            </button>
            <button
              type="button"
              onClick={handleDownloadConnectorStl}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/40 transition cursor-pointer"
            >
              <Box className="w-4 h-4" />
              Descargar Marcos 3D (.STL)
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

      {/* Layout Principal: Configuración del Equipo y Calce (Izquierda) + Previsualización Interactiva (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Configuración del Equipo, IA y Parámetros de Calce */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta de Configuración del Equipo y Geometría Conectora */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Datos del Equipo y Marco Conector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPanel((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Sugerir Ideas con IA
              </button>
            </div>

            {/* Panel desplegable de Sugerencias con IA */}
            {showAiPanel && (
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Elige qué les gusta al grupo para generar 3 ideas:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(false)}
                    className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                  >
                    Cerrar
                  </button>
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
                      onClick={() => setSelectedTheme(t.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedTheme === t.id
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {AI_TEAM_IDEAS_BY_THEME[selectedTheme].map((idea, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-2.5 border border-amber-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{idea.teamName}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            ({idea.icons.slice(0, memberCount).map((ic) => BADGE_ICONS[ic].emoji).join(' ')})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{idea.motto}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyAiIdea(idea)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shrink-0 transition cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nombre del Equipo y Cantidad de Integrantes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => handleTeamNameChange(e.target.value)}
                  placeholder="Ej. Equipo Alfa"
                  maxLength={24}
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

            {/* Geometría del Marco Conector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700">
                Geometría del Marco Conector 3D (Elección del Grupo)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(['hexagono', 'engranaje', 'circular'] as FrameGeometryId[]).map((geoId) => {
                  const g = FRAME_GEOMETRIES[geoId];
                  const active = geometry === geoId;
                  return (
                    <button
                      key={geoId}
                      type="button"
                      onClick={() => setGeometry(geoId)}
                      className={`text-left p-3 rounded-xl border-2 transition cursor-pointer flex items-start justify-between gap-3 ${
                        active
                          ? 'bg-purple-50/80 border-purple-600 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <span>
                            {geoId === 'hexagono'
                              ? '⬢'
                              : geoId === 'engranaje'
                                ? '⚙️'
                                : '⭕'}
                          </span>
                          <span>{g.name}</span>
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
            </div>
          </div>

          {/* 2. Parámetros Técnicos de Calce (Editables) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  2. Parámetros Técnicos de Calce (Press-Fit)
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

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  Centro Madera (Ø)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={26}
                    max={48}
                    step={1}
                    value={woodCenterDiameterMm}
                    onChange={(e) =>
                      setWoodCenterDiameterMm(
                        Math.max(26, Math.min(48, Number(e.target.value) || 36))
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-500">mm</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  Espesor Madera
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={2.0}
                    max={4.5}
                    step={0.1}
                    value={woodThicknessMm}
                    onChange={(e) =>
                      setWoodThicknessMm(
                        Math.max(2.0, Math.min(4.5, Number(e.target.value) || 3.0))
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-500">mm</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  Tolerancia (Clearance)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0.05}
                    max={0.4}
                    step={0.05}
                    value={clearanceMm}
                    onChange={(e) =>
                      setClearanceMm(
                        Math.max(0.05, Math.min(0.4, Number(e.target.value) || 0.15))
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-extrabold text-slate-900 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-500">mm</span>
                </div>
              </div>
            </div>

            {/* Resumen de ingeniería de la cavidad 3D */}
            <div className="rounded-xl bg-sky-50/80 border border-sky-200 p-3 text-[11px] text-sky-950 space-y-1">
              <div className="font-extrabold flex items-center justify-between">
                <span>Cálculo Automático de Cavidad 3D (PLA):</span>
                <span className="text-sky-700 font-mono">
                  Ø {cavityDiameterMm} mm × {cavityDepthMm} mm
                </span>
              </div>
              <p className="text-sky-900/80 leading-relaxed">
                Altura marco PLA: <strong>5.0 mm</strong> · Tope inferior: <strong>1.0 mm</strong> ·
                Cavidad madera: <strong>{cavityDepthMm} mm</strong> · Bisel superior{' '}
                <em>press-fit</em>: <strong>0.9 mm</strong> · Ojal llavero: <strong>Ø 4.0 mm</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Previsualización en Pantalla (Grupal Panal / Individual / Láser) */}
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
                  Vista Grupal (Panal en Mesa)
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
                  Plano Corte Láser (.SVG)
                </button>
              </div>

              {previewTab === 'grupal' && (
                <button
                  type="button"
                  onClick={() => setAssembledOnTable((v) => !v)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition cursor-pointer"
                >
                  {assembledOnTable ? '🔓 Separar Chapitas' : '🧲 Conectar en Panal'}
                </button>
              )}
            </div>

            {/* Contenido del Lienzo de Previsualización */}
            <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 min-h-[390px] flex flex-col justify-between">
              {previewTab === 'grupal' && (
                <svg viewBox="-115 -85 230 175" className="w-full h-[350px] select-none">
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
                  <rect x="-115" y="-85" width="230" height="175" fill="url(#badgeTableGrid)" />

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
                      <svg viewBox="-34 -36 68 68" className="w-36 h-36">
                        {renderBadgeSvgGroup(member, member.id, 0, 2, 0)}
                      </svg>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Marco PLA + Madera Ø{woodCenterDiameterMm}mm
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
                    Vista previa del archivo <strong>.SVG</strong>: Círculos exteriores de corte en{' '}
                    <strong className="text-red-600">#FF0000 (0.1 mm)</strong> e íconos/textos de
                    grabado en <strong className="text-blue-600">#0000FF</strong>.
                  </p>
                </div>
              )}

              {/* Pie informativo del visor */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <span>
                  <strong>Geometría:</strong> {FRAME_GEOMETRIES[geometry].name} ·{' '}
                  <strong>Equipo:</strong> {teamName || 'Sin nombre'} ({memberCount} chapitas)
                </span>
                <span className="text-amber-300 font-semibold">
                  Encaje Press-Fit: Madera Ø{woodCenterDiameterMm} mm → Cavidad PLA Ø
                  {cavityDiameterMm} mm
                </span>
              </div>
            </div>
          </div>

          {/* 5. Panel de Descarga de Archivos de Fabricación (.SVG y .STL) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  5. Descarga de Archivos de Fabricación (Láser + 3D)
                </h3>
                <p className="text-xs text-slate-600">
                  Archivos parametrizados en milímetros listos para LightBurn (corte/grabado láser) y
                  laminador 3D (Bambu Studio / Cura / PrusaSlicer).
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stlExportAll}
                  onChange={(e) => setStlExportAll(e.target.checked)}
                  className="rounded accent-purple-600"
                />
                Incluir los {memberCount} marcos en el .STL
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadLaserSvg}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Descargar Centros para Corte Láser (.SVG)
              </button>

              <button
                type="button"
                onClick={handleDownloadConnectorStl}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Box className="w-4 h-4" />
                Descargar Marcos Conectores 3D (.STL)
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
              3. Personalización de cada Chapita (Centro de Madera de {woodCenterDiameterMm} mm)
            </h3>
            <p className="text-xs text-slate-600">
              Completa los 3 campos de cada integrante: texto principal (nombre o mascota), texto
              secundario (equipo o teléfono) y el emblema vectorial para grabar con láser.
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

              {/* Campo 1: Texto Principal */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  1. Texto Principal (Nombre estudiante o mascota)
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

              {/* Campo 2: Texto Secundario (Opcional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  2. Texto Secundario (Equipo o teléfono mascota)
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
