/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [],
    localPatterns: [{ pathname: '/uploads/**' }],
  },
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'sharp', 'bcryptjs', 'nodemailer'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
              "frame-src https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://challenges.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
