import type { Metadata } from "next";
import { AdminCountries } from "@/components/admin-console";

export const metadata: Metadata = {
  title: "Country coverage",
  description: "Manage countries and their export and import rate zones.",
};

export default function AdminCountriesPage() {
  return <AdminCountries />;
}
