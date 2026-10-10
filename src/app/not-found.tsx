import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="global-error-page">
      <span>
        <Compass size={23} />
      </span>
      <strong className="notfound-code">404</strong>
      <h1>We can’t find that stop.</h1>
      <p>
        The page may have moved, or the address might be off. Let’s get you back
        on route.
      </p>
      <div>
        <Link href="/">
          <ArrowLeft size={14} /> Back to ShipperEx
        </Link>
        <Link href="/track">Track a shipment</Link>
      </div>
    </main>
  );
}
