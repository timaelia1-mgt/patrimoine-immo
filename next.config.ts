import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance de base
  reactStrictMode: true,
  
  // Optimisations images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },
  
  // Retirer les console.log en production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimisations Next.js 16
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-separator',
      'recharts',
      'date-fns',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Config Turbopack (Next.js 16 par défaut)
  turbopack: {
    // Config vide pour silence le warning
    // Turbopack gère l'optimisation automatiquement
  },
};

export default nextConfig;