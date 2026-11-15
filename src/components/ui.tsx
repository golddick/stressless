'use client'
import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'

const TONE: Record<string, string> = { paid: 'ok', verified: 'ok', completed: 'ok', active: 'ok', pass: 'ok', pending_payment: 'warn', flagged: 'bad', refunded: 'warn', abandoned: '', suspended: 'bad', fail: 'bad', disabled: 'bad' }
export const StatusPill = ({ status }: { status: string }) => <span className={`pill ${TONE[status] ?? ''}`}>{status.replace('_', ' ')}</span>

export const StatCard = ({ value, label }: { value: string | number; label: string }) => (
  <div className="glass stat"><b>{value}</b><span>{label}</span></div>
)

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div><h1 className="t">{title}</h1>{sub && <p className="sub" style={{ margin: 0 }}>{sub}</p>}</div>
      <div className="toolbar" style={{ margin: 0 }}>{children}</div>
    </div>
  )
}

export interface Column<T = any> { key: string; label: string; render?: (row: T) => ReactNode }
export function DataTable<T extends Record<string, any>>({ columns, rows, onRow, empty }: { columns: Column<T>[]; rows: T[]; onRow?: (row: T) => void; empty?: string }) {
  return (
    <div className="glass tablewrap">
      <table className="tbl">
        <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className={onRow ? 'click' : ''} onClick={() => onRow?.(r)}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] as ReactNode)}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={columns.length} className="mute">{empty || 'Nothing here yet.'}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass card" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="t" style={{ fontSize: 32 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const cls = ['btn', variant === 'secondary' ? 'g' : variant === 'ghost' ? 'g' : variant === 'danger' ? 'd' : 'p', className].filter(Boolean).join(' ')
  return <button {...props} className={cls}>{children}</button>
}

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['glass card', className].filter(Boolean).join(' ')}>{children}</div>
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['input', className].filter(Boolean).join(' ')} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

export function QrCode({ value, size = 240 }: { value: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => { if (value) QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: '#04110f', light: '#ffffff' } }).then(setSrc) }, [value, size])
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} width={size} height={size} alt="QR code" style={{ borderRadius: 18, background: '#fff', padding: 8 }} /> : null
}
