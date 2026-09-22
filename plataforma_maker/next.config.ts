import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para permitir subida de archivos 3D de hasta 50MB en API Routes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
};

export default nextConfig;
