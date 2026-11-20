/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Register «Output»: Die hinterlegten Dateien (v. a. KI-generiertes HTML) laufen
        // immer abgeschottet, auch wenn sie direkt im Tab geoeffnet werden. So kann ein
        // Script darin nie auf Anmeldung, Speicher oder Cookies der Promptmanagerin zugreifen.
        source: '/outputs/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // Alte Adresse auf den neuen Pfad umleiten.
      { source: '/ki-assistenten', destination: '/ki-tools', permanent: true },
    ]
  },
}

module.exports = nextConfig
