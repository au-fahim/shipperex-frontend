"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

type Callback = {
  verified?: boolean;
  paymentStatus?: string;
  sessionId?: string;
  payment?: {
    status: string;
    shipmentId: string;
    amountUsd: string | number;
  } | null;
};

function ReturnStatus({
  cancelled,
  sessionId,
}: {
  cancelled: boolean;
  sessionId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const handledSuccess = useRef(false);
  const result = useQuery({
    queryKey: ["payment-return", cancelled, sessionId],
    queryFn: () =>
      apiRequest<Callback>(
        `payments/${cancelled ? "cancel" : "success"}?session_id=${encodeURIComponent(sessionId)}`,
      ),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      !cancelled && !query.state.data?.data?.verified ? 4000 : false,
    retry: 1,
  });
  const data = result.data?.data;
  const confirmed = !!data?.verified;
  const shipmentId = data?.payment?.shipmentId;
  const missingSession = !cancelled && !sessionId;
  const hasError = result.isError || missingSession;
  const isPending = !cancelled && !confirmed && !hasError;

  useEffect(() => {
    if (cancelled || !confirmed || !shipmentId || handledSuccess.current)
      return;

    handledSuccess.current = true;
    void queryClient.invalidateQueries({ queryKey: ["my-shipments"] });
    void queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });
    void queryClient.invalidateQueries({
      queryKey: ["shipment-timeline", shipmentId],
    });
    toast.success("Payment successful", {
      description: "Your shipment is confirmed and ready for its next step.",
    });
    router.replace(`/dashboard/shipments/${encodeURIComponent(shipmentId)}`);
  }, [cancelled, confirmed, queryClient, router, shipmentId]);

  return (
    <main className="payment-return-page">
      <div
        className={`return-mark ${cancelled ? "return-cancelled" : confirmed ? "return-success" : hasError ? "return-cancelled" : "return-waiting"}`}
      >
        {cancelled ? (
          <X size={23} />
        ) : confirmed ? (
          <Check size={23} />
        ) : hasError ? (
          <AlertTriangle size={22} />
        ) : (
          <LoaderCircle size={23} className="spin" />
        )}
      </div>
      <span className="eyebrow">SHIPPERE X · PAYMENT UPDATE</span>
      <h1>
        {cancelled
          ? "Checkout paused."
          : confirmed
            ? "Payment confirmed."
            : hasError
              ? "We couldn’t confirm yet."
              : "Checking your payment…"}
      </h1>
      <p>
        {cancelled
          ? "Your Stripe checkout was cancelled. No payment was recorded. The shipment is still awaiting payment if you want to continue later."
          : confirmed
            ? "Stripe has confirmed the payment with ShipperEx. Your shipment is now moving to the next step."
            : missingSession
              ? "The checkout return did not include a Stripe session, so ShipperEx could not verify the payment. Open your shipment history to check its current status."
              : result.isError
                ? result.error.message
                : "We’re checking the secure Stripe status with ShipperEx. This can take a few seconds."}
      </p>
      {sessionId && (
        <div className="return-session">
          <span>CHECKOUT SESSION</span>
          <strong>{sessionId.slice(0, 22)}…</strong>
          {data?.paymentStatus && (
            <small>Payment status · {data.paymentStatus}</small>
          )}
        </div>
      )}
      {result.isError && (
        <button className="return-retry" onClick={() => result.refetch()}>
          <RefreshCw size={14} /> Check again
        </button>
      )}
      {isPending && (
        <span className="return-wait-note">
          <Clock3 size={13} /> This page updates automatically.
        </span>
      )}
      <div className="return-actions">
        {confirmed ? (
          <Link href="/dashboard/shipments" className="workspace-primary">
            View my shipments <ArrowRight size={14} />
          </Link>
        ) : (
          <>
            <Link href="/dashboard/shipments" className="workspace-primary">
              Go to my shipments <ArrowRight size={14} />
            </Link>
            {cancelled && (
              <Link href="/dashboard" className="return-secondary">
                Back to dashboard
              </Link>
            )}
          </>
        )}
      </div>
      <div className="return-security">
        <ShieldCheck size={14} /> Payment status is verified by ShipperEx, never
        set by this page.
      </div>
    </main>
  );
}

export function PaymentReturn({
  cancelled,
  sessionId,
}: {
  cancelled: boolean;
  sessionId: string;
}) {
  return <ReturnStatus cancelled={cancelled} sessionId={sessionId} />;
}
