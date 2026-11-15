'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function SwRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isInstallUiDismissed, setIsInstallUiDismissed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const updateStandaloneState = () => {
      const standalone = mediaQuery.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      setIsStandalone(standalone)
    }

    updateStandaloneState()
    mediaQuery.addEventListener?.('change', updateStandaloneState)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setIsInstallUiDismissed(false)
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setInstallPrompt(null)
      setIsStandalone(true)
    }

    const onControllerChange = () => setUpdateAvailable(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service worker registered scope:', registration.scope)
        console.log('Service worker registered:', registration)
        const sw = registration.waiting
        if (sw) setUpdateAvailable(true)

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed:', error)
      })

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      mediaQuery.removeEventListener?.('change', updateStandaloneState)
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const decision = await installPrompt.userChoice
    if (decision.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const refreshApp = () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (isStandalone && !installPrompt && !updateAvailable) return null

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 80, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
      {installPrompt && !isStandalone && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(4,17,15,0.86)', color: '#f3f7f5', padding: '12px 14px', boxShadow: '0 24px 40px -22px rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(243,247,245,0.7)' }}>Install app</div>
            <button type="button" aria-label="Close install prompt" title="Close install prompt" onClick={() => {
              setInstallPrompt(null)
              setIsInstallUiDismissed(true)
            }} style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, margin: '-6px -8px -6px 0', border: 'none', borderRadius: '50%', background: 'transparent', color: '#f3f7f5', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>Keep stressless available offline and ready on your home screen.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={installApp} style={{ flex: 1, minHeight: 40, borderRadius: 999, border: 'none', background: 'linear-gradient(180deg,#f7e0aa,#e4bd6f)', color: '#2a1f08', fontWeight: 700, cursor: 'pointer' }}>Install</button>
          </div>
        </div>
      )}

      {!isStandalone && !installPrompt && !isInstallUiDismissed && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(4,17,15,0.86)', color: '#f3f7f5', padding: '10px 12px', boxShadow: '0 24px 40px -22px rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(243,247,245,0.7)' }}>App install</div>
            <button type="button" aria-label="Close install prompt" title="Close install prompt" onClick={() => setIsInstallUiDismissed(true)} style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, margin: '-6px -8px -6px 0', border: 'none', borderRadius: '50%', background: 'transparent', color: '#f3f7f5', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(243,247,245,0.82)' }}>Use your browser menu to install or remove the app.</div>
        </div>
      )}

      {updateAvailable && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(155,232,207,0.28)', background: 'rgba(6,28,25,0.9)', color: '#f3f7f5', padding: '10px 12px', boxShadow: '0 24px 40px -22px rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(155,232,207,0.9)', marginBottom: 6 }}>Update ready</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={refreshApp} style={{ flex: 1, minHeight: 38, borderRadius: 999, border: 'none', background: 'linear-gradient(180deg,#9be8cf,#70d0a5)', color: '#04110f', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
          </div>
        </div>
      )}
    </div>
  )
}
