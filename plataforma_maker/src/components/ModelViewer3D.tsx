'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { Box, RotateCcw, AlertTriangle, Check, Layers, Eye } from 'lucide-react';

interface ModelViewer3DProps {
  file?: File | null;
  fileUrl?: string;
  previewColor?: string;
  onDimensionsCalculated?: (dimensions: { x: number; y: number; z: number }) => void;
  maxBedSizeMm?: number; // Por defecto 256mm (Bambu Lab / Prusa estándar)
  className?: string;
}

const COLOR_MAP: Record<string, number> = {
  Blanco: 0xf1f5f9,
  Negro: 0x1e293b,
  Gris: 0x64748b,
  Rojo: 0xef4444,
  Azul: 0x3b82f6,
  Naranja: 0xf97316,
  Amarillo: 0xeab308,
  Verde: 0x22c55e,
  Púrpura: 0x8b5cf6,
  Transparente: 0x93c5fd
};

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  file,
  fileUrl,
  previewColor = 'Gris',
  onDimensionsCalculated,
  maxBedSizeMm = 256,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Object3D | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState(previewColor);

  // Inicialización del Canvas Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 360;

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Cámara
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    camera.position.set(180, 180, 220);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controles orbitales
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1500;
    controls.minDistance = 20;
    controlsRef.current = controls;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(200, 300, 200);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    // Cama de impresión MakerBox (Cuadrícula 256x256 mm)
    const gridHelper = new THREE.GridHelper(maxBedSizeMm, 16, 0x46247a, 0xcbd5e1);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Bucle de animación
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 360;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [maxBedSizeMm]);

  // Manejo común para posicionar y dimensionar cualquier Object3D cargado
  const processObject = (object: THREE.Object3D) => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    // Calcular cotas
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Centrar en X y Z, y posar exactamente en Y = 0 (sobre la cama)
    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= box.min.y;

    const calculatedDims = {
      x: Math.round(size.x * 10) / 10,
      y: Math.round(size.y * 10) / 10,
      z: Math.round(size.z * 10) / 10
    };
    setDimensions(calculatedDims);
    if (onDimensionsCalculated) {
      onDimensionsCalculated(calculatedDims);
    }

    // Aplicar material estilizado a todas las mallas
    const colorHex = COLOR_MAP[selectedColor] || 0x64748b;
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.35,
          metalness: 0.1,
          transparent: selectedColor === 'Transparente',
          opacity: selectedColor === 'Transparente' ? 0.65 : 1.0
        });
      }
    });

    sceneRef.current.add(object);
    meshRef.current = object;

    // Ajustar cámara
    const maxDim = Math.max(size.x, size.y, size.z);
    const camDist = Math.max(maxDim * 2.2, 120);
    cameraRef.current.position.set(camDist * 0.8, camDist * 0.7, camDist);
    controlsRef.current.target.set(0, size.y / 2, 0);
    controlsRef.current.update();

    setIsLoading(false);
  };

  // Carga del modelo (vía File o vía URL)
  useEffect(() => {
    if (!file && !fileUrl) {
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current = null;
        setDimensions(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadSTL = (arrayBuffer: ArrayBuffer) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry);
        processObject(mesh);
      } catch (err: unknown) {
        console.error('Error parseando STL:', err);
        setError('No se pudo leer la geometría del archivo STL.');
        setIsLoading(false);
      }
    };

    const loadOBJ = (text: string) => {
      try {
        const loader = new OBJLoader();
        const obj = loader.parse(text);
        processObject(obj);
      } catch (err: unknown) {
        console.error('Error parseando OBJ:', err);
        setError('No se pudo leer la geometría del archivo OBJ.');
        setIsLoading(false);
      }
    };

    const load3MF = (arrayBuffer: ArrayBuffer) => {
      try {
        const loader = new ThreeMFLoader();
        const group = loader.parse(arrayBuffer);
        processObject(group);
      } catch (err: unknown) {
        console.error('Error parseando 3MF:', err);
        setError('No se pudo leer la geometría del archivo 3MF.');
        setIsLoading(false);
      }
    };

    if (file) {
      const fileName = file.name.toLowerCase();
      const reader = new FileReader();

      if (fileName.endsWith('.stl')) {
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            loadSTL(e.target.result);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (fileName.endsWith('.obj')) {
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            loadOBJ(e.target.result);
          }
        };
        reader.readAsText(file);
      } else if (fileName.endsWith('.3mf')) {
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            load3MF(e.target.result);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError('Formato no previsualizable en 3D (.stl, .obj, .3mf).');
        setIsLoading(false);
      }
    } else if (fileUrl) {
      const lowerUrl = fileUrl.toLowerCase();
      fetch(fileUrl)
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          if (lowerUrl.includes('.3mf')) {
            load3MF(buf);
          } else if (lowerUrl.includes('.obj')) {
            const text = new TextDecoder().decode(buf);
            loadOBJ(text);
          } else {
            loadSTL(buf);
          }
        })
        .catch(() => {
          setError('No se pudo descargar el modelo 3D para previsualización.');
          setIsLoading(false);
        });
    }
  }, [file, fileUrl, selectedColor]);

  // Actualización reactiva de color
  useEffect(() => {
    if (meshRef.current) {
      const colorHex = COLOR_MAP[selectedColor] || 0x64748b;
      meshRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).color) {
            (mesh.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
            (mesh.material as THREE.MeshStandardMaterial).transparent = selectedColor === 'Transparente';
            (mesh.material as THREE.MeshStandardMaterial).opacity = selectedColor === 'Transparente' ? 0.65 : 1.0;
          }
        }
      });
    }
  }, [selectedColor]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current || !dimensions) return;
    const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z);
    const camDist = Math.max(maxDim * 2.2, 120);
    cameraRef.current.position.set(camDist * 0.8, camDist * 0.7, camDist);
    controlsRef.current.target.set(0, dimensions.y / 2, 0);
    controlsRef.current.update();
  };

  const isExceedingBed = dimensions && (
    dimensions.x > maxBedSizeMm ||
    dimensions.y > maxBedSizeMm ||
    dimensions.z > maxBedSizeMm
  );

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner flex flex-col ${className}`}>
      
      {/* Contenedor WebGL */}
      <div ref={containerRef} className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing relative" />

      {/* Indicador de Carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-9 h-9 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-700">Analizando geometría 3D...</p>
        </div>
      )}

      {/* Mensaje de Error */}
      {error && (
        <div className="absolute inset-x-4 top-4 bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center gap-2 z-10 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de herramientas sobre el canvas */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={handleResetCamera}
          title="Centrar vista 3D"
          className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 transition active:scale-95 cursor-pointer text-xs font-bold flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Centrar</span>
        </button>
      </div>

      {/* Barra de estado inferior con cotas del modelo */}
      <div className="bg-white/95 border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        
        {dimensions ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Box className="w-4 h-4 text-purple-600" />
              <span>Dimensiones:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-800 font-semibold border border-slate-200">
                X: {dimensions.x} mm
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-800 font-semibold border border-slate-200">
                Y: {dimensions.y} mm
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-800 font-semibold border border-slate-200">
                Z: {dimensions.z} mm
              </span>
            </div>

            {isExceedingBed ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Excede cama ({maxBedSizeMm}mm)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Apto para impresora
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-500 flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>Carga un archivo .STL, .OBJ o .3MF para inspeccionar cotas y geometría.</span>
          </div>
        )}

        {/* Selector de color */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-slate-500 font-semibold text-[11px] hidden md:inline">Color vista:</span>
          {['Blanco', 'Gris', 'Negro', 'Rojo', 'Azul', 'Naranja'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                selectedColor === c ? 'ring-2 ring-purple-600 ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: c === 'Blanco' ? '#f8fafc' : c === 'Negro' ? '#1e293b' : c === 'Gris' ? '#64748b' : c === 'Rojo' ? '#ef4444' : c === 'Azul' ? '#3b82f6' : '#f97316',
                borderColor: '#cbd5e1'
              }}
              title={`Ver en ${c}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
