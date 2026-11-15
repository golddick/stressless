'use client'
import { useEffect, useState } from 'react'
import { useData } from '@/lib/hooks'
import { api } from '@/lib/api'
import { PageHead } from '@/components/ui'
import { errMsg } from '@/lib/format'

export default function Settings() {
  const { data } = useData<any>('/api/platform/settings')
  const [f, setF] = useState({ spot: 10, idle: 30, tax: 7.5 }), [msg, setMsg] = useState(''), [error, setError] = useState('')
  useEffect(() => { if (data) setF({ spot: data.spot_check_rate * 100, idle: data.session_idle_minutes, tax: data.default_tax_rate * 100 }) }, [data])
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setError('')
    try { await api('/api/platform/settings', { method: 'PUT', body: { spot_check_rate: f.spot / 100, session_idle_minutes: f.idle, default_tax_rate: f.tax / 100 } }); setMsg('Saved.') } catch (err) { setError(errMsg(err)) }
  }
  return (
    <div style={{ maxWidth: 520 }}>
      <PageHead title="Settings" sub="Platform-wide defaults." />
      <form className="glass card" onSubmit={save}>
        <label className="field">Spot-check rate (% of verified exits)<input type="number" min={0} max={100} step={1} value={f.spot} onChange={e => setF({ ...f, spot: +e.target.value })} /></label>
        <label className="field">Shopping session timeout (minutes of inactivity)<input type="number" min={5} max={240} value={f.idle} onChange={e => setF({ ...f, idle: +e.target.value })} /></label>
        <label className="field">Default tax rate for new stores (%)<input type="number" min={0} max={50} step={0.1} value={f.tax} onChange={e => setF({ ...f, tax: +e.target.value })} /></label>
        {error && <p className="err">{error}</p>}{msg && <p className="okmsg">{msg}</p>}
        <button className="btn p">Save settings</button>
      </form>
    </div>
  )
}
