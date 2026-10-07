import { PRIVATE } from "@/lib/seo";
import { AuthForm } from "@/components/auth-form";
import { isConfigured } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: PRIVATE };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const p = await searchParams;
  return (
    <AuthForm
      mode="login"
      configured={isConfigured()}
      next={p.next}
      confirmationError={p.error === "confirmation"}
    />
  );
}
