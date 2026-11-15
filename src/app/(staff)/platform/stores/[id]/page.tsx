'use client'
import { use, useState } from 'react'
import Link from 'next/link'
import { useData } from '@/lib/hooks'
import { api } from '@/lib/api'
import { errMsg, fdate, fmt } from '@/lib/format'
import { PageHead, StatCard, StatusPill } from '@/components/ui'

export default function PlatformStoreDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, error, refresh } = useData<any>(`/api/platform/stores/${id}`)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [saveError, setSaveError] = useState('')

  function editStore() {
    const store = data.store
    setForm({ ...store, taxRate: (store.taxRate * 100).toFixed(2) })
    setSaveError('')
    setEditing(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      await api(`/api/platform/stores/${id}`, {
        method: 'PATCH',
        body: {
          name: form.name, address: form.address, hours: form.hours,
          taxRate: Number(form.taxRate) / 100, active: form.active
        }
      })
      setEditing(false)
      await refresh()
    } catch (e) {
      setSaveError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div><PageHead title="Store details" /><p className="err">{error}</p><Link className="btn g" href="/platform/stores">Back to stores</Link></div>
  if (!data) return <div><PageHead title="Store details" sub="Loading store information…" /></div>

  const { store, sales } = data
  return (
    <div>
      <PageHead title={store.name} sub={`${store.owner} · ${store.address || 'No address provided'}`}>
        <Link className="btn g" href="/platform/stores">Back to stores</Link>
        <button className="btn p" onClick={editStore}>Edit store</button>
      </PageHead>
      <div className="grid g4" style={{ marginBottom: 22 }}>
        <StatCard value={fmt(sales.subtotalMinor)} label="Total subtotal" />
        <StatCard value={fmt(sales.taxMinor)} label="Total tax" />
        <StatCard value={fmt(sales.totalMinor)} label="Total paid" />
        <StatCard value={sales.paidOrders} label="Paid orders" />
      </div>
      <div className="glass card">
        <h2 className="t" style={{ fontSize: 30 }}>Store information</h2>
        <div className="row"><b>Business owner</b><span>{store.owner}</span></div>
        <div className="row"><b>Owner contact</b><span>{store.ownerName || '—'}{store.ownerEmail ? ` · ${store.ownerEmail}` : ''}</span></div>
        <div className="row"><b>Owner status</b><StatusPill status={store.ownerStatus} /></div>
        <div className="row"><b>Store status</b><StatusPill status={store.active ? 'active' : 'disabled'} /></div>
        <div className="row"><b>Address</b><span>{store.address || '—'}</span></div>
        <div className="row"><b>Opening hours</b><span>{store.hours || '—'}</span></div>
        <div className="row"><b>Tax rate</b><span>{(store.taxRate * 100).toFixed(2)}%</span></div>
        <div className="row"><b>Created</b><span>{fdate(store.createdAt)}</span></div>
        <div className="row"><b>All orders</b><span>{data.orderCount}</span></div>
        <div className="row"><b>Inventory records</b><span>{data.inventoryCount}</span></div>
        <div className="row"><b>Assigned staff</b><span>{data.staffCount}</span></div>
      </div>
      {editing && <div className="modal" onClick={e => { if (e.target === e.currentTarget && !saving) setEditing(false) }}>
        <div className="glass card" role="dialog" aria-modal="true" aria-label="Edit store">
          <h2 className="t" style={{ fontSize: 32 }}>Edit store</h2>
          <form onSubmit={save}>
            <label className="field">Store name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field">Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            <label className="field">Opening hours<input value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></label>
            <label className="field">Tax rate (%)<input type="number" step="0.1" min="0" max="50" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} required /></label>
            <label className="check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /><span>Store is open for scanning</span></label>
            {saveError && <p className="err">{saveError}</p>}
            <div className="toolbar">
              <button className="btn p" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn g" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  )
}
