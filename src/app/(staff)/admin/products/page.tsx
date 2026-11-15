'use client'
import { useEffect, useMemo, useState } from 'react'
import { useData, useStoreSelect } from '@/lib/hooks'
import { useSession } from '@/lib/session'
import { api } from '@/lib/api'
import { DataTable, Modal, PageHead, StatusPill } from '@/components/ui'
import { errMsg, fmt } from '@/lib/format'

const blank = () => ({ barcode: '', name: '', price: '', category: '', ageRestricted: false, active: true, stock: '', imageFile: null as string | null })

export default function Products() {
  const { user } = useSession()
  const { stores, storeId, setStoreId } = useStoreSelect()
  const [q, setQ] = useState('')
  const query = useMemo(() => ({ q, storeId }), [q, storeId])
  const { data: products, refresh } = useData<any[]>('/api/admin/products', query)
  const readOnly = user?.role === 'super_admin'
  const [form, setForm] = useState<any>(null), [error, setError] = useState(''), [csv, setCsv] = useState<{ text: string } | null>(null), [result, setResult] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null), [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!selectedImage) return
    const preview = URL.createObjectURL(selectedImage)
    setImagePreview(preview)
    return () => {
      URL.revokeObjectURL(preview)
      setImagePreview(current => current === preview ? null : current)
    }
  }, [selectedImage])
  const edit = (p?: any) => {
    setError(''); setSelectedImage(null)
    setImagePreview(p?.imageFile && !p.imageFile.startsWith('dev://') ? p.imageFile : null)
    setForm(p ? { ...p, price: (p.priceMinor / 100).toString(), stock: p.stock ?? '' } : blank())
  }
  const closeForm = () => {
    if (saving) return
    setForm(null); setSelectedImage(null); setImagePreview(null)
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); const f = form; setError('')
    setSaving(true)
    try {
      const body: any = { barcode: f.barcode, name: f.name, priceMinor: Math.round(parseFloat(f.price) * 100), category: f.category || undefined, ageRestricted: f.ageRestricted, active: f.active, imageFile: f.imageFile }
      if (selectedImage) {
        const fd = new FormData(); fd.append('file', selectedImage)
        const uploaded = await api<{ file: string }>('/api/admin/uploads', { body: fd })
        body.imageFile = uploaded.file
      }
      if (f.stock !== '' && storeId) { body.stock = Number(f.stock); body.storeId = storeId }
      await api(f.id ? `/api/admin/products/${f.id}` : '/api/admin/products', { method: f.id ? 'PATCH' : 'POST', body })
      setForm(null); setSelectedImage(null); setImagePreview(null); refresh()
    } catch (err) { setError(errMsg(err)) } finally { setSaving(false) }
  }
  function chooseImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setError(''); setImagePreview(null); setSelectedImage(file)
  }
  async function importCsv() { try { setResult(await api('/api/admin/products/import', { body: { csv: csv!.text, storeId } })); refresh() } catch (e) { setError(errMsg(e)) } }
  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) setCsv({ text: await f.text() }) }
  return (
    <div>
      <PageHead title="Products" sub="Barcodes are unique per business. Stock is tracked per store.">
        {!readOnly && <><button className="btn g" onClick={() => { setCsv({ text: 'barcode,name,price,category,age_restricted,stock\n' }); setResult(null); setError('') }}>Import CSV</button><button className="btn p" onClick={() => edit()}>Add product</button></>}
      </PageHead>
      <div className="toolbar">
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or barcode" aria-label="Search" />
        <select className="input" value={storeId} onChange={e => setStoreId(e.target.value)} aria-label="Store">{stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      <DataTable rows={products ?? []} onRow={readOnly ? undefined : edit} columns={[
        { key: 'imageFile', label: 'Image', render: p => p.imageFile && !p.imageFile.startsWith('dev://')
          ? <img src={p.imageFile} alt={p.name} width={44} height={44} style={{ display: 'block', objectFit: 'cover', borderRadius: 8 }} />
          : <span className="mute">-</span> },
        { key: 'name', label: 'Product', render: p => <>{p.name}{p.ageRestricted && <span className="pill warn" style={{ marginLeft: 8 }}>18+</span>}</> },
        { key: 'barcode', label: 'Barcode' }, { key: 'category', label: 'Category' }, { key: 'priceMinor', label: 'Price', render: p => fmt(p.priceMinor) },
        { key: 'stock', label: 'Stock', render: p => p.stock ?? '-' }, { key: 'active', label: '', render: p => <StatusPill status={p.active ? 'active' : 'disabled'} /> }]} />
      <Modal open={!!form} title={form?.id ? 'Edit product' : 'Add product'} onClose={closeForm}>
        {form && <form onSubmit={save}>
          <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <label className="field">Barcode<input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} required inputMode="numeric" /></label>
          <label className="field">Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="field">Price (₦)<input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></label>
          <label className="field">Category<input value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
          <label className="field">Stock in selected store<input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></label>
          <label className="field">Image<input type="file" accept="image/*" onChange={chooseImage} /></label>
          {imagePreview
            ? <img src={imagePreview} alt="Product image preview" width={120} height={120} style={{ display: 'block', objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
            : <p className="mute">No product image selected.</p>}
          <label className="check"><input type="checkbox" checked={form.ageRestricted} onChange={e => setForm({ ...form, ageRestricted: e.target.checked })} /><span>Age-restricted (18+)</span></label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /><span>Active (can be scanned)</span></label>
          {error && <p className="err">{error}</p>}
          <div className="toolbar"><button className="btn p">{saving ? (selectedImage ? 'Uploading and saving...' : 'Saving...') : 'Save'}</button><button type="button" className="btn g" onClick={closeForm}>Cancel</button></div>
          </fieldset>
        </form>}
      </Modal>
      <Modal open={!!csv} title="Import products" onClose={() => setCsv(null)}>
        {csv && <>
          <p className="mute" style={{ fontSize: 14 }}>Columns: barcode, name, price (naira), category, age_restricted, stock. Stock applies to the selected store.</p>
          <label className="field">CSV file<input type="file" accept=".csv,text/csv" onChange={pickFile} /></label>
          <label className="field">Or paste CSV<textarea value={csv.text} onChange={e => setCsv({ text: e.target.value })} /></label>
          {error && <p className="err">{error}</p>}
          {result && <p className="okmsg">{result.created} created, {result.updated} updated, {result.errors.length} skipped.</p>}
          {result?.errors.map((e: any) => <div key={e.row} className="err">Row {e.row}: {e.error}</div>)}
          <div className="toolbar"><button className="btn p" onClick={importCsv}>Import</button><button className="btn g" onClick={() => setCsv(null)}>Close</button></div>
        </>}
      </Modal>
    </div>
  )
}
