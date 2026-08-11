import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { queryKeys } from "@/constants/queryKeys";
import {
  adminAiConfigApi,
  AiConfigApiError,
  resolveLabel,
} from "@/services/platform/admin/aiConfig.admin";
import { Section, SectionEmpty } from "@/components/admin/Section";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiConfigField } from "@/components/admin/aiConfig/AiConfigField";
import { AiConfigSkeleton } from "@/components/admin/aiConfig/AiConfigSkeleton";
import { PromptsEditor } from "@/components/admin/aiConfig/PromptsEditor";
import { ModelsEditor } from "@/components/admin/aiConfig/ModelsEditor";
import { AgentBehaviorEditor } from "@/components/admin/aiConfig/AgentBehaviorEditor";
import { RateLimitEditor } from "@/components/admin/aiConfig/RateLimitEditor";
import { ServicesEditor } from "@/components/admin/aiConfig/ServicesEditor";
import { ProxyPoolsEditor } from "@/components/admin/aiConfig/ProxyPoolsEditor";

export const Route = createFileRoute("/admin/ai-config")({
  component: AiConfigPage,
});

interface StructuredEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const STRUCTURED_EDITORS: Record<string, React.ComponentType<StructuredEditorProps>> = {
  PROMPTS: PromptsEditor,
  AI_MODELS: ModelsEditor,
  AI_AGENT: AgentBehaviorEditor,
  RATE_LIMIT: RateLimitEditor,
  SERVICES: ServicesEditor,
  PROXY_POOLS: ProxyPoolsEditor,
};

const GROUPS = [
  { key: "models", configKeys: ["AI_MODELS"] },
  { key: "agent", configKeys: ["AI_AGENT"] },
  { key: "prompts", configKeys: ["PROMPTS"] },
  { key: "limits", configKeys: ["RATE_LIMIT"] },
  { key: "services", configKeys: ["SERVICES"] },
  { key: "miner", configKeys: ["PROXY_POOLS"] },
] as const;

function AiConfigPage() {
  const { t, i18n } = useTranslation();

  const locale = i18n.language?.startsWith("en") ? "en" : "vi";

  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.admin.aiConfig(),
    queryFn: () => adminAiConfigApi.fetchConfig(),
  });

  const [dirty, setDirty] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editorResetToken, setEditorResetToken] = useState(0);

  const mutation = useMutation({
    mutationFn: (updates: Record<string, string>) => adminAiConfigApi.saveConfig(updates),
    onSuccess: () => {
      toast.success(t("admin.aiConfig.saveSuccess"));

      setDirty({});

      setConfirmOpen(false);

      setEditorResetToken((n) => n + 1);

      void qc.invalidateQueries({ queryKey: queryKeys.admin.aiConfig() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t("admin.aiConfig.saveError"));
    },
  });

  const configData = query.data?.config;

  const config = useMemo(() => configData ?? {}, [configData]);

  const meta = query.data?.meta;

  const jsonKeys = useMemo(() => new Set(meta?.jsonKeys ?? []), [meta]);

  const secretKeys = useMemo(() => new Set(meta?.secretKeys ?? []), [meta]);

  const longTextKeys = useMemo(() => new Set(meta?.longTextKeys ?? []), [meta]);

  const groupedKeys = useMemo(
    () => new Set(GROUPS.flatMap((g) => g.configKeys as readonly string[])),
    [],
  );

  const ungrouped = Object.keys(config).filter((k) => !groupedKeys.has(k));

  const visibleGroups = useMemo(
    () => GROUPS.filter((g) => g.configKeys.some((k) => k in config || k in dirty)),
    [config, dirty],
  );

  const tabs = useMemo(
    () => [
      ...visibleGroups.map((g) => ({ key: g.key, configKeys: g.configKeys as readonly string[] })),
      ...(ungrouped.length > 0 ? [{ key: "other", configKeys: ungrouped }] : []),
    ],
    [visibleGroups, ungrouped],
  );

  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (tabs.length && !tabs.some((tb) => tb.key === activeTab)) {
      setActiveTab(tabs[0]!.key);
    }
  }, [tabs, activeTab]);

  const hasInvalidJson = useMemo(
    () =>
      Object.keys(dirty).some((key) => {
        if (!jsonKeys.has(key)) return false;

        try {
          JSON.parse(dirty[key]!);

          return false;
        } catch {
          return true;
        }
      }),
    [dirty, jsonKeys],
  );

  const dirtyCount = Object.keys(dirty).length;

  const renderField = (key: string) => {
    if (!(key in config) && !(key in dirty)) return null;

    const value = dirty[key] ?? config[key] ?? "";

    const isDirty = key in dirty;

    const Editor = STRUCTURED_EDITORS[key];

    if (Editor) {
      return (
        <div
          key={key}
          className="space-y-2 border-t border-white/5 pt-3 first:border-t-0 first:pt-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-white">
              {resolveLabel(meta?.items?.[key]?.label, locale, key)}
            </span>
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
              {key}
            </code>
            {isDirty && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                {t("admin.aiConfig.unsavedBadge")}
              </span>
            )}
          </div>
          <Editor
            key={editorResetToken}
            value={value}
            onChange={(next) => setDirty((d) => ({ ...d, [key]: next }))}
          />
        </div>
      );
    }

    return (
      <AiConfigField
        key={key}
        configKey={key}
        label={resolveLabel(meta?.items?.[key]?.label, locale, key)}
        value={value}
        isJson={jsonKeys.has(key)}
        isSecret={secretKeys.has(key)}
        isLongText={longTextKeys.has(key)}
        isDirty={isDirty}
        updatedAt={meta?.updatedAt?.[key]}
        onChange={(v) => setDirty((d) => ({ ...d, [key]: v }))}
      />
    );
  };

  const header = (
    <div>
      <h1 className="text-xl font-bold text-white">{t("admin.aiConfig.title")}</h1>
      <p className="text-xs text-zinc-400">{t("admin.aiConfig.subtitle")}</p>
    </div>
  );

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {header}
        <AiConfigSkeleton />
      </div>
    );
  }

  if (query.isError) {
    const message =
      query.error instanceof AiConfigApiError ? query.error.message : t("admin.aiConfig.loadError");

    return (
      <div className="space-y-4">
        {header}
        <Section title={t("admin.aiConfig.title")}>
          <SectionEmpty message={message} />
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {header}

      {tabs.length === 0 ? (
        <Section title={t("admin.aiConfig.title")}>
          <SectionEmpty message={t("admin.aiConfig.empty")} />
        </Section>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-white/5 p-1">
            {tabs.map((tb) => {
              const isDirtyTab = tb.configKeys.some((k) => k in dirty);

              return (
                <TabsTrigger key={tb.key} value={tb.key} className="gap-1.5">
                  {tb.key === "other" ? "Other" : t(`admin.aiConfig.groups.${tb.key}`)}
                  {isDirtyTab && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {tabs.map((tb) => (
            <TabsContent key={tb.key} value={tb.key}>
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                {tb.configKeys.map(renderField)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {dirtyCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:pl-60">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {t("admin.aiConfig.unsavedBadge")} · {dirtyCount}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirty({});

                  setEditorResetToken((n) => n + 1);
                }}
                disabled={mutation.isPending}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                {t("admin.aiConfig.discard")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={hasInvalidJson || mutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-netflix-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-netflix-red-hover disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                {t("admin.aiConfig.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={t("admin.aiConfig.confirmTitle")}
        message={t("admin.aiConfig.confirmMessage")}
        confirmText={mutation.isPending ? t("admin.aiConfig.saving") : t("admin.aiConfig.save")}
        danger={false}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(dirty)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
