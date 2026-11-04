# 📐 Geometría y Fabricación Digital Inclusiva — Feria Científica · Liceo Bicentenario de Niñas de Maipú

Plataforma interactiva desarrollada junto a **MakerBox (Facultad de Ingeniería, Universidad de Talca)** para la **Feria Científica del Liceo Bicentenario de Niñas de Maipú**, combinando herramientas de **Geometría y Matemáticas** con módulos de **Fabricación Digital Inclusiva** para exportar archivos vectoriales **`.svg` a escala 1:1 en milímetros (`mm`)** listos para cortar y grabar en **madera MDF de 3 mm** con una **Creality CR-Laser Falcon 2 (10W)**, además de modelos **`.stl` / `.zip`** listos para **impresión 3D en PLA**.

---

## 🛠️ Herramientas Incluidas (5 Módulos Interactivos)

1. **`/fracciones` — Discos de Fracciones y Ángulos Centrales (`1/2` a `1/12`)**
   - Plato didáctico de doble capa en MDF 3 mm (`6 mm` de espesor ensamblado) + sectores circulares con holgura mecánica calibrada (`0.15`, `0.20` o `0.30 mm`) y despunte de bisectriz en el ápice central.
   - Modos de grabado: Fracción clásica, Fracción + Ángulo central (`360°/n`), Porcentaje o **Lectura Táctil Braille Inclusiva**.
2. **`/poligonos` — Tangram Geométrico + Laboratorio de Polígonos Regulares y Teselaciones**
   - **Modo A (Tangram):** Las 7 piezas clásicas con fracciones de área (`1/4`, `1/8`, `1/16`), área en $\text{cm}^2$ y ángulos interiores (`45°`, `90°`, `135°`) grabados.
   - **Modo B (Polígonos y Teselaciones):** Generador de polígonos regulares ($n = 3..12$) con arista común exacta para comprobar teselaciones regulares $\{3,4,6\}$, arquimedianas (`4.8.8`, Kagome `3.6.3.6`) y suma de ángulos en un vértice ($360^\circ$).
3. **`/espirografo` — Espirógrafo Matemático de Engranajes (Curvas Hipotrocoides y MCD/MCM)**
   - Genera un anillo estator dentado interior y 1 o 2 piñones planetarios con perfil cicloidal suave y resistente en MDF 3 mm, con perforaciones calibradas para lápiz (`Ø 3.2 mm`).
   - Simulador matemático en vivo que calcula $\operatorname{MCD}(Z_R, Z_g)$, $\operatorname{MCM}(Z_R, Z_g)$, cantidad de pétalos y revoluciones.
4. **`/imagen-laser` — Imágenes Grabadas en Madera MDF y Litofanías 3D (+ Subida QR en Vivo `/subir-foto`)**
   - Recepción instantánea de fotografías desde celulares mediante **código QR en vivo** (`/subir-foto` + `/api/live-sync`).
   - **Modo Fotograbado Láser (`.SVG` / `.PNG`):** Procesamiento de luminancia, realce de bordes y tramado (Jarvis, Floyd-Steinberg, Atkinson, escala de grises) con marco y línea de corte exterior `#FF0000` para **CR-Laser Falcon 2 10W**.
   - **Modo Litofanía 3D (`.STL`):** Generación de placas y medallones translúcidos en relieve topográfico con visor WebGL de contraluz interactivo.
5. **`/llaveros` — Generador Unificado de Llaveros Inclusivos (Corte Láser `.SVG` e Impresión 3D `.STL`)**
   - **Estilo A (`Nombre + Braille Español`):** Traducción automática a celdas táctiles de 6 puntos con vista previa interactiva, exportable tanto en **Corte y Grabado Láser `.SVG` (MDF 3 mm)** como en **Impresión 3D `.STL` / `.ZIP` Multicolor**.
   - **Estilo B (`Lengua de Señas Chilena · LSCh`):** Alfabeto Manual Chileno oficial en formatos **Cápsula (`25 mm`)** y **Corazón Dúo (`60 mm`, dos nombres)** con diccionario visual interactivo, exportable tanto en **Corte Láser `.SVG` (MDF 3 mm con simulador 3D en madera)** como en **Impresión 3D en Sobre-Relieve (`.STL` monocolor y `.ZIP` bicolor para AMS)**.

---

## 🔥 Parámetros Recomendados para Creality CR-Laser Falcon 2 (10W) en MDF 3 mm

Todos los archivos `.SVG` generados incluyen dimensiones exactas en `mm`, textos convertidos a curvas `<path>` cerradas (sin depender de fuentes instaladas) y 3 capas por color estándar para **LightBurn** / **Creality Falcon Design Space**:

| Capa / Color | Función | Modo LightBurn | Velocidad (`mm/min`) | Potencia | Pasadas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⚫ **Negro (`#000000`)** | Grabado de textos, señas, Braille y sellos | `Fill` (int. `0.10 mm`) | `3500 mm/min` | `45%` | `1` (Ejecutar 1°) |
| 🔵 **Azul (`#0000FF`)** | Marcado rápido de guías, ejes y celdas | `Line` | `3000 mm/min` | `40%` | `1` (Ejecutar 2°) |
| 🔴 **Rojo (`#FF0000`)** | Corte pasante interior y perimetral MDF 3 mm | `Line` | `400 mm/min` *(o `700 mm/min` × 2)* | `95% – 100%` | `1 – 2` (Air Assist activo) |

> **Área útil validada:** `400 × 415 mm` (verificar unidades en `mm/min` en LightBurn y ajustar foco con el bloque metálico escalonado sobre la plancha de MDF de 3 mm).

---

## 🚀 Ejecución Local y Despliegue en Vercel

### Ejecución local
```bash
cd geometria-laser
npm install
npm run dev
```

### Despliegue en Vercel (Monorepo `Makerbox`)
1. Ingresa a [Vercel](https://vercel.com/) e importa el repositorio `https://github.com/crissgabriela/Makerbox.git`.
2. En **Root Directory**, selecciona **`geometria-laser`**.
3. Framework Preset: **Next.js** (detectado automáticamente).
4. Haz clic en **Deploy** (no requiere variables de entorno adicionales).
