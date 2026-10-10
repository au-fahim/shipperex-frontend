import Link from "next/link";
import { PackageOpen } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link href="/" className="brand footer-brand"><span className="brand-mark"><PackageOpen size={18} /></span><span>shipper<span className="brand-dot">ex</span></span></Link>
          <p>Every parcel has a story.<br />We help it get there.</p>
        </div>
        <div className="footer-links"><span>EXPLORE</span><Link href="/#services">Services</Link><Link href="/track">Track a shipment</Link><Link href="/login">Sign in</Link></div>
        <div className="footer-note"><span>MADE FOR THE LONG WAY</span><p>Thoughtful delivery for people<br />and businesses moving forward.</p></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 ShipperEx. All rights reserved.</span><span>Moving the things that matter.</span></div>
    </footer>
  );
}
