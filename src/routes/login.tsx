import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthFormStore } from "@/components/auth/store/authFormStore";
import {
  AuthBrand,
  AuthCard,
  AuthCinematicFrame,
  AuthCheckboxField,
  AuthDivider,
  AuthError,
  AuthField,
  AuthPasswordToggle,
  AuthSubmitButton,
  GoogleAuthButton,
  PasswordStrength,
} from "@/components/auth/auth-form";
import { useAuthStore } from "@/store/authStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LoginSearch = {
  tab?: "login" | "register";
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    tab: search.tab === "register" ? "register" : "login",
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${t("auth.login")} — Cine-Flow` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { tab: searchTab, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { t: tr } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const tab = useAuthFormStore((state) => state.tab);
  const loading = useAuthFormStore((state) => state.loading);
  const apiError = useAuthFormStore((state) => state.apiError);
  const signupSuccess = useAuthFormStore((state) => state.signupSuccess);
  const fieldErrors = useAuthFormStore((state) => state.fieldErrors);
  const login = useAuthFormStore((state) => state.login);
  const register = useAuthFormStore((state) => state.register);
  const syncTab = useAuthFormStore((state) => state.syncTab);
  const setTab = useAuthFormStore((state) => state.setTab);
  const resetTransient = useAuthFormStore((state) => state.resetTransient);
  const patchLogin = useAuthFormStore((state) => state.patchLogin);
  const patchRegister = useAuthFormStore((state) => state.patchRegister);
  const submitLogin = useAuthFormStore((state) => state.submitLogin);
  const submitRegister = useAuthFormStore((state) => state.submitRegister);
  const submitGoogle = useAuthFormStore((state) => state.submitGoogle);
  const backToLoginAfterSignup = useAuthFormStore((state) => state.backToLoginAfterSignup);
  useEffect(() => {
    syncTab(searchTab ?? "login");
    resetTransient();
  }, [resetTransient, searchTab, syncTab]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const target = redirect?.startsWith("/") ? redirect : "/";
    void navigate({ to: target, replace: true });
  }, [isAuthenticated, navigate, redirect]);
  const switchTab = (next: "login" | "register") => {
    setTab(next);
    navigate({
      to: "/login",
      search: {
        tab: next === "register" ? "register" : undefined,
        redirect,
      },
      replace: true,
    });
  };
  return (
    <AuthCinematicFrame>
      <AuthCard>
        <AuthBrand />

        <div
          className="mb-6 grid grid-cols-2 rounded-lg bg-black/40 p-1"
          role="tablist"
          aria-label={`${tr("auth.login")} / ${tr("auth.register")}`}
        >
          {(["login", "register"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => switchTab(value)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red",
                tab === value ? "bg-netflix-red text-white" : "text-netflix-muted hover:text-white",
              )}
            >
              {tr(`auth.${value}`)}
            </button>
          ))}
        </div>

        {apiError && <AuthError message={apiError} />}

        {signupSuccess ? (
          <SignupSuccess
            email={signupSuccess}
            onBack={() => {
              backToLoginAfterSignup();
              switchTab("login");
            }}
          />
        ) : tab === "login" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitLogin();
            }}
          >
            <AuthField
              id="login-email"
              icon={<Mail />}
              type="email"
              placeholder={tr("auth.email")}
              value={login.email}
              onChange={(email) => patchLogin({ email })}
              error={fieldErrors.email}
              autoComplete="username"
            />
            <AuthField
              id="login-password"
              icon={<Lock />}
              type={login.showPassword ? "text" : "password"}
              placeholder={tr("auth.password")}
              value={login.password}
              onChange={(password) => patchLogin({ password })}
              error={fieldErrors.password}
              autoComplete="current-password"
              trailing={
                <AuthPasswordToggle
                  visible={login.showPassword}
                  onToggle={() => patchLogin({ showPassword: !login.showPassword })}
                />
              }
            />

            <div className="flex items-center justify-between gap-4">
              <AuthCheckboxField
                id="remember"
                checked={login.remember}
                onCheckedChange={(remember) => patchLogin({ remember })}
                label={tr("auth.rememberMe")}
              />
              <Link
                to="/forgot-password"
                className="shrink-0 text-xs text-netflix-red hover:underline"
              >
                {tr("auth.forgotPassword")}
              </Link>
            </div>

            <AuthSubmitButton loading={loading} label={tr("auth.loginBtn")} />
            <AuthDivider />
            <GoogleAuthButton onClick={() => void submitGoogle()} disabled={loading} />
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitRegister();
            }}
          >
            <AuthField
              id="register-name"
              icon={<User />}
              placeholder={tr("auth.displayName")}
              value={register.username}
              onChange={(username) => patchRegister({ username })}
              error={fieldErrors.username}
              autoComplete="name"
            />
            <AuthField
              id="register-email"
              icon={<Mail />}
              type="email"
              placeholder={tr("auth.email")}
              value={register.email}
              onChange={(email) => patchRegister({ email })}
              error={fieldErrors.email}
              autoComplete="email"
            />
            <AuthField
              id="register-password"
              icon={<Lock />}
              type={register.showPassword ? "text" : "password"}
              placeholder={tr("auth.password")}
              value={register.password}
              onChange={(password) => patchRegister({ password })}
              error={fieldErrors.password}
              autoComplete="new-password"
              trailing={
                <AuthPasswordToggle
                  visible={register.showPassword}
                  onToggle={() => patchRegister({ showPassword: !register.showPassword })}
                />
              }
            />
            <PasswordStrength password={register.password} />
            <AuthField
              id="register-confirm-password"
              icon={<Lock />}
              type="password"
              placeholder={tr("auth.confirmPassword")}
              value={register.confirmPassword}
              onChange={(confirmPassword) => patchRegister({ confirmPassword })}
              error={fieldErrors.confirm}
              autoComplete="new-password"
            />
            <AuthCheckboxField
              id="terms"
              checked={register.agree}
              onCheckedChange={(agree) => patchRegister({ agree })}
              label={
                <>
                  {tr("auth.agreeTerms")}{" "}
                  <Link to="/terms" className="text-netflix-red hover:underline">
                    {tr("auth.terms")}
                  </Link>
                </>
              }
              error={fieldErrors.agree}
            />

            <AuthSubmitButton loading={loading} label={tr("auth.registerBtn")} />
            <AuthDivider />
            <GoogleAuthButton onClick={() => void submitGoogle()} disabled={loading} />
          </form>
        )}
      </AuthCard>
    </AuthCinematicFrame>
  );
}

function SignupSuccess({ email, onBack }: { email: string; onBack: () => void }) {
  const { t: tr } = useTranslation();
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-semibold text-white">{tr("auth.pendingApproval")}</h1>
      <p className="text-sm text-netflix-muted">
        {tr("auth.pendingApprovalDesc")} <strong className="text-white">{email}</strong>
      </p>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-netflix-red hover:underline"
      >
        {tr("auth.backToLogin")}
      </button>
    </div>
  );
}
