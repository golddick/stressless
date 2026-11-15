'use client'
import { useState } from 'react'
import { useData } from '@/lib/hooks'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api'
import { DataTable, Modal, PageHead, QrCode, StatusPill } from '@/components/ui'
import { errMsg } from '@/lib/format'

const blank = () => ({ name: '', address: '', taxRate: 7.5, hours: '08:00-21:00', active: true })

export default function Stores() {
  const { user } = useSession()
  const { data: stores, refresh } = useData<any[]>('/api/admin/stores')
  const canEdit = user?.role === 'owner'
  const [form, setForm] = useState<any>(null), [qr, setQr] = useState<any>(null), [error, setError] = useState('')
  const open = (s?: any) => { setError(''); setForm(s ? { ...s, taxRate: +(s.taxRate * 100).toFixed(2) } : blank()) }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const f = form, body = { name: f.name, address: f.address, hours: f.hours, active: f.active, taxRate: Number(f.taxRate) / 100 }
    try { await api(f.id ? `/api/admin/stores/${f.id}` : '/api/admin/stores', { method: f.id ? 'PATCH' : 'POST', body }); setForm(null); refresh() } catch (err) { setError(errMsg(err)) }
  }
  async function rotate(s: any) { if (confirm('Replace the QR code? Printed codes will stop working.')) { setQr(await api(`/api/admin/stores/${s.id}/qr`, { method: 'POST', body: {} })); refresh() } }
  const url = (s: any) => (typeof window !== 'undefined' ? `${location.origin}/store/${s.qrToken}` : '')
  return (
    <div>
      <PageHead title="Stores" sub="Hours, tax rate and the entrance QR code customers scan.">
        {canEdit && <button className="btn p" onClick={() => open()}>Add store</button>}
      </PageHead>
      <DataTable rows={stores ?? []} columns={[
        { key: 'name', label: 'Store' }, { key: 'address', label: 'Address' }, { key: 'hours', label: 'Hours' },
        { key: 'taxRate', label: 'Tax', render: s => `${(s.taxRate * 100).toFixed(1)}%` },
        { key: 'active', label: 'Status', render: s => <StatusPill status={s.active ? 'active' : 'disabled'} /> },
        { key: 'x', label: '', render: s => <div className="toolbar" style={{ margin: 0 }}><button className="btn g sm" onClick={() => setQr(s)}>Entrance QR</button>{canEdit && <button className="btn g sm" onClick={() => open(s)}>Edit</button>}</div> }]} />
      <Modal open={!!form} title={form?.id ? 'Edit store' : 'Add store'} onClose={() => setForm(null)}>
        {form && <form onSubmit={save}>
          <label className="field">Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field">Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label className="field">Opening hours<input value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></label>
          <label className="field">Tax rate (%)<input type="number" step="0.1" min="0" max="50" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /><span>Store is open for scanning</span></label>
          {error && <p className="err">{error}</p>}
          <div className="toolbar"><button className="btn p">Save</button><button type="button" className="btn g" onClick={() => setForm(null)}>Cancel</button></div>
        </form>}
      </Modal>
      <Modal open={!!qr} title={`${qr?.name} entrance QR`} onClose={() => setQr(null)}>
        {qr && <div style={{ display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
          <QrCode value={url(qr)} size={280} />
          <p className="mute" style={{ fontSize: 13, wordBreak: 'break-all' }}>{url(qr)}</p>
          <div className="toolbar"><button className="btn p" onClick={() => window.print()}>Print</button>{canEdit && <button className="btn d" onClick={() => rotate(qr)}>Replace code</button>}<button className="btn g" onClick={() => setQr(null)}>Close</button></div>
        </div>}
      </Modal>
    </div>
  )
}
