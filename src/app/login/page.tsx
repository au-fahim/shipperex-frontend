import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm, AuthLayout } from "@/components/auth-form";
import { getSignedInHome } from "@/lib/role-guard";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ShipperEx to book and track shipments.",
};

export default async function LoginPage() {
  const signedInHome = await getSignedInHome();
  if (signedInHome) redirect(signedInHome);

  return (
    <AuthLayout>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthLayout>
  );
}
