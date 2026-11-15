import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from '@/lib/session'
import SwRegister from '@/components/SwRegister'

export const metadata: Metadata = {
  title: 'stressless: scan, pay, walk out',
  description: 'Scan what you pick up, pay on your phone, and leave without queuing.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'stressless', statusBarStyle: 'black-translucent' }
}
export const viewport: Viewport = { themeColor: '#04110f', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
        <SwRegister />
      </body>
    </html>
  )
}
