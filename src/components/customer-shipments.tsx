"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  CircleDollarSign,
  LoaderCircle,
  PackageOpen,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";
import type { ApiEnvelope, Shipment } from "@/lib/backend";

const statuses = [
  { value: "", label: "All statuses" },
  { value: "PENDING_PAYMENT", label: "Awaiting payment" },
  { value: "PAID_AWAITING_ASSIGNMENT", label: "Ready for pickup" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DELIVERY_FAILED", label: "Delivery issue" },
  { value: "HELD_FOR_COLLECTION", label: "Ready for collection" },
];
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
  HELD_FOR_COLLECTION: "Ready for collection",
  COLLECTED_FROM_HUB: "Collected",
  RETURN_BOOKED: "Return booked",
  RETURNED_TO_SENDER: "Returned to sender",
  CANCELLED: "Cancelled",
};
const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

function ShipmentItem({
  shipment,
  onPay,
}: {
  shipment: Shipment;
  onPay: (shipment: Shipment) => void;
}) {
  const destination =
    shipment.direction === "EXPORT"
      ? shipment.destinationCountry?.name
      : shipment.originCountry?.name;
  return (
    <article className="shipment-list-card">
      <Link
        href={`/dashboard/shipments/${shipment.id}`}
        className="shipment-list-main"
      >
        <span className="shipment-list-icon">
          <PackageOpen size={18} />
        </span>
        <span className="shipment-list-copy">
          <strong>
            {destination
              ? `${shipment.direction === "EXPORT" ? "Going to" : "Coming from"} ${destination}`
              : `${shipment.shipmentType.toLowerCase()} shipment`}
          </strong>
          <small>
            {shipment.trackingNumber}
            <i />
            {shipment.shipmentType.toLowerCase()}
            <i />
            {format(new Date(shipment.createdAt), "MMM d, yyyy")}
          </small>
        </span>
      </Link>
      <span className={`status-pill status-${shipment.status.toLowerCase()}`}>
        {labels[shipment.status] ??
          shipment.status.replaceAll("_", " ").toLowerCase()}
      </span>
      <strong className="shipment-list-price">
        {money(shipment.priceUsd)}
      </strong>
      {shipment.status === "PENDING_PAYMENT" ? (
        <button className="pay-pending" onClick={() => onPay(shipment)}>
          <CircleDollarSign size={14} /> Pay securely
        </button>
      ) : (
        <Link
          href={`/dashboard/shipments/${shipment.id}`}
          className="shipment-open"
          aria-label={`Open ${shipment.trackingNumber}`}
        >
          <ArrowRight size={15} />
        </Link>
      )}
    </article>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return <div className="list-state">{children}</div>;
}

export function CustomerShipments() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const status = params.get("status") ?? "";
  const queryText = params.get("search") ?? "";
  const [search, setSearch] = useState(queryText);
  const [paying, setPaying] = useState<string | null>(null);
  useEffect(() => setSearch(queryText), [queryText]);
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.delete("page");
      const string = next.toString();
      router.replace(`${pathname}${string ? `?${string}` : ""}`, {
        scroll: false,
      });
    }, 280);
    return () => clearTimeout(id);
  }, [search]);
  const query = useMemo(() => {
    const q = new URLSearchParams({
      page: String(page),
      limit: "8",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    if (status) q.set("status", status);
    if (queryText) q.set("search", queryText);
    return q.toString();
  }, [page, status, queryText]);
  const shipments = useQuery({
    queryKey: ["my-shipments", query],
    queryFn: () => apiRequest<Shipment[]>(`shipments/my?${query}`),
  });
  const rows = shipments.data?.data ?? [];
  const total = shipments.data?.meta?.total ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / 8));
  function setParam(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    const result = next.toString();
    router.replace(`${pathname}${result ? `?${result}` : ""}`, {
      scroll: false,
    });
  }
  async function pay(shipment: Shipment) {
    setPaying(shipment.id);
    try {
      const result = await apiRequest<{ checkoutUrl: string }>(
        `payments/${shipment.id}/initiate`,
        { method: "POST", body: JSON.stringify({}) },
      );
      window.location.assign(result.data.checkoutUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not start Stripe checkout.",
      );
      setPaying(null);
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR SENDS, ALL IN ONE PLACE</span>
          <h1>
            My <em>shipments.</em>
          </h1>
          <p>Follow each journey or pick up where you left off.</p>
        </div>
        <Link href="/dashboard/shipments/new" className="workspace-primary">
          <Plus size={15} /> Book a shipment
        </Link>
      </div>
      <section className="content-panel shipment-management">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>{shipments.isPending ? "—" : total}</strong>
            <span>shipments</span>
          </div>
          <div className="list-controls">
            <label className="list-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking number"
                aria-label="Search tracking number"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </label>
            <label className="status-filter">
              <SlidersHorizontal size={14} />
              <SearchableSelect
                aria-label="Filter shipments by status"
                value={status}
                onValueChange={(value) => setParam("status", value)}
                placeholder="All statuses"
                options={statuses}
              />
            </label>
          </div>
        </div>
        {shipments.isPending ? (
          <div className="shipment-list-loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <i />
                <span>
                  <b />
                  <b />
                </span>
                <em />
              </div>
            ))}
          </div>
        ) : shipments.isError ? (
          <State>
            <span className="list-state-icon">
              <Search size={18} />
            </span>
            <strong>We couldn’t load your shipments.</strong>
            <p>{shipments.error.message}</p>
            <button
              className="workspace-primary"
              onClick={() => shipments.refetch()}
            >
              Try again <ArrowRight size={14} />
            </button>
          </State>
        ) : rows.length ? (
          <>
            <div className="managed-shipment-list">
              {rows.map((shipment) => (
                <ShipmentItem
                  key={shipment.id}
                  shipment={shipment}
                  onPay={pay}
                />
              ))}
            </div>
            <div className="shipment-pagination">
              <span>
                Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, total)} of{" "}
                {total}
              </span>
              <div>
                <button
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pages}
                </span>
                <button
                  aria-label="Next page"
                  disabled={page >= pages}
                  onClick={() => setParam("page", String(page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <State>
            <span className="list-state-icon">
              <PackageOpen size={20} />
            </span>
            <strong>
              {queryText || status
                ? "No shipments match these filters."
                : "Your first shipment is just around the corner."}
            </strong>
            <p>
              {queryText || status
                ? "Try changing the search or status filter."
                : "Get a live quote and see the full route before you book."}
            </p>
            {queryText || status ? (
              <button
                className="reset-filters"
                onClick={() => router.replace(pathname)}
              >
                Clear filters <X size={13} />
              </button>
            ) : (
              <Link
                href="/dashboard/shipments/new"
                className="workspace-primary"
              >
                <Plus size={14} /> Create a shipment
              </Link>
            )}
          </State>
        )}
      </section>
      {paying && (
        <div className="inline-payment-note">
          <LoaderCircle size={14} className="spin" /> Connecting to Stripe
          securely…
        </div>
      )}
      <p className="list-footnote">
        <CircleDollarSign size={13} /> Payments are handled through Stripe
        Checkout. Shipment prices use backend rates in USD.
      </p>
    </div>
  );
}
