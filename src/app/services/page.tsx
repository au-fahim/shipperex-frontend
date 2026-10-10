import type { Metadata } from "next";
import { SiteInfoPage } from "@/components/site-info-page";
export const metadata: Metadata = {
  title: "Shipping services",
  description:
    "Explore ShipperEx international document, parcel and tracking workflows.",
};
export default function ServicesPage() {
  return <SiteInfoPage kind="services" />;
}
