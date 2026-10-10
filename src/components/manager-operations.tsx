"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  LoaderCircle,
  MapPin,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";
import type { Shipment } from "@/lib/backend";

const statuses = [
  { value: "", label: "All statuses" },
  { value: "PAID_AWAITING_ASSIGNMENT", label: "Ready for pickup" },
  { value: "PICKUP_ASSIGNED", label: "Pickup assigned" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "AT_ORIGIN_HUB", label: "At origin hub" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "AT_DESTINATION_HUB", label: "At destination hub" },
  { value: "DELIVERY_ASSIGNED", label: "Delivery assigned" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERY_FAILED", label: "Delivery issue" },
  { value: "HELD_FOR_COLLECTION", label: "Held for collection" },
];
const label = (value: string) =>
  statuses.find((status) => status.value === value)?.label ??
  value.replaceAll("_", " ").toLowerCase();
type Courier = {
  id: string;
  staffType: string;
  hubId: string;
  availabilityStatus: string;
  activeTaskCount: number;
  maxActiveTasks: number;
  user: { name: string; email: string };
};
const checkpointSchema = z.object({
  location: z.string().min(2, "Enter a location.").max(120),
  note: z.string().min(2, "Describe this checkpoint.").max(500),
});
type CheckpointValues = z.infer<typeof checkpointSchema>;

export function ManagerShipmentQueue() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const status = params.get("status") ?? "";
  const search = params.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(search);
  const [assigning, setAssigning] = useState(false);
  useEffect(() => setSearchValue(search), [search]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (searchValue.trim()) next.set("search", searchValue.trim());
      else next.delete("search");
      next.delete("page");
      const q = next.toString();
      router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchValue]);
  const query = useMemo(() => {
    const q = new URLSearchParams({
      page: String(page),
      limit: "10",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    return q.toString();
  }, [page, status, search]);
  const list = useQuery({
    queryKey: ["manager-shipments", query],
    queryFn: () => apiRequest<Shipment[]>(`shipments?${query}`),
  });
  const rows = list.data?.data ?? [];
  const total = list.data?.meta?.total ?? rows.length;
  function filter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }
  async function autoAssign() {
    setAssigning(true);
    try {
      const result = await apiRequest<{
        assigned: { trackingNumber: string }[];
        skipped: { trackingNumber: string; reason: string }[];
      }>("shipments/auto-assign", {
        method: "POST",
        body: JSON.stringify({ taskType: "PICKUP", limit: 20 }),
      });
      toast.success(
        `${result.data.assigned.length} pickup task${result.data.assigned.length === 1 ? "" : "s"} assigned.`,
      );
      if (result.data.skipped.length)
        toast.message(
          `${result.data.skipped.length} shipment${result.data.skipped.length === 1 ? " was" : "s were"} skipped because there wasn’t a matching courier.`,
        );
      await cache.invalidateQueries({ queryKey: ["manager-shipments"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not assign pickups.",
      );
    } finally {
      setAssigning(false);
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR HUB · SHIPMENT OPERATIONS</span>
          <h1>
            Shipment <em>queue.</em>
          </h1>
          <p>
            Review your hub’s shipment handoffs and keep each parcel moving.
          </p>
        </div>
        <button
          className="workspace-primary"
          onClick={autoAssign}
          disabled={assigning}
        >
          {assigning ? (
            <LoaderCircle size={14} className="spin" />
          ) : (
            <Zap size={14} />
          )}{" "}
          Assign pickup queue
        </button>
      </div>
      <section className="content-panel">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>{list.isPending ? "—" : total}</strong>
            <span>in your hub view</span>
          </div>
          <div className="list-controls">
            <label className="list-search">
              <Search size={15} />
              <input
                aria-label="Search tracking numbers"
                placeholder="Find tracking number"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
            <label className="status-filter">
              <SlidersHorizontal size={14} />
              <SearchableSelect
                value={status}
                onValueChange={(value) => filter("status", value)}
                aria-label="Filter by shipment status"
                placeholder="All statuses"
                options={statuses}
              />
            </label>
          </div>
        </div>
        {list.isPending ? (
          <div className="skeleton-list">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="skeleton-row">
                <i />
                <span>
                  <b />
                  <b />
                </span>
                <em />
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <div className="data-state data-error">
            <span>
              <ClipboardList size={18} />
            </span>
            <strong>Couldn’t load the hub queue.</strong>
            <p>{list.error.message}</p>
            <button onClick={() => list.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="managed-shipment-list">
            {rows.map((shipment) => (
              <article
                className="shipment-list-card manager-shipment-row"
                key={shipment.id}
              >
                <Link
                  href={`/manager/shipments/${shipment.id}`}
                  className="shipment-list-main"
                >
                  <span className="shipment-list-icon">
                    <PackageOpen size={18} />
                  </span>
                  <span className="shipment-list-copy">
                    <strong>{shipment.trackingNumber}</strong>
                    <small>
                      {shipment.direction.toLowerCase()} ·{" "}
                      {shipment.shipmentType.toLowerCase()}
                      <i /> {shipment.originCountry?.name ?? "Origin"} →{" "}
                      {shipment.destinationCountry?.name ?? "Destination"}
                    </small>
                  </span>
                </Link>
                <span
                  className={`status-pill status-${shipment.status.toLowerCase()}`}
                >
                  {label(shipment.status)}
                </span>
                <span className="manager-shipment-hub">
                  {shipment.currentHub?.name ??
                    shipment.originHub?.name ??
                    "Hub handoff"}
                </span>
                <Link
                  href={`/manager/shipments/${shipment.id}`}
                  className="shipment-open"
                  aria-label={`Manage ${shipment.trackingNumber}`}
                >
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <PackageOpen size={20} />
            </span>
            <strong>
              {search || status
                ? "No shipments match that view."
                : "No shipments are in your hub queue."}
            </strong>
            <p>
              As shipments are paid or routed through your hub, they’ll show
              here.
            </p>
            {(search || status) && (
              <button onClick={() => router.replace(pathname)}>
                Clear filters
              </button>
            )}
          </div>
        )}
        {rows.length > 0 && (
          <div className="shipment-pagination">
            <span>
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of{" "}
              {total}
            </span>
            <div>
              <button
                disabled={page <= 1}
                onClick={() => filter("page", String(page - 1))}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / 10))}
              </span>
              <button
                disabled={page >= Math.ceil(total / 10)}
                onClick={() => filter("page", String(page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="workflow-callout">
        <span>
          <Users size={18} />
        </span>
        <div>
          <strong>Assignments respect each courier’s hub and capacity.</strong>
          <p>
            Manual assignment lets you choose a specific courier. Batch
            assignment distributes work to the least-loaded eligible courier.
          </p>
        </div>
        <Link href="/manager/couriers">
          View couriers <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function ManagerShipmentDetail({ id }: { id: string }) {
  const cache = useQueryClient();
  const shipment = useQuery({
    queryKey: ["shipment", id],
    queryFn: () =>
      apiRequest<
        Shipment & {
          currentHub?: { name: string };
          payment?: { status: string };
          courierTasks?: {
            id: string;
            taskType: string;
            status: string;
            courierProfile?: { user?: { name: string } };
          }[];
        }
      >(`shipments/${encodeURIComponent(id)}`),
  });
  const couriers = useQuery({
    queryKey: ["couriers"],
    queryFn: () => apiRequest<Courier[]>("couriers?page=1&limit=100"),
  });
  const [courierId, setCourierId] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const checkpointForm = useForm<CheckpointValues>({
    resolver: zodResolver(checkpointSchema),
    defaultValues: { location: "", note: "" },
  });
  const item = shipment.data?.data;
  const events = item?.trackingEvents ?? [];
  async function assign(taskType: "PICKUP" | "DELIVERY") {
    if (!courierId) {
      toast.error("Choose an available courier first.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`shipments/${id}/assignments`, {
        method: "POST",
        body: JSON.stringify({ courierId, taskType, note: note || undefined }),
      });
      toast.success(`${taskType.toLowerCase()} courier assigned.`);
      await cache.invalidateQueries({ queryKey: ["shipment", id] });
      await cache.invalidateQueries({ queryKey: ["manager-shipments"] });
      await cache.invalidateQueries({ queryKey: ["couriers"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not assign courier.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function updateStatus(status: string) {
    setBusy(true);
    try {
      await apiRequest(`shipments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          location: item?.currentHub?.name ?? item?.originHub?.name,
          note: note || undefined,
        }),
      });
      toast.success(`Shipment updated to ${label(status)}.`);
      await cache.invalidateQueries({ queryKey: ["shipment", id] });
      await cache.invalidateQueries({ queryKey: ["manager-shipments"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update shipment status.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function checkpoint(values: CheckpointValues) {
    setBusy(true);
    try {
      await apiRequest(`shipments/${id}/checkpoints`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Checkpoint added to the shipment timeline.");
      checkpointForm.reset();
      await cache.invalidateQueries({ queryKey: ["shipment", id] });
      await cache.invalidateQueries({ queryKey: ["shipment-timeline", id] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add checkpoint.",
      );
    } finally {
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
      <section className="content-panel">
        <div className="data-state data-error">
          <span>
            <ClipboardList size={18} />
          </span>
          <strong>Shipment unavailable</strong>
          <p>{shipment.error?.message ?? "Couldn’t load shipment."}</p>
          <button onClick={() => shipment.refetch()}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </section>
    );
  const eligiblePickup =
    item.status === "PAID_AWAITING_ASSIGNMENT" &&
    item.payment?.status === "PAID";
  const eligibleDelivery = ["AT_DESTINATION_HUB", "DELIVERY_FAILED"].includes(
    item.status,
  );
  const available =
    couriers.data?.data?.filter(
      (courier) =>
        courier.availabilityStatus === "AVAILABLE" &&
        courier.activeTaskCount < courier.maxActiveTasks,
    ) ?? [];
  return (
    <div className="dashboard-page">
      <Link href="/manager/shipments" className="back-workspace">
        <ArrowLeft size={14} /> Shipment queue
      </Link>
      <div className="detail-title-row">
        <div>
          <span className="eyebrow">SHIPMENT OPERATIONS</span>
          <h1>{item.trackingNumber}</h1>
          <p>
            {item.direction} · {item.shipmentType} ·{" "}
            {item.originCountry?.name ?? "Origin"} to{" "}
            {item.destinationCountry?.name ?? "Destination"}
          </p>
        </div>
        <span className={`status-pill status-${item.status.toLowerCase()}`}>
          {label(item.status)}
        </span>
      </div>
      <div className="manager-detail-grid">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">HANDOFF CONTROL</span>
              <h2>Next shipment action</h2>
            </div>
          </div>
          <div className="manager-actions-panel">
            <div className="wizard-field">
              <label htmlFor="courier-choice">
                Available courier <i>*</i>
              </label>
              <SearchableSelect
                id="courier-choice"
                value={courierId}
                onValueChange={setCourierId}
                placeholder="Choose a courier for this hub"
                aria-label="Available courier"
                disabled={couriers.isPending || available.length === 0}
                emptyMessage="No couriers match this search."
                options={available.map((courier) => ({
                  value: courier.id,
                  label: `${courier.user.name} · ${courier.activeTaskCount}/${courier.maxActiveTasks} active tasks`,
                  keywords: courier.user.email,
                }))}
              />
              {couriers.isError && <small>{couriers.error.message}</small>}
              {!couriers.isPending && couriers.data?.data?.length === 0 && (
                <small>No couriers are assigned to this hub.</small>
              )}
              {couriers.data?.data?.length && available.length === 0 && (
                <small>Every courier is offline or at capacity.</small>
              )}
            </div>
            <div className="wizard-field">
              <label htmlFor="manager-note">
                Assignment or checkpoint note
              </label>
              <input
                id="manager-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for this handoff"
              />
            </div>
            <div className="manager-action-buttons">
              {eligiblePickup && (
                <button
                  onClick={() => assign("PICKUP")}
                  disabled={busy || !available.length}
                  className="workspace-primary"
                >
                  {busy ? (
                    <LoaderCircle size={13} className="spin" />
                  ) : (
                    <Truck size={14} />
                  )}{" "}
                  Assign pickup
                </button>
              )}
              {eligibleDelivery && (
                <button
                  onClick={() => assign("DELIVERY")}
                  disabled={busy || !available.length}
                  className="workspace-primary"
                >
                  {busy ? (
                    <LoaderCircle size={13} className="spin" />
                  ) : (
                    <Truck size={14} />
                  )}{" "}
                  Assign delivery
                </button>
              )}
              {item.status === "PICKED_UP" && (
                <button
                  onClick={() => updateStatus("AT_ORIGIN_HUB")}
                  disabled={busy}
                  className="workspace-primary"
                >
                  Mark at origin hub <ArrowRight size={13} />
                </button>
              )}
              {item.status === "AT_ORIGIN_HUB" && (
                <button
                  onClick={() => updateStatus("IN_TRANSIT")}
                  disabled={busy}
                  className="workspace-primary"
                >
                  Mark in transit <ArrowRight size={13} />
                </button>
              )}
              {item.status === "IN_TRANSIT" && (
                <>
                  <button
                    onClick={() => updateStatus("AT_DESTINATION_HUB")}
                    disabled={busy}
                    className="workspace-primary"
                  >
                    Arrived at destination <ArrowRight size={13} />
                  </button>
                  <form
                    className="checkpoint-form"
                    onSubmit={checkpointForm.handleSubmit(checkpoint)}
                  >
                    <strong>Add a transit checkpoint</strong>
                    <label>
                      Location
                      <input
                        {...checkpointForm.register("location")}
                        aria-invalid={Boolean(
                          checkpointForm.formState.errors.location,
                        )}
                        placeholder="City, hub or checkpoint"
                      />
                      {checkpointForm.formState.errors.location && (
                        <small>
                          {checkpointForm.formState.errors.location.message}
                        </small>
                      )}
                    </label>
                    <label>
                      Update note
                      <input
                        {...checkpointForm.register("note")}
                        aria-invalid={Boolean(
                          checkpointForm.formState.errors.note,
                        )}
                        placeholder="What changed at this stop?"
                      />
                      {checkpointForm.formState.errors.note && (
                        <small>
                          {checkpointForm.formState.errors.note.message}
                        </small>
                      )}
                    </label>
                    <button disabled={busy}>
                      Add checkpoint <ArrowRight size={13} />
                    </button>
                  </form>
                </>
              )}
              {item.status === "HELD_FOR_COLLECTION" && (
                <p className="manager-hint">
                  The customer can request a separately paid return, or the
                  recipient can collect from the hub when no return is booked.
                </p>
              )}
              {!eligiblePickup &&
                !eligibleDelivery &&
                ![
                  "PICKED_UP",
                  "AT_ORIGIN_HUB",
                  "IN_TRANSIT",
                  "HELD_FOR_COLLECTION",
                ].includes(item.status) && (
                  <div className="manager-hint">
                    <PackageCheck size={15} /> Courier task and shipment status
                    actions unlock as the workflow advances.
                  </div>
                )}
            </div>
          </div>
          <div className="handoff-timeline">
            {(item.courierTasks ?? []).map((task) => (
              <div key={task.id}>
                <span className="task-type-icon">
                  <Truck size={15} />
                </span>
                <span>
                  <small>
                    {task.taskType} · {task.status}
                  </small>
                  <strong>
                    {task.courierProfile?.user?.name ?? "Courier assignment"}
                  </strong>
                </span>
              </div>
            ))}
          </div>
        </section>
        <aside className="detail-aside">
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ROUTE</span>
                <h2>Shipment path</h2>
              </div>
            </div>
            <div className="manager-route-info">
              <div>
                <small>ORIGIN HUB</small>
                <strong>{item.originHub?.name ?? "—"}</strong>
                <span>{item.originHub?.city ?? item.originCountry?.name}</span>
              </div>
              <div>
                <small>DESTINATION HUB</small>
                <strong>{item.destinationHub?.name ?? "—"}</strong>
                <span>
                  {item.destinationHub?.city ?? item.destinationCountry?.name}
                </span>
              </div>
              <div>
                <small>CHARGEABLE WEIGHT</small>
                <strong>{item.weightKg} kg</strong>
                <span>Shipment type: {item.shipmentType.toLowerCase()}</span>
              </div>
            </div>
          </section>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CONTACTS</span>
                <h2>Pickup & delivery</h2>
              </div>
            </div>
            <div className="manager-route-info">
              <div>
                <small>SENDER</small>
                <strong>{item.senderSnapshot?.name ?? "—"}</strong>
                <span>{item.senderSnapshot?.phone ?? ""}</span>
              </div>
              <div>
                <small>RECIPIENT</small>
                <strong>{item.recipientSnapshot?.name ?? "—"}</strong>
                <span>{item.recipientSnapshot?.phone ?? ""}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
