import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['ws', '@neondatabase/serverless'],
  async headers() {
    return [
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] }
    ]
  }
}
export default config
