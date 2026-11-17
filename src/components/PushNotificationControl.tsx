'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type PushState = 'checking' | 'unsupported' | 'off' | 'on' | 'saving'

function decodeApplicationServerKey(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0))
}

export default function PushNotificationControl() {
  const [state, setState] = useState<PushState>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported')
      return
    }

    let active = true
    navigator.serviceWorker.ready
      .then(registration => registration.pushManager.getSubscription())
      .then(subscription => {
        if (active) setState(subscription ? 'on' : 'off')
      })
      .catch((reason: unknown) => {
        if (!active) return
        console.error('Could not check push notification subscription:', reason)
        setError('Could not check push notification settings.')
        setState('off')
      })

    return () => { active = false }
  }, [])

  async function togglePush() {
    setError('')
    setState('saving')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await api('/api/push/subscriptions', {
          method: 'DELETE',
          body: { endpoint: subscription.endpoint }
        })
        await subscription.unsubscribe()
        setState('off')
        return
      }

      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Allow notifications in your browser to enable push alerts.')

      const { publicKey } = await api<{ publicKey: string | null }>('/api/push/subscriptions')
      if (!publicKey) throw new Error('Push notifications are not configured on this server.')
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(publicKey)
      })
      await api('/api/push/subscriptions', {
        method: 'POST',
        body: { subscription: newSubscription.toJSON() }
      })
      setState('on')
    } catch (reason) {
      console.error('Could not update push notification subscription:', reason)
      setError(reason instanceof Error ? reason.message : 'Could not update push notification settings.')
      setState('off')
    }
  }

  if (state === 'unsupported') return <p className="mute" style={{ fontSize: 13 }}>Push alerts aren’t supported by this browser.</p>

  return (
    <div style={{ marginTop: 14 }}>
      <button type="button" className="btn g sm" onClick={togglePush} disabled={state === 'checking' || state === 'saving'}>
        {state === 'checking' || state === 'saving'
          ? 'Please wait...'
          : state === 'on' ? 'Disable push alerts' : 'Enable push alerts'}
      </button>
      {error && <p className="err" role="alert" style={{ margin: '8px 0 0', fontSize: 13 }}>{error}</p>}
    </div>
  )
}
