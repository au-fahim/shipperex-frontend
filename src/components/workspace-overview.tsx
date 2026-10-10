"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Building2,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Globe2,
  MapPin,
  PackageCheck,
  PackageOpen,
  Plus,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import type { DashboardStats, Payment, Shipment } from "@/lib/backend";

type ListData<T> = T[];
const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID_AWAITING_ASSIGNMENT: "Ready for pickup",
  PICKUP_ASSIGNED: "Pickup assigned",
  PICKED_UP: "Picked up",
  AT_ORIGIN_HUB: "At origin hub",
  IN_TRANSIT: "On its way",
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
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  FAILED: "Needs attention",
};
const prettyDate = (value?: string) =>
  value ? format(new Date(value), "MMM d, yyyy") : "—";
const amount = (value?: number | string) =>
  `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function DataError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="data-state data-error">
      <span>
        <Activity size={18} />
      </span>
      <strong>Couldn’t load this data</strong>
      <p>{message}</p>
      <button onClick={retry}>
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}
function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="data-state">
      <span>
        <PackageOpen size={20} />
      </span>
      <strong>{title}</strong>
      <p>{copy}</p>
      {action}
    </div>
  );
}
function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "green",
  foot,
}: {
  label: string;
  value: string | number;
  icon: typeof Box;
  tone?: string;
  foot: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}>
        <Icon size={18} />
      </div>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{foot}</small>
    </article>
  );
}
function ShipmentRow({ shipment }: { shipment: Shipment }) {
  const direction =
    shipment.direction === "EXPORT" ? "Sending to" : "Receiving from";
  const destination =
    shipment.direction === "EXPORT"
      ? shipment.destinationCountry?.name
      : shipment.originCountry?.name;
  return (
    <Link href={`/dashboard/shipments/${shipment.id}`} className="shipment-row">
      <span className="shipment-row-icon">
        <PackageOpen size={18} />
      </span>
      <span className="shipment-row-main">
        <strong>
          {destination
            ? `${direction} ${destination}`
            : `${shipment.shipmentType.toLowerCase()} shipment`}
        </strong>
        <small>
          {shipment.trackingNumber} <i /> {shipment.shipmentType.toLowerCase()}
        </small>
      </span>
      <span className={`status-pill status-${shipment.status.toLowerCase()}`}>
        {statusLabels[shipment.status] ??
          shipment.status.replaceAll("_", " ").toLowerCase()}
      </span>
      <span className="shipment-row-date">
        {prettyDate(shipment.createdAt)}
      </span>
      <ArrowRight className="shipment-row-arrow" size={15} />
    </Link>
  );
}

export function CustomerOverview() {
  const shipments = useQuery({
    queryKey: ["my-shipments", "overview"],
    queryFn: () =>
      apiRequest<ListData<Shipment>>("shipments/my?page=1&limit=5"),
  });
  const payments = useQuery({
    queryKey: ["my-payments", "overview"],
    queryFn: () => apiRequest<ListData<Payment>>("payments/my?page=1&limit=5"),
  });
  const rows = shipments.data?.data ?? [];
  const unpaid = rows.filter((row) => row.status === "PENDING_PAYMENT").length;
  const inMotion = rows.filter(
    (row) =>
      !["DELIVERED", "CANCELLED", "PENDING_PAYMENT"].includes(row.status),
  ).length;
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR SHIPPEREX, AT A GLANCE</span>
          <h1>
            Good day, <em>let’s see where it’s going.</em>
          </h1>
          <p>Everything you’ve sent, right here in one place.</p>
        </div>
        <Link href="/dashboard/shipments/new" className="workspace-primary">
          <Plus size={16} /> Book a shipment
        </Link>
      </div>
      <div className="metric-grid">
        <MetricCard
          label="On its way"
          value={shipments.isPending ? "—" : inMotion}
          icon={Truck}
          tone="green"
          foot="Shipments in progress"
        />
        <MetricCard
          label="Awaiting payment"
          value={shipments.isPending ? "—" : unpaid}
          icon={CircleDollarSign}
          tone="amber"
          foot="Finish checkout to get moving"
        />
        <MetricCard
          label="Total sent"
          value={
            shipments.isPending
              ? "—"
              : (shipments.data?.meta?.total ?? rows.length)
          }
          icon={PackageCheck}
          tone="blue"
          foot="All-time shipment history"
        />
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE LATEST</span>
            <h2>Your shipments</h2>
          </div>
          <Link href="/dashboard/shipments" className="panel-link">
            See all shipments <ArrowRight size={14} />
          </Link>
        </div>
        {shipments.isLoading ? (
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
        ) : shipments.isError ? (
          <DataError
            message={shipments.error.message}
            retry={() => shipments.refetch()}
          />
        ) : rows.length ? (
          <div className="shipment-list">
            {rows.slice(0, 4).map((shipment) => (
              <ShipmentRow key={shipment.id} shipment={shipment} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your next shipment starts here."
            copy="Create a quote and see your route, price and next steps before you book."
            action={
              <Link
                href="/dashboard/shipments/new"
                className="workspace-primary"
              >
                <Plus size={15} /> Get a quote
              </Link>
            }
          />
        )}
      </section>
      <div className="lower-grid">
        <section className="content-panel payment-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PAYMENT HISTORY</span>
              <h2>Recent payments</h2>
            </div>
            <Link
              href="/dashboard/payments"
              className="panel-link"
              aria-label="See all payments"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {payments.isLoading ? (
            <div className="skeleton-list">
              {[0, 1].map((i) => (
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
          ) : payments.isError ? (
            <DataError
              message={payments.error.message}
              retry={() => payments.refetch()}
            />
          ) : (payments.data?.data?.length ?? 0) > 0 ? (
            <div className="payment-list">
              {payments.data?.data?.slice(0, 3).map((payment) => (
                <div className="payment-row" key={payment.id}>
                  <span className="payment-icon">
                    <CircleDollarSign size={17} />
                  </span>
                  <span>
                    <strong>
                      {payment.shipment?.trackingNumber ?? "Shipment payment"}
                    </strong>
                    <small>
                      {prettyDate(payment.createdAt)} ·{" "}
                      {payment.status.toLowerCase()}
                    </small>
                  </span>
                  <b>{amount(payment.amountUsd)}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No payments yet"
              copy="Payment details will appear here after booking."
            />
          )}
        </section>
        <section className="note-panel">
          <div className="note-spark">
            <ShieldCheck size={17} />
          </div>
          <span className="eyebrow">A NOTE FOR YOUR NEXT SEND</span>
          <h2>
            Know before
            <br />
            you book.
          </h2>
          <p>
            Your quote uses real shipment rates from ShipperEx. Choose a route
            and parcel type to see the price before you checkout.
          </p>
          <Link href="/dashboard/shipments/new">
            Get a real quote <ArrowUpRight size={14} />
          </Link>
          <div className="note-deco">
            <PackageOpen size={86} strokeWidth={0.7} />
          </div>
        </section>
      </div>
    </div>
  );
}

export function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () =>
      apiRequest<DashboardStats & Record<string, number>>(
        "admin/dashboard-stats",
      ),
  });
  const data = stats.data?.data;
  const count = (key: string) =>
    data?.[key] == null ? "—" : Number(data[key]).toLocaleString();
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPEREX · CONTROL ROOM</span>
          <h1>
            Good day, <em>here’s the big picture.</em>
          </h1>
          <p>A live view of people, parcels and activity across the network.</p>
        </div>
        <span className="live-status">
          <i /> LIVE DATA
        </span>
      </div>
      {stats.isError && (
        <DataError
          message={stats.error.message}
          retry={() => stats.refetch()}
        />
      )}
      <div className="metric-grid">
        <MetricCard
          label="All shipments"
          value={stats.isPending ? "—" : count("totalShipments")}
          icon={PackageOpen}
          tone="green"
          foot="Across the network"
        />
        <MetricCard
          label="Waiting for payment"
          value={stats.isPending ? "—" : count("pendingShipments")}
          icon={CircleDollarSign}
          tone="amber"
          foot="Customer checkout pending"
        />
        <MetricCard
          label="Delivered"
          value={stats.isPending ? "—" : count("deliveredShipments")}
          icon={PackageCheck}
          tone="blue"
          foot="Completed shipments"
        />
        <MetricCard
          label="Paid revenue"
          value={stats.isPending ? "—" : amount(data?.revenueUsd)}
          icon={ChartNoAxesCombined}
          tone="rose"
          foot="Verified Stripe payments"
        />
      </div>
      <div className="lower-grid admin-lower">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">NETWORK PULSE</span>
              <h2>At a glance</h2>
            </div>
            <Link href="/admin/reports" className="panel-link">
              Open reports <ArrowRight size={14} />
            </Link>
          </div>
          {stats.isPending ? (
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
          ) : (
            <div className="admin-pulse-list">
              <div>
                <span>
                  <Users size={17} /> People on the platform
                </span>
                <b>{count("totalUsers")}</b>
              </div>
              <div>
                <span>
                  <Truck size={17} /> Couriers in the network
                </span>
                <b>{count("totalCouriers")}</b>
              </div>
              <div>
                <span>
                  <Activity size={17} /> Available for assignments
                </span>
                <b>{count("availableCouriers")}</b>
              </div>
              <div>
                <span>
                  <Box size={17} /> Failed delivery attempts
                </span>
                <b>{count("failedShipments")}</b>
              </div>
            </div>
          )}
        </section>
        <section className="note-panel admin-note">
          <div className="note-spark">
            <ShieldCheck size={17} />
          </div>
          <span className="eyebrow">ADMIN SHORTCUTS</span>
          <h2>
            Keep the
            <br />
            network moving.
          </h2>
          <div className="shortcut-links">
            <Link href="/admin/users">
              <Users size={15} /> Manage people <ArrowRight size={13} />
            </Link>
            <Link href="/admin/hubs">
              <Building2 size={15} /> Manage hubs <ArrowRight size={13} />
            </Link>
            <Link href="/admin/countries">
              <Globe2 size={15} /> Manage countries <ArrowRight size={13} />
            </Link>
            <Link href="/admin/rates">
              <CircleDollarSign size={15} /> Review rates{" "}
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="note-deco">
            <Globe2 size={86} strokeWidth={0.7} />
          </div>
        </section>
      </div>
    </div>
  );
}

export function ManagerOverview() {
  const queue = useQuery({
    queryKey: ["manager-shipments", "overview"],
    queryFn: () =>
      apiRequest<Shipment[]>(
        "shipments?page=1&limit=5&sortBy=createdAt&sortOrder=desc",
      ),
  });
  const rows = queue.data?.data ?? [];
  const needsPickup = rows.filter(
    (row) => row.status === "PAID_AWAITING_ASSIGNMENT",
  ).length;
  const active = rows.filter((row) =>
    [
      "PICKUP_ASSIGNED",
      "PICKED_UP",
      "AT_ORIGIN_HUB",
      "IN_TRANSIT",
      "AT_DESTINATION_HUB",
      "DELIVERY_ASSIGNED",
      "OUT_FOR_DELIVERY",
    ].includes(row.status),
  ).length;
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPEREX · HUB OPERATIONS</span>
          <h1>
            Good day, <em>let’s keep things moving.</em>
          </h1>
          <p>Your hub’s shipment queue and next steps, together.</p>
        </div>
        <Link href="/manager/shipments" className="workspace-primary">
          Open shipment queue <ArrowRight size={15} />
        </Link>
      </div>
      <div className="metric-grid">
        <MetricCard
          label="Needs assignment"
          value={queue.isPending ? "—" : needsPickup}
          icon={ClipboardList}
          tone="amber"
          foot="Paid, ready for a courier"
        />
        <MetricCard
          label="On the move"
          value={queue.isPending ? "—" : active}
          icon={Truck}
          tone="green"
          foot="Active shipments in your hub"
        />
        <MetricCard
          label="Queue in view"
          value={
            queue.isPending ? "—" : (queue.data?.meta?.total ?? rows.length)
          }
          icon={PackageOpen}
          tone="blue"
          foot="Filtered to your hub access"
        />
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">RECENT HUB ACTIVITY</span>
            <h2>Shipment queue</h2>
          </div>
          <Link href="/manager/shipments" className="panel-link">
            Manage assignments <ArrowRight size={14} />
          </Link>
        </div>
        {queue.isLoading ? (
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
        ) : queue.isError ? (
          <DataError
            message={queue.error.message}
            retry={() => queue.refetch()}
          />
        ) : rows.length ? (
          <div className="shipment-list">
            {rows.map((shipment) => (
              <ShipmentRow key={shipment.id} shipment={shipment} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your hub queue is clear."
            copy="Shipments routed to your hub will appear here."
          />
        )}
      </section>
      <div className="workflow-callout">
        <span>
          <MapPin size={19} />
        </span>
        <div>
          <strong>Good handoffs keep the journey on track.</strong>
          <p>
            Update checkpoints as parcels move between your hub and the next
            stop.
          </p>
        </div>
        <Link href="/manager/shipments">
          Open operations <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function CourierOverview() {
  const tasks = useQuery({
    queryKey: ["courier-tasks", "overview"],
    queryFn: () =>
      apiRequest<
        Array<{
          id: string;
          taskType: string;
          status: string;
          shipment?: Shipment;
          assignedAt: string;
        }>
      >("courier/tasks?page=1&limit=5"),
  });
  const rows = tasks.data?.data ?? [];
  const active = rows.filter((task) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(task.status),
  ).length;
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR SHIPPEREX · COURIER ROUTE</span>
          <h1>
            Good day, <em>your next stop is here.</em>
          </h1>
          <p>Your assigned pickups and deliveries, in one easy view.</p>
        </div>
        <span className="live-status">
          <i /> MY TASKS
        </span>
      </div>
      <div className="metric-grid">
        <MetricCard
          label="Active tasks"
          value={tasks.isPending ? "—" : active}
          icon={Truck}
          tone="green"
          foot="Assigned or in progress"
        />
        <MetricCard
          label="Pickup tasks"
          value={
            tasks.isPending
              ? "—"
              : rows.filter(
                  (task) =>
                    task.taskType === "PICKUP" && task.status !== "COMPLETED",
                ).length
          }
          icon={ArrowDownLeft}
          tone="amber"
          foot="Collect from sender"
        />
        <MetricCard
          label="Delivery tasks"
          value={
            tasks.isPending
              ? "—"
              : rows.filter(
                  (task) =>
                    task.taskType === "DELIVERY" && task.status !== "COMPLETED",
                ).length
          }
          icon={PackageCheck}
          tone="blue"
          foot="Bring it to the recipient"
        />
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR NEXT STOPS</span>
            <h2>Assigned tasks</h2>
          </div>
          <Link href="/courier/tasks" className="panel-link">
            See all tasks <ArrowRight size={14} />
          </Link>
        </div>
        {tasks.isLoading ? (
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
          <DataError
            message={tasks.error.message}
            retry={() => tasks.refetch()}
          />
        ) : rows.length ? (
          <div className="courier-task-list">
            {rows.map((task) => (
              <Link
                href={`/courier/tasks/${task.id}`}
                key={task.id}
                className="courier-task-row"
              >
                <span className="task-type-icon">
                  {task.taskType === "PICKUP" ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <PackageCheck size={18} />
                  )}
                </span>
                <span className="courier-task-copy">
                  <small>
                    {task.taskType} · {statusLabels[task.status] ?? task.status}
                  </small>
                  <strong>
                    {task.shipment?.trackingNumber ?? "Shipment task"}
                  </strong>
                  <span>
                    <MapPin size={12} />
                    {task.shipment?.recipientSnapshot?.city ??
                      task.shipment?.originHub?.city ??
                      "View task details for location"}
                  </span>
                </span>
                <span className="task-due">
                  <Clock3 size={13} />
                  {prettyDate(task.assignedAt)}
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No stops assigned yet."
            copy="When your manager assigns a pickup or delivery, the details will show up here."
          />
        )}
      </section>
      <div className="workflow-callout courier-tip">
        <span>
          <ShieldCheck size={19} />
        </span>
        <div>
          <strong>Every handoff deserves a clear update.</strong>
          <p>
            Mark the task as started, completed, or record a delivery attempt
            from its detail page.
          </p>
        </div>
        <Link href="/courier/tasks">
          Open tasks <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
