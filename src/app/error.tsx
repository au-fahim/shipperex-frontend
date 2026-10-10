"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="global-error-page"><span><AlertTriangle size={23}/></span><h1>That didn’t go as planned.</h1><p>Something interrupted this page. Your shipment data is safe. Try again, or head back to your workspace.</p><div><button onClick={reset}><RefreshCw size={14}/> Try again</button><Link href="/"><ArrowLeft size={14}/> Back to ShipperEx</Link></div></main>;
}
