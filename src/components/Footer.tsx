const Footer = () => {
  return (
    <footer className="site-footer glass">
      <div className="footer-grid">
        <div>
          <div className="logo">stressless</div>
          <p className="mute">Scan what you pick up, pay on your phone, and leave without queuing.</p>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="/#how">How it works</a></li>
            <li><a href="/#stores">For stores</a></li>
            <li><a href="/#trust">Trust & safety</a></li>
          </ul>
        </div>

        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="/terms">Terms & conditions</a></li>
            <li><a href="/privacy">Privacy policy</a></li>
            <li><a href="/cookies">Cookies</a></li>
          </ul>
        </div>

        <div>
          <h4>Newsletter</h4>
          <form className="newsletter-form" action="#" method="get">
            <input className="input" type="email" placeholder="Your email" aria-label="Email for newsletter" />
            <button className="btn p sm" type="submit">Subscribe</button>
          </form>
        </div>
      </div>
    </footer>
  )
}

export default Footer