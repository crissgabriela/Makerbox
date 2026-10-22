---
name: github-vercel-sync
description: >-
  Agente y flujo automatizado encargado de verificar la compilación de planeador-laser,
  hacer commit/push al repositorio de GitHub (https://github.com/crissgabriela/Makerbox.git)
  y comprobar el estado del despliegue en Vercel sin modificar lengua-de-senas ni plataforma_maker.
---

# Agente de Sincronización GitHub y Despliegue Vercel (`github-vercel-deployer`)

Este agente se encarga de auditar, compilar (`next build`), sincronizar y desplegar automáticamente cada modificación realizada en la aplicación independiente **`planeador-laser/`** dentro del repositorio **MakerBox** (`https://github.com/crissgabriela/Makerbox.git`).

## Responsabilidades Paso a Paso

1. **Aislamiento Estricto de Proyectos**:
   - **NUNCA** modificar archivos dentro de `lengua-de-senas/` ni `plataforma_maker/`.
   - Verificar con `git diff origin/main -- lengua-de-senas plataforma_maker` que ambas carpetas permanezcan intactas respecto al estado original.

2. **Verificación de Compilación Real (`npm.cmd run build`)**:
   - Ejecutar `npm.cmd run build` dentro de `planeador-laser/` para garantizar que tanto TypeScript como el empaquetado de producción de Next.js funcionen sin errores en Vercel.

3. **Auditoría de Git y Actualización en GitHub**:
   - Ejecutar `git status` y `git diff --stat`.
   - Agregar los archivos de `planeador-laser/`, hacer commit y subir a `origin/main` (`https://github.com/crissgabriela/Makerbox.git`).
   - Verificar con `git rev-parse HEAD` y `git ls-remote origin refs/heads/main` que el hash local coincida exactamente con el remoto en GitHub.
