import type { Metadata } from "next";
import { SiteInfoPage } from "@/components/site-info-page";
export const metadata: Metadata = {
  title: "Contact & help",
  description: "Find help with ShipperEx booking and shipment tracking.",
};
export default function ContactPage() {
  return <SiteInfoPage kind="contact" />;
}
