export type AiConfigLabel = string | Record<string, string> | null | undefined;

export interface AiConfigMeta {
  jsonKeys: string[];
  longTextKeys: string[];
  secretKeys: string[];
  updatedAt: Record<string, string>;
  items: Record<string, { label?: AiConfigLabel; fields?: unknown }>;
}

export interface AiConfigBundle {
  config: Record<string, string>;
  meta: AiConfigMeta;
}

export function resolveLabel(label: AiConfigLabel, locale: string, fallback: string): string {
  if (typeof label === "string" && label.trim()) return label;

  if (label && typeof label === "object") {
    return label[locale] || label.en || label.vi || Object.values(label)[0] || fallback;
  }

  return fallback;
}

export class AiConfigApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);

    this.name = "AiConfigApiError";
  }
}

async function call<T>(path: string, method: "GET" | "PATCH", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
  } | null;

  if (!res.ok || json?.success === false) {
    throw new AiConfigApiError(
      json?.error || json?.message || `Request failed (${res.status})`,
      res.status,
    );
  }

  return json!.data as T;
}

class AdminAiConfigApi {
  fetchConfig() {
    return call<AiConfigBundle>("/api/admin/ai-config", "GET");
  }
  saveConfig(updates: Record<string, string>) {
    return call<{ saved: string[] }>("/api/admin/ai-config", "PATCH", { updates });
  }
}

export const adminAiConfigApi = new AdminAiConfigApi();
