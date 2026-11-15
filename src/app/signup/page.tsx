'use client'
import Link from 'next/link'
import { useState } from 'react'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { Button, Card, Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { useSession } from '@/lib/session'
import { errMsg } from '@/lib/format'
import { useQueryParam } from '@/lib/hooks'

export default function SignupPage() {
  const { refresh } = useSession()
  const next = useQueryParam('next')
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const finishAuth = async (user: any) => {
    await refresh()
    const target = next && next.startsWith('/') ? next : '/store'
    window.location.href = target
  }

  async function requestSignupCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api('/api/auth/otp/request', { body: { identifier } })
      setOtpSent(true)
      setError('')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  async function verifySignupCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await api('/api/auth/otp/verify', { body: { identifier, code, name } })
      await finishAuth(r.user)
    } catch (err) {
      setError(errMsg(err)); setBusy(false)
    }
  }

  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap auth-shell">
        <Card className="auth-card">
          <h1 className="t">Create account</h1>
          <p className="sub">Sign up with your email and confirm the code we send you.</p>

          {!otpSent ? (
            <form onSubmit={requestSignupCode}>
              <Field label="Full name (optional)">
                <Input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" />
              </Field>
              <Field label="Email ">
                <Input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" placeholder="you@example.com" required />
              </Field>
              {error && <p className="err">{error}</p>}
              <Button type="submit" className="block" disabled={busy}>{busy ? 'Sending code...' : 'Send code'}</Button>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Link href="/login" className="mute" style={{ fontSize: 14 }}>Already have an account? Log in</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={verifySignupCode}>
              <Field label={`6-digit code sent to ${identifier}`}>
                <Input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required />
              </Field>
              {error && <p className="err">{error}</p>}
              <Button type="submit" className="block" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</Button>
              <button type="button" className="btn g block" style={{ marginTop: 10 }} onClick={() => { setCode(''); setOtpSent(false); setError('') }}>Use a different email or phone</button>
            </form>
          )}
        </Card>
      </main>
    </>
  )
}
