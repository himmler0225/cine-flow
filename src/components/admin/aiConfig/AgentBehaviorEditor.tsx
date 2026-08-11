import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AgentBehaviorShape {
  max_iter?: number;
  max_comments?: number;
  max_comment_len?: number;
  max_list_items?: number;
  max_result_chars?: number;
  curated_top_n?: number;
  include_review_summary?: boolean;
  [key: string]: unknown;
}

const NUMBER_FIELDS = [
  "max_iter",
  "max_comments",
  "max_comment_len",
  "max_list_items",
  "max_result_chars",
  "curated_top_n",
] as const;

function safeParse(raw: string): AgentBehaviorShape {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AgentBehaviorShape;
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

export function AgentBehaviorEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [data, setData] = useState<AgentBehaviorShape>(() => safeParse(value));

  const update = (field: string, fieldValue: unknown) => {
    const next = { ...data, [field]: fieldValue };

    setData(next);

    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NUMBER_FIELDS.map((field) => (
          <div key={field} className="space-y-1">
            <Label className="text-[11px] text-zinc-400">
              {t(`admin.aiConfig.agent.fields.${field}`, field)}
            </Label>
            <Input
              type="number"
              value={(data[field] as number | string | undefined) ?? ""}
              onChange={(e) => update(field, Number(e.target.value) || 0)}
              className="border-white/15 bg-black/40 font-mono text-xs text-white"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300">
        <Checkbox
          checked={data.include_review_summary === true}
          onCheckedChange={(checked) => update("include_review_summary", checked === true)}
        />
        {t("admin.aiConfig.agent.fields.include_review_summary", "include_review_summary")}
      </label>
    </div>
  );
}
