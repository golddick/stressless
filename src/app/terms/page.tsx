import Backdrop from '@/components/Backdrop'
import Footer from '@/components/Footer'
import SiteNav from '@/components/SiteNav'

export default function TermsPage() {
  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap page legal-page">
        <div className="glass card">
          <h1 className="t">Terms & conditions</h1>
          <p>By using stressless, you agree to use the app responsibly and comply with all local laws, store policies, and payment verification rules.</p>
          <p>We provide a platform for scanning items, paying in-app, and verifying exit passes. Users are responsible for the accuracy of their entries and for interacting with stores in accordance with their own policies.</p>
          <p>Orders are considered valid only after the payment confirmation reaches our server. Store operators may refuse or flag transactions that do not meet verification standards.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
