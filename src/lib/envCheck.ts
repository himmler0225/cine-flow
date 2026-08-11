import { toast } from "sonner";
import { clientEnv, isValidHttpUrl } from "@/config/env";
import { DEFAULT_URLS } from "@/constants/urls";

interface EnvIssue {
  key: string;
  level: "error" | "warn";
  message: string;
}

export function collectEnvIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];

  const movieApiUrl = clientEnv.rawMovieApiUrl;

  if (!movieApiUrl) {
    issues.push({
      key: "VITE_MOVIE_API_URL",
      level: "warn",
      message: `Thiếu VITE_MOVIE_API_URL — dùng mặc định ${DEFAULT_URLS.movieApi}.`,
    });
  } else if (!isValidHttpUrl(movieApiUrl)) {
    issues.push({
      key: "VITE_MOVIE_API_URL",
      level: "error",
      message: `VITE_MOVIE_API_URL không hợp lệ: "${movieApiUrl}".`,
    });
  }

  return issues;
}

let alreadyChecked = false;

export function runStartupEnvCheck() {
  if (typeof window === "undefined" || alreadyChecked) return;

  alreadyChecked = true;

  const issues = collectEnvIssues();

  if (issues.length === 0) {
    console.info("[Cine-Flow] Env OK");

    return;
  }

  const errors = issues.filter((i) => i.level === "error");

  const warns = issues.filter((i) => i.level === "warn");

  for (const i of issues) {
    const fn = i.level === "error" ? console.error : console.warn;

    fn(`[Cine-Flow env] ${i.key}: ${i.message}`);
  }

  if (errors.length > 0) {
    toast.error(`Thiếu hoặc sai cấu hình: ${errors.map((e) => e.key).join(", ")}`, {
      description: errors[0].message,
      duration: 8000,
    });
  } else if (!clientEnv.isProduction && warns.length > 0) {
    toast.warning(`Cảnh báo cấu hình: ${warns.map((w) => w.key).join(", ")}`, {
      description: warns[0].message,
      duration: 6000,
    });
  }
}

export function hasPlatformApiConfig(): boolean {
  return isValidHttpUrl(clientEnv.rawMovieApiUrl) || !clientEnv.rawMovieApiUrl;
}

export const hasSupabaseConfig = hasPlatformApiConfig;
