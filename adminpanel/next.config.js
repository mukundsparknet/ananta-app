/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  basePath: '/admin',
  assetPrefix: '/admin',
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/admin/api/:path*',
        destination: 'http://localhost:8082/api/:path*'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
