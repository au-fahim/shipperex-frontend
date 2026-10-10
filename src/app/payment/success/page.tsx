import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentReturn } from "@/components/payment-return";
export const metadata: Metadata = {
  title: "Payment status",
  description: "Confirm your Stripe test payment with ShipperEx.",
};
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <Suspense
      fallback={
        <main className="payment-return-page">
          <LoaderFallback />
        </main>
      }
    >
      <PaymentReturn cancelled={false} sessionId={session_id ?? ""} />
    </Suspense>
  );
}
function LoaderFallback() {
  return (
    <span className="return-mark return-waiting">
      <span className="spin">◌</span>
    </span>
  );
}
