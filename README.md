# MakerBox — Repositorio de Recursos y Plataformas

Repositorio institucional de proyectos, módulos académicos y plataformas de interacción para **MakerBox** (Co Creación e Innovación — Facultad de Ingeniería, Universidad de Talca).

---

## 📂 Estructura del Repositorio

```
Makerbox/
├── index.html                  # Portal central de recursos y módulos académicos
├── planeador-laser/            # Configurador Paramétrico de Planeador SVG para Corte Láser
│   ├── public/                 # Plantilla vectorial estructurada (planeador-base.svg) y logos
│   └── src/                    # Motor vectorial (svgson + svg-path-parser), API y visor en tiempo real
├── lengua-de-senas/            # Plataforma de Fabricación Digital (Señas, Litofanía, Braille, Fracciones, Planeador)
│   ├── public/                 # Logos de MakerBox, UTalca, vectores de señas y plantilla de planeador
│   └── src/                    # Código fuente Next.js + React 19 + Tailwind CSS
├── plataforma_maker/           # Plataforma de Solicitudes y Gestión de Impresión 3D
│   ├── public/                 # Logos de MakerBox y UTalca
│   └── src/                    # Visor 3D WebGL, Formulario de pedidos, Panel Admin y Excel
└── README.md                   # Documentación general
```

---

## ✈️ Proyecto: Configurador Paramétrico de Planeador SVG (Corte Láser)

Ubicado en [`planeador-laser/`](./planeador-laser/) (y también integrado en [`lengua-de-senas/`](./lengua-de-senas/) bajo la ruta `/planeador`).

Permite a los estudiantes modificar una plantilla SVG base de un planeador de 6 piezas ajustando parámetros geométricos en tiempo real sin perder la capacidad de ensamble:

- **Entradas Paramétricas (`mm`):**
  - **Largo del fuselaje (`mm`)** — Base en PDF: `546.10 mm` (`1548 pt` / `21.5 in`)
  - **Envergadura de alas (`mm`)** — Base en PDF: `508.00 mm` (`254.00 mm` cada ala / `20 in` total)
  - **Ancho del ala (`mm`)** — Base en PDF: `76.20 mm` (`216 pt` / `3.0 in`)
  - **Espesor del material para las ranuras (`mm`) (Fijo)** — Base en PDF: `3.175 mm` (`9 pt` / `1/8 in`)
- **Motor Vectorial en Backend (`/api/planeador`):**
  - Utiliza `svgson` y `svg-path-parser` para cargar `public/templates/planeador-base.svg` y transformar por zonas los nodos de `#fuselaje`, `#ala-izquierda`, `#ala-derecha`, `#estabilizador-horizontal`, `#soporte-diedro` y `#soporte-trasero`, manteniendo **fijas e invariantes** todas las ranuras de ensamble (`3.175 mm` de ancho, `25.40 mm` de profundidad en alas, `12.70 mm` en cama del ala) y sincronizando la cama del ala en el fuselaje con el ancho del ala.

### Despliegue en Vercel:
En la configuración del proyecto en Vercel, establece **Root Directory** en `planeador-laser` (o accede directamente a `/planeador` en el despliegue de `lengua-de-senas`).

---

## 🤟 Proyecto: Plataforma de Lengua de Señas para Corte Láser

Ubicado en la subcarpeta [`lengua-de-senas/`](./lengua-de-senas/).

Diseñado especialmente para la pantalla táctil del stand demostrativo de **MakerBox** en el **Festival de Ciencia y Tecnología 2026**:

- **Teclado virtual flotante táctil** (Kiosk Mode) con teclas grandes y respuesta sonora.
- **Traducción en tiempo real** a dactilología de Lengua de Señas (A-Z y Ñ).
- **Generación de SVG unificado** para cortadora láser (corte de palabra como una sola pieza física mediante base continua o solapamiento, sin piezas sueltas).
- **Capas estándar para LightBurn y RDWorks:**
  - 🔴 **Rojo (`#FF0000`):** Corte exterior perimetral y orificio para llavero.
  - 🔵 **Azul (`#0000FF`):** Marcado vectorial de dedos y articulaciones.
  - ⚫ **Negro (`#000000`):** Grabado raster del texto legible y sello institucional.

### Ejecución local:
```bash
cd lengua-de-senas
npm install
npm run dev
```

### Despliegue en Vercel:
En la configuración del proyecto en Vercel, establece **Root Directory** en `lengua-de-senas`.

---

## 🖨️ Proyecto: Plataforma de Solicitudes de Impresión 3D

Ubicado en la subcarpeta [`plataforma_maker/`](./plataforma_maker/).

Sistema de solicitudes y gestión de fabricación digital 3D para estudiantes, docentes e investigadores:

- **Portal Público (Link o QR)**: Formulario con carga de archivos `.stl`, `.obj` y `.3mf`, **visor 3D interactivo WebGL (Three.js)** con cálculo automático de cotas y validación de cama, más generación de comprobante y código QR de seguimiento.
- **Panel Administrativo (Staff MakerBox)**: Acceso por PIN (`1234`), filtros dinámicos, métricas en tiempo real, visor 3D de inspección, descarga de archivos para slicer, contacto rápido vía WhatsApp y correo con plantillas automáticas, y **exportación a Excel (.xlsx)**.
- **Almacenamiento**: Persistencia mediante GitHub REST API (Octokit) con fallback local en memoria.

### Ejecución local:
```bash
cd plataforma_maker
npm install
npm run dev
```

### Despliegue en Vercel:
En la configuración del proyecto en Vercel, establece **Root Directory** en `plataforma_maker`.
