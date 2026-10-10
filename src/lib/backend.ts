import { cookies } from "next/headers";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://shipperex-backend.vercel.app/api/v1"
    : "http://localhost:5000/api/v1";

export const API_BASE_URL = (
  process.env.BACKEND_API_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
  errors?: { path?: string; message: string }[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
  phone?: string | null;
  avatarUrl?: string | null;
  staffProfile?: {
    id: string;
    staffType: "MANAGER" | "COURIER";
    hubId: string;
    availabilityStatus?: string | null;
    activeTaskCount?: number;
    maxActiveTasks?: number;
  } | null;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  direction: "EXPORT" | "IMPORT";
  shipmentType: "DOCUMENT" | "PARCEL";
  status: string;
  priceUsd: string | number;
  currency: string;
  weightKg: string | number;
  createdAt: string;
  originCountry?: { name: string };
  destinationCountry?: { name: string };
  originHub?: { name: string; city?: string; address?: string } | null;
  destinationHub?: { name: string; city?: string; address?: string } | null;
  currentHub?: { name: string; city?: string; address?: string } | null;
  senderSnapshot?: {
    name: string;
    city?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  recipientSnapshot?: {
    name: string;
    city?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  trackingEvents?: {
    id: string;
    status: string;
    location?: string;
    note?: string;
    createdAt: string;
  }[];
};

export type Payment = {
  id: string;
  shipmentId: string;
  amountUsd: string | number;
  currency: string;
  status: string;
  createdAt: string;
  shipment?: { id: string; trackingNumber: string; status: string };
};

export type DashboardStats = {
  totalShipments?: number;
  activeShipments?: number;
  deliveredShipments?: number;
  totalRevenueUsd?: number;
  [key: string]: unknown;
};

export async function serverBackend<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const jar = await cookies();
  const accessToken = jar.get("shipperex_access")?.value;
  const response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, "")}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  const result = await response.json().catch(() => ({
    success: false,
    message: "The API returned an unreadable response.",
  }));
  if (!response.ok)
    throw new Error(result.message ?? "Could not load data from the API.");
  return result as ApiEnvelope<T>;
}
