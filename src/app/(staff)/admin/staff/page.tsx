'use client'
import { useState } from 'react'
import { useData } from '@/lib/hooks'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api'
import { DataTable, Modal, PageHead, StatusPill } from '@/components/ui'
import { errMsg } from '@/lib/format'

export default function Staff() {
  const { user } = useSession()
  const { data: staff, refresh } = useData<any[]>('/api/admin/staff')
  const { data: stores } = useData<any[]>('/api/admin/stores')
  const readOnly = user?.role === 'super_admin'
  const [form, setForm] = useState<any>(null), [error, setError] = useState('')
  const open = () => { setError(''); setForm({ name: '', email: '', role: 'exit_staff', storeIds: [] as string[] }) }
  async function save(e: React.FormEvent) { e.preventDefault(); try { await api('/api/admin/staff', { body: form }); setForm(null); refresh() } catch (err) { setError(errMsg(err)) } }
  async function remove(s: any) { if (confirm(`Remove ${s.name || s.email} from ${s.store}?`)) { await api(`/api/admin/staff/${s.userId}`, { method: 'DELETE' }); refresh() } }
  const toggle = (id: string) => setForm((f: any) => ({ ...f, storeIds: f.storeIds.includes(id) ? f.storeIds.filter((x: string) => x !== id) : [...f.storeIds, id] }))
  return (
    <div>
      <PageHead title="Staff" sub="Managers run a store. Exit staff verify passes at the door. They sign in with an email code.">{!readOnly && <button className="btn p" onClick={open}>Add staff</button>}</PageHead>
      <DataTable rows={(staff ?? []).map(s => ({ ...s, id: s.userId + s.storeId }))} columns={[
        { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role', render: s => <StatusPill status={s.role} /> }, { key: 'store', label: 'Store' },
        { key: 'x', label: '', render: s => !readOnly && <button className="btn d sm" onClick={() => remove(s)}>Remove</button> }]} />
      <Modal open={!!form} title="Add staff" onClose={() => setForm(null)}>
        {form && <form onSubmit={save}>
          <label className="field">Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field">Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="field">Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="exit_staff">Exit staff</option>{user?.role === 'owner' && <option value="manager">Store manager</option>}</select></label>
          <div className="field">Stores{stores?.map(s => <label key={s.id} className="check" style={{ margin: '2px 0' }}><input type="checkbox" checked={form.storeIds.includes(s.id)} onChange={() => toggle(s.id)} /><span>{s.name}</span></label>)}</div>
          {error && <p className="err">{error}</p>}
          <div className="toolbar"><button className="btn p" disabled={!form.storeIds.length}>Send invite</button><button type="button" className="btn g" onClick={() => setForm(null)}>Cancel</button></div>
        </form>}
      </Modal>
    </div>
  )
}
