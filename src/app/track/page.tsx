import {
  ArrowLeft,
  ArrowRight,
  Globe2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackingSearch } from "@/components/tracking-search";

export const metadata: Metadata = {
  title: "Track your shipment",
  description: "Follow a ShipperEx parcel by its tracking number.",
};

export default function TrackPage() {
  return (
    <main className="track-page">
      <SiteHeader />
      <section className="track-hero">
        <div className="container">
          <Link href="/" className="track-back">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <div className="track-orbit">
            <Globe2 size={170} strokeWidth={0.55} />
            <span />
            <span />
            <span />
          </div>
          <span className="eyebrow">A LITTLE CLOSER, ALREADY</span>
          <h1>
            Where is it
            <br />
            <em>on its way to?</em>
          </h1>
          <p>
            Enter the tracking number from your confirmation. We’ll show you the
            latest update and the journey so far.
          </p>
          <div className="track-lookup">
            <label htmlFor="tracking-number">TRACKING NUMBER</label>
            <TrackingSearch />
            <small>
              Find your number in your shipment confirmation or dashboard.
            </small>
          </div>
          <div className="track-privacy">
            <ShieldCheck size={15} /> Tracking shows shipment progress only.
            Personal contact details stay private.
          </div>
        </div>
      </section>
      <section className="track-steps">
        <div className="container">
          <div>
            <span>
              <PackageCheck size={18} />
            </span>
            <strong>Live updates</strong>
            <small>See the latest recorded checkpoint.</small>
          </div>
          <div>
            <span>
              <Globe2 size={18} />
            </span>
            <strong>Route visibility</strong>
            <small>Know which hub your parcel is moving through.</small>
          </div>
          <div>
            <span>
              <ArrowRight size={18} />
            </span>
            <strong>Clear next steps</strong>
            <small>Understand where the shipment goes from here.</small>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
