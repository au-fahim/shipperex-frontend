"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageCheck,
  PackageOpen,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";
import type { Shipment } from "@/lib/backend";

type CourierTask = {
  id: string;
  taskType: "PICKUP" | "DELIVERY";
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  attemptNumber: number;
  assignedAt: string;
  startedAt?: string | null;
  note?: string | null;
  failureReason?: string | null;
  contactAttempted?: boolean | null;
  hub?: { name: string; address?: string; city?: string };
  shipment: Shipment & {
    senderSnapshot?: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      city: string;
    };
    recipientSnapshot?: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      city: string;
    };
  };
};
const taskLabel = (task: CourierTask) =>
  task.taskType === "PICKUP" ? "Pickup" : "Delivery";
const date = (value: string) => format(new Date(value), "MMM d, yyyy · h:mm a");

export function CourierTaskList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get("status") ?? "";
  const type = params.get("taskType") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const query = useMemo(() => {
    const q = new URLSearchParams({ page: String(page), limit: "10" });
    if (status) q.set("status", status);
    if (type) q.set("taskType", type);
    return q.toString();
  }, [page, status, type]);
  const tasks = useQuery({
    queryKey: ["courier-tasks", query],
    queryFn: () => apiRequest<CourierTask[]>(`courier/tasks?${query}`),
  });
  const rows = tasks.data?.data ?? [];
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    const q = next.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR WORK, YOUR NEXT STOP</span>
          <h1>
            My <em>tasks.</em>
          </h1>
          <p>Pickup and delivery details assigned to you.</p>
        </div>
      </div>
      <section className="content-panel">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>
              {tasks.isPending ? "—" : (tasks.data?.meta?.total ?? rows.length)}
            </strong>
            <span>tasks in view</span>
          </div>
          <div className="list-controls">
            <label className="status-filter">
              <Truck size={14} />
              <SearchableSelect
                value={type}
                onValueChange={(value) => update("taskType", value)}
                aria-label="Filter task type"
                placeholder="All task types"
                options={[
                  { value: "", label: "All task types" },
                  { value: "PICKUP", label: "Pickup" },
                  { value: "DELIVERY", label: "Delivery" },
                ]}
              />
            </label>
            <label className="status-filter">
              <SearchableSelect
                value={status}
                onValueChange={(value) => update("status", value)}
                aria-label="Filter task status"
                placeholder="All statuses"
                options={[
                  { value: "", label: "All statuses" },
                  { value: "ASSIGNED", label: "Assigned" },
                  { value: "IN_PROGRESS", label: "In progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "FAILED", label: "Failed" },
                ]}
              />
            </label>
          </div>
        </div>
        {tasks.isPending ? (
          <div className="skeleton-list">
            {[0, 1, 2].map((i) => (
              <div className="skeleton-row" key={i}>
                <i />
                <span>
                  <b />
                  <b />
                </span>
                <em />
              </div>
            ))}
          </div>
        ) : tasks.isError ? (
          <div className="data-state data-error">
            <span>
              <Truck size={18} />
            </span>
            <strong>Your tasks couldn’t load.</strong>
            <p>{tasks.error.message}</p>
            <button onClick={() => tasks.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="managed-shipment-list">
            {rows.map((task) => (
              <Link
                href={`/courier/tasks/${task.id}`}
                key={task.id}
                className="courier-list-item"
              >
                <span
                  className={`task-list-icon ${task.taskType.toLowerCase()}`}
                >
                  {task.taskType === "PICKUP" ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <PackageCheck size={18} />
                  )}
                </span>
                <span className="task-list-main">
                  <small>
                    {taskLabel(task)} ·{" "}
                    {task.status.toLowerCase().replaceAll("_", " ")}
                  </small>
                  <strong>{task.shipment.trackingNumber}</strong>
                  <span>
                    <MapPin size={12} />
                    {task.taskType === "PICKUP"
                      ? task.shipment.senderSnapshot?.city
                      : task.shipment.recipientSnapshot?.city}{" "}
                    · {task.hub?.name}
                  </span>
                </span>
                <span className="task-attempt">
                  {task.taskType === "DELIVERY"
                    ? `Attempt ${task.attemptNumber}`
                    : "Pickup"}
                </span>
                <span
                  className={`status-pill status-${task.status.toLowerCase()}`}
                >
                  {task.status.toLowerCase().replaceAll("_", " ")}
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <PackageCheck size={20} />
            </span>
            <strong>No tasks match that view.</strong>
            <p>
              Your manager will add pickup and delivery tasks here when work is
              ready.
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="shipment-pagination">
            <span>
              Page {page} of{" "}
              {Math.max(
                1,
                Math.ceil((tasks.data?.meta?.total ?? rows.length) / 10),
              )}
            </span>
            <div>
              <button
                disabled={page <= 1}
                onClick={() => update("page", String(page - 1))}
              >
                Previous
              </button>
              <span>{page}</span>
              <button
                disabled={
                  page >=
                  Math.ceil((tasks.data?.meta?.total ?? rows.length) / 10)
                }
                onClick={() => update("page", String(page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const failedSchema = z.object({
  reason: z.string().min(3, "Explain what prevented delivery.").max(300),
  location: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
  contactAttempted: z.literal(true, {
    error: "Confirm that you attempted to contact the recipient.",
  }),
});
type FailedValues = z.infer<typeof failedSchema>;
export function CourierTaskDetail({ id }: { id: string }) {
  const cache = useQueryClient();
  const router = useRouter();
  const task = useQuery({
    queryKey: ["courier-task", id],
    queryFn: () =>
      apiRequest<CourierTask>(`courier/tasks/${encodeURIComponent(id)}`),
  });
  const [busy, setBusy] = useState(false);
  const form = useForm<FailedValues>({
    resolver: zodResolver(failedSchema),
    defaultValues: { reason: "", location: "", note: "" },
  });
  const item = task.data?.data;
  async function action(kind: "start" | "complete") {
    setBusy(true);
    try {
      await apiRequest(`courier/tasks/${id}/${kind}`, {
        method: "PATCH",
        body: JSON.stringify({
          location: item?.hub?.name,
          note: item?.note || undefined,
        }),
      });
      toast.success(
        kind === "start"
          ? "Task started. Stay safe out there."
          : item?.taskType === "PICKUP"
            ? "Pickup recorded. The shipment is ready for the next handoff."
            : "Delivery recorded. Shipment complete.",
      );
      await cache.invalidateQueries({ queryKey: ["courier-task", id] });
      await cache.invalidateQueries({ queryKey: ["courier-tasks"] });
      await cache.invalidateQueries({ queryKey: ["my-shipments"] });
      await cache.invalidateQueries({ queryKey: ["shipment"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the task.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function fail(values: FailedValues) {
    setBusy(true);
    try {
      await apiRequest(`courier/tasks/${id}/fail`, {
        method: "PATCH",
        body: JSON.stringify({
          reason: values.reason,
          location: values.location || item?.hub?.name,
          note: values.note || undefined,
          contactAttempted: true,
        }),
      });
      toast.success(
        "Delivery attempt recorded. Your manager and the customer have been updated.",
      );
      await cache.invalidateQueries({ queryKey: ["courier-task", id] });
      await cache.invalidateQueries({ queryKey: ["courier-tasks"] });
      await cache.invalidateQueries({ queryKey: ["shipment"] });
      router.push("/courier/tasks");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not record this attempt.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (task.isPending)
    return (
      <div className="detail-loading">
        <span />
        <span />
        <span />
      </div>
    );
  if (task.isError || !item)
    return (
      <div className="data-state data-error">
        <span>
          <Truck size={18} />
        </span>
        <strong>Task details are unavailable.</strong>
        <p>{task.error?.message ?? "This task may have been reassigned."}</p>
        <button onClick={() => task.refetch()}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  const isActive = item.status === "IN_PROGRESS";
  const canFail = isActive && item.taskType === "DELIVERY";
  const contact =
    item.taskType === "PICKUP"
      ? item.shipment.senderSnapshot
      : item.shipment.recipientSnapshot;
  const destination =
    item.taskType === "PICKUP"
      ? item.shipment.originHub
      : item.shipment.destinationHub;
  return (
    <div className="dashboard-page">
      <Link href="/courier/tasks" className="back-workspace">
        <ArrowLeft size={14} /> All tasks
      </Link>
      <div className="detail-title-row">
        <div>
          <span className="eyebrow">
            {taskLabel(item).toUpperCase()} TASK · ATTEMPT {item.attemptNumber}
          </span>
          <h1>{item.shipment.trackingNumber}</h1>
          <p>Assigned {date(item.assignedAt)}</p>
        </div>
        <span className={`status-pill status-${item.status.toLowerCase()}`}>
          {item.status.toLowerCase().replaceAll("_", " ")}
        </span>
      </div>
      <div className="courier-work-grid">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR HANDOFF</span>
              <h2>
                {item.taskType === "PICKUP"
                  ? "Collect the shipment"
                  : "Deliver to the recipient"}
              </h2>
            </div>
          </div>
          <div className="task-destination">
            <span>
              <MapPin size={18} />
            </span>
            <div>
              <small>
                {item.taskType === "PICKUP" ? "PICKUP HUB" : "DELIVERY HUB"}
              </small>
              <strong>
                {destination?.name ?? item.hub?.name ?? "Hub location"}
              </strong>
              <p>
                {destination?.address ??
                  item.hub?.address ??
                  destination?.city ??
                  "See route details below."}
              </p>
            </div>
          </div>
          <div className="task-contact">
            <span>
              <UserRound />
            </span>
            <div>
              <small>
                {item.taskType === "PICKUP" ? "SENDER" : "RECIPIENT"}
              </small>
              <strong>{contact?.name ?? "Contact not available"}</strong>
              <p>
                {contact?.address} · {contact?.city}
              </p>
              {contact?.phone && (
                <a href={`tel:${contact.phone}`}>
                  <Phone size={12} /> {contact.phone}
                </a>
              )}
            </div>
          </div>
          <div className="task-shipment-data">
            <div>
              <small>TYPE</small>
              <strong>{item.shipment.shipmentType.toLowerCase()}</strong>
            </div>
            <div>
              <small>WEIGHT</small>
              <strong>{item.shipment.weightKg} kg</strong>
            </div>
            <div>
              <small>ROUTE</small>
              <strong>
                {item.shipment.originCountry?.name} →{" "}
                {item.shipment.destinationCountry?.name}
              </strong>
            </div>
          </div>
          <div className="task-action-area">
            {item.status === "ASSIGNED" && (
              <button
                className="workspace-primary"
                disabled={busy}
                onClick={() => action("start")}
              >
                {busy ? (
                  <LoaderCircle size={14} className="spin" />
                ) : (
                  <Truck size={15} />
                )}{" "}
                Start this task
              </button>
            )}
            {isActive && (
              <>
                <button
                  className="workspace-primary"
                  disabled={busy}
                  onClick={() => action("complete")}
                >
                  {busy ? (
                    <LoaderCircle size={14} className="spin" />
                  ) : (
                    <Check size={15} />
                  )}{" "}
                  {item.taskType === "PICKUP"
                    ? "Confirm pickup"
                    : "Confirm delivery"}
                </button>
                {canFail && (
                  <details className="delivery-failure">
                    <summary>
                      <AlertTriangle size={14} /> I couldn’t complete delivery
                    </summary>
                    <form onSubmit={form.handleSubmit(fail)} noValidate>
                      <div className="wizard-field">
                        <label htmlFor="failure-reason">
                          What happened? <i>*</i>
                        </label>
                        <textarea
                          id="failure-reason"
                          rows={3}
                          placeholder="Briefly explain the delivery issue"
                          {...form.register("reason")}
                        />
                        {form.formState.errors.reason && (
                          <small>{form.formState.errors.reason.message}</small>
                        )}
                      </div>
                      <div className="wizard-field">
                        <label htmlFor="failure-location">
                          Attempt location
                        </label>
                        <input
                          id="failure-location"
                          placeholder={item.hub?.name ?? "Current location"}
                          {...form.register("location")}
                        />
                      </div>
                      <label className="contact-attempt-check">
                        <input
                          type="checkbox"
                          {...form.register("contactAttempted")}
                        />{" "}
                        <span>
                          I tried to contact the recipient before recording this
                          failed delivery.
                        </span>
                      </label>
                      {form.formState.errors.contactAttempted && (
                        <small className="field-error">
                          {form.formState.errors.contactAttempted.message}
                        </small>
                      )}
                      <button disabled={busy} className="record-failure">
                        Record delivery attempt <ArrowRight size={13} />
                      </button>
                      <p>
                        After three failed attempts, ShipperEx holds the
                        shipment at the destination hub.
                      </p>
                    </form>
                  </details>
                )}
              </>
            )}
            {item.status === "COMPLETED" && (
              <div className="task-complete-note">
                <span>
                  <Check size={17} />
                </span>
                <strong>
                  Task complete. Thank you for the careful handoff.
                </strong>
              </div>
            )}
            {item.status === "FAILED" && (
              <div className="manager-hint">
                <AlertTriangle size={15} /> Attempt recorded:{" "}
                {item.failureReason ?? "The delivery was not completed."}
              </div>
            )}
          </div>
        </section>
        <aside className="content-panel task-summary">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ROUTE CONTEXT</span>
              <h2>Shipment direction</h2>
            </div>
          </div>
          <div className="task-route-card">
            <span className="task-route-node">
              <i />
              <span>
                <small>FROM</small>
                <strong>{item.shipment.originCountry?.name}</strong>
              </span>
            </span>
            <span className="task-route-link" />
            <span className="task-route-node">
              <i />
              <span>
                <small>TO</small>
                <strong>{item.shipment.destinationCountry?.name}</strong>
              </span>
            </span>
          </div>
          <div className="task-info-row">
            <span>
              <PackageOpen size={14} /> Shipment type
            </span>
            <strong>{item.shipment.shipmentType}</strong>
          </div>
          <div className="task-info-row">
            <span>
              <Clock3 size={14} /> Assigned
            </span>
            <strong>{date(item.assignedAt)}</strong>
          </div>
          <div className="task-safety">
            <span>
              <ShieldCheck size={15} />
            </span>
            <p>
              Follow your hub’s handling process. Only record delivery as
              complete after the handoff is confirmed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
