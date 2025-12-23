import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Habilita React Strict Mode para detectar problemas
  reactStrictMode: true,

  // Output standalone para Docker
  output: 'standalone',
}

export default nextConfig
