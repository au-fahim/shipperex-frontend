"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";

type Courier = {
  id: string;
  hubId: string;
  staffType: string;
  availabilityStatus: string;
  activeTaskCount: number;
  maxActiveTasks: number;
  totalDeliveries: number;
  earningsBalanceUsd: string | number;
  user: { name: string; email: string; phone?: string | null };
};
type Report = {
  byStatus: { status: string; _count: { status: number } }[];
  byDirection: { direction: string; _count: { direction: number } }[];
  byType: { shipmentType: string; _count: { shipmentType: number } }[];
};
const statusWords = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

export function ManagerCouriers() {
  const cache = useQueryClient();
  const couriers = useQuery({
    queryKey: ["couriers"],
    queryFn: () => apiRequest<Courier[]>("couriers?page=1&limit=100"),
  });
  const [busy, setBusy] = useState<string | null>(null);
  const rows = couriers.data?.data ?? [];
  async function availability(
    courier: Courier,
    value: "AVAILABLE" | "OFFLINE" | "SUSPENDED",
  ) {
    setBusy(courier.id);
    try {
      await apiRequest(`couriers/${courier.id}`, {
        method: "PATCH",
        body: JSON.stringify({ availabilityStatus: value }),
      });
      toast.success(
        `${courier.user.name} is now ${value.toLowerCase().replaceAll("_", " ")}.`,
      );
      await cache.invalidateQueries({ queryKey: ["couriers"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update availability.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">YOUR HUB · COURIER CAPACITY</span>
          <h1>
            People on the <em>move.</em>
          </h1>
          <p>
            Review the couriers assigned to your hub and their task capacity.
          </p>
        </div>
      </div>
      <div className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon metric-green">
            <Users size={18} />
          </div>
          <span className="metric-label">Couriers at this hub</span>
          <strong>{couriers.isPending ? "—" : rows.length}</strong>
          <small>Hub-scoped view</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon metric-blue">
            <Truck size={18} />
          </div>
          <span className="metric-label">Available now</span>
          <strong>
            {couriers.isPending
              ? "—"
              : rows.filter((item) => item.availabilityStatus === "AVAILABLE")
                  .length}
          </strong>
          <small>Eligible for assignment</small>
        </article>
        <article className="metric-card">
          <div className="metric-icon metric-amber">
            <ClipboardList size={18} />
          </div>
          <span className="metric-label">Active assignments</span>
          <strong>
            {couriers.isPending
              ? "—"
              : rows.reduce((total, item) => total + item.activeTaskCount, 0)}
          </strong>
          <small>Across this hub</small>
        </article>
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">HUB COURIER ROSTER</span>
            <h2>Courier availability</h2>
          </div>
          {couriers.data?.meta && (
            <span className="records-count">
              {couriers.data.meta.total} couriers
            </span>
          )}
        </div>
        {couriers.isPending ? (
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
        ) : couriers.isError ? (
          <div className="data-state data-error">
            <span>
              <Users size={18} />
            </span>
            <strong>Courier roster unavailable.</strong>
            <p>{couriers.error.message}</p>
            <button onClick={() => couriers.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="courier-roster">
            {rows.map((courier) => (
              <article className="courier-roster-card" key={courier.id}>
                <span className="roster-avatar">
                  {courier.user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="roster-person">
                  <strong>{courier.user.name}</strong>
                  <small>{courier.user.email}</small>
                  <span>{courier.user.phone ?? "No phone on file"}</span>
                </div>
                <div className="roster-capacity">
                  <small>TASK CAPACITY</small>
                  <strong>
                    {courier.activeTaskCount} <i>/</i> {courier.maxActiveTasks}
                  </strong>
                  <div className="capacity-track">
                    <i
                      style={{
                        width: `${Math.min(100, (courier.activeTaskCount / courier.maxActiveTasks) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={`courier-availability availability-${courier.availabilityStatus.toLowerCase()}`}
                >
                  <i />
                  {courier.availabilityStatus
                    .toLowerCase()
                    .replaceAll("_", " ")}
                </span>
                <label className="availability-control">
                  <span className="sr-only">
                    Update {courier.user.name} availability
                  </span>
                  <SearchableSelect
                    aria-label={`Update ${courier.user.name} availability`}
                    value={
                      courier.availabilityStatus === "AT_CAPACITY"
                        ? "AVAILABLE"
                        : courier.availabilityStatus
                    }
                    onValueChange={(value) =>
                      availability(
                        courier,
                        value as "AVAILABLE" | "OFFLINE" | "SUSPENDED",
                      )
                    }
                    disabled={
                      busy === courier.id ||
                      courier.availabilityStatus === "AT_CAPACITY"
                    }
                    options={[
                      { value: "AVAILABLE", label: "Available" },
                      { value: "OFFLINE", label: "Offline" },
                      { value: "SUSPENDED", label: "Suspended" },
                    ]}
                  />
                  {busy === courier.id && (
                    <LoaderCircle size={12} className="spin" />
                  )}
                </label>
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <Users size={20} />
            </span>
            <strong>No couriers assigned to your hub.</strong>
            <p>
              Ask an administrator to add couriers to this hub before creating
              assignments.
            </p>
          </div>
        )}
      </section>
      <div className="workflow-callout">
        <span>
          <Activity size={17} />
        </span>
        <div>
          <strong>Assignments respect the five-task capacity limit.</strong>
          <p>
            Couriers at capacity become available automatically when they
            complete or fail a task.
          </p>
        </div>
        <Link href="/manager/shipments">
          Open shipment queue <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function ShipmentReports({ admin = false }: { admin?: boolean }) {
  const report = useQuery({
    queryKey: ["shipment-report", admin],
    queryFn: () => apiRequest<Report>("admin/reports/shipments"),
  });
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiRequest<Record<string, number>>("admin/dashboard-stats"),
    enabled: admin,
  });
  const data = report.data?.data;
  const chartData =
    data?.byStatus?.map((row) => ({
      name: statusWords(row.status),
      count: row._count.status,
    })) ?? [];
  const direction =
    data?.byDirection?.map((row) => ({
      name: statusWords(row.direction),
      count: row._count.direction,
    })) ?? [];
  const type =
    data?.byType?.map((row) => ({
      name: statusWords(row.shipmentType),
      count: row._count.shipmentType,
    })) ?? [];
  const metric = (key: string) => stats.data?.data?.[key] ?? "—";
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">
            {admin
              ? "SHIPPERE X · NETWORK INSIGHTS"
              : "YOUR HUB · OPERATIONS REPORT"}
          </span>
          <h1>
            Shipment <em>reports.</em>
          </h1>
          <p>
            {admin
              ? "A live view of real shipment outcomes across ShipperEx."
              : "Shipment volume and movement within your hub access."}
          </p>
        </div>
      </div>
      {admin && (
        <div className="metric-grid">
          <article className="metric-card">
            <div className="metric-icon metric-green">
              <Users size={18} />
            </div>
            <span className="metric-label">Total users</span>
            <strong>{metric("totalUsers")}</strong>
            <small>Network accounts</small>
          </article>
          <article className="metric-card">
            <div className="metric-icon metric-blue">
              <Truck size={18} />
            </div>
            <span className="metric-label">Couriers</span>
            <strong>{metric("totalCouriers")}</strong>
            <small>{metric("availableCouriers")} available now</small>
          </article>
          <article className="metric-card">
            <div className="metric-icon metric-amber">
              <ChartNoAxesCombined size={18} />
            </div>
            <span className="metric-label">Revenue</span>
            <strong>
              {stats.data
                ? `$${Number(metric("revenueUsd")).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                : "—"}
            </strong>
            <small>Verified Stripe payments</small>
          </article>
        </div>
      )}
      {report.isError && (
        <div className="data-state data-error">
          <span>
            <ChartNoAxesCombined size={18} />
          </span>
          <strong>Reports are unavailable.</strong>
          <p>{report.error.message}</p>
          <button onClick={() => report.refetch()}>
            <RefreshCw size={13} /> Try again
          </button>
        </div>
      )}
      {admin && stats.isError && (
        <div className="inline-api-message">
          <Activity size={14} />
          <span>{stats.error.message}</span>
          <button onClick={() => stats.refetch()}>Retry statistics</button>
        </div>
      )}
      <div className="report-chart-grid">
        <section className="content-panel report-chart">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ALL VISIBLE SHIPMENTS</span>
              <h2>Shipment status</h2>
            </div>
          </div>
          {report.isPending ? (
            <div className="chart-skeleton" />
          ) : chartData.length ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 14, left: -18, bottom: 45 }}
                >
                  <CartesianGrid stroke="#edf1eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 8, fill: "#839188" }}
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 8, fill: "#9aa69d" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f5f8f3" }}
                    contentStyle={{
                      border: "1px solid #e7ede5",
                      borderRadius: 8,
                      fontSize: 9,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#4e8b70"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="data-state">
              <span>
                <ChartNoAxesCombined size={18} />
              </span>
              <strong>No shipment data to chart.</strong>
              <p>
                Report counts will appear when shipments exist in the network.
              </p>
            </div>
          )}
        </section>
        <div className="report-side">
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">DIRECTION</span>
                <h2>Import & export</h2>
              </div>
            </div>
            {direction.length ? (
              <div className="report-breakdown">
                {direction.map((item) => (
                  <div key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="report-no-data">No direction data yet.</p>
            )}
          </section>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">SHIPMENT TYPE</span>
                <h2>Documents & parcels</h2>
              </div>
            </div>
            {type.length ? (
              <div className="report-breakdown">
                {type.map((item) => (
                  <div key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="report-no-data">No type data yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
