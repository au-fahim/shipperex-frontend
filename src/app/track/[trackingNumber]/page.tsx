import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDot,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyTracking } from "@/components/copy-tracking";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { serverBackend } from "@/lib/backend";

type PublicTracking = {
  trackingNumber: string;
  purpose?: string;
  status: string;
  direction: string;
  shipmentType: string;
  originCountry: { name: string };
  destinationCountry: { name: string };
  createdAt: string;
  updatedAt: string;
  trackingEvents: {
    status: string;
    location?: string | null;
    note?: string | null;
    createdAt: string;
  }[];
};
const labels: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID_AWAITING_ASSIGNMENT: "Payment confirmed",
  PICKUP_ASSIGNED: "Pickup assigned",
  PICKED_UP: "Picked up",
  AT_ORIGIN_HUB: "At origin hub",
  IN_TRANSIT: "In transit",
  AT_DESTINATION_HUB: "At destination hub",
  DELIVERY_ASSIGNED: "Delivery assigned",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Delivery attempt missed",
  HELD_FOR_COLLECTION: "Held for collection",
  COLLECTED_FROM_HUB: "Collected from hub",
  RETURN_BOOKED: "Return booked",
  RETURNED_TO_SENDER: "Returned to sender",
  CANCELLED: "Cancelled",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}): Promise<Metadata> {
  const { trackingNumber } = await params;
  return {
    title: `Track ${trackingNumber}`,
    description: `Latest ShipperEx tracking updates for ${trackingNumber}.`,
  };
}

export default async function TrackingResultPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  let shipment: PublicTracking | undefined;
  let message: string | undefined;
  try {
    shipment = (
      await serverBackend<PublicTracking>(
        `tracking/${encodeURIComponent(trackingNumber)}`,
      )
    ).data;
  } catch (error) {
    message =
      error instanceof Error
        ? error.message
        : "Tracking is temporarily unavailable.";
  }
  const events = shipment?.trackingEvents ?? [];
  const current = shipment?.status
    ? (labels[shipment.status] ??
      shipment.status.replaceAll("_", " ").toLowerCase())
    : "";
  return (
    <main className="track-page">
      <SiteHeader />
      <section className="track-result-section">
        <div className="container">
          <Link href="/track" className="track-back">
            <ArrowLeft size={14} /> New tracking search
          </Link>
          {shipment ? (
            <>
              <div className="result-topline">
                <span className="eyebrow">SHIPMENT PROGRESS</span>
                <span
                  className={`status-pill status-${shipment.status.toLowerCase()}`}
                >
                  {current}
                </span>
              </div>
              <div className="result-title">
                <div>
                  <h1>
                    Your parcel is{" "}
                    <em>
                      {shipment.status === "DELIVERED"
                        ? "home."
                        : "on its way."}
                    </em>
                  </h1>
                  <p>
                    Tracking number <strong>{shipment.trackingNumber}</strong>
                    <CopyTracking value={shipment.trackingNumber} />
                  </p>
                </div>
                <span className="result-package">
                  <PackageOpen size={25} />
                </span>
              </div>
              <div className="route-summary">
                <div>
                  <small>FROM</small>
                  <strong>{shipment.originCountry.name}</strong>
                </div>
                <span className="route-summary-line">
                  <i />
                  <ArrowRight size={15} />
                  <i />
                </span>
                <div>
                  <small>TO</small>
                  <strong>{shipment.destinationCountry.name}</strong>
                </div>
                <span className="route-summary-tag">
                  {shipment.shipmentType}
                </span>
              </div>
              <section className="timeline-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">THE JOURNEY SO FAR</span>
                    <h2>Shipment updates</h2>
                  </div>
                  <span className="updated-label">
                    <RefreshCw size={12} /> Updated{" "}
                    {format(new Date(shipment.updatedAt), "MMM d, h:mm a")}
                  </span>
                </div>
                {events.length ? (
                  <ol className="public-timeline">
                    {events.map((event, index) => (
                      <li
                        key={`${event.status}-${event.createdAt}`}
                        className={
                          index === events.length - 1
                            ? "is-current"
                            : "is-complete"
                        }
                      >
                        <span className="timeline-marker">
                          {index === events.length - 1 ? (
                            <CircleDot size={14} />
                          ) : (
                            <Check size={13} />
                          )}
                        </span>
                        <div>
                          <strong>
                            {labels[event.status] ??
                              event.status.replaceAll("_", " ").toLowerCase()}
                          </strong>
                          {event.location && (
                            <span className="timeline-place">
                              <MapPin size={12} />
                              {event.location}
                            </span>
                          )}
                          {event.note && <p>{event.note}</p>}
                        </div>
                        <time>
                          {format(
                            new Date(event.createdAt),
                            "MMM d, yyyy · h:mm a",
                          )}
                        </time>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="track-empty">
                    <PackageCheck size={22} />
                    <strong>Your shipment is getting ready.</strong>
                    <p>
                      Updates will appear here as it moves through the network.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="tracking-error">
              <span>
                <PackageOpen size={24} />
              </span>
              <h1>We couldn’t find that number.</h1>
              <p>
                {message ??
                  "Double-check the tracking number and try again. It may take a moment for a new shipment to appear."}
              </p>
              <Link href="/track" className="button button-coral">
                Try another number <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
