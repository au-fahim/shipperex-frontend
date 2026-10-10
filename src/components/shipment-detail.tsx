"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  Globe2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { apiRequest } from "@/lib/api-client";
import type { Shipment } from "@/lib/backend";

type Detail = Shipment & {
  purpose?: string;
  chargeableWeightKg?: string | number;
  pickupScheduledAt?: string | null;
  senderSnapshot?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    countryName?: string;
  };
  recipientSnapshot?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    countryName?: string;
  };
  payment?: { id: string; status: string; amountUsd: string | number };
  returnShipment?: { id: string; trackingNumber: string; status: string };
  courierTasks?: {
    id: string;
    taskType: string;
    status: string;
    attemptNumber: number;
    courierProfile?: { user?: { name: string } };
  }[];
};
type Event = {
  id: string;
  status: string;
  location?: string | null;
  note?: string | null;
  createdAt: string;
};
const labels: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID_AWAITING_ASSIGNMENT: "Ready for pickup",
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
const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

export function ShipmentDetail({ id }: { id: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const shipment = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => apiRequest<Detail>(`shipments/${encodeURIComponent(id)}`),
  });
  const events = useQuery({
    queryKey: ["shipment-timeline", id],
    queryFn: () =>
      apiRequest<Event[]>(`shipments/${encodeURIComponent(id)}/timeline`),
    enabled: !!shipment.data,
  });
  const item = shipment.data?.data;
  async function checkout(targetId = id) {
    setBusy(true);
    try {
      const result = await apiRequest<{ checkoutUrl: string }>(
        `payments/${targetId}/initiate`,
        { method: "POST", body: JSON.stringify({}) },
      );
      window.location.assign(result.data.checkoutUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start Stripe checkout.",
      );
      setBusy(false);
    }
  }
  async function requestReturn() {
    setBusy(true);
    try {
      const returned = await apiRequest<Detail>(
        `shipments/${encodeURIComponent(id)}/return-orders`,
        {
          method: "POST",
          body: JSON.stringify({
            note: "Customer requested a return to sender",
          }),
        },
      );
      toast.success("Return shipment created. Continue to secure payment.");
      await cache.invalidateQueries({ queryKey: ["shipment", id] });
      await checkout(returned.data.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create the return shipment.",
      );
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    try {
      await apiRequest(`shipments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      toast.success("Shipment cancelled.");
      await cache.invalidateQueries({ queryKey: ["my-shipments"] });
      router.push("/dashboard/shipments");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel the shipment.",
      );
      setBusy(false);
    }
  }
  if (shipment.isPending)
    return (
      <div className="detail-loading">
        <span />
        <span />
        <span />
      </div>
    );
  if (shipment.isError || !item)
    return (
      <div className="dashboard-page">
        <Link href="/dashboard/shipments" className="back-workspace">
          <ArrowLeft size={14} /> All shipments
        </Link>
        <section className="content-panel">
          <div className="data-state data-error">
            <span>
              <PackageOpen size={18} />
            </span>
            <strong>Shipment details aren’t available.</strong>
            <p>
              {shipment.error?.message ??
                "Try again or return to your shipment list."}
            </p>
            <button onClick={() => shipment.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        </section>
      </div>
    );
  const from =
    item.originCountry?.name ?? item.senderSnapshot?.countryName ?? "Origin";
  const to =
    item.destinationCountry?.name ??
    item.recipientSnapshot?.countryName ??
    "Destination";
  const timeline = events.data?.data ?? [];
  const sender = item.senderSnapshot;
  const recipient = item.recipientSnapshot;
  return (
    <div className="dashboard-page shipment-detail-page">
      <Link href="/dashboard/shipments" className="back-workspace">
        <ArrowLeft size={14} /> All shipments
      </Link>
      <div className="detail-title-row">
        <div>
          <span className="eyebrow">SHIPMENT · {item.shipmentType}</span>
          <h1>{item.trackingNumber}</h1>
          <p>Created {format(new Date(item.createdAt), "MMMM d, yyyy")}</p>
        </div>
        <span className={`status-pill status-${item.status.toLowerCase()}`}>
          {labels[item.status] ??
            item.status.replaceAll("_", " ").toLowerCase()}
        </span>
      </div>
      <section className="detail-route-card">
        <div className="detail-route-head">
          <span>
            <Globe2 size={16} /> ROUTE DETAILS
          </span>
          <span>
            {item.direction} · {item.shipmentType}
          </span>
        </div>
        <div className="detail-route-main">
          <div>
            <small>FROM</small>
            <strong>{from}</strong>
            <span>{item.originHub?.name ?? sender?.city ?? "Origin hub"}</span>
          </div>
          <span className="detail-route-line">
            <i />
            <ArrowRight size={17} />
            <i />
          </span>
          <div>
            <small>TO</small>
            <strong>{to}</strong>
            <span>
              {item.destinationHub?.name ??
                recipient?.city ??
                "Destination hub"}
            </span>
          </div>
        </div>
        <div className="detail-route-meta">
          <span>
            <Box size={14} /> {item.weightKg} kg actual ·{" "}
            {item.chargeableWeightKg ?? item.weightKg} kg billable
          </span>
          <span>
            <CalendarClock size={14} /> Pickup{" "}
            {item.pickupScheduledAt
              ? format(new Date(item.pickupScheduledAt), "MMM d, yyyy · h:mm a")
              : "to be arranged"}
          </span>
        </div>
      </section>
      <div className="detail-main-grid">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">THE JOURNEY SO FAR</span>
              <h2>Shipment timeline</h2>
            </div>
            {events.isFetching && (
              <RefreshCw size={13} className="muted-spin" />
            )}
          </div>
          {events.isError ? (
            <div className="data-state data-error">
              <span>
                <Clock3 size={17} />
              </span>
              <strong>Timeline unavailable</strong>
              <p>{events.error.message}</p>
              <button onClick={() => events.refetch()}>
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          ) : timeline.length ? (
            <ol className="detail-timeline">
              {timeline.map((event, index) => (
                <li
                  key={event.id}
                  className={
                    index === timeline.length - 1 ? "is-current" : "is-complete"
                  }
                >
                  <span>
                    {index === timeline.length - 1 ? (
                      <CircleDollarSign size={13} />
                    ) : (
                      <Check size={12} />
                    )}
                  </span>
                  <div>
                    <strong>
                      {labels[event.status] ??
                        event.status.replaceAll("_", " ").toLowerCase()}
                    </strong>
                    {event.location && (
                      <small>
                        <MapPin size={11} />
                        {event.location}
                      </small>
                    )}
                    {event.note && <p>{event.note}</p>}
                  </div>
                  <time>
                    {format(new Date(event.createdAt), "MMM d · h:mm a")}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <div className="data-state">
              <span>
                <Clock3 size={17} />
              </span>
              <strong>No updates yet</strong>
              <p>Your shipment timeline will appear here.</p>
            </div>
          )}
        </section>
        <aside className="detail-aside">
          <section className="content-panel detail-payment">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PAYMENT</span>
                <h2>Shipment cost</h2>
              </div>
            </div>
            <div className="payment-total">
              <small>TOTAL · USD</small>
              <strong>{money(item.priceUsd)}</strong>
              <span>
                <i /> {item.payment?.status ?? "PENDING"}
              </span>
            </div>
            {item.status === "PENDING_PAYMENT" && (
              <div className="payment-aside-actions">
                <button
                  className="workspace-primary"
                  disabled={busy}
                  onClick={() => checkout()}
                >
                  {busy ? (
                    <LoaderCircle size={14} className="spin" />
                  ) : (
                    <>
                      <ShieldCheck size={14} /> Continue to Stripe
                    </>
                  )}
                </button>
                <ConfirmationDialog
                  title="Cancel this unpaid shipment?"
                  description="This cancels the shipment and releases its pending payment session. You cannot undo this action."
                  confirmLabel="Cancel shipment"
                  destructive
                  onConfirm={cancel}
                  trigger={
                    <button className="cancel-shipment" disabled={busy}>
                      Cancel unpaid shipment
                    </button>
                  }
                />
              </div>
            )}
            {item.returnShipment && (
              <div className="related-return">
                <span>
                  <PackageCheck size={15} />
                </span>
                <div>
                  <small>RETURN SHIPMENT</small>
                  <Link href={`/dashboard/shipments/${item.returnShipment.id}`}>
                    {item.returnShipment.trackingNumber}{" "}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </section>
          <section className="content-panel contact-summary">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">PEOPLE</span>
                <h2>Sender & recipient</h2>
              </div>
            </div>
            <div className="contact-summary-row">
              <span className="contact-summary-icon">
                <UserRound size={14} />
              </span>
              <div>
                <small>SENDER</small>
                <strong>{sender?.name ?? "—"}</strong>
                <span>{sender?.city ?? ""}</span>
              </div>
            </div>
            <div className="contact-summary-row">
              <span className="contact-summary-icon recipient-icon">
                <UserRound size={14} />
              </span>
              <div>
                <small>RECIPIENT</small>
                <strong>{recipient?.name ?? "—"}</strong>
                <span>{recipient?.city ?? ""}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
      {item.status === "HELD_FOR_COLLECTION" && !item.returnShipment && (
        <div className="return-callout">
          <span>
            <Truck size={18} />
          </span>
          <div>
            <strong>Prefer to have it sent back?</strong>
            <p>
              Create a return shipment. It uses current rates and needs a
              separate Stripe payment.
            </p>
          </div>
          <button onClick={requestReturn} disabled={busy}>
            {busy ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              "Request a return"
            )}
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
