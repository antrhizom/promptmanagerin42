/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Alte Adresse auf den neuen Pfad umleiten.
      { source: '/ki-assistenten', destination: '/ki-tools', permanent: true },
    ]
  },
}

module.exports = nextConfig
