'use client'
import { useMemo } from 'react'
import { useData, useStoreSelect } from '@/lib/hooks'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api'
import { DataTable, PageHead } from '@/components/ui'

export default function Inventory() {
  const { user } = useSession()
  const { stores, storeId, setStoreId } = useStoreSelect()
  const query = useMemo(() => (storeId ? { storeId } : undefined), [storeId])
  const { data: rows, refresh } = useData<any[]>(storeId ? '/api/admin/inventory' : null, query)
  const readOnly = user?.role === 'super_admin'
  const low = (r: any) => (r.quantity ?? 0) <= (r.lowStockThreshold ?? 5)
  async function patch(r: any, body: object) { await api('/api/admin/inventory', { method: 'PATCH', body: { storeId, productId: r.productId, ...body } }); refresh() }
  function setStock(r: any) { const v = window.prompt('Set stock to', String(r.quantity ?? 0)); if (v !== null && v.trim() !== '' && !isNaN(+v)) patch(r, { quantity: Math.max(0, Math.floor(+v)) }) }
  return (
    <div>
      <PageHead title="Inventory" sub="Stock drops automatically when an order is paid. Low-stock alerts go to owners and managers.">
        <select className="input" value={storeId} onChange={e => setStoreId(e.target.value)} aria-label="Store">{stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </PageHead>
      <DataTable rows={(rows ?? []).map(r => ({ ...r, id: r.productId }))} columns={[
        { key: 'imageFile', label: 'Image', render: r => r.imageFile && !r.imageFile.startsWith('dev://')
          ? <img src={r.imageFile} alt={r.name} width={44} height={44} style={{ display: 'block', objectFit: 'cover', borderRadius: 8 }} />
          : <span className="mute">-</span> },
        { key: 'name', label: 'Product' }, { key: 'barcode', label: 'Barcode' },
        { key: 'quantity', label: 'In stock', render: r => <span style={{ color: low(r) ? 'var(--bad)' : undefined }}>{r.quantity ?? 0}</span> },
        { key: 'lowStockThreshold', label: 'Alert at', render: r => r.lowStockThreshold ?? 5 },
        { key: 'x', label: '', render: r => !readOnly && <div className="toolbar" style={{ margin: 0 }}>
          <button className="btn g sm" onClick={() => patch(r, { delta: -1 })}>−1</button><button className="btn g sm" onClick={() => patch(r, { delta: 1 })}>+1</button>
          <button className="btn g sm" onClick={() => patch(r, { delta: 10 })}>+10</button><button className="btn g sm" onClick={() => setStock(r)}>Set</button></div> }]} />
    </div>
  )
}
