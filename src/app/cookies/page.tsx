import Backdrop from '@/components/Backdrop'
import Footer from '@/components/Footer'
import SiteNav from '@/components/SiteNav'

export default function CookiesPage() {
  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap page legal-page">
        <div className="glass card">
          <h1 className="t">Cookies</h1>
          <p>We may use cookies and local session data to keep you signed in, remember your shopping session, and improve the app experience.</p>
          <p>The app only stores the session information required for secure authentication and cart functionality. You can sign out at any time to clear your active session.</p>
        </div>
      </main>

      <Footer /> 
    </>
  )
}
