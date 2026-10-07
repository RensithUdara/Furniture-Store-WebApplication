import { PRIVATE } from "@/lib/seo";
import { AuthForm } from "@/components/auth-form";
import { isConfigured } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account", robots: PRIVATE };
export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return <AuthForm mode="register" configured={isConfigured()} next={(await searchParams).next} />;
}
