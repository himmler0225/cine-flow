import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n";

function tryPretty(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

interface Props {
  configKey: string;
  label: string;
  value: string;
  isJson: boolean;
  isSecret: boolean;
  isLongText: boolean;
  isDirty: boolean;
  updatedAt?: string;
  onChange: (value: string) => void;
}

export function AiConfigField({
  configKey,
  label,
  value,
  isJson,
  isSecret,
  isLongText,
  isDirty,
  updatedAt,
  onChange,
}: Props) {
  const { t, i18n } = useTranslation();

  const [revealed, setRevealed] = useState(!isSecret);

  const [prettied, setPrettied] = useState(false);

  const displayValue = useMemo(() => {
    if (isJson && !prettied && !isDirty) return tryPretty(value);

    return value;
  }, [isJson, prettied, isDirty, value]);

  const jsonError = useMemo(() => {
    if (!isJson) return null;

    try {
      JSON.parse(value);

      return null;
    } catch (err) {
      return err instanceof Error ? err.message : t("admin.aiConfig.invalidJson");
    }
  }, [isJson, value, t]);

  const updatedLabel = updatedAt
    ? t("admin.aiConfig.lastUpdated", {
        time: new Date(updatedAt).toLocaleString(getIntlLocale(i18n.language)),
      })
    : null;

  return (
    <div className="space-y-1.5 border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">{label}</span>
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
            {configKey}
          </code>
          {isDirty && (
            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
              {t("admin.aiConfig.unsavedBadge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {updatedLabel && <span className="text-[10px] text-zinc-500">{updatedLabel}</span>}
          {isSecret && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {revealed ? t("admin.aiConfig.hideSecret") : t("admin.aiConfig.showSecret")}
            </button>
          )}
        </div>
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full rounded-md border border-dashed border-white/10 bg-black/30 px-3 py-3 text-left text-xs text-zinc-500 hover:border-white/20"
        >
          {t("admin.aiConfig.secretHidden")}
        </button>
      ) : (
        <textarea
          value={displayValue}
          onChange={(e) => {
            setPrettied(true);

            onChange(e.target.value);
          }}
          rows={isJson ? (isLongText ? 12 : 6) : 2}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-white/10 bg-black/40 p-2.5 font-mono text-[12px] leading-relaxed text-white placeholder:text-netflix-muted focus-visible:border-netflix-red focus-visible:outline-none"
        />
      )}

      {jsonError && (
        <p className="flex items-center gap-1 text-[11px] text-red-400">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {jsonError}
        </p>
      )}
    </div>
  );
}
