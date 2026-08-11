import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProviderConfig {
  base_url?: string;
  api_key?: string;
  model?: string;
  max_tokens?: number;
  tool_model?: string;
  tool_max_tokens?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

type ModelsShape = Record<string, ProviderConfig>;

function safeParse(raw: string): ModelsShape {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ModelsShape;
    }

    return {};
  } catch {
    return {};
  }
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ModelsEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [data, setData] = useState<ModelsShape>(() => safeParse(value));

  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const providerKeys = useMemo(() => Object.keys(data), [data]);

  const activeProvider = useMemo(
    () => providerKeys.find((k) => data[k]?.is_active === true),
    [providerKeys, data],
  );

  const [active, setActive] = useState(() => providerKeys[0] ?? "");

  const commit = (next: ModelsShape) => {
    setData(next);

    onChange(JSON.stringify(next));
  };

  const updateField = (provider: string, field: keyof ProviderConfig, fieldValue: unknown) => {
    commit({
      ...data,
      [provider]: { ...data[provider], [field]: fieldValue },
    });
  };

  const setActiveProvider = (provider: string) => {
    const next: ModelsShape = {};

    for (const key of providerKeys) {
      next[key] = { ...data[key], is_active: key === provider };
    }

    commit(next);
  };

  if (providerKeys.length === 0) {
    return <p className="text-xs text-zinc-500">{t("admin.aiConfig.models.empty")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-zinc-300">
          {t("admin.aiConfig.models.activeProvider")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {providerKeys.map((key) => {
            const isActive = key === activeProvider;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveProvider(key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  isActive
                    ? "border-netflix-red/40 bg-netflix-red/15 text-netflix-red"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
                )}
              >
                {key}
              </button>
            );
          })}
        </div>
        {!activeProvider && (
          <p className="text-[11px] text-amber-400">{t("admin.aiConfig.models.noActive")}</p>
        )}
      </div>

      <Tabs value={active || providerKeys[0]} onValueChange={setActive}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-white/5 p-1">
          {providerKeys.map((key) => (
            <TabsTrigger key={key} value={key} className="gap-1.5">
              {key}
              {key === activeProvider && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {providerKeys.map((key) => {
          const provider = data[key] ?? {};

          const keyRevealed = revealed.has(key);

          return (
            <TabsContent key={key} value={key} className="space-y-3">
              <Field label={t("admin.aiConfig.models.baseUrl")}>
                <Input
                  value={provider.base_url ?? ""}
                  onChange={(e) => updateField(key, "base_url", e.target.value)}
                  className="border-white/15 bg-black/40 font-mono text-xs text-white"
                />
              </Field>

              <Field label={t("admin.aiConfig.models.apiKey")}>
                <div className="flex gap-1.5">
                  <Input
                    type={keyRevealed ? "text" : "password"}
                    value={provider.api_key ?? ""}
                    onChange={(e) => updateField(key, "api_key", e.target.value)}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((s) => {
                        const next = new Set(s);

                        if (next.has(key)) next.delete(key);
                        else next.add(key);

                        return next;
                      })
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
                    aria-label={
                      keyRevealed ? t("admin.aiConfig.hideSecret") : t("admin.aiConfig.showSecret")
                    }
                  >
                    {keyRevealed ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t("admin.aiConfig.models.model")}>
                  <Input
                    value={provider.model ?? ""}
                    onChange={(e) => updateField(key, "model", e.target.value)}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </Field>
                <Field label={t("admin.aiConfig.models.maxTokens")}>
                  <Input
                    type="number"
                    value={provider.max_tokens ?? ""}
                    onChange={(e) => updateField(key, "max_tokens", Number(e.target.value) || 0)}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </Field>
                <Field label={t("admin.aiConfig.models.toolModel")}>
                  <Input
                    value={provider.tool_model ?? ""}
                    onChange={(e) => updateField(key, "tool_model", e.target.value)}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </Field>
                <Field label={t("admin.aiConfig.models.toolMaxTokens")}>
                  <Input
                    type="number"
                    value={provider.tool_max_tokens ?? ""}
                    onChange={(e) =>
                      updateField(key, "tool_max_tokens", Number(e.target.value) || 0)
                    }
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </Field>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}
