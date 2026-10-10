"use client";

import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrackingSearch({ compact = false }: { compact?: boolean }) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = trackingNumber.trim();
    if (!value) return;
    router.push(`/track/${encodeURIComponent(value)}`);
  }

  return (
    <form
      className={`tracking-form${compact ? " tracking-form-compact" : ""}`}
      onSubmit={submit}
    >
      <label
        htmlFor={compact ? "tracking-compact" : "tracking-number"}
        className="sr-only"
      >
        Tracking number
      </label>
      <Search size={18} aria-hidden="true" />
      <input
        id={compact ? "tracking-compact" : "tracking-number"}
        value={trackingNumber}
        onChange={(event) => setTrackingNumber(event.target.value)}
        placeholder="Enter your tracking number"
        autoComplete="off"
        required
      />
      <button
        type="submit"
        className="track-submit focus-ring"
        aria-label="Track shipment"
      >
        {compact ? (
          <ArrowRight size={19} />
        ) : (
          <>
            Track parcel <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
