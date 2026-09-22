# MakerBox — Repositorio de Recursos y Plataformas

Repositorio institucional de proyectos, módulos académicos y plataformas de interacción para **MakerBox** (Co Creación e Innovación — Facultad de Ingeniería, Universidad de Talca).

---

## 📂 Estructura del Repositorio

```
Makerbox/
├── index.html                  # Portal central de recursos y módulos académicos
├── lengua-de-senas/            # Plataforma de traducción de texto a Lengua de Señas para Corte Láser
│   ├── public/                 # Logos de MakerBox, UTalca y vectores de señas
│   └── src/                    # Código fuente Next.js + React 19 + Tailwind CSS
├── plataforma_maker/           # Plataforma de Solicitudes y Gestión de Impresión 3D
│   ├── public/                 # Logos de MakerBox y UTalca
│   └── src/                    # Visor 3D WebGL, Formulario de pedidos, Panel Admin y Excel
└── README.md                   # Documentación general
```

---

## 🤟 Proyecto: Plataforma de Lengua de Señas para Corte Láser

Ubicado en la subcarpeta [`lengua-de-senas/`](./lengua-de-senas/).

Diseñado especialmente para la pantalla táctil del stand demostrativo de **MakerBox** en la conmemoración del **Día de las Personas Sordas y de la Lengua de Señas**:

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

