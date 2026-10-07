'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCw,
  RefreshCw,
  Eye,
  Sparkles,
  Layers,
  Sliders,
  Palette,
  Maximize2,
  Box,
  Flame
} from 'lucide-react';
import { FractionsModelResult, FractionsConfig } from '@/lib/fractionsGenerator';

interface Fractions3DViewerProps {
  modelResult: FractionsModelResult | null;
  config: FractionsConfig;
  onExplodeChange?: (val: number) => void;
  onMaterialChange?: (val: 'mdf' | 'pla_white' | 'pla_color') => void;
  isLoading?: boolean;
}

// Generador procedural de textura de madera MDF Trupán
function createProceduralMdfTexture(): THREE.CanvasTexture | null {
  if (typeof window === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Tono base cálido de madera MDF
  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-fibras prensadas características del MDF
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 24;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.9));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  // Sutiles vetas horizontales orgánicas
  ctx.fillStyle = 'rgba(175, 120, 65, 0.08)';
  for (let y = 0; y < 512; y += 3) {
    if (Math.random() > 0.45) {
      ctx.fillRect(0, y, 512, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

// Colores vivos STEM para cada fracción en modo multicolor PLA
const STEM_FRACTION_COLORS: Record<number, string> = {
  2: '#0284c7', // 1/2 Azul cielo
  3: '#10b981', // 1/3 Esmeralda
  4: '#eab308', // 1/4 Amarillo sol
  5: '#f97316', // 1/5 Naranja brillante
  6: '#ec4899'  // 1/6 Rosa vivo
};

export const Fractions3DViewer: React.FC<Fractions3DViewerProps> = ({
  modelResult,
  config,
  onExplodeChange,
  onMaterialChange,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const trayMeshRef = useRef<THREE.Mesh | null>(null);
  const piecesMeshRef = useRef<THREE.Mesh | null>(null);
  const markingsMeshRef = useRef<THREE.Mesh | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'tray-only' | 'pieces-only'>('both');
  const [activeMaterial, setActiveMaterial] = useState<'mdf' | 'pla_white' | 'pla_color'>(
    config.materialStyle || 'mdf'
  );

  useEffect(() => {
    if (config.materialStyle) {
      setActiveMaterial(config.materialStyle);
    }
  }, [config.materialStyle]);

  const handleSelectMaterial = (mat: 'mdf' | 'pla_white' | 'pla_color') => {
    setActiveMaterial(mat);
    onMaterialChange?.(mat);
  };

  // Textura MDF en caché para rendimiento
  const mdfTexture = useMemo(() => {
    return createProceduralMdfTexture();
  }, []);

  // Inicializar Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(36, width / height, 1, 1000);
    // Posición isométrica óptima para ver el relieve y espesor del plato
    camera.position.set(0, -95, 115);
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
    controls.minDistance = 25;
    controls.target.set(0, 0, 3);
    controlsRef.current = controls;

    // Iluminación de estudio para resaltar sombras de cantos y bajorrelieve
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(50, 70, 95);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    fillLight.position.set(-60, -40, 50);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, -80, -20);
    scene.add(rimLight);

    // Suelo suave para proyección de sombras
    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.ShadowMaterial({ opacity: 0.12 })
    );
    shadowFloor.position.z = -0.1;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    // Bucle de animación
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
      const h = container.clientHeight || 480;
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

  // Actualizar mallas cuando cambia el modelo o el material
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelResult) return;

    // Limpiar mallas previas
    if (trayMeshRef.current) {
      scene.remove(trayMeshRef.current);
      trayMeshRef.current = null;
    }
    if (piecesMeshRef.current) {
      scene.remove(piecesMeshRef.current);
      piecesMeshRef.current = null;
    }
    if (markingsMeshRef.current) {
      scene.remove(markingsMeshRef.current);
      markingsMeshRef.current = null;
    }

    // Configuración de materiales según el modo activo
    let trayMaterial: THREE.Material;
    let piecesMaterial: THREE.Material;
    let markingsMaterial: THREE.Material;

    if (activeMaterial === 'mdf') {
      // MODO MADERA MDF (Corte Láser):
      // - Plato y piezas en tono beige cálido de trupán MDF
      // - Números y puntos grabados en café tostado oscuro quemado
      trayMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#deb887'),
        map: mdfTexture ?? undefined,
        roughness: 0.55,
        metalness: 0.02
      });

      piecesMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e5bf92'),
        map: mdfTexture ?? undefined,
        roughness: 0.52,
        metalness: 0.02
      });

      markingsMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2c1408'), // Café quemado láser oscuro
        roughness: 0.88,
        metalness: 0.05
      });
    } else if (activeMaterial === 'pla_white') {
      // MODO PLA BLANCO PURO (Impresión 3D estándar como foto real)
      trayMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f8fafc'),
        roughness: 0.35,
        metalness: 0.06
      });

      piecesMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f1f5f9'),
        roughness: 0.32,
        metalness: 0.08
      });

      markingsMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0f172a'), // Contraste oscuro
        roughness: 0.4,
        metalness: 0.1
      });
    } else {
      // MODO PLA MULTICOLOR STEM (Colores pedagógicos Montessori)
      const fractionColor = STEM_FRACTION_COLORS[config.denominator] || '#7c3aed';

      trayMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.35,
        metalness: 0.05
      });

      piecesMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(fractionColor),
        roughness: 0.28,
        metalness: 0.08
      });

      markingsMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.3,
        metalness: 0.05
      });
    }

    // 1. Malla del Plato
    const trayMesh = new THREE.Mesh(modelResult.trayGeometry, trayMaterial);
    trayMesh.castShadow = true;
    trayMesh.receiveShadow = true;
    trayMesh.visible = viewMode !== 'pieces-only';
    scene.add(trayMesh);
    trayMeshRef.current = trayMesh;

    // 2. Malla de las Piezas de Fracciones
    const piecesMesh = new THREE.Mesh(modelResult.piecesGeometry, piecesMaterial);
    piecesMesh.castShadow = true;
    piecesMesh.receiveShadow = true;
    piecesMesh.visible = viewMode !== 'tray-only';
    scene.add(piecesMesh);
    piecesMeshRef.current = piecesMesh;

    // 3. Malla de los Grabados y Puntos Láser / Braille
    if (modelResult.markingsGeometry) {
      const markingsMesh = new THREE.Mesh(modelResult.markingsGeometry, markingsMaterial);
      markingsMesh.castShadow = true;
      markingsMesh.receiveShadow = true;
      markingsMesh.visible = viewMode !== 'tray-only';
      scene.add(markingsMesh);
      markingsMeshRef.current = markingsMesh;
    }
  }, [modelResult, activeMaterial, viewMode, config.denominator, mdfTexture]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, -95, 115);
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
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200/90 bg-gradient-to-b from-slate-100 to-slate-200/60 shadow-lg flex flex-col">
      {/* Barra superior de controles del visor 3D (Optimizada para pantalla táctil) */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        {/* Selector de Material con texturas reales */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleSelectMaterial('mdf')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
              activeMaterial === 'mdf'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'text-slate-700 hover:text-amber-900 hover:bg-amber-50/80'
            }`}
            title="Textura de madera MDF trupán con corte y grabado láser tostado"
          >
            <span>🪵 Madera MDF Láser</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMaterial('pla_white')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
              activeMaterial === 'pla_white'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Plástico PLA blanco puro para impresión 3D"
          >
            <span>🖨️ PLA Blanco</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMaterial('pla_color')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
              activeMaterial === 'pla_color'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
            }`}
            title="Colores didácticos vivos STEM por fracción"
          >
            <span>🎨 Color STEM</span>
          </button>
        </div>

        {/* Acciones de cámara y rotación */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={handleTopView}
            className="p-2.5 rounded-xl text-slate-700 hover:text-purple-600 hover:bg-purple-50 text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Vista Superior 2D (Planta)"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Planta 2D</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2.5 rounded-xl text-slate-700 hover:text-purple-600 hover:bg-purple-50 text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Restablecer Vista"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Centrar</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              autoRotate
                ? 'bg-purple-100 text-purple-800'
                : 'text-slate-700 hover:text-purple-700 hover:bg-slate-100'
            }`}
            title="Giro automático 360°"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">Girar</span>
          </button>
        </div>
      </div>

      {/* Contenedor del lienzo Three.js WebGL */}
      <div
        ref={containerRef}
        className="w-full h-[420px] sm:h-[500px] cursor-grab active:cursor-grabbing"
      />

      {/* Barra flotante inferior: Controles táctiles de Ensamblaje / Separación */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Botones directos táctiles Ensamblado vs Separado */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => onExplodeChange && onExplodeChange(0)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
              config.explodeDistanceMm === 0
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>🧩 Ensamblado en Plato</span>
          </button>

          <button
            type="button"
            onClick={() => onExplodeChange && onExplodeChange(14)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
              config.explodeDistanceMm > 0
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>💥 Separado / Despiece</span>
          </button>
        </div>

        {/* Slider fino de separación radial */}
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-slate-200 pointer-events-auto w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800 shrink-0">
            Apertura:
          </span>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={config.explodeDistanceMm}
            onChange={(e) => onExplodeChange && onExplodeChange(Number(e.target.value))}
            className="w-28 sm:w-36 accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <span className="text-xs font-mono font-black text-purple-700 w-12 text-right">
            {config.explodeDistanceMm === 0 ? '0 mm' : `+${config.explodeDistanceMm}mm`}
          </span>
        </div>
      </div>

      {/* Spinner de carga si está recalculando */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white shadow-xl border border-slate-200 text-xs font-black text-purple-700">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Generando geometría 3D precisa...</span>
          </div>
        </div>
      )}
    </div>
  );
};
