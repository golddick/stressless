'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useData } from '@/lib/hooks'
import { api } from '@/lib/api'
import { DataTable, Modal, PageHead, StatusPill } from '@/components/ui'
import { errMsg } from '@/lib/format'

export default function Owners() {
  const { data: owners, refresh } = useData<any[]>('/api/platform/owners')
  const [form, setForm] = useState<any>(null), [error, setError] = useState('')
  async function save(e: React.FormEvent) { e.preventDefault(); try { await api('/api/platform/owners', { body: form }); setForm(null); refresh() } catch (err) { setError(errMsg(err)) } }
  async function toggle(o: any) {
    const a = o.status === 'active' ? 'suspend' : 'reactivate'
    if (confirm(`${a === 'suspend' ? 'Suspend' : 'Reactivate'} ${o.businessName}? ${a === 'suspend' ? 'Their stores will stop working immediately.' : ''}`)) { await api(`/api/platform/owners/${o.id}/${a}`, { body: {} }); refresh() }
  }
  return (
    <div>
      <PageHead title="Store owners" sub="Onboard businesses, suspend or reactivate them, or open a read-only view of their dashboard.">
        <button className="btn p" onClick={() => { setError(''); setForm({ businessName: '', name: '', email: '' }) }}>Invite owner</button>
      </PageHead>
      <DataTable rows={owners ?? []} columns={[
        { key: 'businessName', label: 'Business' }, { key: 'ownerName', label: 'Owner' }, { key: 'email', label: 'Email' }, { key: 'stores', label: 'Stores' },
        { key: 'status', label: 'Status', render: o => <StatusPill status={o.status} /> },
        { key: 'x', label: '', render: o => <div className="toolbar" style={{ margin: 0 }}><Link className="btn g sm" href={`/admin?ownerId=${o.id}`}>Support view</Link><button className={`btn sm ${o.status === 'active' ? 'd' : 'g'}`} onClick={() => toggle(o)}>{o.status === 'active' ? 'Suspend' : 'Reactivate'}</button></div> }]} />
      <Modal open={!!form} title="Invite a store owner" onClose={() => setForm(null)}>
        {form && <form onSubmit={save}>
          <label className="field">Business name<input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} required /></label>
          <label className="field">Owner&apos;s name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field">Owner&apos;s email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          {error && <p className="err">{error}</p>}
          <div className="toolbar"><button className="btn p">Send invite</button><button type="button" className="btn g" onClick={() => setForm(null)}>Cancel</button></div>
        </form>}
      </Modal>
    </div>
  )
}
