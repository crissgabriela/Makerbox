'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, Sun, Box, RefreshCw, ZoomIn } from 'lucide-react';

interface Lithophane3DViewerProps {
  geometry: THREE.BufferGeometry | null;
  isLoading?: boolean;
}

export const Lithophane3DViewer: React.FC<Lithophane3DViewerProps> = ({
  geometry,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frontLightRef = useRef<THREE.DirectionalLight | null>(null);
  const backLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  const [viewMode, setViewMode] = useState<'solid' | 'backlight'>('solid');
  const [autoRotate, setAutoRotate] = useState(false);

  // Inicialización de la escena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // slate-100 suave
    sceneRef.current = scene;

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 190);
    cameraRef.current = camera;

    // 3. Renderer WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls para manipular con el dedo o mouse
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 450;
    controls.minDistance = 40;
    controlsRef.current = controls;

    // 5. Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Luz frontal angular para resaltar el relieve 3D
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontLight.position.set(60, 60, 100);
    scene.add(frontLight);
    frontLightRef.current = frontLight;

    // Luz posterior potente para simulación a contraluz
    const backLight = new THREE.PointLight(0xfff3d4, 0, 300);
    backLight.position.set(0, 0, -45);
    scene.add(backLight);
    backLightRef.current = backLight;

    // Bucle de animación
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotate;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // Redimensionamiento
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 450;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Actualización de la geometría en la escena
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }

    if (geometry) {
      // Material blanco mate para simulación de filamento PLA blanco
      const material = new THREE.MeshStandardMaterial({
        color: 0xfbfbfb,
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;

      // Centrar cámara en el objeto
      if (cameraRef.current && controlsRef.current) {
        controlsRef.current.reset();
        cameraRef.current.position.set(0, 0, 190);
        cameraRef.current.lookAt(0, 0, 0);
      }
    }
  }, [geometry]);

  // Cambio de modo de iluminación (Relieve 3D vs Contraluz)
  useEffect(() => {
    if (!frontLightRef.current || !backLightRef.current || !ambientLightRef.current || !sceneRef.current) return;

    if (viewMode === 'backlight') {
      // Modo Contraluz (Efecto Litofanía iluminada)
      sceneRef.current.background = new THREE.Color(0x0f172a); // Fondo oscuro
      ambientLightRef.current.intensity = 0.15;
      frontLightRef.current.intensity = 0.1;
      backLightRef.current.intensity = 4.0; // Luz cálida trasera intensa
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xfff8ee);
        mat.roughness = 0.8;
      }
    } else {
      // Modo Plástico Blanco 3D
      sceneRef.current.background = new THREE.Color(0xf8fafc); // Fondo claro
      ambientLightRef.current.intensity = 0.65;
      frontLightRef.current.intensity = 1.3;
      backLightRef.current.intensity = 0;
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xfbfbfb);
        mat.roughness = 0.45;
      }
    }
  }, [viewMode]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0, 190);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-50">
      {/* Contenedor del canvas WebGL */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-700">Construyendo modelo 3D y generando STL...</span>
        </div>
      )}

      {/* Barra de herramientas flotante sobre el visor 3D */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* Selector de modo de iluminación */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('solid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'solid'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Relieve 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('backlight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'backlight'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-600" />
            <span>Efecto a Contraluz</span>
          </button>
        </div>

        {/* Controles de cámara */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs transition active:scale-95 ${
              autoRotate ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={autoRotate ? 'Detener rotación' : 'Rotar 360°'}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95"
            title="Centrar vista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leyenda inferior */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500 pointer-events-none">
        <span className="bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium">
          👆 Arrastra con el dedo para girar · Pellizca para zoom
        </span>
        <span className="bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-bold text-purple-700 hidden sm:inline">
          MakerBox 3D Engine · WebGL Manifold
        </span>
      </div>
    </div>
  );
};
