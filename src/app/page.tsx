'use client'
import Link from 'next/link'
import Backdrop from '@/components/Backdrop'
import SiteNav from '@/components/SiteNav'
import { useSession } from '@/lib/session'
import Footer from '@/components/Footer'

export default function Landing() {
  const { user } = useSession()
  const start = user ? '/store' : '/login?next=/store'
  return (
    <div className="landing">
      <Backdrop />
      <SiteNav />
      <main className="wrap" id="top">
        <div className="hero">
          <div>
            <h1>Walk in. Scan. Walk out.</h1>
            <p className="lead mute">Scan what you pick up, pay on your phone, and show one QR code at the exit. No queue, no till, no waiting.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><Link className="btn p" href={user ? start : '/login?next=/store'}>Start shopping</Link><Link className="btn g" href="/signup">Create account</Link></div>
            <p className="mute" style={{ fontSize: 13, marginTop: 18 }}>Works in your browser. Add it to your home screen and it opens like an app.</p>
          </div>
          <div className="phone glass" aria-label="Preview of the stressless cart">
            <div className="screen">
              <div className="store"><span>Shopping at <b>Your store</b></span><span>Live cart</span></div>
              <div className="view" />
              <div className="row"><span>Greek yogurt</span><span className="mute">1 × ₦1,800</span></div>
              <div className="row"><span>Sourdough loaf</span><span className="mute">1 × ₦2,500</span></div>
              <div className="row"><span>Cold brew</span><span className="mute">2 × ₦1,200</span></div>
              <div className="tot"><span>Total incl. tax</span><b className="serif">₦7,150</b></div>
              <Link className="btn p block" style={{ marginTop: 12 }} href={start}>Pay in app</Link>
            </div>
          </div>
        </div>

        <div className="glass stats">
          <div className="stat2"><b className="serif">&lt; 1s</b><span>from barcode scan to item in your cart</span></div>
          <div className="stat2"><b className="serif">0</b><span>checkout queues to stand in</span></div>
          <div className="stat2"><b className="serif">1</b><span>single-use exit QR for every paid order</span></div>
          <div className="stat2"><b className="serif">100%</b><span>of payments confirmed by the server</span></div>
        </div>

        <section id="how">
          <h2 className="t">Three steps, no till.</h2><p className="sub">From the entrance to the exit, everything happens on your phone.</p>
          <div className="grid g3">
            <div className="glass card"><div className="n serif">1</div><h3>Scan the store code</h3><p className="mute">Sign in with a one-time code, then scan the QR at the entrance to start your shopping session.</p></div>
            <div className="glass card"><div className="n serif">2</div><h3>Scan as you shop</h3><p className="mute">Point your camera at a barcode and the item lands in your cart. Your total updates with every scan, tax included.</p></div>
            <div className="glass card"><div className="n serif">3</div><h3>Pay and show your pass</h3><p className="mute">Pay in the app, show your exit QR to staff, and leave. Your receipt arrives by email.</p></div>
          </div>
        </section>

        <section id="stores">
          <h2 className="t">Built for the people who run the store.</h2><p className="sub">One platform for owners with many stores, managers on the floor, and staff at the exit.</p>
          <div className="grid g2">
            <div className="glass card big"><h3 className="serif">Owners and managers</h3>
              <ul><li>Manage products, prices and stock, with CSV import</li><li>Watch live orders and review flagged ones</li><li>Run random spot checks and issue refunds</li><li>Read sales, top-product and verification reports</li><li>Get alerts for low stock and flagged orders</li></ul></div>
            <div className="glass card big"><h3 className="serif">Exit staff</h3>
              <ul><li>Scan the customer&apos;s exit pass in one tap</li><li>See the cart and paid status at a glance</li><li>Verify the order or flag a mismatch</li><li>Check ID for age-restricted items</li><li>Every action is recorded in the audit trail</li></ul></div>
          </div>
        </section>

        <section id="trust">
          <h2 className="t">Fast for shoppers. Tight for stores.</h2><p className="sub">Prices, stock and payments are decided by our server, never by the phone in your hand.</p>
          <div className="grid g3">
            <div className="glass card"><h3>Payment you can trust</h3><p className="mute">A payment counts only after a signed confirmation from the payment provider reaches our server.</p></div>
            <div className="glass card"><h3>One pass, one exit</h3><p className="mute">Each exit QR is random, tied to one paid order at one store, and works once.</p></div>
            <div className="glass card"><h3>Every owner kept apart</h3><p className="mute">Stores, products and orders are scoped to their owner, so no business sees another&apos;s data.</p></div>
          </div>
        </section>

        <div className="glass final">
          <h2 className="t">Skip the queue today.</h2><p className="sub" style={{ margin: '0 auto 28px' }}>Open the site, sign in, and scan the code at the door.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}><Link className="btn p" href={user ? start : '/login?next=/store'}>Start shopping</Link><Link className="btn g" href="/signup">Create account</Link><Link className="btn g" href="/login">Log in</Link></div>
        </div>

       
      </main>

       <Footer />
    </div>
  )
}
