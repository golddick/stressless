'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/lib/hooks'
import { api } from '@/lib/api'
import { DataTable, Modal, PageHead, StatusPill } from '@/components/ui'
import { errMsg } from '@/lib/format'

export default function PlatformStores() {
  const router = useRouter()
  const { data: stores, refresh } = useData<any[]>('/api/platform/stores')
  const { data: owners } = useData<any[]>('/api/platform/owners')
  const [form, setForm] = useState<any>(null), [error, setError] = useState('')
  const open = () => { setError(''); setForm({ ownerId: owners?.[0]?.id ?? '', name: '', address: '', taxRate: 7.5, hours: '08:00-21:00' }) }
  async function save(e: React.FormEvent) { e.preventDefault(); try { await api('/api/platform/stores', { body: { ...form, taxRate: Number(form.taxRate) / 100 } }); setForm(null); refresh() } catch (err) { setError(errMsg(err)) } }
  return (
    <div>
      <PageHead title="All stores" sub="Every store on the platform."><button className="btn p" onClick={open}>Add store for an owner</button></PageHead>
      <DataTable rows={stores ?? []} onRow={s => router.push(`/platform/stores/${s.id}`)} columns={[
        { key: 'name', label: 'Store' }, { key: 'owner', label: 'Business' }, { key: 'address', label: 'Address' },
        { key: 'taxRate', label: 'Tax', render: s => `${(s.taxRate * 100).toFixed(1)}%` }, { key: 'ownerStatus', label: 'Owner status', render: s => <StatusPill status={s.ownerStatus} /> }]} />
      <Modal open={!!form} title="Add store" onClose={() => setForm(null)}>
        {form && <form onSubmit={save}>
          <label className="field">Owner<select value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })} required>{owners?.map(o => <option key={o.id} value={o.id}>{o.businessName}</option>)}</select></label>
          <label className="field">Store name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field">Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label className="field">Tax rate (%)<input type="number" step="0.1" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} /></label>
          {error && <p className="err">{error}</p>}
          <div className="toolbar"><button className="btn p">Create</button><button type="button" className="btn g" onClick={() => setForm(null)}>Cancel</button></div>
        </form>}
      </Modal>
    </div>
  )
}
