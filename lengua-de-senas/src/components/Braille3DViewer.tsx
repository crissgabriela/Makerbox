'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Eye, Sparkles, Layers, Palette } from 'lucide-react';
import { BrailleModelResult } from '@/lib/brailleGenerator';

interface Braille3DViewerProps {
  modelResult: BrailleModelResult | null;
  baseColor: string;
  dotColor: string;
  onColorChange?: (base: string, dot: string) => void;
  isLoading?: boolean;
  textMode?: 'emboss' | 'deboss';
}

export const COLOR_PRESETS = [
  { name: 'Pizarra + Ámbar', base: '#1e293b', dot: '#fbbf24' },
  { name: 'Azul UTalca + Blanco', base: '#1d4ed8', dot: '#ffffff' },
  { name: 'Negro + Amarillo Neón', base: '#0f172a', dot: '#eab308' },
  { name: 'Blanco + Morado MakerBox', base: '#f8fafc', dot: '#7e22ce' },
  { name: 'Rojo + Blanco', base: '#dc2626', dot: '#ffffff' },
  { name: 'Verde Pino + Dorado', base: '#14532d', dot: '#f59e0b' }
];

export const Braille3DViewer: React.FC<Braille3DViewerProps> = ({
  modelResult,
  baseColor,
  dotColor,
  onColorChange,
  isLoading = false,
  textMode = 'emboss'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const baseMeshRef = useRef<THREE.Mesh | null>(null);
  const dotsMeshRef = useRef<THREE.Mesh | null>(null);
  const textMeshRef = useRef<THREE.Mesh | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);

  // Inicializar Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 440;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 1000);
    // Vista angular en perspectiva óptima para ver tanto el plano como el relieve de 0.36mm
    camera.position.set(0, -65, 80);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 350;
    controls.minDistance = 25;
    controlsRef.current = controls;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    // Luz cenital angular (resalta las sombras del relieve de los puntos táctiles)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(40, 50, 70);
    scene.add(keyLight);

    // Luz de relleno lateral
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    fillLight.position.set(-40, -30, 40);
    scene.add(fillLight);

    // Luz suave trasera
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 40, -50);
    scene.add(rimLight);

    // Loop de animación
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

    // Redimensionar al cambiar ventana
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Actualizar auto-rotación
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Actualizar mallas cuando cambia el modelo geométrico o los colores
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !modelResult) return;

    // Remover mallas anteriores
    if (baseMeshRef.current) {
      scene.remove(baseMeshRef.current);
      baseMeshRef.current.geometry.dispose();
      (baseMeshRef.current.material as THREE.Material).dispose();
      baseMeshRef.current = null;
    }

    if (dotsMeshRef.current) {
      scene.remove(dotsMeshRef.current);
      dotsMeshRef.current.geometry.dispose();
      (dotsMeshRef.current.material as THREE.Material).dispose();
      dotsMeshRef.current = null;
    }

    if (textMeshRef.current) {
      scene.remove(textMeshRef.current);
      textMeshRef.current.geometry.dispose();
      (textMeshRef.current.material as THREE.Material).dispose();
      textMeshRef.current = null;
    }

    // Crear material para la placa base
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.45,
      metalness: 0.05
    });

    const baseMesh = new THREE.Mesh(modelResult.baseGeometry, baseMat);
    scene.add(baseMesh);
    baseMeshRef.current = baseMesh;

    // Crear material para los puntos táctiles
    if (modelResult.dotsGeometry) {
      const dotsMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(dotColor),
        roughness: 0.25,
        metalness: 0.15
      });

      const dotsMesh = new THREE.Mesh(modelResult.dotsGeometry, dotsMat);
      scene.add(dotsMesh);
      dotsMeshRef.current = dotsMesh;
    }

    // Crear material para las letras escritas (sobresalen del plano)
    if (modelResult.textGeometry) {
      const textMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(dotColor), // Usar color de contraste (o blanco/ámbar)
        roughness: 0.3,
        metalness: 0.1
      });

      const textMesh = new THREE.Mesh(modelResult.textGeometry, textMat);
      scene.add(textMesh);
      textMeshRef.current = textMesh;
    }

    // Ajustar distancia de cámara según el ancho del llavero
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(modelResult.widthMm, modelResult.heightMm);
      const targetDist = maxDim * 1.55;
      cameraRef.current.position.set(0, -targetDist * 0.75, targetDist * 0.85);
      cameraRef.current.lookAt(0, 0, modelResult.totalThicknessMm / 2);
      controlsRef.current.target.set(0, 0, modelResult.totalThicknessMm / 2);
      controlsRef.current.update();
    }
  }, [modelResult, baseColor, dotColor]);

  const handleResetCamera = (view: 'iso' | 'top' | 'front') => {
    if (!cameraRef.current || !controlsRef.current || !modelResult) return;
    const maxDim = Math.max(modelResult.widthMm, modelResult.heightMm);
    const dist = maxDim * 1.5;

    if (view === 'iso') {
      cameraRef.current.position.set(0, -dist * 0.75, dist * 0.85);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 0, dist * 1.25);
    } else if (view === 'front') {
      cameraRef.current.position.set(0, -dist * 1.2, dist * 0.25);
    }

    cameraRef.current.lookAt(0, 0, 0.5);
    controlsRef.current.target.set(0, 0, 0.5);
    controlsRef.current.update();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Contenedor del Canvas 3D */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-3xl border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
        {/* Elemento de montaje WebGL */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Indicador de carga */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs font-bold text-slate-700">Calculando geometría Braille 3D...</span>
          </div>
        )}

        {/* Insignia con medidas exactas en pantalla */}
        {modelResult && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-sm text-xs flex flex-col gap-1 text-slate-700 pointer-events-none select-none">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Dimensiones Físicas</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Largo × Ancho:</span>
              <span className="font-mono font-bold text-slate-800">
                {modelResult.widthMm} × {modelResult.heightMm} mm
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Espesor Placa:</span>
              <span className="font-mono font-bold text-blue-600">0.8 mm (Ender 3)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Letras Escritas:</span>
              <span className="font-mono font-bold text-cyan-600">
                {textMode === 'deboss' ? '-0.40 mm (Bajo Relieve)' : '+0.36 mm (Sobre Relieve)'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Relieve Braille:</span>
              <span className="font-mono font-bold text-amber-600">+0.36 mm (1.2 mm día)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Puntos Activos:</span>
              <span className="font-mono font-bold text-emerald-600">{modelResult.dotCount}</span>
            </div>
          </div>
        )}

        {/* Botones de control sobre el visor */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-sm transition active:scale-95 flex items-center justify-center ${
              autoRotate
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white'
            }`}
            title="Giro automático 360°"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleResetCamera('iso')}
            className="p-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm backdrop-blur-md transition active:scale-95"
            title="Vista en perspectiva"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleResetCamera('top')}
            className="px-2 py-1 rounded-xl bg-white/90 hover:bg-white text-[10px] font-bold text-slate-700 border border-slate-200 shadow-sm backdrop-blur-md transition active:scale-95 text-center"
            title="Vista Superior"
          >
            Cenital
          </button>

          <button
            type="button"
            onClick={() => handleResetCamera('front')}
            className="px-2 py-1 rounded-xl bg-white/90 hover:bg-white text-[10px] font-bold text-slate-700 border border-slate-200 shadow-sm backdrop-blur-md transition active:scale-95 text-center"
            title="Vista de Relieve"
          >
            Rasante
          </button>
        </div>

        {/* Guía táctil al pie del visor */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="bg-slate-900/70 text-white text-[11px] font-medium px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
            👆 Arrastra para girar en 360° · Pellizca para acercar el relieve
          </span>
        </div>
      </div>

      {/* Selector rápido de combinaciones de color para visualización y OBJ */}
      {onColorChange && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Colores (Placa + Puntos):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((p) => {
              const isSelected = baseColor === p.base && dotColor === p.dot;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => onColorChange(p.base, p.dot)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-300/50 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-400/50 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: p.base }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0 -ml-1"
                    style={{ backgroundColor: p.dot }}
                  />
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
