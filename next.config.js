/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
