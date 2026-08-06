/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Le RGPD interdit d'écrire une plaque dans les logs applicatifs.
  // On coupe aussi les en-têtes qui pourraient fuiter en clair.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
