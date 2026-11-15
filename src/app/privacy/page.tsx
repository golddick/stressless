import Backdrop from '@/components/Backdrop'
import Footer from '@/components/Footer'
import SiteNav from '@/components/SiteNav'

export default function PrivacyPage() {
  return (
    <>
      <Backdrop />
      <SiteNav />
      <main className="wrap page legal-page">
        <div className="glass card">
          <h1 className="t">Privacy policy</h1>
          <p>stressless handles personal data only to support secure sign-in, payment verification, order history, store access, and required legal compliance.</p>
          <p>We do not sell personal information. Access is restricted to the owner, designated managers, and staff for the stores involved in your activity.</p>
          <p>We keep order and security records needed to prevent fraud, verify exit passes, and protect legitimate customers and stores.</p>
        </div>
      </main>

      <Footer />
    </>
  )
}
