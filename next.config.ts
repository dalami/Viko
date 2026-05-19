/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      {
        protocol: 'https',
        hostname: 'nmictvyupmdzskjauzbx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com",
              "style-src 'self' 'unsafe-inline' https://*.mercadopago.com https://*.mlstatic.com",
              "img-src 'self' data: blob: https://*.mercadopago.com https://*.mlstatic.com https://*.supabase.co https://images.unsplash.com",
              "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com",
              "connect-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://*.supabase.co",
              "font-src 'self' data: https://*.mlstatic.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
