'use client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { Button, Card, Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { errMsg } from '@/lib/format'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordFallback() {
  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap auth-shell">
        <Card className="auth-card">
          <h1 className="t">Reset password</h1>
          <p className="sub">Loading...</p>
        </Card>
      </main>
    </>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [identifier, setIdentifier] = useState(params.get('identifier') || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api('/api/auth/password/reset', { body: { identifier, code, password, confirmPassword } })
      router.push('/login')
    } catch (err) { setError(errMsg(err)); setBusy(false) }
  }

  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap auth-shell">
        <Card className="auth-card">
          <h1 className="t">Reset password</h1>
          <p className="sub">Enter the code we sent and choose a new password.</p>
          <form onSubmit={submit}>
            <Field label="Email or phone">
              <Input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" placeholder="you@example.com or +234..." required />
            </Field>
            <Field label="6-digit code">
              <Input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" required />
            </Field>
            <Field label="New password">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" placeholder="Minimum 8 characters" required />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Confirm password" required />
            </Field>
            {error && <p className="err">{error}</p>}
            <Button type="submit" className="block" disabled={busy}>{busy ? 'Resetting...' : 'Reset password'}</Button>
            <div style={{ marginTop: 10 }}>
              <Link href="/login" className="mute" style={{ fontSize: 14 }}>Back to log in</Link>
            </div>
          </form>
        </Card>
      </main>
    </>
  )
}
