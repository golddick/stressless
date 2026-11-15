'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { Button, Card, Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { errMsg } from '@/lib/format'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api('/api/auth/otp/request', { body: { identifier } })
      router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`)
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap auth-shell">
        <Card className="auth-card">
          <h1 className="t">Forgot password</h1>
          <p className="sub">Enter your email and we will send a reset code.</p>
          <form onSubmit={submit}>
            <Field label="Email or phone">
              <Input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" placeholder="you@example.com " required />
            </Field>
            {error && <p className="err">{error}</p>}
            <Button type="submit" className="block" disabled={busy}>{busy ? 'Sending...' : 'Send reset code'}</Button>
            <div style={{ marginTop: 10 }}>
              <Link href="/login" className="mute" style={{ fontSize: 14 }}>Back to log in</Link>
            </div>
          </form>
        </Card>
      </main>
    </>
  )
}
