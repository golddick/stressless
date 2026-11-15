'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { Button, Card, Field, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { errMsg } from '@/lib/format'
import { useSession } from '@/lib/session'

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileContent />
    </Suspense>
  )
}

function ProfileFallback() {
  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap page">
        <div className="card" style={{ padding: 24 }}>Loading profile...</div>
      </main>
    </>
  )
}

function ProfileContent() {
  const params = useSearchParams()
  const { refresh } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [image, setImage] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [status, setStatus] = useState<'active' | 'disabled'>('active')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const r = await api('/api/auth/profile')
        setProfile(r.user)
        setStatus(r.user.status)
        setName(r.user.name || '')
        setEmail(r.user.email || '')
        setPhone(r.user.phone || '')
        setImage(r.user.image || '')
        setAge(r.user.age == null ? '' : String(r.user.age))
        setSex(r.user.sex || '')
        setShowPasswordForm(!r.user.hasPassword)
      } catch (err) { setError(errMsg(err)) }
    }
    load()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try {
      const body: any = { name, email, phone, age: age === '' ? null : Number(age), sex: sex || null }
      if (newPassword || confirmPassword || currentPassword) {
        body.currentPassword = currentPassword || undefined
        body.newPassword = newPassword || undefined
        body.confirmPassword = confirmPassword || undefined
      }
      const r = await api('/api/auth/profile', { method: 'PATCH', body })
      await refresh()
      if (r.disabled) {
        await api('/api/auth/logout', { method: 'POST', body: {} })
        window.location.href = '/login'
        return
      }
      setProfile(r.user)
      setName(r.user.name || '')
      setEmail(r.user.email || '')
      setPhone(r.user.phone || '')
      setImage(r.user.image || '')
      setAge(r.user.age == null ? '' : String(r.user.age))
      setSex(r.user.sex || '')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setShowPasswordForm(!r.user.hasPassword)
      setSuccess(r.user.hasPassword ? 'Profile updated successfully.' : 'Password saved successfully.')
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  async function uploadProfileImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await api<{ image: string }>('/api/auth/profile/image', { method: 'POST', body: formData })
      setImage(result.image)
      setProfile((current: any) => current ? { ...current, image: result.image } : current)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const needsSetup = params.get('setup') === '1'

  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <h1 className="t">Profile</h1>
            <p className="sub" style={{ margin: 0 }}>Manage your account details, password, and security settings.</p>
          </div>
          <span className={`pill ${status === 'active' ? 'ok' : 'bad'}`} style={{ textTransform: 'capitalize' }}>{status}</span>
        </div>

        {needsSetup && profile && !profile.hasPassword && <div className=" ">Set a password to complete your account setup.</div>}

        <Card>
          <form onSubmit={save}>
            <div className="grid g2">
              <Field label="Profile image">
                <div style={{ display: 'flex', flexDirection: 'row', rowGap: 8, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {image && !image.startsWith('dev://') && <img src={image} alt="Profile" width={45} height={45} style={{ display: 'block', objectFit: 'cover', borderRadius: '100%', marginTop: 12 }} />}
                  <Input type="file" accept="image/*" onChange={uploadProfileImage} disabled={busy} />
                </div>
                {busy && <span className="mute">Uploading image...</span>}
              </Field>
              <Field label="Full name">
                <Input value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
              </Field>
              <Field label="Age">
                <Input type="number" min="0" max="130" step="1" value={age} onChange={e => setAge(e.target.value)} />
              </Field>
              <Field label="Sex">
                <select className="input" value={sex} onChange={e => setSex(e.target.value)}>
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Role">
                <Input value={profile?.role?.replace('_', ' ') ?? ''} readOnly />
              </Field>
              <Field label="Account status">
                <Input value={status} readOnly />
              </Field>
            </div>

            <div className="divider" />

            <h2 className="t" style={{ fontSize: 30, marginBottom: 12 }}>Password</h2>

            {profile?.hasPassword ? (
              <>
                {!showPasswordForm ? (
                  <Button type="button" className="btn" onClick={() => setShowPasswordForm(true)}>
                    Change password
                  </Button>
                ) : (
                  <div className="grid g2">
                    <Field label="Current password">
                      <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="Current password" />
                    </Field>
                    <div />
                    <Field label="New password">
                      <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Enter a new password" />
                    </Field>
                    <Field label="Confirm new password">
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Confirm new password" />
                    </Field>
                  </div>
                )}
              </>
            ) : (
              <div className="grid g2">
                <Field label="New password">
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Enter a new password" />
                </Field>
                <Field label="Confirm new password">
                  <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Confirm new password" />
                </Field>
              </div>
            )}

            {error && <p className="err">{error}</p>}
            {success && <p className="okmsg">{success}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
              <button type="button" className="btn d" onClick={async () => {
                if (!window.confirm('Disable your account? You will not be able to sign in again until support re-enables it.')) return
                setBusy(true); setError(''); setSuccess('')
                try {
                  const body: any = { disableAccount: true }
                  const hasPassword = !!profile?.hasPassword
                  if (hasPassword) {
                    const pwd = window.prompt('Enter your current password to disable this account:')
                    if (!pwd) { setBusy(false); return }
                    body.currentPassword = pwd
                  }
                  await api('/api/auth/profile', { method: 'PATCH', body })
                  await api('/api/auth/logout', { method: 'POST', body: {} })
                  window.location.href = '/login'
                } catch (err) { setError(errMsg(err)); setBusy(false) }
              }}>Disable account</button>
              <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
            </div>
          </form>
        </Card>
      </main>
    </>
  )
}
