import { PackageOpen } from "lucide-react";

export default function Loading() {
  return (
    <main className="loading-page" aria-label="Loading page">
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
      <p>Getting things ready…</p>
    </main>
  );
}
