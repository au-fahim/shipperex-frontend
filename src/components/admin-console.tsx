"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FormDialog } from "@/components/form-dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";
import type { User } from "@/lib/backend";
import type { LocationCatalog } from "@/lib/location-catalog";
import { fetchLocationCatalog } from "@/lib/location-catalog";

type Country = {
  id: string;
  name: string;
  iso2Code: string;
  exportZoneCode: string;
  importZoneCode: string;
  isActive?: boolean;
  deletedAt?: string | null;
};
type RateZone = { code: string; name: string; description?: string | null };
type Hub = {
  id: string;
  name: string;
  code: string;
  city: string;
  countryId: string;
  country?: Country;
  address: string;
  isActive: boolean;
};
type Rate = {
  id: string;
  direction: "EXPORT" | "IMPORT";
  zoneCode: string;
  shipmentType: "DOCUMENT" | "PARCEL";
  minWeightKg: string | number;
  maxWeightKg?: string | number | null;
  priceUsd?: string | number | null;
  perKgRateUsd?: string | number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  zone?: { name: string };
};
type UserList = User & {
  createdAt: string;
  staffProfile?: NonNullable<User["staffProfile"]> & { hub?: { name: string } };
};
const money = (value: number | string | null | undefined) =>
  value == null ? "—" : `$${Number(value).toFixed(2)}`;
const human = (value: string) => value.toLowerCase().replaceAll("_", " ");

export function AdminUsers() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryText = params.get("search") ?? "";
  const userFilter = params.get("filter") ?? "ALL";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const [search, setSearch] = useState(queryText);
  const [staffEditorOpen, setStaffEditorOpen] = useState(false);
  useEffect(() => setSearch(queryText), [queryText]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.delete("page");
      const q = next.toString();
      router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const request = useMemo(() => {
    const q = new URLSearchParams({
      page: String(page),
      limit: "10",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    if (queryText) q.set("search", queryText);
    if (userFilter !== "ALL") q.set("filter", userFilter);
    return q.toString();
  }, [page, queryText, userFilter]);
  const list = useQuery({
    queryKey: ["admin-users", request],
    queryFn: () => apiRequest<UserList[]>(`admin/users?${request}`),
  });
  const cache = useQueryClient();
  const rows = list.data?.data ?? [];
  const total = list.data?.meta?.total ?? rows.length;
  function setUserFilter(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "ALL") next.delete("filter");
    else next.set("filter", value);
    next.delete("page");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  }
  async function changeStatus(user: UserList) {
    const status = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      await apiRequest(`admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`${user.name} is now ${status.toLowerCase()}.`);
      await cache.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update account status.",
      );
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPERE X · PEOPLE & ACCESS</span>
          <h1>
            People in the <em>network.</em>
          </h1>
          <p>
            Find accounts, manage access, or provision a hub manager and
            courier.
          </p>
        </div>
        <button
          type="button"
          className="workspace-primary"
          onClick={() => setStaffEditorOpen(true)}
        >
          <UserPlus size={14} /> Add staff
        </button>
      </div>
      <section className="content-panel">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>{list.isPending ? "—" : total}</strong>
            <span>accounts</span>
          </div>
          <div className="list-controls admin-user-list-controls">
            <label className="list-search">
              <Search size={15} />
              <input
                aria-label="Search user name and email"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </label>
            <label className="status-filter">
              <select
                aria-label="Filter users by type or status"
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
              >
                <option value="ALL">All</option>
                <option value="MANAGER">Manager</option>
                <option value="CUSTOMER">Customer</option>
                <option value="COURIER">Courier</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </label>
          </div>
        </div>
        {list.isPending ? (
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
        ) : list.isError ? (
          <div className="data-state data-error">
            <span>
              <Users size={18} />
            </span>
            <strong>Couldn’t load accounts.</strong>
            <p>{list.error.message}</p>
            <button onClick={() => list.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="admin-user-list">
            {rows.map((user) => (
              <article key={user.id} className="admin-user-row">
                <span className="roster-avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="admin-user-main">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </div>
                <span className={`user-role role-${user.role.toLowerCase()}`}>
                  {user.staffProfile?.staffType
                    ? human(user.staffProfile.staffType)
                    : human(user.role)}
                </span>
                <span
                  className={`account-state account-${user.status.toLowerCase()}`}
                >
                  <i />
                  {human(user.status)}
                </span>
                <span className="admin-user-date">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </span>
                <ConfirmationDialog
                  title={
                    user.status === "ACTIVE"
                      ? "Block this account?"
                      : "Restore this account?"
                  }
                  description={
                    user.status === "ACTIVE"
                      ? `${user.name} will lose access until an administrator restores the account.`
                      : `${user.name} will regain access to the ShipperEx workspace.`
                  }
                  confirmLabel={
                    user.status === "ACTIVE"
                      ? "Block account"
                      : "Restore account"
                  }
                  destructive={user.status === "ACTIVE"}
                  onConfirm={() => changeStatus(user)}
                  trigger={
                    <button className="user-row-action">
                      {user.status === "ACTIVE" ? "Block" : "Unblock"}
                    </button>
                  }
                />
                <Link
                  href={`/admin/users/${user.id}`}
                  className="shipment-open"
                  aria-label={`View ${user.name}`}
                >
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <Users size={18} />
            </span>
            <strong>No accounts found.</strong>
            <p>
              {queryText || userFilter !== "ALL"
                ? "Try another search or filter."
                : "Accounts will appear here after registration or provisioning."}
            </p>
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
                onClick={() => {
                  const q = new URLSearchParams(params.toString());
                  q.set("page", String(page - 1));
                  router.replace(`${pathname}?${q}`);
                }}
              >
                Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / 10))}
              </span>
              <button
                disabled={page >= Math.ceil(total / 10)}
                onClick={() => {
                  const q = new URLSearchParams(params.toString());
                  q.set("page", String(page + 1));
                  router.replace(`${pathname}?${q}`);
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      <FormDialog
        open={staffEditorOpen}
        onOpenChange={setStaffEditorOpen}
        title="Create a staff account"
        description="Provision a manager or courier and assign them to an operating hub."
      >
        <StaffProvisioner
          onCancel={() => setStaffEditorOpen(false)}
          onCreated={() => setStaffEditorOpen(false)}
        />
      </FormDialog>
      <div className="workflow-callout">
        <span>
          <ShieldCheck size={17} />
        </span>
        <div>
          <strong>
            Each staff account has a clear operational assignment.
          </strong>
          <p>
            Staff accounts are created through this form so each person has a
            hub and staff type.
          </p>
        </div>
      </div>
    </div>
  );
}

const staffSchema = z.object({
  name: z.string().min(2, "Enter a full name.").max(100),
  email: z.email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[0-9]/, "Add a number."),
  phone: z.string().min(6, "Enter a valid phone number."),
  hubId: z.string().min(1, "Choose a hub."),
  staffType: z.enum(["MANAGER", "COURIER"]),
});
type StaffValues = z.infer<typeof staffSchema>;
function StaffProvisioner({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const cache = useQueryClient();
  const hubs = useQuery({
    queryKey: ["hubs", "admin-options"],
    queryFn: () => apiRequest<Hub[]>("hubs?page=1&limit=100"),
  });
  const [saving, setSaving] = useState(false);
  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      hubId: "",
      staffType: "MANAGER",
    },
  });
  const errors = form.formState.errors;
  async function submit(values: StaffValues) {
    setSaving(true);
    try {
      const { staffType, ...body } = values;
      await apiRequest(`admin/staff/${staffType.toLowerCase()}s`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success(`${staffType.toLowerCase()} account created.`);
      form.reset({
        name: "",
        email: "",
        password: "",
        phone: "",
        hubId: "",
        staffType: values.staffType,
      });
      await cache.invalidateQueries({ queryKey: ["admin-users"] });
      onCreated();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not create staff account.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="staff-provision-form"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div className="wizard-grid wizard-grid-two">
        <div className="wizard-field">
          <label htmlFor="staff-type">
            Staff type <i>*</i>
          </label>
          <SearchableSelect
            id="staff-type"
            value={form.watch("staffType")}
            onValueChange={(value) =>
              form.setValue("staffType", value as StaffValues["staffType"], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={[
              { value: "MANAGER", label: "Hub manager" },
              { value: "COURIER", label: "Courier" },
            ]}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="staff-hub">
            Assigned hub <i>*</i>
          </label>
          <SearchableSelect
            id="staff-hub"
            value={form.watch("hubId")}
            onValueChange={(value) =>
              form.setValue("hubId", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose a hub"
            aria-invalid={Boolean(errors.hubId)}
            options={(hubs.data?.data ?? []).map((hub) => ({
              value: hub.id,
              label: `${hub.name} · ${hub.city}`,
            }))}
          />
          {errors.hubId && <small>{errors.hubId.message}</small>}
          {hubs.isError && <small>{hubs.error.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="staff-name">
            Full name <i>*</i>
          </label>
          <input
            id="staff-name"
            placeholder="Staff member name"
            {...form.register("name")}
          />
          {errors.name && <small>{errors.name.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="staff-email">
            Email address <i>*</i>
          </label>
          <input
            id="staff-email"
            type="email"
            placeholder="name@example.com"
            {...form.register("email")}
          />
          {errors.email && <small>{errors.email.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="staff-password">
            Temporary password <i>*</i>
          </label>
          <input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            placeholder="Uppercase, lowercase & number"
            {...form.register("password")}
          />
          {errors.password && <small>{errors.password.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="staff-phone">
            Phone number <i>*</i>
          </label>
          <input
            id="staff-phone"
            type="tel"
            placeholder="Include country code"
            {...form.register("phone")}
          />
          {errors.phone && <small>{errors.phone.message}</small>}
        </div>
      </div>
      <div className="staff-form-submit">
        <span>
          <ShieldCheck size={13} /> Share the temporary password securely with
          the staff member.
        </span>
        <div className="form-dialog-actions">
          <button type="button" className="wizard-back" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="workspace-primary"
            disabled={saving || hubs.isPending}
          >
            {saving ? (
              <LoaderCircle size={14} className="spin" />
            ) : (
              <Plus size={14} />
            )}{" "}
            Create staff account
          </button>
        </div>
      </div>
    </form>
  );
}

export function AdminUserDetail({ id }: { id: string }) {
  const cache = useQueryClient();
  const user = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () =>
      apiRequest<UserList>(`admin/users/${encodeURIComponent(id)}`),
  });
  const item = user.data?.data;
  const [saving, setSaving] = useState(false);
  async function changeStatus() {
    if (!item) return;
    const status = item.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    setSaving(true);
    try {
      await apiRequest(`admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(`Account ${status.toLowerCase()}.`);
      await cache.invalidateQueries({ queryKey: ["admin-user", id] });
      await cache.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update account.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (user.isPending)
    return (
      <div className="detail-loading">
        <span />
        <span />
        <span />
      </div>
    );
  if (user.isError || !item)
    return (
      <div className="data-state data-error">
        <span>
          <Users size={18} />
        </span>
        <strong>User details unavailable.</strong>
        <p>{user.error?.message ?? "Account not found."}</p>
        <button onClick={() => user.refetch()}>
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  return (
    <div className="dashboard-page">
      <Link href="/admin/users" className="back-workspace">
        <ArrowRight size={14} /> All users
      </Link>
      <div className="welcome-row">
        <div>
          <span className="eyebrow">ADMIN · ACCOUNT DETAILS</span>
          <h1>
            {item.name}
            <em>.</em>
          </h1>
          <p>Created {format(new Date(item.createdAt), "MMMM d, yyyy")}</p>
        </div>
        <span className={`account-state account-${item.status.toLowerCase()}`}>
          <i />
          {human(item.status)}
        </span>
      </div>
      <div className="admin-user-detail-grid">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROFILE</span>
              <h2>Account details</h2>
            </div>
          </div>
          <div className="admin-user-detail-body">
            <div>
              <small>EMAIL ADDRESS</small>
              <strong>{item.email}</strong>
            </div>
            <div>
              <small>PHONE</small>
              <strong>{item.phone ?? "Not provided"}</strong>
            </div>
            <div>
              <small>PRIMARY ROLE</small>
              <strong>{item.role}</strong>
            </div>
            <div>
              <small>STAFF TYPE</small>
              <strong>{item.staffProfile?.staffType ?? "—"}</strong>
            </div>
            <div>
              <small>HUB</small>
              <strong>
                {item.staffProfile?.hub?.name ??
                  item.staffProfile?.hubId ??
                  "—"}
              </strong>
            </div>
            <div>
              <small>STATUS</small>
              <strong>{item.status}</strong>
            </div>
          </div>
        </section>
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ACCESS CONTROL</span>
              <h2>Account access</h2>
            </div>
          </div>
          <div className="admin-access-controls">
            <p>
              Primary roles are assigned when an account is created. Admins can
              block or restore account access here.
            </p>
            {item.role === "STAFF" && item.staffProfile && (
              <StaffHubAssignment
                userId={item.id}
                staffProfileId={item.staffProfile.id}
                staffType={item.staffProfile.staffType}
                hubId={item.staffProfile.hubId}
                currentHubName={item.staffProfile.hub?.name}
                activeTaskCount={item.staffProfile.activeTaskCount ?? 0}
              />
            )}
            <button
              className={`user-status-toggle ${item.status === "ACTIVE" ? "danger" : "safe"}`}
              disabled={saving}
              onClick={changeStatus}
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <ShieldCheck size={14} />
              )}{" "}
              {item.status === "ACTIVE"
                ? "Block account"
                : "Restore account access"}
            </button>
            <p>Blocking prevents future API access and sign-in.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

const hubAssignmentSchema = z.object({
  hubId: z.string().min(1, "Choose an active hub."),
});
type HubAssignmentValues = z.infer<typeof hubAssignmentSchema>;

function StaffHubAssignment({
  userId,
  staffProfileId,
  staffType,
  hubId: initialHubId,
  currentHubName,
  activeTaskCount,
}: {
  userId: string;
  staffProfileId: string;
  staffType: "MANAGER" | "COURIER";
  hubId: string;
  currentHubName?: string;
  activeTaskCount: number;
}) {
  const assignmentForm = useForm<HubAssignmentValues>({
    resolver: zodResolver(hubAssignmentSchema),
    defaultValues: { hubId: initialHubId },
    mode: "onTouched",
  });
  const cache = useQueryClient();
  const hubs = useQuery({
    queryKey: ["hubs", "admin-active-options"],
    queryFn: () => apiRequest<Hub[]>("hubs?page=1&limit=100&isActive=true"),
  });
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const hubId = assignmentForm.watch("hubId");

  useEffect(() => {
    assignmentForm.reset({ hubId: initialHubId });
  }, [assignmentForm, initialHubId]);

  async function saveAssignment(values: HubAssignmentValues) {
    const hasActiveCourierTasks =
      staffType === "COURIER" && activeTaskCount > 0;
    if (hasActiveCourierTasks) return;

    setSaving(true);
    try {
      const path =
        staffType === "MANAGER"
          ? `admin/staff/managers/${encodeURIComponent(staffProfileId)}/hub`
          : `couriers/${encodeURIComponent(staffProfileId)}`;
      await apiRequest(path, {
        method: "PATCH",
        body: JSON.stringify({ hubId: values.hubId }),
      });
      toast.success(
        `${staffType === "MANAGER" ? "Manager" : "Courier"} assigned hub updated.`,
      );
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-user", userId] }),
        cache.invalidateQueries({ queryKey: ["admin-users"] }),
        cache.invalidateQueries({ queryKey: ["couriers"] }),
      ]);
      setEditorOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update the staff member's assigned hub.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeHubs = hubs.data?.data ?? [];
  const currentHubIsListed = activeHubs.some((hub) => hub.id === initialHubId);

  return (
    <>
      <button
        type="button"
        className="assignment-edit-trigger"
        onClick={() => setEditorOpen(true)}
      >
        <MapPin size={14} /> Change assigned hub
      </button>
      <FormDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={`Change ${staffType === "MANAGER" ? "manager" : "courier"} hub`}
        description="Move this staff member to an active ShipperEx hub."
      >
        <form
          className="courier-hub-editor"
          onSubmit={assignmentForm.handleSubmit(saveAssignment)}
          noValidate
        >
          <label htmlFor="staff-assigned-hub">
            {staffType === "MANAGER" ? "Manager" : "Courier"} assigned hub
          </label>
          <SearchableSelect
            id="staff-assigned-hub"
            value={hubId}
            onValueChange={(value) =>
              assignmentForm.setValue("hubId", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose an active hub"
            className="assignment-search-select"
            disabled={
              saving ||
              hubs.isPending ||
              (staffType === "COURIER" && activeTaskCount > 0)
            }
            aria-invalid={Boolean(assignmentForm.formState.errors.hubId)}
            options={[
              ...(!currentHubIsListed
                ? [
                    {
                      value: initialHubId,
                      label: `${currentHubName ?? "Current hub"} · unavailable`,
                    },
                  ]
                : []),
              ...activeHubs.map((hub) => ({
                value: hub.id,
                label: `${hub.name} · ${hub.city}`,
              })),
            ]}
          />
          {assignmentForm.formState.errors.hubId && (
            <small role="alert">
              {assignmentForm.formState.errors.hubId.message}
            </small>
          )}
          {hubs.isPending && <small>Loading active hubs…</small>}
          {hubs.isError && (
            <div className="courier-hub-error">
              <small>{hubs.error.message}</small>
              <button type="button" onClick={() => hubs.refetch()}>
                Try again
              </button>
            </div>
          )}
          {staffType === "COURIER" && activeTaskCount > 0 && (
            <small>
              Complete the courier’s {activeTaskCount} active task
              {activeTaskCount === 1 ? "" : "s"} before transferring hubs.
            </small>
          )}
          <div className="form-dialog-actions">
            <button
              type="button"
              className="wizard-back"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </button>
            <button
              className="workspace-primary"
              disabled={
                saving ||
                hubs.isPending ||
                hubs.isError ||
                (staffType === "COURIER" && activeTaskCount > 0) ||
                !hubId ||
                hubId === initialHubId
              }
            >
              {saving ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <MapPin size={14} />
              )}
              Save hub assignment
            </button>
          </div>
        </form>
      </FormDialog>
    </>
  );
}

const hubSchema = z.object({
  name: z.string().min(2, "Enter a hub name.").max(100),
  code: z
    .string()
    .min(2, "Use at least 2 characters.")
    .max(20)
    .transform((value) => value.toUpperCase()),
  city: z.string().trim().min(2, "Enter a city.").max(80),
  countryId: z.string().min(1, "Choose a country."),
  address: z.string().min(5, "Enter a complete address.").max(250),
});
type HubValues = z.infer<typeof hubSchema>;
function HubEditor({
  countries,
  hub,
  onSaved,
  onCancel,
}: {
  countries: Country[];
  hub: Hub | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const cache = useQueryClient();
  const [saving, setSaving] = useState(false);
  const form = useForm<HubValues>({
    resolver: zodResolver(hubSchema),
    defaultValues: {
      name: hub?.name ?? "",
      code: hub?.code ?? "",
      city: hub?.city ?? "",
      countryId: hub?.countryId ?? "",
      address: hub?.address ?? "",
    },
  });
  const selectedCountryId = form.watch("countryId");
  const locationCatalog = useQuery({
    queryKey: ["location-catalog"],
    queryFn: fetchLocationCatalog,
    enabled: Boolean(selectedCountryId),
    staleTime: Infinity,
  });
  const selectedCountry = countries.find(
    (country) => country.id === selectedCountryId,
  );
  const citySuggestions =
    locationCatalog.data?.citiesByCountry[selectedCountry?.iso2Code ?? ""] ??
    [];
  const errors = form.formState.errors;
  async function submit(values: HubValues) {
    setSaving(true);
    try {
      await apiRequest(hub ? `hubs/${hub.id}` : "hubs", {
        method: hub ? "PATCH" : "POST",
        body: JSON.stringify(values),
      });
      toast.success(hub ? "Hub details updated." : "Hub created.");
      await cache.invalidateQueries({ queryKey: ["admin-hubs"] });
      await cache.invalidateQueries({ queryKey: ["hubs"] });
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save hub.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="resource-editor"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div className="wizard-grid wizard-grid-two">
        <div className="wizard-field">
          <label htmlFor="hub-name">
            Hub name <i>*</i>
          </label>
          <input
            id="hub-name"
            placeholder="Central dispatch hub"
            {...form.register("name")}
          />
          {errors.name && <small>{errors.name.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="hub-code">
            Hub code <i>*</i>
          </label>
          <input
            id="hub-code"
            placeholder="DAC-01"
            {...form.register("code")}
          />
          {errors.code && <small>{errors.code.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="hub-country">
            Country <i>*</i>
          </label>
          <SearchableSelect
            id="hub-country"
            value={form.watch("countryId")}
            onValueChange={(value) => {
              form.setValue("countryId", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
              if (value !== selectedCountryId) {
                form.clearErrors("city");
                form.setValue("city", "", {
                  shouldDirty: true,
                });
              }
            }}
            placeholder="Choose country"
            aria-invalid={Boolean(errors.countryId)}
            options={countries.map((country) => ({
              value: country.id,
              label: country.name,
            }))}
          />
          {errors.countryId && <small>{errors.countryId.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="hub-city">
            City <i>*</i>
          </label>
          <SearchableSelect
            id="hub-city"
            value={form.watch("city")}
            onValueChange={(value) => {
              form.setValue("city", value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            placeholder={
              !selectedCountryId
                ? "Choose a country first"
                : locationCatalog.isPending
                  ? "Loading cities…"
                  : "Choose a city"
            }
            aria-invalid={Boolean(errors.city)}
            disabled={
              !selectedCountryId ||
              locationCatalog.isPending ||
              citySuggestions.length === 0
            }
            maxOptions={80}
            options={citySuggestions.map((city) => ({
              value: city,
              label: city,
            }))}
          />
          {errors.city && <small>{errors.city.message}</small>}
          {locationCatalog.isError && (
            <small>
              {locationCatalog.error.message}{" "}
              <button type="button" onClick={() => locationCatalog.refetch()}>
                Retry
              </button>
            </small>
          )}
          {selectedCountryId &&
            !locationCatalog.isPending &&
            !locationCatalog.isError && (
              <small className="hub-city-hint">
                {citySuggestions.length
                  ? `City list for ${selectedCountry?.name ?? "this country"}.`
                  : "No city names are available for this country."}
              </small>
            )}
        </div>
        <div className="wizard-field wizard-span-two">
          <label htmlFor="hub-address">
            Street address <i>*</i>
          </label>
          <input
            id="hub-address"
            placeholder="Address used by local teams"
            {...form.register("address")}
          />
          {errors.address && <small>{errors.address.message}</small>}
        </div>
      </div>
      <div className="resource-editor-actions">
        <button type="button" className="wizard-back" onClick={onCancel}>
          Cancel
        </button>
        <button className="workspace-primary" disabled={saving}>
          {saving ? (
            <LoaderCircle size={13} className="spin" />
          ) : (
            <Check size={13} />
          )}{" "}
          {hub ? "Save changes" : "Create hub"}
        </button>
      </div>
    </form>
  );
}

export function AdminHubs() {
  const cache = useQueryClient();
  const hubs = useQuery({
    queryKey: ["admin-hubs"],
    queryFn: () => apiRequest<Hub[]>("hubs?page=1&limit=100"),
  });
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: () => apiRequest<Country[]>("countries"),
  });
  const [editor, setEditor] = useState<Hub | null | false>(false);
  const rows = hubs.data?.data ?? [];
  async function remove(hub: Hub) {
    try {
      await apiRequest(`hubs/${hub.id}`, { method: "DELETE" });
      toast.success("Hub archived.");
      await cache.invalidateQueries({ queryKey: ["admin-hubs"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not archive hub.",
      );
    }
  }
  async function toggle(hub: Hub) {
    try {
      await apiRequest(`hubs/${hub.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !hub.isActive }),
      });
      toast.success(`Hub ${hub.isActive ? "paused" : "activated"}.`);
      await cache.invalidateQueries({ queryKey: ["admin-hubs"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update hub.",
      );
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPERE X · NETWORK FOOTPRINT</span>
          <h1>
            Hubs that <em>connect us.</em>
          </h1>
          <p>
            Manage operating locations. Existing shipments keep their recorded
            route details.
          </p>
        </div>
        <button className="workspace-primary" onClick={() => setEditor(null)}>
          <Plus size={14} /> Add hub
        </button>
      </div>
      {editor !== false && (
        <FormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditor(false);
          }}
          title={editor ? "Edit hub" : "Add a hub"}
          description="Choose a supported country, then select a city from its location list."
        >
          {countries.isPending ? (
            <div className="form-dialog-message">
              Loading the active country list…
            </div>
          ) : countries.isError ? (
            <div className="form-dialog-message data-error">
              <p>{countries.error.message}</p>
              <button
                className="workspace-primary"
                onClick={() => countries.refetch()}
              >
                Try again
              </button>
            </div>
          ) : countries.data?.data.length ? (
            <HubEditor
              countries={countries.data.data}
              hub={editor}
              onCancel={() => setEditor(false)}
              onSaved={() => setEditor(false)}
            />
          ) : (
            <div className="form-dialog-message">
              Add an active country before creating a hub.
            </div>
          )}
        </FormDialog>
      )}
      {countries.isError && (
        <div className="inline-api-message">
          <MapPin size={14} />
          <span>Country list unavailable: {countries.error.message}</span>
          <button onClick={() => countries.refetch()}>Retry</button>
        </div>
      )}
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">OPERATING LOCATIONS</span>
            <h2>ShipperEx hubs</h2>
          </div>
          <span className="records-count">
            {hubs.isPending ? "—" : rows.length} hubs
          </span>
        </div>
        {hubs.isPending ? (
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
        ) : hubs.isError ? (
          <div className="data-state data-error">
            <span>
              <Building2 size={18} />
            </span>
            <strong>Hubs aren’t available.</strong>
            <p>{hubs.error.message}</p>
            <button onClick={() => hubs.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="resource-card-grid">
            {rows.map((hub) => (
              <article className="resource-card" key={hub.id}>
                <div className="resource-card-top">
                  <span className="resource-icon">
                    <Building2 size={17} />
                  </span>
                  <span
                    className={`account-state account-${hub.isActive ? "active" : "blocked"}`}
                  >
                    <i />
                    {hub.isActive ? "active" : "inactive"}
                  </span>
                </div>
                <h3>{hub.name}</h3>
                <span className="resource-code">{hub.code}</span>
                <p>
                  <MapPin size={12} />
                  {hub.city}
                  {hub.country?.name ? `, ${hub.country.name}` : ""}
                </p>
                <small>{hub.address}</small>
                <div className="resource-card-actions">
                  <button onClick={() => toggle(hub)}>
                    {hub.isActive ? "Pause hub" : "Activate hub"}
                  </button>
                  <button onClick={() => setEditor(hub)}>Edit</button>
                  <ConfirmationDialog
                    title="Archive this hub?"
                    description={`${hub.name} will be removed from active operations. Existing shipments keep their recorded route.`}
                    confirmLabel="Archive hub"
                    destructive
                    onConfirm={() => remove(hub)}
                    trigger={
                      <button aria-label={`Archive ${hub.name}`}>
                        <Trash2 size={13} />
                      </button>
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <Building2 size={19} />
            </span>
            <strong>No hubs configured.</strong>
            <p>
              Create the first operating hub after loading active countries.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const rateSchema = z
  .object({
    direction: z.enum(["EXPORT", "IMPORT"]),
    zoneCode: z.string().min(1, "Choose a rate zone."),
    shipmentType: z.enum(["DOCUMENT", "PARCEL"]),
    minWeightKg: z
      .string()
      .refine((value) => Number(value) > 0, "Enter a weight above zero."),
    maxWeightKg: z.string().optional(),
    priceUsd: z.string().optional(),
    perKgRateUsd: z.string().optional(),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (!value.priceUsd && !value.perKgRateUsd)
      context.addIssue({
        code: "custom",
        path: ["priceUsd"],
        message: "Enter a fixed price or a per-kilogram rate.",
      });
    if (
      value.maxWeightKg &&
      Number(value.maxWeightKg) < Number(value.minWeightKg)
    )
      context.addIssue({
        code: "custom",
        path: ["maxWeightKg"],
        message: "Max weight must be at least the minimum.",
      });
  });
type RateValues = z.infer<typeof rateSchema>;
function RateEditor({
  rate,
  zones,
  onCancel,
  onSaved,
}: {
  rate: Rate | null;
  zones: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const cache = useQueryClient();
  const [saving, setSaving] = useState(false);
  const form = useForm<RateValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      direction: rate?.direction ?? "EXPORT",
      zoneCode: rate?.zoneCode ?? zones[0] ?? "",
      shipmentType: rate?.shipmentType ?? "PARCEL",
      minWeightKg: String(rate?.minWeightKg ?? "0.5"),
      maxWeightKg: rate?.maxWeightKg == null ? "" : String(rate.maxWeightKg),
      priceUsd: rate?.priceUsd == null ? "" : String(rate.priceUsd),
      perKgRateUsd: rate?.perKgRateUsd == null ? "" : String(rate.perKgRateUsd),
      effectiveFrom: rate?.effectiveFrom?.slice(0, 10) ?? "",
      effectiveTo: rate?.effectiveTo?.slice(0, 10) ?? "",
    },
  });
  const errors = form.formState.errors;
  async function submit(values: RateValues) {
    setSaving(true);
    const payload = {
      direction: values.direction,
      zoneCode: values.zoneCode,
      shipmentType: values.shipmentType,
      minWeightKg: Number(values.minWeightKg),
      maxWeightKg: values.maxWeightKg ? Number(values.maxWeightKg) : null,
      priceUsd: values.priceUsd ? Number(values.priceUsd) : null,
      perKgRateUsd: values.perKgRateUsd ? Number(values.perKgRateUsd) : null,
      effectiveFrom: values.effectiveFrom
        ? new Date(values.effectiveFrom).toISOString()
        : undefined,
      effectiveTo: values.effectiveTo
        ? new Date(values.effectiveTo).toISOString()
        : null,
      isActive: true,
    };
    try {
      await apiRequest(rate ? `shipment-rates/${rate.id}` : "shipment-rates", {
        method: rate ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(rate ? "Shipment rate updated." : "Shipment rate created.");
      await cache.invalidateQueries({ queryKey: ["admin-rates"] });
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save rate.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="resource-editor"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div className="wizard-grid rate-editor-grid">
        <div className="wizard-field">
          <label htmlFor="rate-direction">Direction *</label>
          <SearchableSelect
            id="rate-direction"
            value={form.watch("direction")}
            onValueChange={(value) =>
              form.setValue("direction", value as RateValues["direction"], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={[
              { value: "EXPORT", label: "Export" },
              { value: "IMPORT", label: "Import" },
            ]}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-type">Shipment type *</label>
          <SearchableSelect
            id="rate-type"
            value={form.watch("shipmentType")}
            onValueChange={(value) =>
              form.setValue(
                "shipmentType",
                value as RateValues["shipmentType"],
                { shouldDirty: true, shouldValidate: true },
              )
            }
            options={[
              { value: "PARCEL", label: "Parcel" },
              { value: "DOCUMENT", label: "Document" },
            ]}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-zone">Rate zone *</label>
          <SearchableSelect
            id="rate-zone"
            value={form.watch("zoneCode")}
            onValueChange={(value) =>
              form.setValue("zoneCode", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose a zone"
            aria-invalid={Boolean(errors.zoneCode)}
            options={zones.map((zone) => ({ value: zone, label: zone }))}
          />
          {errors.zoneCode && <small>{errors.zoneCode.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-min">Minimum kg *</label>
          <input
            id="rate-min"
            type="number"
            step="0.5"
            {...form.register("minWeightKg")}
          />
          {errors.minWeightKg && <small>{errors.minWeightKg.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-max">Maximum kg</label>
          <input
            id="rate-max"
            type="number"
            step="0.5"
            placeholder="No limit"
            {...form.register("maxWeightKg")}
          />
          {errors.maxWeightKg && <small>{errors.maxWeightKg.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-price">Fixed slab price (USD)</label>
          <input
            id="rate-price"
            type="number"
            step="0.01"
            placeholder="Optional"
            {...form.register("priceUsd")}
          />
          {errors.priceUsd && <small>{errors.priceUsd.message}</small>}
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-per-kg">Price per kg (USD)</label>
          <input
            id="rate-per-kg"
            type="number"
            step="0.01"
            placeholder="Optional"
            {...form.register("perKgRateUsd")}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-from">Effective from</label>
          <input
            id="rate-from"
            type="date"
            {...form.register("effectiveFrom")}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="rate-to">Effective to</label>
          <input id="rate-to" type="date" {...form.register("effectiveTo")} />
        </div>
      </div>
      <div className="resource-editor-actions">
        <button type="button" className="wizard-back" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="workspace-primary"
          disabled={saving || zones.length === 0}
        >
          {saving ? (
            <LoaderCircle size={13} className="spin" />
          ) : (
            <Check size={13} />
          )}{" "}
          {rate ? "Save rate" : "Create rate"}
        </button>
      </div>
    </form>
  );
}

const countryZoneSchema = z.object({
  iso2Code: z.string().length(2, "Choose a country."),
  exportZoneCode: z.string().min(1, "Choose an export zone."),
  importZoneCode: z.string().min(1, "Choose an import zone."),
});
type CountryZoneValues = z.infer<typeof countryZoneSchema>;

function CountryZoneEditor({
  country,
  countries,
  existingCountries,
  isCountriesLoading,
  zones,
  onCancel,
  onSaved,
}: {
  country: Country | null;
  countries: LocationCatalog["countries"];
  existingCountries: Country[];
  isCountriesLoading: boolean;
  zones: RateZone[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const cache = useQueryClient();
  const [saving, setSaving] = useState(false);
  const form = useForm<CountryZoneValues>({
    resolver: zodResolver(countryZoneSchema),
    defaultValues: {
      iso2Code: country?.iso2Code ?? "",
      exportZoneCode: country?.exportZoneCode ?? zones[0]?.code ?? "",
      importZoneCode: country?.importZoneCode ?? zones[0]?.code ?? "",
    },
  });
  const errors = form.formState.errors;
  const usedCountryCodes = new Set(
    existingCountries.map((item) => item.iso2Code),
  );
  const availableCountries = countries.filter(
    (item) =>
      !usedCountryCodes.has(item.iso2Code) ||
      item.iso2Code === country?.iso2Code,
  );

  async function submit(values: CountryZoneValues) {
    const selected = countries.find(
      (item) => item.iso2Code === values.iso2Code,
    );
    const name = country?.name ?? selected?.name;
    if (!name) {
      toast.error("Choose a country from the location catalog.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        iso2Code: values.iso2Code,
        exportZoneCode: values.exportZoneCode,
        importZoneCode: values.importZoneCode,
      };
      await apiRequest(country ? `countries/${country.id}` : "countries", {
        method: country ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(
        country
          ? "Country rate zones updated."
          : "Country added to rate zones.",
      );
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-countries"] }),
        cache.invalidateQueries({ queryKey: ["countries"] }),
        cache.invalidateQueries({ queryKey: ["admin-rates"] }),
      ]);
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save country.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="resource-editor"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <div className="wizard-grid wizard-grid-two">
        <div className="wizard-field">
          <label htmlFor="country-zone-country">
            Country <i>*</i>
          </label>
          <SearchableSelect
            id="country-zone-country"
            value={form.watch("iso2Code")}
            onValueChange={(value) =>
              form.setValue("iso2Code", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose a country"
            disabled={Boolean(country) || isCountriesLoading}
            aria-invalid={Boolean(errors.iso2Code)}
            options={availableCountries.map((item) => ({
              value: item.iso2Code,
              label: item.name,
              keywords: item.iso2Code,
            }))}
            maxOptions={80}
          />
          {errors.iso2Code && <small>{errors.iso2Code.message}</small>}
          {country && (
            <small className="hub-city-hint">
              Country identity and ISO code stay fixed to preserve shipment
              references.
            </small>
          )}
        </div>
        <div className="wizard-field">
          <label htmlFor="country-zone-export">
            Export rate zone <i>*</i>
          </label>
          <SearchableSelect
            id="country-zone-export"
            value={form.watch("exportZoneCode")}
            onValueChange={(value) =>
              form.setValue("exportZoneCode", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose export zone"
            aria-invalid={Boolean(errors.exportZoneCode)}
            options={zones.map((zone) => ({
              value: zone.code,
              label: `${zone.name} · ${zone.code}`,
            }))}
          />
          {errors.exportZoneCode && (
            <small>{errors.exportZoneCode.message}</small>
          )}
        </div>
        <div className="wizard-field wizard-span-two">
          <label htmlFor="country-zone-import">
            Import rate zone <i>*</i>
          </label>
          <SearchableSelect
            id="country-zone-import"
            value={form.watch("importZoneCode")}
            onValueChange={(value) =>
              form.setValue("importZoneCode", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder="Choose import zone"
            aria-invalid={Boolean(errors.importZoneCode)}
            options={zones.map((zone) => ({
              value: zone.code,
              label: `${zone.name} · ${zone.code}`,
            }))}
          />
          {errors.importZoneCode && (
            <small>{errors.importZoneCode.message}</small>
          )}
        </div>
      </div>
      <div className="resource-editor-actions">
        <button type="button" className="wizard-back" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="workspace-primary"
          disabled={saving || zones.length === 0 || isCountriesLoading}
        >
          {saving ? (
            <LoaderCircle size={13} className="spin" />
          ) : (
            <Check size={13} />
          )}
          {country ? "Save country zones" : "Add country"}
        </button>
      </div>
    </form>
  );
}

export function AdminRates() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const pageSize = 15;
  const direction = params.get("direction") ?? "";
  const type = params.get("shipmentType") ?? "";
  const query = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (direction) query.set("direction", direction);
  if (type) query.set("shipmentType", type);
  const cache = useQueryClient();
  const rates = useQuery({
    queryKey: ["admin-rates", direction, type, page],
    queryFn: () => apiRequest<Rate[]>(`shipment-rates?${query}`),
  });
  const [editor, setEditor] = useState<Rate | null | false>(false);
  const rateZones = useQuery({
    queryKey: ["rate-zones"],
    queryFn: () => apiRequest<RateZone[]>("rate-zones"),
  });
  const rows: Rate[] = rates.data?.data ?? [];
  const total = rates.data?.meta?.total ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const zoneOptions: RateZone[] = rateZones.data?.data ?? [];
  const zones = zoneOptions.map((zone) => zone.code);
  useEffect(() => {
    if (
      rates.isPending ||
      rates.isError ||
      rates.data?.meta?.total == null ||
      page <= pageCount
    ) {
      return;
    }
    const q = new URLSearchParams(params.toString());
    if (pageCount > 1) q.set("page", String(pageCount));
    else q.delete("page");
    const search = q.toString();
    router.replace(`/admin/rates${search ? `?${search}` : ""}`, {
      scroll: false,
    });
  }, [
    page,
    pageCount,
    params,
    pathname,
    rates.data?.meta?.total,
    rates.isError,
    rates.isPending,
    router,
  ]);
  function setFilter(key: string, value: string) {
    const q = new URLSearchParams(params.toString());
    if (value) q.set(key, value);
    else q.delete(key);
    q.delete("page");
    const search = q.toString();
    router.replace(`/admin/rates${search ? `?${search}` : ""}`, {
      scroll: false,
    });
  }
  function goPage(nextPage: number) {
    const q = new URLSearchParams(params.toString());
    q.set("page", String(nextPage));
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }
  async function remove(rate: Rate) {
    try {
      await apiRequest(`shipment-rates/${rate.id}`, { method: "DELETE" });
      toast.success(
        "Rate archived. Existing shipment snapshots are unchanged.",
      );
      await cache.invalidateQueries({ queryKey: ["admin-rates"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not archive rate.",
      );
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPERE X · PRICING RULES</span>
          <h1>
            Clear rates for <em>every route.</em>
          </h1>
          <p>Manage pricing bands used by the live quote and shipment flows.</p>
        </div>
        <button className="workspace-primary" onClick={() => setEditor(null)}>
          <Plus size={14} /> Add rate
        </button>
      </div>
      {editor !== false && (
        <FormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditor(false);
          }}
          title={editor ? "Edit shipment rate" : "Add shipment rate"}
          description="Set the pricing band and validity dates for the selected rate zone."
        >
          {rateZones.isPending ? (
            <div className="form-dialog-message">
              Loading the rate-zone list…
            </div>
          ) : rateZones.isError ? (
            <div className="form-dialog-message data-error">
              <p>{rateZones.error.message}</p>
              <button
                className="workspace-primary"
                onClick={() => rateZones.refetch()}
              >
                Try again
              </button>
            </div>
          ) : (
            <RateEditor
              rate={editor}
              zones={zones}
              onCancel={() => setEditor(false)}
              onSaved={() => setEditor(false)}
            />
          )}
        </FormDialog>
      )}
      <section className="content-panel">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>{rates.isPending ? "—" : total}</strong>
            <span>rates</span>
          </div>
          <div className="list-controls">
            <div className="status-filter">
              <SearchableSelect
                value={direction}
                onValueChange={(value) => setFilter("direction", value)}
                aria-label="Filter rates by direction"
                placeholder="All directions"
                options={[
                  { value: "", label: "All directions" },
                  { value: "EXPORT", label: "Export" },
                  { value: "IMPORT", label: "Import" },
                ]}
              />
            </div>
            <div className="status-filter">
              <SearchableSelect
                value={type}
                onValueChange={(value) => setFilter("shipmentType", value)}
                aria-label="Filter by shipment type"
                placeholder="All types"
                options={[
                  { value: "", label: "All types" },
                  { value: "PARCEL", label: "Parcel" },
                  { value: "DOCUMENT", label: "Document" },
                ]}
              />
            </div>
          </div>
        </div>
        {rates.isPending ? (
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
        ) : rates.isError ? (
          <div className="data-state data-error">
            <span>
              <RefreshCw size={18} />
            </span>
            <strong>Rate catalog unavailable.</strong>
            <p>{rates.error.message}</p>
            <button onClick={() => rates.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="rate-table-wrap">
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Route pricing</th>
                  <th>Weight band</th>
                  <th>Rate</th>
                  <th>Effective</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((rate: Rate) => (
                  <tr key={rate.id}>
                    <td>
                      <strong>
                        {rate.direction.toLowerCase()} ·{" "}
                        {rate.shipmentType.toLowerCase()}
                      </strong>
                      <small>
                        {rate.zone?.name ?? rate.zoneCode} · {rate.zoneCode}
                      </small>
                    </td>
                    <td>
                      {rate.minWeightKg} kg – {rate.maxWeightKg ?? "∞"} kg
                    </td>
                    <td>
                      {rate.priceUsd != null
                        ? money(rate.priceUsd)
                        : `${money(rate.perKgRateUsd)} / kg`}
                    </td>
                    <td>
                      {format(new Date(rate.effectiveFrom), "MMM d, yyyy")}
                      {rate.effectiveTo && (
                        <small>
                          Until{" "}
                          {format(new Date(rate.effectiveTo), "MMM d, yyyy")}
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        className={`account-state account-${rate.isActive ? "active" : "blocked"}`}
                      >
                        <i />
                        {rate.isActive ? "active" : "inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="rate-actions">
                        <button onClick={() => setEditor(rate)}>Edit</button>
                        <ConfirmationDialog
                          title="Archive this rate?"
                          description={`${rate.direction.toLowerCase()} ${rate.shipmentType.toLowerCase()} pricing in ${rate.zoneCode} will stop applying to new quotes.`}
                          confirmLabel="Archive rate"
                          destructive
                          onConfirm={() => remove(rate)}
                          trigger={
                            <button
                              aria-label={`Archive ${rate.zoneCode} rate`}
                            >
                              <Trash2 size={13} />
                            </button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="data-state">
            <span>
              <CircleDollarSign size={19} />
            </span>
            <strong>No matching rates found.</strong>
            <p>Create a rate for a valid country zone or adjust filters.</p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="shipment-pagination">
            <span>
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)} of {total}
            </span>
            <div>
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                disabled={page >= pageCount}
                onClick={() => goPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="workflow-callout">
        <span>
          <ShieldCheck size={17} />
        </span>
        <div>
          <strong>Rate changes only affect new quotes.</strong>
          <p>Existing shipments keep their saved price and rate snapshots.</p>
        </div>
      </div>
    </div>
  );
}

export function AdminCountries() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cache = useQueryClient();
  const [countryEditor, setCountryEditor] = useState<Country | null | false>(
    false,
  );
  const countryZoneFilter = params.get("zone") ?? "";
  const countrySearch = params.get("search") ?? "";
  const countryPage = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const [countrySearchInput, setCountrySearchInput] = useState(countrySearch);
  const rateZones = useQuery({
    queryKey: ["rate-zones"],
    queryFn: () => apiRequest<RateZone[]>("rate-zones"),
  });
  const managedCountries = useQuery({
    queryKey: ["admin-countries"],
    queryFn: () => apiRequest<Country[]>("countries/admin"),
  });
  const locationCatalog = useQuery({
    queryKey: ["location-catalog"],
    queryFn: fetchLocationCatalog,
    enabled: countryEditor !== false,
    staleTime: Infinity,
  });
  useEffect(() => setCountrySearchInput(countrySearch), [countrySearch]);
  useEffect(() => {
    if (countrySearchInput.trim() === countrySearch) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (countrySearchInput.trim())
        next.set("search", countrySearchInput.trim());
      else next.delete("search");
      next.delete("page");
      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [countrySearch, countrySearchInput, pathname, params, router]);
  const zoneOptions: RateZone[] = rateZones.data?.data ?? [];
  const normalizedSearch = countrySearch.trim().toLocaleLowerCase();
  const pageSize = 18;
  const countryRows: Country[] = (managedCountries.data?.data ?? []).filter(
    (country: Country) => {
      const matchesSearch =
        !normalizedSearch ||
        country.name.toLocaleLowerCase().includes(normalizedSearch) ||
        country.iso2Code.toLocaleLowerCase().includes(normalizedSearch);
      const matchesZone =
        !countryZoneFilter ||
        country.exportZoneCode === countryZoneFilter ||
        country.importZoneCode === countryZoneFilter;
      return matchesSearch && matchesZone;
    },
  );
  const pageCount = Math.max(1, Math.ceil(countryRows.length / pageSize));
  const activePage = Math.min(countryPage, pageCount);
  useEffect(() => {
    if (countryPage <= pageCount) return;
    const next = new URLSearchParams(params.toString());
    if (pageCount > 1) next.set("page", String(pageCount));
    else next.delete("page");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }, [countryPage, pageCount, params, pathname, router]);

  function updateCountryParam(name: "zone" | "page", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "page") next.delete("page");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }
  const firstVisibleCountry = (activePage - 1) * pageSize;
  const visibleCountryRows = countryRows.slice(
    firstVisibleCountry,
    firstVisibleCountry + pageSize,
  );

  async function archiveCountry(country: Country) {
    try {
      await apiRequest(`countries/${country.id}`, { method: "DELETE" });
      toast.success(`${country.name} archived from the active country list.`);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-countries"] }),
        cache.invalidateQueries({ queryKey: ["countries"] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not archive country.",
      );
    }
  }

  async function restoreCountry(country: Country) {
    try {
      await apiRequest(`countries/${country.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      toast.success(`${country.name} restored to the active country list.`);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin-countries"] }),
        cache.invalidateQueries({ queryKey: ["countries"] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not restore country.",
      );
    }
  }

  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">COUNTRY COVERAGE</span>
          <h1>
            Countries by <em>rate zone.</em>
          </h1>
          <p>
            Manage the countries available to shipment routes and their export
            and import pricing zones.
          </p>
        </div>
        <button
          className="workspace-primary"
          onClick={() => setCountryEditor(null)}
          disabled={
            rateZones.isPending || rateZones.isError || zoneOptions.length === 0
          }
        >
          <Plus size={14} /> Add country
        </button>
      </div>
      {countryEditor !== false && (
        <FormDialog
          open
          onOpenChange={(open) => {
            if (!open) setCountryEditor(false);
          }}
          title={countryEditor ? "Update country rate zones" : "Add a country"}
          description="Choose a country with a preloaded city list and assign its export and import zones."
        >
          {locationCatalog.isPending ||
          managedCountries.isPending ||
          rateZones.isPending ? (
            <div className="form-dialog-message">
              Loading the country and rate-zone lists…
            </div>
          ) : locationCatalog.isError ? (
            <div className="form-dialog-message data-error">
              <p>{locationCatalog.error.message}</p>
              <button
                className="workspace-primary"
                onClick={() => locationCatalog.refetch()}
              >
                Try again
              </button>
            </div>
          ) : managedCountries.isError ? (
            <div className="form-dialog-message data-error">
              <p>{managedCountries.error.message}</p>
              <button
                className="workspace-primary"
                onClick={() => managedCountries.refetch()}
              >
                Try again
              </button>
            </div>
          ) : rateZones.isError ? (
            <div className="form-dialog-message data-error">
              <p>{rateZones.error.message}</p>
              <button
                className="workspace-primary"
                onClick={() => rateZones.refetch()}
              >
                Try again
              </button>
            </div>
          ) : locationCatalog.data ? (
            <CountryZoneEditor
              country={countryEditor}
              countries={locationCatalog.data.countries.filter(
                (item: LocationCatalog["countries"][number]) =>
                  Boolean(
                    locationCatalog.data?.citiesByCountry[item.iso2Code]
                      ?.length,
                  ),
              )}
              existingCountries={managedCountries.data?.data ?? []}
              isCountriesLoading={managedCountries.isPending}
              zones={zoneOptions}
              onCancel={() => setCountryEditor(false)}
              onSaved={() => setCountryEditor(false)}
            />
          ) : null}
        </FormDialog>
      )}
      <section className="content-panel country-zone-panel">
        <div className="panel-heading country-zone-heading">
          <div>
            <span className="eyebrow">COUNTRY DIRECTORY</span>
            <h2>Country assignments</h2>
          </div>
          <span className="records-count">
            {managedCountries.isPending ? "—" : countryRows.length} countries
          </span>
        </div>
        <div className="country-zone-toolbar">
          <p>
            Export and import assignments determine which rate zone applies to
            new quotes.
          </p>
          <div className="country-zone-controls">
            <label className="country-directory-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search countries</span>
              <input
                type="search"
                value={countrySearchInput}
                onChange={(event) => setCountrySearchInput(event.target.value)}
                placeholder="Search country or code"
              />
            </label>
            <div className="status-filter">
              <SearchableSelect
                value={countryZoneFilter}
                onValueChange={(value) => updateCountryParam("zone", value)}
                aria-label="Filter countries by rate zone"
                placeholder="All rate zones"
                options={[
                  { value: "", label: "All rate zones" },
                  ...zoneOptions.map((zone: RateZone) => ({
                    value: zone.code,
                    label: `${zone.name} · ${zone.code}`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>
        {managedCountries.isPending || rateZones.isPending ? (
          <div className="skeleton-list">
            {[0, 1, 2].map((index) => (
              <div className="skeleton-row" key={index}>
                <i />
                <span>
                  <b />
                  <b />
                </span>
                <em />
              </div>
            ))}
          </div>
        ) : managedCountries.isError ? (
          <div className="data-state data-error">
            <span>
              <MapPin size={18} />
            </span>
            <strong>Country assignments couldn’t load.</strong>
            <p>{managedCountries.error.message}</p>
            <button onClick={() => managedCountries.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rateZones.isError ? (
          <div className="data-state data-error">
            <span>
              <MapPin size={18} />
            </span>
            <strong>Rate zones couldn’t load.</strong>
            <p>{rateZones.error.message}</p>
            <button onClick={() => rateZones.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : countryRows.length ? (
          <>
            <div className="resource-card-grid country-zone-grid">
              {visibleCountryRows.map((country: Country) => {
                const active = country.isActive !== false && !country.deletedAt;
                const exportZone = zoneOptions.find(
                  (zone: RateZone) => zone.code === country.exportZoneCode,
                );
                const importZone = zoneOptions.find(
                  (zone: RateZone) => zone.code === country.importZoneCode,
                );
                return (
                  <article
                    className="resource-card country-zone-card"
                    key={country.id}
                  >
                    <div className="resource-card-top">
                      <span className="resource-code">{country.iso2Code}</span>
                      <span
                        className={`account-state account-${active ? "active" : "blocked"}`}
                      >
                        <i />
                        {active ? "active" : "archived"}
                      </span>
                    </div>
                    <h3>{country.name}</h3>
                    <div className="country-zone-assignment">
                      <small>EXPORT</small>
                      <strong>
                        {exportZone?.name ?? country.exportZoneCode} ·{" "}
                        {country.exportZoneCode}
                      </strong>
                    </div>
                    <div className="country-zone-assignment">
                      <small>IMPORT</small>
                      <strong>
                        {importZone?.name ?? country.importZoneCode} ·{" "}
                        {country.importZoneCode}
                      </strong>
                    </div>
                    <div className="country-zone-actions">
                      <button onClick={() => setCountryEditor(country)}>
                        Edit assignments
                      </button>
                      {active ? (
                        <ConfirmationDialog
                          title={`Archive ${country.name}?`}
                          description="The country will stop appearing in new shipment forms. Existing shipments and their saved route history will remain intact."
                          confirmLabel="Archive country"
                          destructive
                          onConfirm={() => archiveCountry(country)}
                          trigger={
                            <button className="country-archive-action">
                              Archive
                            </button>
                          }
                        />
                      ) : (
                        <button onClick={() => restoreCountry(country)}>
                          Restore
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <nav
              className="country-directory-pagination"
              aria-label="Country directory pages"
            >
              <span>
                Showing {firstVisibleCountry + 1}–
                {Math.min(firstVisibleCountry + pageSize, countryRows.length)}{" "}
                of {countryRows.length}
              </span>
              <div>
                <button
                  type="button"
                  aria-label="Previous country page"
                  onClick={() =>
                    updateCountryParam(
                      "page",
                      String(Math.max(1, activePage - 1)),
                    )
                  }
                  disabled={activePage <= 1}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span
                  className="country-directory-page-count"
                  aria-live="polite"
                >
                  Page {activePage} of {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next country page"
                  onClick={() =>
                    updateCountryParam(
                      "page",
                      String(Math.min(pageCount, activePage + 1)),
                    )
                  }
                  disabled={activePage >= pageCount}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          </>
        ) : (
          <div className="data-state">
            <span>
              <MapPin size={18} />
            </span>
            <strong>
              {countrySearch || countryZoneFilter
                ? "No countries match these filters."
                : "No countries are configured."}
            </strong>
            <p>
              {countrySearch || countryZoneFilter
                ? "Try another country name, country code, or rate zone."
                : "Add a country and set its export and import rate zones to make it available for new shipments."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

type AuditLog = {
  id: string;
  actor?: { name: string; email: string; role: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  before?: unknown;
  after?: unknown;
};
export function AdminAuditLogs() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const [action, setAction] = useState(params.get("action") ?? "");
  const activeAction = params.get("action") ?? "";
  useEffect(() => setAction(activeAction), [activeAction]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = new URLSearchParams(params.toString());
      if (action.trim()) q.set("action", action.trim());
      else q.delete("action");
      q.delete("page");
      const query = q.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [action]);
  const query = new URLSearchParams({ page: String(page), limit: "15" });
  if (activeAction) query.set("action", activeAction);
  const logs = useQuery({
    queryKey: ["audit-logs", query.toString()],
    queryFn: () => apiRequest<AuditLog[]>(`admin/audit-logs?${query}`),
  });
  const rows = logs.data?.data ?? [];
  const total = logs.data?.meta?.total ?? rows.length;
  function goPage(nextPage: number) {
    const q = new URLSearchParams(params.toString());
    q.set("page", String(nextPage));
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SHIPPERE X · ADMIN ACTIVITY</span>
          <h1>
            The <em>audit trail.</em>
          </h1>
          <p>
            Follow administrative and workflow changes recorded by the backend.
          </p>
        </div>
      </div>
      <section className="content-panel">
        <div className="shipments-toolbar">
          <div className="shipments-count">
            <strong>{logs.isPending ? "—" : total}</strong>
            <span>audit records</span>
          </div>
          <label className="list-search">
            <Search size={15} />
            <input
              placeholder="Filter exact action name"
              aria-label="Filter by exact audit action"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            />
            {action && (
              <button
                aria-label="Clear action filter"
                onClick={() => setAction("")}
              >
                <X size={13} />
              </button>
            )}
          </label>
        </div>
        {logs.isPending ? (
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
        ) : logs.isError ? (
          <div className="data-state data-error">
            <span>
              <ShieldCheck size={18} />
            </span>
            <strong>Audit trail unavailable.</strong>
            <p>{logs.error.message}</p>
            <button onClick={() => logs.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="audit-list">
            {rows.map((log) => (
              <details className="audit-row" key={log.id}>
                <summary>
                  <span className="audit-action">
                    <ShieldCheck size={15} />
                    <span>
                      <strong>
                        {log.action.replaceAll("_", " ").toLowerCase()}
                      </strong>
                      <small>
                        {log.entityType} · {log.entityId}
                      </small>
                    </span>
                  </span>
                  <span className="audit-actor">
                    {log.actor?.name ?? "System"}
                    <small>{log.actor?.email ?? "Automated event"}</small>
                  </span>
                  <time>
                    {format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}
                  </time>
                  <ChevronToggle />
                </summary>
                <div className="audit-details">
                  <div>
                    <strong>Before</strong>
                    <pre>{JSON.stringify(log.before ?? null, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>After</strong>
                    <pre>{JSON.stringify(log.after ?? null, null, 2)}</pre>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <ShieldCheck size={18} />
            </span>
            <strong>No audit events match.</strong>
            <p>
              {activeAction
                ? "Try another action name."
                : "Changes will be recorded here as work moves through ShipperEx."}
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="shipment-pagination">
            <span>
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of{" "}
              {total}
            </span>
            <div>
              <button disabled={page <= 1} onClick={() => goPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / 15))}
              </span>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => goPage(page + 1)}
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

function ChevronToggle() {
  return (
    <span className="audit-chevron">
      <ChevronDown size={14} />
    </span>
  );
}
