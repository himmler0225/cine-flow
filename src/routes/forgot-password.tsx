import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { authApi } from "@/services/platform/auth.service";
import { t } from "@/lib/i18n";
import {
  AuthCard,
  AuthCinematicFrame,
  AuthError,
  AuthField,
  AuthSubmitButton,
} from "@/components/auth/auth-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: t("seo.forgotPasswordTitle") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t: tr } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authApi.resetPasswordForEmail(email);
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };
  return (
    <AuthCinematicFrame>
      <AuthCard>
        <h1 className="text-2xl font-bold text-white">{tr("auth.forgotPasswordTitle")}</h1>
        <p className="mt-2 text-sm text-netflix-muted">{tr("auth.forgotPasswordDesc")}</p>
        {sent ? (
          <Alert className="mt-6 border-emerald-500/40 bg-emerald-950/40 text-emerald-200">
            <AlertDescription>{tr("auth.checkInbox")}</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <AuthField
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder={tr("auth.emailShort")}
              value={email}
              onChange={setEmail}
            />
            {error && <AuthError message={error} />}
            <AuthSubmitButton loading={loading} label={tr("auth.sendResetLink")} />
          </form>
        )}
        <Link
          to="/login"
          className="mt-6 block text-center text-sm text-netflix-muted hover:text-white"
        >
          {tr("auth.backToLogin")}
        </Link>
      </AuthCard>
    </AuthCinematicFrame>
  );
}
