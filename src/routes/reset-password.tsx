import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/services/platform/auth.service";
import { t } from "@/lib/i18n";
import {
  AuthCard,
  AuthCinematicFrame,
  AuthError,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
  PasswordStrength,
} from "@/components/auth/auth-form";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: t("seo.resetPasswordTitle") },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t: tr } = useTranslation();

  const navigate = useNavigate();

  const [ready, setReady] = useState(false);

  const [pwd, setPwd] = useState("");

  const [pwd2, setPwd2] = useState("");

  const [showPwd, setShowPwd] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const { data: sub } = authApi.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    authApi.getSession().then((session) => {
      if (session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (pwd.length < 6) return setError(tr("auth.errors.passwordMin"));

    if (pwd !== pwd2) return setError(tr("auth.errors.passwordMismatch"));

    setLoading(true);

    const { error } = await authApi.updateUserPassword(pwd);

    setLoading(false);

    if (error) return setError(error.message);

    toast.success(tr("toast.passwordChanged"));

    navigate({ to: "/" });
  };

  return (
    <AuthCinematicFrame>
      <AuthCard>
        <h1 className="text-2xl font-bold text-white">{tr("auth.resetPasswordTitle")}</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-netflix-muted">{tr("auth.openResetLink")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <AuthField
              icon={<Lock className="h-4 w-4" />}
              type={showPwd ? "text" : "password"}
              placeholder={tr("auth.newPassword")}
              value={pwd}
              onChange={setPwd}
              trailing={
                <AuthPasswordToggle visible={showPwd} onToggle={() => setShowPwd((v) => !v)} />
              }
            />
            <PasswordStrength password={pwd} />
            <AuthField
              icon={<Lock className="h-4 w-4" />}
              type="password"
              placeholder={tr("auth.confirmPassword")}
              value={pwd2}
              onChange={setPwd2}
            />
            {error && <AuthError message={error} />}
            <AuthSubmitButton loading={loading} label={tr("auth.updatePassword")} />
          </form>
        )}
      </AuthCard>
    </AuthCinematicFrame>
  );
}
