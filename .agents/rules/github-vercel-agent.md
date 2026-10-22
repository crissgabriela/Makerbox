---
trigger: always_on
description: Regla para actualizar y verificar automáticamente los cambios de planeador-laser en GitHub y el despliegue en Vercel sin tocar lengua-de-senas ni plataforma_maker.
---

# Regla de Sincronización Continua con GitHub y Vercel (`planeador-laser`)

Cada vez que se realicen modificaciones en la aplicación independiente `planeador-laser/` dentro de este repositorio (`https://github.com/crissgabriela/Makerbox.git`):

1. **PROHIBIDO modificar `lengua-de-senas/` o `plataforma_maker/`**: Son proyectos independientes y no deben ser alterados.
2. Utiliza el subagente **`github-vercel-deployer`** (o sigue el skill `github-vercel-sync`) para:
   - Verificar con `npm.cmd run build` dentro de `planeador-laser/` que la compilación de producción de Next.js finalice con 0 errores.
   - Hacer `git add`, `git commit` y `git push origin main` hacia `https://github.com/crissgabriela/Makerbox.git`.
   - Verificar mediante `git ls-remote origin refs/heads/main` que los cambios están arriba en GitHub y listos para el despliegue automático en Vercel.
