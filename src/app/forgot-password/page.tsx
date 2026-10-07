import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isConfigured } from "@/lib/config";
import { ResetRequestForm } from "@/components/account-forms";
export const dynamic = "force-dynamic";
export const metadata = { title: "Reset your password" };
export default function ForgotPassword() {
  return (
    <div className="container page-space narrow">
      <Link className="back-link" href="/login">
        <ArrowLeft size={15} /> Back to sign in
      </Link>
      <div className="page-heading">
        <span className="eyebrow">Account help</span>
        <h1>Reset your password.</h1>
        <p>Enter your email and we’ll send a secure, single-use link to set a new one.</p>
      </div>
      <section className="form-card">
        <ResetRequestForm configured={isConfigured()} />
      </section>
    </div>
  );
}
