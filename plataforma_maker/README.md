# Plataforma de Solicitudes de Impresión 3D — MakerBox UTalca

Plataforma web institucional desarrollada para la gestión integral de trabajos de impresión 3D en **MakerBox** (Co Creación e Innovación — Facultad de Ingeniería, Universidad de Talca).

Diseñada para ser desplegada en **Vercel** con persistencia y respaldo de datos y archivos en **GitHub**, manteniendo la identidad visual oficial del laboratorio.

---

## 🚀 Características Principales

### 1. Portal Público de Solicitudes (Vía Enlace o QR)
* **Formulario Intuitivo y Progresivo**: Registro de solicitante (nombre, correo institucional o personal, WhatsApp, carrera y estamento).
* **Carga de Archivos 3D**: Admite formatos `.STL`, `.OBJ` y `.3MF` (hasta 50 MB).
* **Visor 3D Interactivo en Tiempo Real (Three.js)**:
  * Permite rotar, hacer zoom y examinar la pieza antes de enviar.
  * Selector de color del filamento para previsualizar el acabado.
  * **Cálculo automático de cotas (X, Y, Z en mm)** y alerta si excede el área de impresión (256 × 256 mm).
* **Parámetros de Fabricación**: Selección de material (PLA, PETG, TPU, Resina UV), densidad de relleno (infill), calidad de capa y observaciones especiales.
* **Comprobante y Código de Rastreo**: Generación instantánea de un código único (ej: `MBX-2026-A101`) y código QR para escanear y hacer seguimiento desde smartphones.

### 2. Panel de Control de Encargados (Staff MakerBox)
* **Acceso Protegido por PIN**: Ingreso seguro para el equipo de laboratorio (PIN por defecto: `1234`).
* **Métricas en Tiempo Real**: Conteo de solicitudes pendientes, en evaluación, en impresión, listas para retiro y cálculo acumulado de gramos de filamento.
* **Filtros y Búsqueda Dinámica**: Filtro por estado, material y búsqueda por código, solicitante o archivo.
* **Inspección 3D y Descarga Directa**: Visor 3D integrado para revisar la geometría y descarga con un solo clic del archivo original para abrir en Bambu Studio, PrusaSlicer o Cura.
* **Gestión de Máquina y Consumo**: Asignación de impresora del lab (Bambu X1C, Prusa MK4, Ender, etc.), peso en gramos y horas estimadas.
* **Comunicación en 1 Clic**:
  * 🟢 **WhatsApp Directo**: Abre chat con mensaje predefinido para avisar aprobación, inicio o retiro de la pieza.
  * 📧 **Correo Electrónico**: Abre cliente de correo con plantilla formal y detalles del trabajo.
* **Exportación a Excel (`.xlsx`)**: Descarga instantánea de la base de datos completa o filtrada en formato Excel con todas las columnas ordenadas.

### 3. Portal de Seguimiento Público
* Permite a cualquier estudiante o profesor ingresar su código de seguimiento para consultar el estado del trabajo, máquina asignada, notas del equipo técnico e indicaciones de retiro.

---

## 🛠️ Tecnologías Utilizadas

* **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
* **Estilos y Diseño**: Tailwind CSS v4 con paleta oficial MakerBox (`#46247a`, `#c72979`, `#00aeef`)
* **Gráficos 3D**: Three.js + STLLoader + OBJLoader + OrbitControls
* **Herramientas**: SheetJS (`xlsx`) para exportación Excel, `qrcode` para generación de QR y `canvas-confetti`
* **Persistencia**: GitHub REST API (Octokit) con fallback automático en memoria/local

---

## ⚙️ Variables de Entorno (Opcionales para Vercel)

Si deseas sincronizar los archivos y las solicitudes directamente con un repositorio de GitHub, configura las siguientes variables en el panel de Vercel o en un archivo `.env.local`:

```env
# GitHub Token (Personal Access Token con permisos repo / contents:write)
GITHUB_TOKEN=ghp_tuTokenAqui

# Repositorio donde se guardarán los archivos JSON y modelos 3D
GITHUB_REPO_OWNER=crissgabriela
GITHUB_REPO_NAME=Makerbox
GITHUB_BRANCH=main

# PIN de acceso para el panel administrativo (por defecto: 1234)
ADMIN_PIN=1234
```

> **Nota**: Si no se configuran variables de GitHub, la plataforma funciona al 100% en modo de demostración/local con datos precargados.

---

## 💻 Ejecución Local

```bash
cd plataforma_maker
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ☁️ Despliegue en Vercel

1. Sube los cambios a GitHub.
2. En tu cuenta de **Vercel**, crea un nuevo proyecto apuntando a tu repositorio.
3. En la sección **Root Directory**, selecciona la carpeta `plataforma_maker`.
4. (Opcional) Agrega las variables de entorno mencionadas arriba.
5. Haz clic en **Deploy**.
