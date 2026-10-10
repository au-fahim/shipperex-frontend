"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  PackageOpen,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const registerSchema = z.object({
  name: z.string().min(2, "Use at least 2 characters.").max(80),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[0-9]/, "Add a number."),
  phone: z.string().min(6, "Enter a valid phone number.").max(25),
});
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const demoAccounts = [
  {
    label: "Customer",
    email: "customer@shipperex.com",
    password: "Customer@12345",
    color: "mint",
  },
  {
    label: "Hub manager",
    email: "manager@shipperex.com",
    password: "Manager@12345",
    color: "sand",
  },
  {
    label: "Courier",
    email: "rahim.courier@shipperex.com",
    password: "Courier@12345",
    color: "blue",
  },
  {
    label: "Admin",
    email: "admin@shipperex.com",
    password: "Admin@12345",
    color: "rose",
  },
];

type AuthResult = {
  data?: { user?: { role?: string; staffProfile?: { staffType?: string } } };
  success?: boolean;
  message?: string;
};

function destination(result: AuthResult) {
  const user = result.data?.user;
  if (user?.role === "ADMIN") return "/admin";
  if (user?.role === "STAFF")
    return user.staffProfile?.staffType === "COURIER" ? "/courier" : "/manager";
  return "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "login"
        ? { email: "", password: "" }
        : { name: "", email: "", password: "", phone: "" },
  });
  const errors = form.formState.errors as Partial<
    Record<keyof RegisterValues, { message?: string }>
  >;

  async function authenticate(
    values: Record<string, string>,
    endpoint: string,
  ) {
    setPending(true);
    try {
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as AuthResult;
      if (!response.ok || result.success === false)
        throw new Error(
          result.message ?? "We couldn’t sign you in. Please try again.",
        );
      toast.success(
        mode === "register" ? "Your account is ready." : "Welcome back.",
      );
      const requested = params.get("next");
      const nextPath =
        requested?.startsWith("/") && !requested.startsWith("//")
          ? requested
          : destination(result);
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  }

  function submit(values: LoginValues | RegisterValues) {
    return authenticate(values as unknown as Record<string, string>, mode);
  }

  async function demoLogin(account: (typeof demoAccounts)[number]) {
    await authenticate(
      { email: account.email, password: account.password },
      "login",
    );
  }

  const inputClass = "auth-input focus-ring";
  return (
    <div className="auth-card">
      <div className="auth-heading">
        <span className="auth-eyebrow">
          {mode === "login"
            ? "GOOD TO SEE YOU AGAIN"
            : "YOUR NEXT JOURNEY STARTS HERE"}
        </span>
        <h1>
          {mode === "login" ? (
            <>
              Welcome
              <br />
              back.
            </>
          ) : (
            <>
              Let’s get
              <br />
              you moving.
            </>
          )}
        </h1>
        <p>
          {mode === "login"
            ? "Sign in to check in on the things you’ve sent."
            : "Create an account to book and follow your shipments."}
        </p>
      </div>
      <form
        className="auth-form"
        onSubmit={form.handleSubmit(submit)}
        noValidate
      >
        {mode === "register" && (
          <div className="field-group">
            <label htmlFor="name">Full name</label>
            <div className="auth-control">
              <UserRound size={16} />
              <input
                id="name"
                className={inputClass}
                placeholder="Your name"
                autoComplete="name"
                {...form.register("name" as never)}
              />
            </div>
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>
        )}
        <div className="field-group">
          <label htmlFor="email">Email address</label>
          <div className="auth-control">
            <Mail size={16} />
            <input
              id="email"
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
              {...form.register("email" as never)}
            />
          </div>
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </div>
        {mode === "register" && (
          <div className="field-group">
            <label htmlFor="phone">Phone number</label>
            <div className="auth-control">
              <span className="phone-prefix">+</span>
              <input
                id="phone"
                className={inputClass}
                placeholder="880 1700 000000"
                autoComplete="tel"
                {...form.register("phone" as never)}
              />
            </div>
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
          </div>
        )}
        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="password">Password</label>
            {mode === "login" && (
              <span className="password-hint">Your account, kept safe</span>
            )}
          </div>
          <div className="auth-control">
            <LockKeyhole size={16} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={inputClass}
              placeholder={
                mode === "login"
                  ? "Your password"
                  : "8+ characters, upper, lower & number"
              }
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              {...form.register("password" as never)}
            />
            <button
              type="button"
              className="password-toggle focus-ring"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>
        <button
          className="auth-submit focus-ring"
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle size={17} className="spin" />
          ) : (
            <>
              {mode === "login"
                ? "Sign in to your account"
                : "Create my account"}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      {mode === "login" && (
        <>
          <div className="auth-divider">
            <span /> <b>OR STEP INSIDE AS</b> <span />
          </div>
          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                className={`demo-button demo-${account.color} focus-ring`}
                onClick={() => demoLogin(account)}
                disabled={pending}
              >
                <span className="demo-avatar">
                  {account.label === "Admin"
                    ? "A"
                    : account.label === "Courier"
                      ? "C"
                      : account.label === "Hub manager"
                        ? "M"
                        : "S"}
                </span>
                <span>
                  <strong>{account.label}</strong>
                  <small>One-click demo</small>
                </span>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </>
      )}
      <p className="auth-switch">
        {mode === "login" ? (
          <>
            New to ShipperEx?{" "}
            <Link href="/register">
              Create an account <ArrowRight size={13} />
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login">
              Sign in <ArrowRight size={13} />
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <aside className="auth-art">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark">
            <PackageOpen size={19} />
          </span>
          <span>
            Shipper<span className="brand-dot">Ex</span>
          </span>
        </Link>
        <Link href="/" className="auth-back">
          <ArrowLeft size={14} /> Back to home
        </Link>
        <div className="auth-art-content">
          <span className="auth-art-kicker">
            YOUR SHIPMENT, WITHOUT THE GUESSWORK
          </span>
          <h2>
            Distance is just
            <br />a detail.
          </h2>
          <p>
            See where it is, what comes next, and feel close to the people
            waiting for it.
          </p>
          <div className="auth-route-card">
            <span className="auth-route-icon">
              <PackageOpen size={19} />
            </span>
            <span>
              <small>A LITTLE PEACE OF MIND</small>
              <strong>Every step, in one place.</strong>
            </span>
            <span className="auth-route-points">
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
        <div className="auth-art-foot">
          <span>MOVE WHAT MATTERS.</span>
          <span>SHIPPERE X · 2026</span>
        </div>
        <div className="auth-art-orbit" />
      </aside>
      <section className="auth-main">{children}</section>
    </main>
  );
}
