import type { Metadata } from "next";
import { ShipmentWizard } from "@/components/shipment-wizard";

export const metadata: Metadata = {
  title: "Book a shipment",
  description: "Get a live ShipperEx quote and arrange a shipment.",
};

export default function NewShipmentPage() {
  return <ShipmentWizard />;
}
