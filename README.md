# MakerBox — Repositorio de Recursos y Plataformas

Repositorio institucional de proyectos, módulos académicos y plataformas de interacción para **MakerBox** (Co Creación e Innovación — Facultad de Ingeniería, Universidad de Talca).

---

## 📂 Estructura del Repositorio

```
Makerbox/
├── index.html                  # Portal central de recursos y módulos académicos
├── lengua-de-senas/            # Plataforma de traducción de texto a Lengua de Señas para Corte Láser
│   ├── public/                 # Logos de MakerBox, UTalca y vectores de señas
│   ├── src/                    # Código fuente Next.js + React 19 + Tailwind CSS
│   │   ├── app/                # Páginas y layout principal
│   │   ├── components/         # Teclado táctil, visualizador de señas, controles láser
│   │   ├── lib/                # Motor de unión de siluetas SVG y catálogo de dactilología
│   │   └── types/              # Definiciones TypeScript
│   ├── package.json            # Dependencias del proyecto
│   └── tsconfig.json           # Configuración de TypeScript
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
