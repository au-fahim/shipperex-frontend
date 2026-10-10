import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShipperEx — Send with confidence",
    template: "%s · ShipperEx",
  },
  description:
    "International parcel and document shipping, with clear tracking at every step.",
  openGraph: {
    title: "ShipperEx — Send with confidence",
    description: "Simple international shipping, from pickup to delivery.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
