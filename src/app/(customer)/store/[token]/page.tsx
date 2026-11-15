'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { errMsg } from '@/lib/format'

export default function StartFromQr({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const cart = useCart(), router = useRouter()
  const [error, setError] = useState('')
  useEffect(() => { cart.start({ storeToken: token }).then(() => router.replace('/scan')).catch(e => setError(errMsg(e))) }, [token]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="glass card" style={{ textAlign: 'center' }}>
      <h1 className="t">{error ? 'We could not start' : 'Starting your session...'}</h1>
      {error && <p className="err">{error}</p>}
      {error && <Link className="btn g" href="/store">Choose a store instead</Link>}
    </div>
  )
}
