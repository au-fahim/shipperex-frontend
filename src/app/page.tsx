import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Box, Check, CircleDot, Globe2, MapPin, PackageCheck, PackageOpen, ShieldCheck, Sparkles, Timer, Truck, Weight } from "lucide-react";
import { getSignedInHome } from "@/lib/role-guard";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrackingSearch } from "@/components/tracking-search";

const services = [
  { icon: PackageOpen, title: "Documents that matter", copy: "Contracts, certificates and the important paper trail, delivered with care.", tag: "DOCUMENTS" },
  { icon: Box, title: "Parcels, near or far", copy: "Send personal packages and business shipments across supported countries.", tag: "PARCELS" },
  { icon: CircleDot, title: "Every step, visible", copy: "Follow the journey from pickup to your recipient's door in one clear timeline.", tag: "LIVE TRACKING" },
];

export default async function HomePage() {
  const signedInHome = await getSignedInHome();
  if (signedInHome) redirect(signedInHome);

  return (
    <main className="page-shell">
      <SiteHeader sticky />
      <section className="hero-section">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-dot" /> INTERNATIONAL SHIPPING, MADE HUMAN</div>
            <h1 className="display">Good things<br />are <span>going places.</span></h1>
            <p className="hero-description">From a first hello to a world away, send what matters with confidence. We’ll keep you close to every step.</p>
            <div className="hero-actions">
              <Link className="button button-coral focus-ring" href="/register">Send a shipment <ArrowUpRight size={17} /></Link>
              <Link className="button button-quiet focus-ring" href="#how-it-works">See how it works <ArrowDownRight size={17} /></Link>
            </div>
            <div className="hero-proof"><span className="proof-icon"><ShieldCheck size={17} /></span><span>Clear pricing. Thoughtful handling. Real updates.</span></div>
          </div>
          <div className="hero-visual" aria-label="Illustration of an international shipment journey">
            <div className="visual-topline"><span><span className="live-dot" /> YOUR SHIPMENT, IN MOTION</span><span>01 — 04</span></div>
            <div className="route-art">
              <div className="map-grid" />
              <svg className="route-line" viewBox="0 0 520 250" fill="none" aria-hidden="true"><path d="M76 173 C144 35 218 220 277 111 S391 47 455 92" stroke="rgba(227,245,236,.35)" strokeWidth="2" strokeDasharray="5 8"/><path d="M76 173 C144 35 218 220 277 111 S391 47 455 92" stroke="#9ee5c9" strokeWidth="2" strokeDasharray="5 8" pathLength="1" strokeDashoffset=".38"/></svg>
              <div className="route-point origin"><span className="point-ring"><MapPin size={18} /></span><div><strong>Chattogram</strong><small>Picked up · 9:42 AM</small></div></div>
              <div className="route-point destination"><span className="point-ring point-ring-light"><MapPin size={18} /></span><div><strong>New York</strong><small>On its way</small></div></div>
              <div className="parcel-float"><PackageOpen size={25} /><span>Carefully<br />on its way</span><Sparkles size={14} /></div>
              <span className="city-label city-label-a">DHAKA</span><span className="city-label city-label-b">LONDON</span><span className="city-label city-label-c">NEW YORK</span>
            </div>
            <div className="journey-card"><div className="journey-icon"><PackageCheck size={19} /></div><div className="journey-text"><span>THE JOURNEY SO FAR</span><strong>Pickup confirmed</strong></div><div className="journey-status"><i /> Moving</div></div>
            <div className="visual-caption"><span>FROM YOUR DOOR, TO THEIRS.</span><span>EST. 2026</span></div>
          </div>
        </div>
        <div className="container hero-bottom"><span>BUILT AROUND THE MOMENTS THAT MATTER</span><Link href="/track">Already sent something? Track it <ArrowRight size={14} /></Link></div>
      </section>

      <section className="tracking-strip" aria-labelledby="tracking-title">
        <div className="container tracking-strip-inner">
          <div><span className="eyebrow">A LITTLE CLOSER, ALREADY</span><h2 id="tracking-title">Know where it is.<br /><em>Feel good about where it’s going.</em></h2></div>
          <div className="tracking-box"><label htmlFor="tracking-number">YOUR TRACKING NUMBER</label><TrackingSearch /><p>No number yet? <Link href="/login">Sign in to see your shipments <ArrowUpRight size={13} /></Link></p></div>
          <div className="strip-mark"><Globe2 size={74} strokeWidth={.8} /><span>ACROSS<br />THE DISTANCE</span></div>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">A BETTER WAY TO SEND</span><h2 className="section-title">Made for the things<br />you <em>can’t leave behind.</em></h2></div><p>Whether it’s a signed page or a box full of care, the details matter. We keep the process simple, and the journey in sight.</p></div>
          <div className="service-grid">{services.map(({ icon: Icon, title, copy, tag }, i) => <article className="service-card" key={title}><div className={`service-art service-art-${i + 1}`}><Icon size={27} strokeWidth={1.6} /><span>{String(i + 1).padStart(2, "0")}</span></div><div className="service-tag">{tag}</div><h3>{title}</h3><p>{copy}</p><Link href={i === 2 ? "/track" : "/register"} aria-label={`${title}: learn more`} className="round-arrow"><ArrowUpRight size={17} /></Link></article>)}</div>
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div className="container how-grid"><div className="how-intro"><span className="eyebrow eyebrow-light">A CLEARER KIND OF JOURNEY</span><h2 className="section-title">Three steps.<br />A little less <em>worry.</em></h2><p>We’ve taken the complicated bits out of sending something far. Here’s all it takes.</p><Link href="/register" className="button button-light focus-ring">Start a shipment <ArrowUpRight size={16} /></Link></div><div className="steps-list"><div className="step-row"><div className="step-number">01</div><div className="step-icon"><Weight size={19} /></div><div><h3>Tell us what you’re sending</h3><p>Choose a route, add the parcel details and see your price before you book.</p></div></div><div className="step-row"><div className="step-number">02</div><div className="step-icon"><Truck size={19} /></div><div><h3>We’ll pick it up and move it along</h3><p>Local teams handle your shipment as it travels hub to hub.</p></div></div><div className="step-row"><div className="step-number">03</div><div className="step-icon"><PackageCheck size={19} /></div><div><h3>Follow along until it arrives</h3><p>Get a clear timeline and meaningful updates all the way through.</p></div></div></div></div></section>

      <section className="closing-section"><div className="container closing-inner"><div className="closing-badge"><Timer size={16} /> READY WHEN YOU ARE</div><h2>Some things are worth<br />sending <em>the right way.</em></h2><p>Start with a quick quote. Your shipment’s journey begins there.</p><Link href="/register" className="button button-coral focus-ring">Let’s get it moving <ArrowUpRight size={17} /></Link><div className="closing-decoration" aria-hidden="true"><span /><span /><span /></div></div></section>
      <SiteFooter />
    </main>
  );
}
