import { useTranslation } from "react-i18next";
import zxcvbn from "zxcvbn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function AuthError({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="mb-4 border-red-500 bg-red-950 text-red-200">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  if (!password) return null;
  const score = zxcvbn(password).score;
  const colors = ["bg-red-500", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const widths = ["25%", "25%", "50%", "75%", "100%"];
  const labels = [
    t("auth.pwdWeak"),
    t("auth.pwdWeak"),
    t("auth.pwdFair"),
    t("auth.pwdGood"),
    t("auth.pwdStrong"),
  ];
  return (
    <div className="mt-2">
      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div
          className={cn("h-full transition-all", colors[score])}
          style={{ width: widths[score] }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {t("auth.pwdStrength")}: {labels[score]}
      </p>
    </div>
  );
}
