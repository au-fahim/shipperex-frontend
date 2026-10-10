"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  PackageOpen,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { User } from "@/lib/backend";

type WorkspaceRole = "customer" | "admin" | "manager" | "courier";
const navMap: Record<
  WorkspaceRole,
  { label: string; href: string; icon: typeof LayoutDashboard }[]
> = {
  customer: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My shipments", href: "/dashboard/shipments", icon: PackageOpen },
    { label: "Payments", href: "/dashboard/payments", icon: CircleDollarSign },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { label: "My profile", href: "/dashboard/profile", icon: Settings2 },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users & staff", href: "/admin/users", icon: Users },
    { label: "Hubs", href: "/admin/hubs", icon: Building2 },
    { label: "Countries", href: "/admin/countries", icon: Globe2 },
    { label: "Shipment rates", href: "/admin/rates", icon: CircleDollarSign },
    { label: "Reports", href: "/admin/reports", icon: ChartNoAxesCombined },
    { label: "Audit trail", href: "/admin/audit-logs", icon: ShieldCheck },
  ],
  manager: [
    { label: "Hub overview", href: "/manager", icon: LayoutDashboard },
    {
      label: "Shipment queue",
      href: "/manager/shipments",
      icon: ClipboardList,
    },
    { label: "Couriers", href: "/manager/couriers", icon: Truck },
    { label: "Reports", href: "/manager/reports", icon: ChartNoAxesCombined },
  ],
  courier: [
    { label: "My route", href: "/courier", icon: LayoutDashboard },
    { label: "My tasks", href: "/courier/tasks", icon: ClipboardList },
    { label: "My profile", href: "/courier/profile", icon: Settings2 },
  ],
};
const roleLabel: Record<WorkspaceRole, string> = {
  customer: "Customer space",
  admin: "Control room",
  manager: "Hub operations",
  courier: "Courier route",
};
const expectedRole: Record<
  WorkspaceRole,
  { role: User["role"]; staffType?: "MANAGER" | "COURIER" }
> = {
  customer: { role: "CUSTOMER" },
  admin: { role: "ADMIN" },
  manager: { role: "STAFF", staffType: "MANAGER" },
  courier: { role: "STAFF", staffType: "COURIER" },
};

export function WorkspaceShell({
  role,
  children,
}: {
  role: WorkspaceRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const cache = useQueryClient();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const me = useCurrentUser({ staleTime: 60_000 });
  const user = me.data?.data;
  const needsStaffType = expectedRole[role].staffType;
  const authorized =
    user?.role === expectedRole[role].role &&
    (!needsStaffType || user.staffProfile?.staffType === needsStaffType);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      cache.clear();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    profileMenuRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const menu = profileMenuRef.current;
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        menu.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      const menu = profileMenuRef.current;
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (me.isPending)
    return (
      <main className="workspace-loading">
        <div className="loading-brand">
            <span className="brand-mark">
              <PackageOpen size={18} />
            </span>
            ShipperEx
        </div>
        <div className="loading-panel">
          <span />
          <span />
          <span />
        </div>
        <p>Getting your workspace ready…</p>
      </main>
    );
  if (me.isError)
    return (
      <main className="workspace-message">
        <div className="workspace-message-card">
          <span className="message-icon">
            <Activity size={22} />
          </span>
          <h1>We couldn’t reach your account.</h1>
          <p>
            {me.error instanceof Error
              ? me.error.message
              : "Check your connection and try again."}
          </p>
          <button onClick={() => me.refetch()} className="workspace-primary">
            Try again <ArrowRight size={15} />
          </button>
          <button onClick={signOut} className="workspace-text-button">
            Sign out
          </button>
        </div>
      </main>
    );
  if (!user)
    return (
      <main className="workspace-message">
        <div className="workspace-message-card">
          <span className="message-icon">
            <Activity size={22} />
          </span>
          <h1>We couldn’t verify your workspace.</h1>
          <p>Your account details were incomplete. Please try again.</p>
          <button onClick={() => me.refetch()} className="workspace-primary">
            Try again <ArrowRight size={15} />
          </button>
          <button onClick={signOut} className="workspace-text-button">
            Sign out
          </button>
        </div>
      </main>
    );
  if (!authorized)
    return (
      <main className="workspace-message">
        <div className="workspace-message-card">
          <span className="message-icon">
            <ShieldCheck size={22} />
          </span>
          <h1>This workspace is for another role.</h1>
          <p>
            You’re signed in as{" "}
            {user?.role === "STAFF"
              ? user.staffProfile?.staffType?.toLowerCase()
              : user?.role?.toLowerCase()}
            . Switch to the correct demo account to continue.
          </p>
          <Link
            href={
              user?.role === "ADMIN"
                ? "/admin"
                : user?.role === "CUSTOMER"
                  ? "/dashboard"
                  : user?.staffProfile?.staffType === "COURIER"
                    ? "/courier"
                    : "/manager"
            }
            className="workspace-primary"
          >
            Go to my workspace <ArrowRight size={15} />
          </Link>
          <button onClick={signOut} className="workspace-text-button">
            Sign out
          </button>
        </div>
      </main>
    );

  const links = navMap[role];
  const active = (href: string) =>
    href === `/${role === "customer" ? "dashboard" : role}`
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <div className="workspace-app">
      <div className={`workspace-sidebar-wrap${menuOpen ? " is-open" : ""}`}>
        <aside className="workspace-sidebar">
          <Link href="/" className="workspace-brand">
            <span className="brand-mark">
              <PackageOpen size={18} />
            </span>
            <span>
              Shipper<span className="brand-dot">Ex</span>
            </span>
          </Link>
          {/* <div className="workspace-switch">
            <span className="workspace-switch-icon">
              <Globe2 size={15} />
            </span>
            <span>
              <small>YOUR SPACE</small>
              <strong>{roleLabel[role]}</strong>
            </span>
            <ChevronDown size={14} />
          </div> */}
          <div className="workspace-nav-label">WORKSPACE</div>
          <nav
            className="workspace-nav"
            aria-label={`${roleLabel[role]} navigation`}
          >
            {links.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`workspace-nav-link${active(href) ? " active" : ""}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {label === "Notifications" && <span className="nav-dot" />}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="support-card">
              <span className="support-orb">
                <PackageCheck size={15} />
              </span>
              <strong>Moving something?</strong>
              <span>Keep every shipment close at hand.</span>
              <Link
                href={
                  role === "customer" ? "/dashboard/shipments/new" : "/track"
                }
              >
                {role === "customer" ? "Book a shipment" : "Track a parcel"}
                <ArrowRight size={12} />
              </Link>
            </div>
            <button
              className="workspace-nav-link sidebar-signout"
              onClick={signOut}
              disabled={signingOut}
            >
              <LogOut size={16} />
              <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </aside>
        <button
          className="mobile-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      </div>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <button
            className="mobile-menu focus-ring"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link
            href="/"
            className="brand workspace-mobile-brand"
            aria-label="ShipperEx home"
          >
            <span className="brand-mark">
              <PackageOpen size={17} />
            </span>
            <span>
              Shipper<span className="brand-dot">Ex</span>
            </span>
          </Link>
          <div className="crumbs">
            <Link href="/">ShipperEx</Link>
            <ArrowRight size={12} />
            <span>{roleLabel[role]}</span>
          </div>
          <div className="topbar-actions">
            <Link href="/track" className="topbar-track">
              <Search size={15} /> <span>Track a parcel</span>
            </Link>
            {role === "customer" && (
              <Link
                href="/dashboard/notifications"
                className="notification-button"
                aria-label="Notifications"
              >
                <Bell size={17} />
                <i />
              </Link>
            )}
            <details ref={profileMenuRef} className="profile-menu">
              <summary
                className="profile-menu-trigger focus-ring"
                aria-label={`Open ${roleLabel[role]} profile menu`}
              >
                <span className="profile-menu-avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="profile-menu-name">{user.name}</span>
                <span className="profile-menu-chevron" aria-hidden="true">
                  <ChevronDown size={15} strokeWidth={2} />
                </span>
              </summary>
              <div className="profile-dropdown">
                <div className="profile-dropdown-identity">
                  <span className="profile-menu-avatar">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>
                      {roleLabel[role]} · {user.email}
                    </small>
                  </span>
                </div>
                <nav
                  aria-label={`${roleLabel[role]} shortcuts`}
                  className="profile-dropdown-links"
                >
                  {[
                    ...navMap[role],
                    {
                      label: "Track a shipment",
                      href: "/track",
                      icon: PackageOpen,
                    },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() =>
                        profileMenuRef.current?.removeAttribute("open")
                      }
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                      <ArrowRight size={13} />
                    </Link>
                  ))}
                </nav>
                <button
                  className="profile-signout"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                  <LogOut size={15} />
                </button>
              </div>
            </details>
          </div>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
