'use client'
import Link from 'next/link'
import { useState } from 'react'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { Button, Card, Field, Input } from '@/components/ui'
import Spinner from '@/components/Spinner'
import { api } from '@/lib/api'
import { useSession } from '@/lib/session'
import { errMsg, homeFor } from '@/lib/format'
import { useQueryParam } from '@/lib/hooks'

export default function LoginPage() {
  const { refresh } = useSession()
  const next = useQueryParam('next')
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const finishAuth = async (user: any) => {
    await refresh()
    const needsPassword = user.role !== 'customer' && !user.hasPassword
    const target = user.role === 'customer' && next.startsWith('/') ? next : homeFor(user.role)
    window.location.href = needsPassword ? '/profile?setup=1' : target
  }

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await api('/api/auth/login', { body: { identifier, password } })
      await finishAuth(r.user)
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api('/api/auth/otp/request', { body: { identifier } })
      setOtpSent(true)
      setError('')
      setMode('otp')
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const r = await api('/api/auth/otp/verify', { body: { identifier, code } })
      await finishAuth(r.user)
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap auth-shell">
        <Card className="auth-card">
          <h1 className="t">Log in</h1>
          <p className="sub">Use your email to get a one-time code, or Use your password to continue.</p>

          <div className="auth-tabs">
            <button type="button" className={mode === 'password' ? 'active' : ''} onClick={() => { setMode('password'); setOtpSent(false); setCode(''); setError('') }}>Password</button>
            <button type="button" className={mode === 'otp' ? 'active' : ''} onClick={() => { setMode('otp'); setOtpSent(false); setCode(''); setError('') }}>One-time code</button>
          </div>

          {mode === 'password' && (
            <form onSubmit={loginPassword}>
              <Field label="Email">
                <Input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" placeholder="you@example.com or +234..." required />
              </Field>
              <Field label="Password">
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your password" required />
              </Field>
              {error && <p className="err">{error}</p>}
              <Button type="submit" className="block" disabled={busy} aria-busy={busy}>{busy && <Spinner />}{busy ? 'Signing in...' : 'Log in'}</Button>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/forgot-password" className="mute" style={{ fontSize: 14 }}>Forgot password?</Link>
                <Link href="/signup" className="mute" style={{ fontSize: 14 }}>Create account</Link>
              </div>
            </form>
          )}

          {mode === 'otp' && (
            <>
              {!otpSent ? (
                <form onSubmit={requestOtp}>
                  <Field label="Email">
                    <Input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" placeholder="you@example.com " required />
                  </Field>
                  {/* <Field label="Your name (optional)">
                    <Input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" />
                  </Field> */}
                  {error && <p className="err">{error}</p>}
                  <Button type="submit" className="block" disabled={busy} aria-busy={busy}>{busy && <Spinner />}{busy ? 'Sending...' : 'Send code'}</Button>
                  <div style={{ marginTop: 10 }}>
                    <Link href="/forgot-password" className="mute" style={{ fontSize: 14 }}>Forgot password?</Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={verifyOtp}>
                  <Field label={`6-digit code sent to ${identifier}`}>
                    <Input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required />
                  </Field>
                  {error && <p className="err">{error}</p>}
                  <Button type="submit" className="block" disabled={busy} aria-busy={busy}>{busy && <Spinner />}{busy ? 'Checking...' : 'Verify code'}</Button>
                  <button type="button" className="btn g block" style={{ marginTop: 10 }} onClick={() => { setCode(''); setOtpSent(false); setError('') }}>Use a different email or phone</button>
                </form>
              )}
            </>
          )}
        </Card>
      </main>
    </>
  )
}
