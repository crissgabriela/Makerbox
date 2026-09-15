'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Sparkles } from 'lucide-react';
import { GeneratedLaserSvg } from '@/types';

interface Laser3DViewerProps {
  laserResult: GeneratedLaserSvg;
  isLoading?: boolean;
}

export const Laser3DViewer: React.FC<Laser3DViewerProps> = ({ laserResult, isLoading = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const meshGroupRef = useRef<THREE.Group | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);

  // Inicializar Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 1000);
    camera.position.set(0, -60, 95);
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

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.3);
    keyLight.position.set(50, 60, 80);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    fillLight.position.set(-50, -40, 50);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
    backLight.position.set(0, 50, -60);
    scene.add(backLight);

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

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
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

  // Actualizar modelo 3D cuando cambia el SVG o el acabado de madera
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !laserResult) return;

    // Eliminar grupo anterior si existe
    if (meshGroupRef.current) {
      scene.remove(meshGroupRef.current);
      meshGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      meshGroupRef.current = null;
    }

    const group = new THREE.Group();

    const totalWidth = laserResult.widthMm;
    const totalHeight = laserResult.heightMm; // 25 mm
    const thickness = 3.0; // 3 mm standard laser MDF/wood
    const endRadius = totalHeight / 2; // 12.5 mm

    const holeCenterX = 7.5;
    const holeCenterY = 12.5;
    const holeRadius = 2.25; // 4.5 mm diameter / 2

    // 1. Crear forma 2D de la cápsula con orificio
    const shape = new THREE.Shape();
    const capLeftX = endRadius;
    const capRightX = Math.max(totalWidth - endRadius, capLeftX + 1);

    shape.moveTo(capLeftX, 0);
    shape.lineTo(capRightX, 0);
    shape.absarc(capRightX, endRadius, endRadius, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(capLeftX, totalHeight);
    shape.absarc(capLeftX, endRadius, endRadius, Math.PI / 2, 3 * Math.PI / 2, false);

    // Orificio de argolla
    const holePath = new THREE.Path();
    holePath.absarc(holeCenterX, holeCenterY, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.18
    };

    const baseGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Centrar la geometría en el origen (0, 0, 0)
    baseGeometry.center();

    // Material de madera para la base
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd7ab76),
      roughness: 0.65,
      metalness: 0.05
    });

    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(baseMesh);

    // 2. Anillo metálico de llavero (argolla cromada pasando por el orificio)
    const ringTorusGeo = new THREE.TorusGeometry(6.5, 0.75, 16, 36);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.18
    });
    const ringMesh = new THREE.Mesh(ringTorusGeo, ringMaterial);
    const holeRelX = holeCenterX - totalWidth / 2;
    ringMesh.position.set(holeRelX - 2.5, 0, 0);
    ringMesh.rotation.y = Math.PI / 4;
    group.add(ringMesh);

    // 3. Crear textura grabada con los trazos láser en la cara superior
    const canvas = document.createElement('canvas');
    const scalePx = 18; // 18 px por milímetro para nitidez óptima
    canvas.width = Math.round(totalWidth * scalePx);
    canvas.height = Math.round(totalHeight * scalePx);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const img = new window.Image();
      const svgForTexture = laserResult.svgString
        .replace(/stroke="#[A-Fa-f0-9]+"/g, 'stroke="none"')
        .replace(/fill="#[A-Fa-f0-9]+"/g, 'fill="#362113"');

      const svgBlob = new Blob([svgForTexture], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const engraveTexture = new THREE.CanvasTexture(canvas);
        engraveTexture.minFilter = THREE.LinearFilter;
        engraveTexture.magFilter = THREE.LinearFilter;
        engraveTexture.needsUpdate = true;

        const planeGeo = new THREE.PlaneGeometry(totalWidth, totalHeight);
        const planeMat = new THREE.MeshStandardMaterial({
          map: engraveTexture,
          transparent: true,
          roughness: 0.85,
          metalness: 0.05,
          depthWrite: false
        });

        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.position.set(0, 0, thickness / 2 + 0.2);
        group.add(planeMesh);
      };

      img.src = url;
    }

    scene.add(group);
    meshGroupRef.current = group;

    // Centrar la cámara según el ancho del llavero
    if (cameraRef.current && controlsRef.current) {
      const maxDim = Math.max(totalWidth, totalHeight);
      const targetDist = Math.max(maxDim * 1.5, 65);
      cameraRef.current.position.set(0, -targetDist * 0.75, targetDist * 0.85);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [laserResult]);

  const handleResetCamera = (view: 'iso' | 'top' | 'front') => {
    if (!cameraRef.current || !controlsRef.current || !laserResult) return;
    const maxDim = Math.max(laserResult.widthMm, laserResult.heightMm);
    const dist = Math.max(maxDim * 1.45, 65);

    if (view === 'iso') {
      cameraRef.current.position.set(0, -dist * 0.75, dist * 0.85);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, 0, dist * 1.2);
    } else if (view === 'front') {
      cameraRef.current.position.set(0, -dist * 1.2, dist * 0.2);
    }

    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Contenedor del Canvas 3D */}
      <div className="relative w-full h-[320px] sm:h-[380px] bg-gradient-to-b from-slate-100 to-slate-200 rounded-3xl border border-slate-300 shadow-inner overflow-hidden flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-slate-700">Generando modelo 3D del llavero...</span>
          </div>
        )}

        {/* Medidas flotantes */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-200 shadow-sm text-xs flex flex-col gap-0.5 text-slate-700 pointer-events-none select-none">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Dimensiones Reales</span>
          </div>
          <span className="font-mono text-[11px] text-purple-700 font-bold">
            {laserResult.widthMm} mm × {laserResult.heightMm} mm × 3.0 mm
          </span>
          <span className="text-[10px] text-slate-500">MDF 3mm · Orificio 4.5mm</span>
        </div>

        {/* Controles flotantes */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={'p-2 rounded-xl text-xs font-semibold transition ' + (autoRotate ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
            title={autoRotate ? 'Detener rotación' : 'Girar automáticamente'}
          >
            <RotateCw className={'w-4 h-4 ' + (autoRotate ? 'animate-spin' : '')} />
          </button>
          <button
            type="button"
            onClick={() => handleResetCamera('iso')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Iso
          </button>
          <button
            type="button"
            onClick={() => handleResetCamera('top')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Plano
          </button>
          <button
            type="button"
            onClick={() => handleResetCamera('front')}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Frente
          </button>
        </div>
      </div>
    </div>
  );
};
