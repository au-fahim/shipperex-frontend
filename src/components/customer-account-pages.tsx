"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  Bell,
  Check,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { currentUserQueryKey, useCurrentUser } from "@/hooks/use-current-user";
import { apiRequest } from "@/lib/api-client";
import type { Payment, User } from "@/lib/backend";

type Notice = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
type PageList<T> = {
  data: T[];
  meta?: { page: number; limit: number; total: number };
};
const money = (value: number | string) => `$${Number(value).toFixed(2)}`;
const humanDate = (value: string) =>
  format(new Date(value), "MMM d, yyyy · h:mm a");

export function CustomerPayments() {
  const payments = useQuery({
    queryKey: ["my-payments", "page"],
    queryFn: () => apiRequest<Payment[]>("payments/my?page=1&limit=50"),
  });
  const rows = payments.data?.data ?? [];
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">TRANSACTIONS, ALL IN ONE PLACE</span>
          <h1>
            Payments <em>& receipts.</em>
          </h1>
          <p>
            See what’s paid, what’s pending, and what belongs to each shipment.
          </p>
        </div>
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR HISTORY</span>
            <h2>Recent payments</h2>
          </div>
          {payments.data?.meta && (
            <span className="records-count">
              {payments.data.meta.total} records
            </span>
          )}
        </div>
        {payments.isPending ? (
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
        ) : payments.isError ? (
          <div className="data-state data-error">
            <span>
              <CircleDollarSign size={18} />
            </span>
            <strong>Your payment history isn’t available.</strong>
            <p>{payments.error.message}</p>
            <button onClick={() => payments.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="payment-history-list">
            {rows.map((payment) => (
              <article className="payment-history-row" key={payment.id}>
                <span className="payment-history-icon">
                  <CircleDollarSign size={18} />
                </span>
                <div className="payment-history-main">
                  <strong>
                    {payment.shipment?.trackingNumber ?? "Shipment payment"}
                  </strong>
                  <small>
                    {humanDate(payment.createdAt)} · {payment.currency}
                  </small>
                </div>
                <span
                  className={`payment-status payment-${payment.status.toLowerCase()}`}
                >
                  <i />
                  {payment.status.toLowerCase()}
                </span>
                <strong className="payment-history-amount">
                  {money(payment.amountUsd)}
                </strong>
                {payment.shipment?.id && (
                  <Link
                    href={`/dashboard/shipments/${payment.shipment.id}`}
                    className="shipment-open"
                    aria-label={`View shipment ${payment.shipment.trackingNumber}`}
                  >
                    <ArrowRight size={15} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <CircleDollarSign size={20} />
            </span>
            <strong>No payment records yet.</strong>
            <p>
              When you create a shipment, your Stripe checkout and payment
              status will appear here.
            </p>
            <Link href="/dashboard/shipments/new" className="workspace-primary">
              Get a quote <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
      <div className="payment-security-note">
        <ShieldCheck size={15} />
        <span>
          <strong>Payments stay clear.</strong> Checkout is handled by Stripe in
          test mode. ShipperEx records a payment only after backend
          verification.
        </span>
      </div>
    </div>
  );
}

export function CustomerNotifications() {
  const cache = useQueryClient();
  const notices = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<Notice[]>("notifications?page=1&limit=50"),
  });
  const rows = notices.data?.data ?? [];
  const unread = rows.filter((item) => !item.readAt).length;
  async function markRead(id: string) {
    try {
      await apiRequest(`notifications/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      await cache.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not mark this update as read.",
      );
    }
  }
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">SMALL UPDATES, BIG PEACE OF MIND</span>
          <h1>
            Your <em>notifications.</em>
          </h1>
          <p>Shipment and account updates from the ShipperEx team.</p>
        </div>
        {unread > 0 && (
          <span className="unread-count">
            <i />
            {unread} unread
          </span>
        )}
      </div>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE LATEST</span>
            <h2>All updates</h2>
          </div>
        </div>
        {notices.isPending ? (
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
        ) : notices.isError ? (
          <div className="data-state data-error">
            <span>
              <Bell size={18} />
            </span>
            <strong>Updates aren’t available.</strong>
            <p>{notices.error.message}</p>
            <button onClick={() => notices.refetch()}>
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        ) : rows.length ? (
          <div className="notice-list">
            {rows.map((notice) => (
              <article
                key={notice.id}
                className={`notice-row${notice.readAt ? " read" : " unread"}`}
              >
                <span className="notice-icon">
                  <Bell size={16} />
                </span>
                <div className="notice-copy">
                  <strong>{notice.title}</strong>
                  <p>{notice.message}</p>
                  <small>
                    <Clock3 size={11} />
                    {humanDate(notice.createdAt)}
                  </small>
                </div>
                {!notice.readAt && (
                  <button
                    onClick={() => markRead(notice.id)}
                    aria-label={`Mark ${notice.title} as read`}
                  >
                    <Check size={14} /> Mark read
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="data-state">
            <span>
              <Bell size={19} />
            </span>
            <strong>You’re all caught up.</strong>
            <p>
              When there’s an update about your shipment, you’ll find it here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const profileSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(80),
  phone: z.string().min(6, "Enter a valid phone number.").max(25),
});
type ProfileValues = z.infer<typeof profileSchema>;
export function CustomerProfile() {
  const cache = useQueryClient();
  const me = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });
  useEffect(() => {
    const user = me.data?.data;
    if (user) form.reset({ name: user.name, phone: user.phone ?? "" });
  }, [me.data, form]);
  async function save(values: ProfileValues) {
    setSaving(true);
    try {
      await apiRequest<User>("users/me", {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      await cache.invalidateQueries({ queryKey: currentUserQueryKey });
      toast.success("Your profile is up to date.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }
  const user = me.data?.data;
  return (
    <div className="dashboard-page">
      <div className="welcome-row">
        <div>
          <span className="eyebrow">A FEW DETAILS ABOUT YOU</span>
          <h1>
            Your <em>profile.</em>
          </h1>
          <p>
            Keep your contact information current for pickups and deliveries.
          </p>
        </div>
      </div>
      <div className="profile-layout">
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PERSONAL DETAILS</span>
              <h2>Contact information</h2>
            </div>
          </div>
          {me.isPending ? (
            <div className="skeleton-list">
              <div className="skeleton-row">
                <i />
                <span>
                  <b />
                  <b />
                </span>
              </div>
            </div>
          ) : me.isError ? (
            <div className="data-state data-error">
              <span>
                <UserRound size={18} />
              </span>
              <strong>We couldn’t load your profile.</strong>
              <p>{me.error.message}</p>
              <button onClick={() => me.refetch()}>
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          ) : (
            <form
              className="profile-form"
              onSubmit={form.handleSubmit(save)}
              noValidate
            >
              <div className="profile-avatar">
                <span>{user?.name?.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{user?.name}</strong>
                  <small>
                    {user?.role === "STAFF"
                      ? user.staffProfile?.staffType?.toLowerCase()
                      : user?.role?.toLowerCase()}{" "}
                    account
                  </small>
                </div>
              </div>
              <div className="wizard-field">
                <label htmlFor="profile-name">
                  Full name <i>*</i>
                </label>
                <input id="profile-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <small>{form.formState.errors.name.message}</small>
                )}
              </div>
              <div className="wizard-field">
                <label htmlFor="profile-email">Email address</label>
                <input id="profile-email" value={user?.email ?? ""} disabled />
                <span className="profile-hint">
                  Email is used for sign in and can’t be changed here.
                </span>
              </div>
              <div className="wizard-field">
                <label htmlFor="profile-phone">
                  Phone number <i>*</i>
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  placeholder="Include country code"
                  {...form.register("phone")}
                />
                {form.formState.errors.phone && (
                  <small>{form.formState.errors.phone.message}</small>
                )}
              </div>
              <div className="profile-save-row">
                <span>
                  <ShieldCheck size={13} /> Your details are only shared to
                  complete your shipment.
                </span>
                <button className="workspace-primary" disabled={saving}>
                  {saving ? (
                    <LoaderCircle size={14} className="spin" />
                  ) : (
                    <>
                      <Save size={14} /> Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="profile-tip">
          <span>
            <PackageCheck size={18} />
          </span>
          <span className="eyebrow">A USEFUL REMINDER</span>
          <h2>
            Good details
            <br />
            make smooth handoffs.
          </h2>
          <p>
            Double-check your phone number so couriers can reach you about a
            pickup or delivery.
          </p>
          <div>
            <Check size={13} /> Name matches your ID
          </div>
          <div>
            <Check size={13} /> Phone has your country code
          </div>
        </aside>
      </div>
    </div>
  );
}
