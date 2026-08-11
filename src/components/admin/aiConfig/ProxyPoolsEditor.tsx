import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Provider {
  type: "direct" | "api";
  value?: string;
  url?: string;
  method?: string;
  query?: Record<string, string>;
}

interface PoolEntry {
  key?: string;
  countries?: string[];
  provider?: Provider;
  [k: string]: unknown;
}

function safeParse(raw: string): PoolEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as PoolEntry[]) : [];
  } catch {
    return [];
  }
}

function emptyPool(): PoolEntry {
  return { key: "", countries: [], provider: { type: "direct", value: "" } };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ProxyPoolsEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [pools, setPools] = useState<PoolEntry[]>(() => safeParse(value));

  const commit = (next: PoolEntry[]) => {
    setPools(next);

    onChange(JSON.stringify(next));
  };

  const updatePool = (index: number, patch: Partial<PoolEntry>) => {
    commit(pools.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const updateProvider = (index: number, patch: Partial<Provider>) => {
    const pool = pools[index];

    if (!pool) return;

    const base: Provider = pool.provider ?? { type: "direct" };

    updatePool(index, { provider: { ...base, ...patch } });
  };

  const removePool = (index: number) => commit(pools.filter((_, i) => i !== index));

  const addPool = () => commit([...pools, emptyPool()]);

  return (
    <div className="space-y-3">
      {pools.length === 0 && (
        <p className="text-xs text-zinc-500">{t("admin.aiConfig.proxy.empty")}</p>
      )}

      {pools.map((pool, index) => {
        const provider: Provider = pool.provider ?? { type: "direct" };

        const isApi = provider.type === "api";

        const query = isApi ? (provider.query ?? {}) : {};

        return (
          <div key={index} className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1 space-y-1">
                  <Label className="text-[11px] text-zinc-400">
                    {t("admin.aiConfig.proxy.key")}
                  </Label>
                  <Input
                    value={pool.key ?? ""}
                    onChange={(e) => updatePool(index, { key: e.target.value })}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </div>
                <div className="min-w-[160px] flex-1 space-y-1">
                  <Label className="text-[11px] text-zinc-400">
                    {t("admin.aiConfig.proxy.countries")}
                  </Label>
                  <Input
                    value={(pool.countries ?? []).join(", ")}
                    onChange={(e) =>
                      updatePool(index, {
                        countries: e.target.value
                          .split(",")
                          .map((c) => c.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                    placeholder="VN, US"
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePool(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                aria-label={t("admin.aiConfig.proxy.remove")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex gap-1.5">
              {(["direct", "api"] as const).map((ptype) => (
                <button
                  key={ptype}
                  type="button"
                  onClick={() => updateProvider(index, { type: ptype })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    provider.type === ptype
                      ? "border-netflix-red/40 bg-netflix-red/15 text-netflix-red"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white",
                  )}
                >
                  {ptype}
                </button>
              ))}
            </div>

            {!isApi ? (
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-400">
                  {t("admin.aiConfig.proxy.value")}
                </Label>
                <Input
                  value={provider.value ?? ""}
                  onChange={(e) => updateProvider(index, { value: e.target.value })}
                  placeholder="host:port:user:pass"
                  className="border-white/15 bg-black/40 font-mono text-xs text-white"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] text-zinc-400">
                      {t("admin.aiConfig.proxy.url")}
                    </Label>
                    <Input
                      value={provider.url ?? ""}
                      onChange={(e) => updateProvider(index, { url: e.target.value })}
                      className="border-white/15 bg-black/40 font-mono text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-zinc-400">
                      {t("admin.aiConfig.proxy.method")}
                    </Label>
                    <Input
                      value={provider.method ?? "GET"}
                      onChange={(e) =>
                        updateProvider(index, { method: e.target.value.toUpperCase() })
                      }
                      className="border-white/15 bg-black/40 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-400">
                    {t("admin.aiConfig.proxy.query")}
                  </Label>
                  {Object.entries(query).map(([qKey, qVal]) => (
                    <div key={qKey} className="flex gap-1.5">
                      <Input
                        value={qKey}
                        onChange={(e) => {
                          const nextQuery = { ...query };

                          delete nextQuery[qKey];

                          nextQuery[e.target.value] = qVal;

                          updateProvider(index, { query: nextQuery });
                        }}
                        placeholder={t("admin.aiConfig.proxy.queryKey")}
                        className="border-white/15 bg-black/40 font-mono text-xs text-white"
                      />
                      <Input
                        value={qVal}
                        onChange={(e) =>
                          updateProvider(index, { query: { ...query, [qKey]: e.target.value } })
                        }
                        placeholder={t("admin.aiConfig.proxy.queryValue")}
                        className="border-white/15 bg-black/40 font-mono text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextQuery = { ...query };

                          delete nextQuery[qKey];

                          updateProvider(index, { query: nextQuery });
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        aria-label={t("admin.aiConfig.proxy.remove")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateProvider(index, { query: { ...query, "": "" } })}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    {t("admin.aiConfig.proxy.addQueryParam")}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addPool}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/5"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("admin.aiConfig.proxy.addPool")}
      </button>
    </div>
  );
}
