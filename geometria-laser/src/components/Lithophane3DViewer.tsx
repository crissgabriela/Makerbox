'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, Sun, Box, RefreshCw, Eye, Lightbulb } from 'lucide-react';
import { LithophaneConfig } from '@/lib/lithophaneGenerator';

interface Lithophane3DViewerProps {
  geometry: THREE.BufferGeometry | null;
  imageSource?: string;
  config?: LithophaneConfig;
  isLoading?: boolean;
}

export const Lithophane3DViewer: React.FC<Lithophane3DViewerProps> = ({
  geometry,
  imageSource,
  config,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const frontLightRef = useRef<THREE.DirectionalLight | null>(null);
  const lampGroupRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const emissiveTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const [viewMode, setViewMode] = useState<'solid' | 'backlight'>('solid');
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightIntensity, setLightIntensity] = useState<number>(1.2);

  // 1. Inicialización de la escena Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Cámara
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 0, 190);
    cameraRef.current = camera;

    // Renderer WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls para pantalla táctil y mouse
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 450;
    controls.minDistance = 40;
    controlsRef.current = controls;

    // Iluminación ambiental
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Luz frontal angular para resaltar el relieve 3D
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.25);
    frontLight.position.set(60, 60, 110);
    scene.add(frontLight);
    frontLightRef.current = frontLight;

    // ==========================================
    // LÁMPARA VIRTUAL TRASERA VISIBLE
    // ==========================================
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0, 0, -45); // Detrás del modelo

    // Ampolleta / Bombilla brillante
    const bulbGeo = new THREE.SphereGeometry(7, 24, 24);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfffaea });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    lampGroup.add(bulbMesh);

    // Núcleo incandescente
    const coreGeo = new THREE.SphereGeometry(4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    lampGroup.add(coreMesh);

    // Halo cálido resplandeciente alrededor de la ampolleta
    const auraGeo = new THREE.SphereGeometry(18, 24, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffa834,
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    lampGroup.add(auraMesh);

    // Corona exterior suave
    const coronaGeo = new THREE.SphereGeometry(32, 16, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    lampGroup.add(coronaMesh);

    // Base y cuello de la lámpara (para realismo al girar)
    const socketGeo = new THREE.CylinderGeometry(4, 5, 8, 16);
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const socketMesh = new THREE.Mesh(socketGeo, socketMat);
    socketMesh.rotation.x = Math.PI / 2;
    socketMesh.position.set(0, 0, -8);
    lampGroup.add(socketMesh);

    const rodGeo = new THREE.CylinderGeometry(2, 2, 60, 16);
    const rodMesh = new THREE.Mesh(rodGeo, socketMat);
    rodMesh.position.set(0, -35, -10);
    lampGroup.add(rodMesh);

    // Fuente de luz puntual que proyecta brillo
    const pointLight = new THREE.PointLight(0xffe299, 3.5, 350, 1.2);
    lampGroup.add(pointLight);

    lampGroup.visible = false; // Oculta en modo sólido
    scene.add(lampGroup);
    lampGroupRef.current = lampGroup;

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

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
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

  // 2. Generación de textura de simulación a contraluz basada en la imagen real
  useEffect(() => {
    if (!imageSource) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dibujar imagen original escalada
      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      const frameFraction = (config?.frameWidthMm || 3.5) / (config?.widthMm || 100);
      const framePx = Math.round(size * frameFraction);
      const cx = size / 2;
      const cy = size / 2;
      const maxR = Math.hypot(cx, cy);

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const isFrame = x < framePx || x >= size - framePx || y < framePx || y >= size - framePx;

          if (isFrame) {
            // Marco grueso y opaco que bloquea la luz
            data[idx] = 22;
            data[idx + 1] = 18;
            data[idx + 2] = 16;
            data[idx + 3] = 255;
          } else {
            // Luminancia
            let lum = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
            if (config?.invert) lum = 1 - lum;

            // Curva no lineal para transmitir luz a través del plástico
            const transmission = Math.pow(lum, 1.25);

            // Caída de luz radial desde la ampolleta central
            const dist = Math.hypot(x - cx, y - cy) / maxR;
            const radialFalloff = Math.max(0.68, 1.0 - dist * dist * 0.32);

            const brightness = transmission * radialFalloff;

            // Rampa de color cálido (luz incandescente a través de filamento PLA blanco)
            data[idx] = Math.min(255, Math.round(35 + brightness * 220));     // Rojo cálido
            data[idx + 1] = Math.min(255, Math.round(22 + brightness * 215)); // Amarillo
            data[idx + 2] = Math.min(255, Math.round(14 + brightness * 175)); // Blanco cálido
            data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = true;
      emissiveTextureRef.current = texture;

      // Si ya está en modo contraluz, actualizar material de inmediato
      if (viewMode === 'backlight' && meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveMap = texture;
        mat.needsUpdate = true;
      }
    };
    img.src = imageSource;
  }, [imageSource, config]);

  // 3. Actualización de la geometría en la escena
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }

    if (geometry) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xfbfbfb,
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshRef.current = mesh;

      // Si está en contraluz, aplicar textura
      if (viewMode === 'backlight' && emissiveTextureRef.current) {
        material.emissiveMap = emissiveTextureRef.current;
        material.emissive = new THREE.Color(0xffffff);
        material.emissiveIntensity = lightIntensity;
        material.color = new THREE.Color(0x2a221a);
        material.roughness = 0.75;
      }
    }
  }, [geometry]);

  // 4. Conmutación dinámica entre Relieve 3D y Efecto a Contraluz
  useEffect(() => {
    if (!sceneRef.current || !frontLightRef.current || !ambientLightRef.current || !lampGroupRef.current) return;

    if (viewMode === 'backlight') {
      // MODO CONTRALUZ: Habitación oscura con ampolleta brillante visible detrás
      sceneRef.current.background = new THREE.Color(0x0a0e1a); // Noche acogedora
      ambientLightRef.current.intensity = 0.2;
      frontLightRef.current.intensity = 0.12;

      // Mostrar la lámpara trasera con su brillo
      lampGroupRef.current.visible = true;

      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0x261e16); // Base oscura para que domine la luz transmitida
        mat.roughness = 0.75;
        mat.emissive = new THREE.Color(0xffffff);
        mat.emissiveIntensity = lightIntensity;
        if (emissiveTextureRef.current) {
          mat.emissiveMap = emissiveTextureRef.current;
        }
        mat.needsUpdate = true;
      }
    } else {
      // MODO SÓLIDO (Relieve 3D): Iluminación diurna de taller
      sceneRef.current.background = new THREE.Color(0xf8fafc); // Fondo claro
      ambientLightRef.current.intensity = 0.7;
      frontLightRef.current.intensity = 1.25;

      // Ocultar la lámpara trasera
      lampGroupRef.current.visible = false;

      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.color.setHex(0xfbfbfb);
        mat.roughness = 0.45;
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mat.emissiveMap = null;
        mat.needsUpdate = true;
      }
    }
  }, [viewMode, lightIntensity]);

  // Enfoque de cámara rápido
  const handleViewFront = () => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0, 190);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleViewBack = () => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0, -190);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[430px] sm:h-[500px] rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-50">
      {/* Contenedor del canvas WebGL */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Indicador de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-700">Calculando mapa de altura y luz 3D...</span>
        </div>
      )}

      {/* Barra superior flotante de herramientas */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        {/* Selector de modo: Relieve 3D vs Efecto Contraluz */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('solid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'solid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Relieve 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('backlight')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
              viewMode === 'backlight'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Efecto a Contraluz</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Controles de cámara y perspectiva */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
          {viewMode === 'backlight' && (
            <button
              type="button"
              onClick={handleViewBack}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 transition active:scale-95"
              title="Ver ampolleta detrás"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Ver Lámpara Atrás</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleViewFront}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95"
            title="Ver de frente"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Frente</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs transition active:scale-95 ${
              autoRotate ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={autoRotate ? 'Pausar rotación' : 'Rotar 360°'}
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleViewFront}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition active:scale-95"
            title="Centrar cámara"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control de intensidad de luz (solo visible en modo Contraluz) */}
      {viewMode === 'backlight' && (
        <div className="absolute top-16 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-xl text-white flex flex-col gap-2 z-10 pointer-events-auto">
          <div className="flex items-center justify-between gap-4 text-xs font-bold text-amber-300">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              Potencia de Luz:
            </span>
            <span>{Math.round(lightIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.2}
            step={0.1}
            value={lightIntensity}
            onChange={(e) => setLightIntensity(Number(e.target.value))}
            className="w-36 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Tenue</span>
            <span>Estándar</span>
            <span>Intensa</span>
          </div>
        </div>
      )}

      {/* Leyenda inferior */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] pointer-events-none">
        <span className={`px-2.5 py-1 rounded-lg border shadow-xs font-medium backdrop-blur-xs ${
          viewMode === 'backlight'
            ? 'bg-slate-900/85 text-amber-300 border-slate-700'
            : 'bg-white/85 text-slate-600 border-slate-200'
        }`}>
          👆 Arrastra con el dedo para girar 360° · ¡Gira para ver la ampolleta encendida detrás!
        </span>

        <span className={`px-2.5 py-1 rounded-lg border shadow-xs font-bold hidden sm:inline backdrop-blur-xs ${
          viewMode === 'backlight'
            ? 'bg-slate-900/85 text-amber-400 border-slate-700'
            : 'bg-white/85 text-blue-700 border-slate-200'
        }`}>
          {viewMode === 'backlight' ? '💡 Lámpara Trasera Activa (350lm)' : 'Plástico Blanco PLA 3D'}
        </span>
      </div>
    </div>
  );
};
