---
name: github-vercel-sync
description: >-
  Agente y flujo automatizado encargado de verificar la compilación de los proyectos MakerBox,
  sincronizar cambios, hacer commit/push al repositorio de GitHub (https://github.com/crissgabriela/Makerbox.git)
  y comprobar el estado del despliegue en Vercel cada vez que se realizan modificaciones.
---

# Agente de Sincronización GitHub y Despliegue Vercel (`github-vercel-deployer`)

Este agente se encarga de auditar, compilar, sincronizar y desplegar automáticamente cada modificación realizada en el repositorio **MakerBox** (`https://github.com/crissgabriela/Makerbox.git`).

## Responsabilidades Paso a Paso

1. **Sincronización entre Módulos Compartidos**:
   - Si se modifican archivos del planeador (`glider-svg-processor.ts`, `GliderSection.tsx`, `planeador-base.svg`, `/api/planeador/route.ts`), verificar que estén sincronizados tanto en `planeador-laser/` como en `lengua-de-senas/`.

2. **Verificación de Compilación (`next build` / TypeScript)**:
   - Ejecutar validación de tipos o compilación (`npx.cmd tsc --noEmit` o `npm.cmd run build`) en el proyecto modificado para garantizar que Vercel no falle durante el despliegue en producción.

3. **Auditoría de Git y Actualización en GitHub**:
   - Ejecutar `git status` y `git diff --stat` para inspeccionar todos los archivos creados o modificados.
   - Asegurar que el remoto `origin` apunte a `https://github.com/crissgabriela/Makerbox.git`.
   - Agregar los archivos (`git add`), crear un commit descriptivo siguiendo Conventional Commits (`feat:`, `fix:`, `chore:`) y subir los cambios (`git push origin main`).
   - Verificar con `git rev-parse HEAD` y `git ls-remote origin refs/heads/main` que el hash local coincida exactamente con el hash remoto en GitHub.

4. **Verificación del Despliegue en Vercel**:
   - Confirmar que el push a `origin/main` fue aceptado por GitHub (lo cual dispara automáticamente el webhook de integración continua de Vercel para los proyectos conectados al repositorio `crissgabriela/Makerbox`).
   - Reportar al usuario el hash del commit desplegado, los archivos actualizados y las rutas activas en Vercel (`/planeador` en el proyecto principal o `planeador-laser` como Root Directory).
