import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichHtmlField } from "@/components/admin/aiConfig/RichHtmlField";

type PromptsShape = Record<string, Record<string, string>>;

const KNOWN_GROUP_ORDER = ["agent", "review_summary", "aspect_group", "aspect_summary"];

function safeParse(raw: string): PromptsShape {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as PromptsShape;
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

export function PromptsEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [data, setData] = useState<PromptsShape>(() => safeParse(value));

  const groups = useMemo(() => {
    const present = Object.keys(data);

    const ordered = KNOWN_GROUP_ORDER.filter((g) => present.includes(g));

    const extra = present.filter((g) => !KNOWN_GROUP_ORDER.includes(g));

    return [...ordered, ...extra];
  }, [data]);

  const [active, setActive] = useState(() => groups[0] ?? "");

  useEffect(() => {
    if (groups.length && !groups.includes(active)) setActive(groups[0]!);
  }, [groups, active]);

  const updateField = (group: string, field: string, text: string) => {
    setData((prev) => {
      const next = { ...prev, [group]: { ...(prev[group] || {}), [field]: text } };

      onChange(JSON.stringify(next));

      return next;
    });
  };

  if (groups.length === 0) {
    return <p className="text-xs text-zinc-500">{t("admin.aiConfig.prompts.empty")}</p>;
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-white/5 p-1">
        {groups.map((g) => (
          <TabsTrigger key={g} value={g}>
            {t(`admin.aiConfig.prompts.groups.${g}`, g)}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((g) => (
        <TabsContent key={g} value={g} className="space-y-4">
          {Object.entries(data[g] || {}).map(([field, text]) => (
            <div key={field} className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-300">
                {t(`admin.aiConfig.prompts.fields.${field}`, field)}
              </span>
              <RichHtmlField value={text} onChange={(v) => updateField(g, field, v)} />
            </div>
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
