import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'stressless', short_name: 'stressless', description: 'Scan, pay, walk out.',
    start_url: '/', display: 'standalone', background_color: '#04110f', theme_color: '#04110f',
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
