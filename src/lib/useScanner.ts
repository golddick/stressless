'use client'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Camera scanning: native BarcodeDetector where available, ZXing fallback (iOS Safari). */
export function useScanner(video: RefObject<HTMLVideoElement | null>, onCode: (code: string) => void) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const on = useRef(onCode); on.current = onCode
  const state = useRef({ stream: null as MediaStream | null, raf: 0, controls: null as { stop: () => void } | null, last: '', lastAt: 0, running: false })

  const emit = (code: string) => {
    const s = state.current, now = Date.now()
    if (code === s.last && now - s.lastAt < 2500) return // ignore the same code seen repeatedly
    s.last = code; s.lastAt = now
    navigator.vibrate?.(40)
    on.current(code)
  }

  const stop = useCallback(() => {
    const s = state.current
    s.running = false; cancelAnimationFrame(s.raf)
    s.controls?.stop(); s.controls = null
    s.stream?.getTracks().forEach(t => t.stop()); s.stream = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    setError('')
    const el = video.current
    if (!el) return
    const s = state.current
    try {
      if ('BarcodeDetector' in window) {
        s.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        el.srcObject = s.stream
        await el.play()
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] })
        s.running = true; setActive(true)
        const tick = async () => {
          if (!s.running) return
          try { const found = await detector.detect(el); if (found[0]?.rawValue) emit(found[0].rawValue) } catch {}
          s.raf = requestAnimationFrame(tick)
        }
        tick()
      } else {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        s.running = true; setActive(true)
        s.controls = await new BrowserMultiFormatReader().decodeFromConstraints(
          { video: { facingMode: 'environment' }, audio: false }, el, (res) => { if (res) emit(res.getText()) })
      }
    } catch (e: any) {
      setActive(false)
      setError(e?.name === 'NotAllowedError'
        ? 'Camera access is blocked. Allow it in your browser settings, or type the barcode below.'
        : 'The camera could not start. You can type the barcode below instead.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video])

  useEffect(() => stop, [stop])
  return { start, stop, active, error }
}
