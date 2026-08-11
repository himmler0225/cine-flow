import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RateLimitSection = Record<string, string>;

type RateLimitShape = Record<string, RateLimitSection>;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const KNOWN_SECTIONS = ["default", "apis", "routes", "burst", "services"];

function safeParse(raw: string): RateLimitShape {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as RateLimitShape;
    }

    return {};
  } catch {
    return {};
  }
}

export function RateLimitEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [data, setData] = useState<RateLimitShape>(() => safeParse(value));

  useEffect(() => {
    setData(safeParse(value));
  }, [value]);

  const sections = useMemo(() => {
    const present = Object.keys(data);

    const ordered = KNOWN_SECTIONS.filter((section) => present.includes(section));

    const extra = present.filter((section) => !KNOWN_SECTIONS.includes(section));

    return [...ordered, ...extra];
  }, [data]);

  const update = (section: string, field: string, fieldValue: string) => {
    const nextData: RateLimitShape = {
      ...data,
      [section]: {
        ...(data[section] ?? {}),
        [field]: fieldValue,
      },
    };

    setData(nextData);

    onChange(JSON.stringify(nextData));
  };

  if (sections.length === 0) {
    return <p className="text-xs text-zinc-500">{t("admin.aiConfig.rateLimit.empty")}</p>;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const fields = Object.entries(data[section] ?? {});

        return (
          <div
            key={section}
            className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3"
          >
            {/* Section title */}
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                {section}
              </h3>

              <code className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {section}
              </code>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map(([field, fieldValue]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-[11px] text-zinc-400">{field}</Label>

                  <Input
                    value={fieldValue}
                    onChange={(e) => update(section, field, e.target.value)}
                    placeholder={t("admin.aiConfig.rateLimit.placeholder")}
                    className="border-white/15 bg-black/40 font-mono text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
