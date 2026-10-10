"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Globe2,
  LayoutDashboard,
  LogOut,
  PackageOpen,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import type { User } from "@/lib/backend";
import { useCurrentUser } from "@/hooks/use-current-user";

const links = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/track", label: "Track a shipment" },
];

export function SiteHeader({ sticky = false }: { sticky?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const me = useCurrentUser({ retry: false, staleTime: 60_000 });
  const user = me.data?.data;
  const workspace =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "STAFF"
        ? user.staffProfile?.staffType === "COURIER"
          ? "/courier"
          : "/manager"
        : "/dashboard";
  const roleName =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "STAFF"
        ? user.staffProfile?.staffType === "COURIER"
          ? "Courier"
          : "Hub manager"
        : "Customer";
  const accountLinks =
    user?.role === "ADMIN"
      ? [
          { href: "/admin", label: "Admin dashboard", icon: LayoutDashboard },
          { href: "/admin/users", label: "People & staff", icon: Users },
          { href: "/admin/hubs", label: "Hubs", icon: Building2 },
          { href: "/admin/countries", label: "Countries", icon: Globe2 },
          {
            href: "/admin/rates",
            label: "Shipment rates",
            icon: CircleDollarSign,
          },
          {
            href: "/admin/reports",
            label: "Reports",
            icon: ChartNoAxesCombined,
          },
          {
            href: "/admin/audit-logs",
            label: "Audit trail",
            icon: ShieldCheck,
          },
          { href: "/track", label: "Track a shipment", icon: PackageOpen },
        ]
      : user?.role === "STAFF" && user.staffProfile?.staffType === "MANAGER"
        ? [
            { href: "/manager", label: "Hub dashboard", icon: LayoutDashboard },
            {
              href: "/manager/shipments",
              label: "Shipment queue",
              icon: ClipboardList,
            },
            { href: "/manager/couriers", label: "Couriers", icon: Truck },
            {
              href: "/manager/reports",
              label: "Reports",
              icon: ChartNoAxesCombined,
            },
            { href: "/track", label: "Track a shipment", icon: PackageOpen },
          ]
        : user?.role === "STAFF"
          ? [
              {
                href: "/courier",
                label: "Courier dashboard",
                icon: LayoutDashboard,
              },
              {
                href: "/courier/tasks",
                label: "My tasks",
                icon: ClipboardList,
              },
              {
                href: "/courier/profile",
                label: "My profile",
                icon: Settings2,
              },
              { href: "/track", label: "Track a shipment", icon: PackageOpen },
            ]
          : [
              {
                href: "/dashboard",
                label: "My dashboard",
                icon: LayoutDashboard,
              },
              {
                href: "/dashboard/shipments",
                label: "My shipments",
                icon: PackageOpen,
              },
              {
                href: "/dashboard/payments",
                label: "Payments",
                icon: CircleDollarSign,
              },
              {
                href: "/dashboard/notifications",
                label: "Notifications",
                icon: Bell,
              },
              {
                href: "/dashboard/profile",
                label: "My profile",
                icon: Settings2,
              },
              { href: "/track", label: "Track a shipment", icon: PackageOpen },
            ];

  useEffect(() => {
    if (pathname === "/" && user) router.replace(workspace);
  }, [pathname, router, user, workspace]);

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

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.clear();
      router.replace("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className={`site-header${sticky ? " site-header-sticky" : ""}`}>
      <div className="container header-inner">
        <Link href="/" className="brand focus-ring" aria-label="ShipperEx home">
          <span className="brand-mark">
            <PackageOpen size={19} strokeWidth={2.4} />
          </span>
          <span>
            shipper<span className="brand-dot">ex</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <details ref={profileMenuRef} className="profile-menu">
              <summary
                className="profile-menu-trigger focus-ring"
                aria-label={`Open ${roleName} profile menu`}
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
                      {roleName} · {user.email}
                    </small>
                  </span>
                </div>
                <nav
                  aria-label={`${roleName} shortcuts`}
                  className="profile-dropdown-links"
                >
                  {accountLinks.map(({ href, label, icon: Icon }) => (
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
          ) : me.isPending ? (
            <span className="header-profile-placeholder" aria-hidden="true" />
          ) : (
            <>
              <Link className="sign-in" href="/login">
                Log in
              </Link>
              <Link className="header-cta focus-ring" href="/register">
                <span className="header-cta-label">Get started</span>
                <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
