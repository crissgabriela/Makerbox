# 📐 Geometría Láser — Feria Científica · Liceo Bicentenario de Niñas de Maipú

Plataforma interactiva de herramientas matemáticas y geométricas desarrollada junto a **MakerBox (Facultad de Ingeniería, Universidad de Talca)** para diseñar y exportar archivos vectoriales **`.svg` a escala 1:1 en milímetros (`mm`)**, calibrados para corte y grabado en **madera MDF de 3 mm** con una cortadora láser **Creality CR-Laser Falcon 2 (10W)**.

---

## 🛠️ Herramientas Incluidas (6 Módulos Interactivos)

1. **`/fracciones` — Discos de Fracciones y Ángulos Centrales (`1/2` a `1/12`)**
   - Plato didáctico de doble capa en MDF 3 mm (`6 mm` de espesor ensamblado) + sectores circulares con holgura mecánica calibrada (`0.15`, `0.20` o `0.30 mm`) y despunte de bisectriz en el ápice central.
   - Modos de grabado: Fracción clásica, Fracción + Ángulo central (`360°/n`), Porcentaje o **Lectura Táctil Braille Inclusiva**.
2. **`/pitagoras` — Rompecabezas del Teorema de Pitágoras (Disección de Perigal)**
   - Demostración física de $a^2 + b^2 = c^2$ mediante la disección geométrica de Henry Perigal (1873): el cuadrado menor $a^2$ y los 4 cuadriláteros congruentes de $b^2$ se trasladan (sin rotar) para rellenar exactamente el cuadrado de la hipotenusa $c^2$.
   - Incluye simulador animado en tiempo real y dos formatos de fabricación (Tablero Guía Rápido o Bandeja Encajable Doble Capa).
3. **`/poligonos` — Tangram Geométrico + Laboratorio de Polígonos Regulares y Teselaciones**
   - **Modo A (Tangram):** Las 7 piezas clásicas con fracciones de área (`1/4`, `1/8`, `1/16`), área en $\text{cm}^2$ y ángulos interiores (`45°`, `90°`, `135°`) grabados.
   - **Modo B (Polígonos y Teselaciones):** Generador de polígonos regulares ($n = 3..12$) con arista común exacta para comprobar teselaciones regulares $\{3,4,6\}$, arquimedianas (`4.8.8`, Kagome `3.6.3.6`) y suma de ángulos en un vértice ($360^\circ$).
4. **`/espirografo` — Espirógrafo Matemático de Engranajes (Curvas Hipotrocoides y MCD/MCM)**
   - Genera un anillo estator dentado interior y 1 o 2 piñones planetarios con perfil cicloidal suave y resistente en MDF 3 mm, con perforaciones calibradas para lápiz (`Ø 3.2 mm`).
   - Simulador matemático en vivo que calcula $\operatorname{MCD}(Z_R, Z_g)$, $\operatorname{MCM}(Z_R, Z_g)$, cantidad de pétalos y revoluciones.
5. **`/instrumentos` — Plantilla de Dibujo Matemático y Compás de Proporción Áurea ($\Phi = 1,618$)**
   - **Regla + Transportador 180° + Esténcil de Parábola ($y=x^2$), Polígonos y Espiral de Fibonacci**, personalizable con el **nombre grabado** de cada estudiante de la Feria Científica.
   - **Compás Articulado de Proporción Áurea ($\Phi = 1,618$):** Pantógrafo de 4 barras en razón de Fibonacci (`144 / 89 / 55 mm`) con perforaciones para tornillos/remaches `M3`.
6. **`/poliamantes` — Rompecabezas Lógicos de Poliamantes: «Nueve P Puntiagudas» y «Diez Azadas»**
   - **Puzzle A (`Nueve P Puntiagudas` · Red $N=7$):** 9 pentiamantes *P* quirales (`7` derechas con punto + `2` espejadas con punto) + `1` isla triangular fija sobre cavidad de $7^2 = 49$ triángulos ($3$ huecos libres). Incluye los 3 desafíos clásicos (ignorar puntos = 18 soluciones; mostrar 9 puntos = 1 solución única; ocultar todos los puntos = 1 solución única).
   - **Puzzle B (`Diez Azadas` · Red $N=8$):** 10 hexiamantes *Azada* anidados en 5 pares $180^\circ$ sobre cavidad de $8^2 = 64$ triángulos con 8 celdas numeradas (`1..4`, dos de cada número), dejando libres los dos triángulos del reto elegido (solución única para cada número).

---

## 🔥 Parámetros Recomendados para Creality CR-Laser Falcon 2 (10W) en MDF 3 mm

Todos los archivos `.SVG` generados incluyen dimensiones exactas en `mm`, textos convertidos a curvas `<path>` cerradas (sin depender de fuentes instaladas) y 3 capas por color estándar para **LightBurn** / **Creality Falcon Design Space**:

| Capa / Color | Función | Modo LightBurn | Velocidad (`mm/min`) | Potencia | Pasadas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ⚫ **Negro (`#000000`)** | Grabado de textos, números, Braille y sellos | `Fill` (int. `0.10 mm`) | `3500 mm/min` | `45%` | `1` (Ejecutar 1°) |
| 🔵 **Azul (`#0000FF`)** | Marcado rápido de reglas, transportador y guías | `Line` | `3000 mm/min` | `40%` | `1` (Ejecutar 2°) |
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
