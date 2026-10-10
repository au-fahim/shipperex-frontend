import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Globe2,
  HeartHandshake,
  MapPin,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteInfoPage({
  kind,
}: {
  kind: "about" | "services" | "contact";
}) {
  const content = {
    about: {
      eyebrow: "A MORE THOUGHTFUL WAY TO SEND",
      title: (
        <>
          Care travels
          <br />
          <em>farther than distance.</em>
        </>
      ),
      intro:
        "ShipperEx is built around the small but important things that move between people: documents, parcels, plans and promises.",
      icon: HeartHandshake,
      points: [
        {
          title: "The route should feel clear.",
          copy: "Know where your shipment starts, which hubs handle it, and what the next handoff means.",
        },
        {
          title: "A real person is on the other end.",
          copy: "Pickup and delivery workflows help local teams care for the parcel between each milestone.",
        },
        {
          title: "The details should stay visible.",
          copy: "A privacy-safe tracking timeline keeps customers close to progress without exposing contact details.",
        },
      ],
      cta: "Start a shipment",
      href: "/register",
    },
    services: {
      eyebrow: "DOCUMENTS, PARCELS, AND THE DISTANCE BETWEEN",
      title: (
        <>
          What matters
          <br />
          <em>gets moving.</em>
        </>
      ),
      intro:
        "ShipperEx brings booking, local hub handoffs, Stripe Checkout and status tracking together for international document and parcel shipments.",
      icon: PackageOpen,
      points: [
        {
          title: "Document shipments",
          copy: "Send important papers along an export or import route, with status updates through each stage.",
        },
        {
          title: "Parcel shipments",
          copy: "Share actual weight and package dimensions to receive a backend-calculated chargeable weight and price.",
        },
        {
          title: "International tracking",
          copy: "Use the shipment tracking number to see public progress across origin and destination hubs.",
        },
      ],
      cta: "Get a live quote",
      href: "/login",
    },
    contact: {
      eyebrow: "HERE WHEN YOU NEED A HAND",
      title: (
        <>
          Let’s get you
          <br />
          <em>back on route.</em>
        </>
      ),
      intro:
        "For a shipment update, start with its tracking number. For a booking, sign in to see your saved route, payment status and shipment timeline.",
      icon: Compass,
      points: [
        {
          title: "Following a parcel?",
          copy: "Open public tracking and enter your ShipperEx tracking number to see the latest recorded checkpoint.",
        },
        {
          title: "Booked a shipment?",
          copy: "Your dashboard shows shipment details, Stripe payment status, customer notifications and the complete timeline.",
        },
        {
          title: "Need to change a booking?",
          copy: "Unpaid shipments can be reviewed in your account. Post-payment progress is handled by the hub and courier teams.",
        },
      ],
      cta: "Sign in to your account",
      href: "/login",
    },
  }[kind];
  const Icon = content.icon;
  return (
    <main className="info-page">
      <SiteHeader />
      <section className="info-hero">
        <div className="container">
          <Link href="/" className="track-back">
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="info-hero-grid">
            <div>
              <span className="eyebrow">{content.eyebrow}</span>
              <h1>{content.title}</h1>
              <p>{content.intro}</p>
              <Link href={content.href} className="button button-coral">
                {content.cta}
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="info-illustration">
              <span className="info-illustration-orbit">
                <Globe2 size={151} strokeWidth={0.7} />
              </span>
              <span className="info-illustration-box">
                <Icon size={31} />
              </span>
              <span className="info-illustration-check">
                <Check size={14} />
              </span>
              <span className="info-illustration-label">
                <small>SHIPPEREX · EVERY STEP</small>
                <strong>
                  Good things,
                  <br />
                  going places.
                </strong>
              </span>
              <i className="info-point info-point-a" />
              <i className="info-point info-point-b" />
              <i className="info-point info-point-c" />
            </div>
          </div>
        </div>
      </section>
      <section className="info-values">
        <div className="container">
          <span className="eyebrow">THE JOURNEY SHOULD MAKE SENSE</span>
          <div className="info-value-grid">
            {content.points.map((point, index) => (
              <article key={point.title}>
                <span className="info-number">0{index + 1}</span>
                <h2>{point.title}</h2>
                <p>{point.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="info-flow">
        <div className="container">
          <div>
            <span className="eyebrow eyebrow-light">
              FROM FIRST STEP TO LAST MILE
            </span>
            <h2>
              One route.
              <br />
              <em>Fewer unknowns.</em>
            </h2>
            <p>
              Real shipment records power the customer, manager and courier
              views. Every update comes from the ShipperEx workflow.
            </p>
          </div>
          <div className="info-flow-steps">
            <span>
              <PackageOpen size={17} /> Quote & book
            </span>
            <ArrowRight size={16} />
            <span>
              <Truck size={17} /> Hub handoffs
            </span>
            <ArrowRight size={16} />
            <span>
              <PackageCheck size={17} /> Delivery update
            </span>
          </div>
        </div>
      </section>
      <section className="info-bottom">
        <div className="container">
          <span className="eyebrow">GOOD THINGS ARE GOING PLACES</span>
          <h2>
            Ready to send it
            <br />
            <em>the right way?</em>
          </h2>
          <Link href={content.href} className="button button-coral">
            {content.cta}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
