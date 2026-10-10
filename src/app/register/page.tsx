import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm, AuthLayout } from "@/components/auth-form";
import { getSignedInHome } from "@/lib/role-guard";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a ShipperEx customer account.",
};

export default async function RegisterPage() {
  const signedInHome = await getSignedInHome();
  if (signedInHome) redirect(signedInHome);

  return (
    <AuthLayout>
      <AuthForm mode="register" />
    </AuthLayout>
  );
}
