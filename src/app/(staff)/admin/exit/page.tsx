'use client'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { useScanner } from '@/lib/useScanner'
import { PageHead, StatusPill } from '@/components/ui'
import { errMsg, fmt } from '@/lib/format'

export default function Exit() {
  const video = useRef<HTMLVideoElement>(null)
  const [token, setToken] = useState(''), [manual, setManual] = useState(''), [look, setLook] = useState<any>(null), [note, setNote] = useState('')
  const [error, setError] = useState(''), [done, setDone] = useState<any>(null), [spot, setSpot] = useState<any>(null), [spotNote, setSpotNote] = useState('')
  const busy = useRef(false)
  const { start, error: camError } = useScanner(video, t => lookup(t))
  useEffect(() => { start() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(t: string) {
    if (busy.current) return
    busy.current = true; setError('')
    try { setLook(await api('/api/exit/lookup', { body: { token: t } })); setToken(t) } catch (e) { setError(errMsg(e)); busy.current = false }
  }
  async function decide(result: 'verified' | 'flagged') {
    setError('')
    try {
      const r = await api('/api/exit/verify', { body: { token, result, note: note || undefined } })
      setDone(r); if (r.spotCheck) setSpot({ storeId: r.storeId, orderId: r.orderId })
    } catch (e) { setError(errMsg(e)) }
  }
  async function recordSpot(outcome: 'pass' | 'fail') {
    try { await api('/api/exit/audit', { body: { ...spot, outcome, note: spotNote || undefined } }); setSpot(null); setSpotNote('') } catch (e) { setError(errMsg(e)) }
  }
  function reset() { setLook(null); setDone(null); setToken(''); setNote(''); setError(''); setManual(''); busy.current = false; setTimeout(start, 0) }
  return (
    <div style={{ maxWidth: 620 }}>
      <PageHead title="Exit verification" sub="Scan the customer's exit pass, check the cart, then verify or flag." />
      {!look ? (
        <>
          <div className="scanbox glass" style={{ maxHeight: '46vh' }}><video ref={video} playsInline muted /></div>
          {camError && <p className="err">{camError}</p>}
          <form className="toolbar" style={{ marginTop: 14 }} onSubmit={e => { e.preventDefault(); lookup(manual) }}>
            <input className="input" style={{ flex: 1 }} value={manual} onChange={e => setManual(e.target.value)} placeholder="Or paste the pass code" aria-label="Pass code" /><button className="btn g">Look up</button>
          </form>
          {error && <p className="err">{error}</p>}
        </>
      ) : (
        <div className="glass card">
          <div className="row"><b>{look.customer || 'Customer'}</b><StatusPill status={look.order.status} /></div>
          {look.order.hasAgeRestricted && <p className="pill warn">Contains age-restricted items: check ID</p>}
          {look.items.map((i: any) => <div key={i.id} className="row"><span>{i.name} × {i.quantity}{i.ageRestricted && <span className="pill warn" style={{ marginLeft: 8 }}>18+</span>}</span></div>)}
          <div className="row"><b>Paid</b><b>{fmt(look.order.totalMinor)}</b></div>
          {!done ? (
            <>
              {!look.usable ? <p className="err">This pass cannot be used (already scanned or not paid).</p>
                : <label className="field" style={{ marginTop: 12 }}>Note (needed if you flag)<input value={note} onChange={e => setNote(e.target.value)} /></label>}
              {error && <p className="err">{error}</p>}
              <div className="toolbar"><button className="btn p" disabled={!look.usable} onClick={() => decide('verified')}>Verify</button><button className="btn d" disabled={!look.usable} onClick={() => decide('flagged')}>Flag</button><button className="btn g" onClick={reset}>Cancel</button></div>
            </>
          ) : (
            <>
              <p className="okmsg">{done.result === 'verified' ? 'Verified. Customer may leave.' : 'Flagged. The store team has been notified.'}</p>
              {spot && <div className="glass card" style={{ margin: '12px 0' }}><b>Spot check</b><p className="mute" style={{ margin: '6px 0 10px' }}>Please check this customer&apos;s bag against the cart.</p>
                <label className="field">Note<input value={spotNote} onChange={e => setSpotNote(e.target.value)} /></label>
                <div className="toolbar"><button className="btn p sm" onClick={() => recordSpot('pass')}>Matches</button><button className="btn d sm" onClick={() => recordSpot('fail')}>Does not match</button></div></div>}
              <button className="btn p block" onClick={reset}>Scan next customer</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
