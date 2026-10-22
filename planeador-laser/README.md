# Planeador Paramétrico SVG para Corte Láser — MakerBox UTalca

Aplicación web interactiva que permite a los estudiantes modificar una plantilla vectorial SVG base de un planeador ajustando parámetros de longitud de fuselaje, envergadura de alas y ancho de ala en milímetros (`mm`), manteniendo intacta la capacidad de ensamble mecánico de sus 6 piezas.

## Parámetros Identificados en el PDF Original (`1728 × 576 pt` @ `72 pt/in`)

| Pieza / Parámetro | Dimensión en PDF (mm) | Puntos PDF (pt) | Pulgadas (in) | Comportamiento Paramétrico |
| :--- | :--- | :--- | :--- | :--- |
| **Largo del fuselaje** | `546.10 mm` | `1548.00 pt` | `21.500 in` | Escalado por zonas preservando cama de ala y cola |
| **Alto del fuselaje** | `91.31 mm` | `258.84 pt` | `3.595 in` | Fijo |
| **Envergadura total (2 alas)** | `508.00 mm` (`254.00 mm` c/u) | `1440.00 pt` (`720 pt` c/u) | `20.000 in` (`10 in` c/u) | Escalado longitudinal manteniendo ranura de raíz a `25.40 mm` |
| **Ancho del ala (cuerda)** | `76.20 mm` | `216.00 pt` | `3.000 in` | Sincronizado con la longitud de la cama superior del fuselaje |
| **Espesor de ranuras (Fijo)** | `3.175 mm` | `9.00 pt` | `0.125 in` (`1/8"`) | Bloqueado en todas las ranuras de las 6 piezas |
| **Estabilizador horizontal** | `203.26 × 50.80 mm` | `576.18 × 144.00 pt` | `8.000 × 2.000 in` | Ranura central `38.10 × 3.175 mm` y muesca `3.175 × 6.35 mm` |
| **Soporte diedro (7.5°)** | `62.17 × 19.11 mm` | `176.22 × 54.18 pt` | `2.448 × 0.753 in` | Ranura central `3.175 × 3.175 mm` |
| **Soporte trasero** | `44.45 × 11.11 mm` | `126.00 × 31.50 pt` | `1.750 × 0.438 in` | Pestaña `38.10 mm` y ranura `3.175 × 3.175 mm` |

## Ejecución Local

```bash
cd planeador-laser
npm install
npm run dev
```

## Despliegue en Vercel

En la configuración del proyecto en Vercel, establece **Root Directory** en `planeador-laser` (o accede desde `/planeador` en el despliegue de `lengua-de-senas`).
