'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Eye, Sparkles, Layers, Sliders, Palette } from 'lucide-react';
import { FractionsModelResult, FractionsConfig } from '@/lib/fractionsGenerator';

interface Fractions3DViewerProps {
  modelResult: FractionsModelResult | null;
  config: FractionsConfig;
  onExplodeChange?: (val: number) => void;
  isLoading?: boolean;
}

export const FRACTION_COLOR_PRESETS = [
  { name: 'Blanco Puro (Como Muestra)', tray: '#ffffff', pieces: '#ffffff' },
  { name: 'Multicolor Montessori (Azul / Ámbar)', tray: '#f1f5f9', pieces: '#2563eb' },
  { name: 'Madera MDF Natural', tray: '#d97706', pieces: '#fde68a' },
  { name: 'Pizarra Moderna (Oscuro + Lima)', tray: '#0f172a', pieces: '#84cc16' },
  { name: 'Púrpura MakerBox + Rosa', tray: '#ffffff', pieces: '#7e22ce' }
];

export const Fractions3DViewer: React.FC<Fractions3DViewerProps> = ({
  modelResult,
  config,
  onExplodeChange,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const trayMeshRef = useRef<THREE.Mesh | null>(null);
  const piecesMeshRef = useRef<THREE.Mesh | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'tray-only' | 'pieces-only'>('both');
  const [activeColorPreset, setActiveColorPreset] = useState(0);

  // Inicializar Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 1000);
    // Posición isométrica óptima para ver la altura del plato de 5 mm y las partes de 3 mm
    camera.position.set(0, -90, 115);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 450;
    controls.minDistance = 30;
    controls.target.set(0, 0, 3);
    controlsRef.current = controls;

    // Iluminación realista para resaltar bajo relieve o braille
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(50, 70, 90);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.65);
    fillLight.position.set(-60, -40, 50);
    scene.add(fillLight);

    const bottomRimLight = new THREE.DirectionalLight(0xffffff, 0.35);
    bottomRimLight.position.set(0, -80, -30);
    scene.add(bottomRimLight);

    // Animación
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.autoRotateSpeed = 2.0;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Redimensionar
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Actualizar mallas cuando cambia el resultado
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelResult) return;

    // Limpiar mallas anteriores
    if (trayMeshRef.current) {
      scene.remove(trayMeshRef.current);
      trayMeshRef.current.geometry.dispose();
      trayMeshRef.current = null;
    }
    if (piecesMeshRef.current) {
      scene.remove(piecesMeshRef.current);
      piecesMeshRef.current.geometry.dispose();
      piecesMeshRef.current = null;
    }

    const currentPreset = FRACTION_COLOR_PRESETS[activeColorPreset];

    // 1. Malla del Plato Base (D=70mm, Dint=60mm, H=5mm)
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentPreset.tray),
      roughness: 0.38,
      metalness: 0.05
    });

    const trayMesh = new THREE.Mesh(modelResult.trayGeometry, trayMaterial);
    trayMesh.castShadow = true;
    trayMesh.receiveShadow = true;
    trayMesh.visible = viewMode !== 'pieces-only';
    scene.add(trayMesh);
    trayMeshRef.current = trayMesh;

    // 2. Malla de las Piezas de Fracciones (H=3mm)
    const piecesMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(currentPreset.pieces),
      roughness: 0.32,
      metalness: 0.08
    });

    const piecesMesh = new THREE.Mesh(modelResult.piecesGeometry, piecesMaterial);
    piecesMesh.castShadow = true;
    piecesMesh.receiveShadow = true;
    piecesMesh.visible = viewMode !== 'tray-only';
    scene.add(piecesMesh);
    piecesMeshRef.current = piecesMesh;
  }, [modelResult, activeColorPreset, viewMode]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, -90, 115);
    controlsRef.current.target.set(0, 0, 3);
    controlsRef.current.update();
  };

  const handleTopView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0, 140);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-100/90 to-slate-200/50 shadow-inner flex flex-col">
      {/* Barra superior de controles del visor 3D */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        {/* Controles de vista */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'both'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Plato + Piezas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pieces-only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'pieces-only'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Solo Piezas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tray-only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'tray-only'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Solo Plato</span>
          </button>
        </div>

        {/* Acciones de cámara y rotación */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={handleTopView}
            className="p-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="Vista Superior 2D"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planta</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-xl text-slate-600 hover:text-purple-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="Restablecer Vista"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Centrar</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              autoRotate
                ? 'bg-purple-100 text-purple-700'
                : 'text-slate-600 hover:text-purple-600 hover:bg-slate-100'
            }`}
            title="Giro automático"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Girar</span>
          </button>
        </div>
      </div>

      {/* Contenedor del lienzo Three.js WebGL */}
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[480px] cursor-grab active:cursor-grabbing"
      />

      {/* Barra flotante inferior: Slider de explosión y selector de color */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none">
        {/* Slider de Separación / Explosión de piezas */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 pointer-events-auto w-full sm:w-auto">
          <Sliders className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 shrink-0">
            Separación de piezas:
          </span>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={config.explodeDistanceMm}
            onChange={(e) => onExplodeChange && onExplodeChange(Number(e.target.value))}
            className="w-28 sm:w-36 accent-purple-600 cursor-pointer"
          />
          <span className="text-[11px] font-mono font-extrabold text-purple-700 w-12 text-right">
            {config.explodeDistanceMm === 0 ? 'Encajadas' : `+${config.explodeDistanceMm}mm`}
          </span>
        </div>

        {/* Paletas de color didácticas */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200 pointer-events-auto">
          <Palette className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 shrink-0" />
          {FRACTION_COLOR_PRESETS.map((p, idx) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setActiveColorPreset(idx)}
              className={`w-6 h-6 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                activeColorPreset === idx
                  ? 'ring-2 ring-purple-600 ring-offset-1 border-transparent scale-110'
                  : 'border-slate-300 hover:scale-105'
              }`}
              style={{
                background: `linear-gradient(135deg, ${p.tray} 50%, ${p.pieces} 50%)`
              }}
              title={p.name}
            />
          ))}
        </div>
      </div>

      {/* Spinner de carga si está recalculando */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-lg border border-slate-200 text-xs font-extrabold text-purple-700">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Generando geometría 3D con tolerancia...</span>
          </div>
        </div>
      )}
    </div>
  );
};
