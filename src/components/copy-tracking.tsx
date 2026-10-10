"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyTracking({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Tracking number copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Please select the tracking number.");
    }
  }
  return (
    <button
      type="button"
      className="copy-tracking"
      onClick={copy}
      aria-label="Copy tracking number"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}{" "}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
