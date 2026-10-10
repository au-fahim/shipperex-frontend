import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentReturn } from "@/components/payment-return";
export const metadata: Metadata = {
  title: "Checkout cancelled",
  description: "Review your cancelled ShipperEx Stripe Checkout.",
};
export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <Suspense fallback={<main className="payment-return-page" />}>
      <PaymentReturn cancelled sessionId={session_id ?? ""} />
    </Suspense>
  );
}
