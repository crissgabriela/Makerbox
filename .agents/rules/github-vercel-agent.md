---
trigger: always_on
description: Regla para actualizar y verificar automáticamente los cambios en GitHub y el despliegue en Vercel tras cada modificación.
---

# Regla de Sincronización Continua con GitHub y Vercel

Cada vez que se realicen modificaciones en los archivos de la plataforma dentro de este repositorio (`https://github.com/crissgabriela/Makerbox.git`):

1. Utiliza el subagente **`github-vercel-deployer`** (o sigue el skill `github-vercel-sync`) para:
   - Verificar que la compilación y los tipos de TypeScript/Next.js no tengan errores.
   - Sincronizar los archivos entre `planeador-laser/` y `lengua-de-senas/` cuando corresponda.
   - Hacer `git add`, `git commit` y `git push origin main` hacia `https://github.com/crissgabriela/Makerbox.git`.
   - Verificar mediante `git ls-remote origin refs/heads/main` que los cambios están arriba en GitHub y listos para el despliegue automático en Vercel.
