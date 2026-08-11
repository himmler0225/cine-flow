import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceConfig {
  url?: string;
  key?: string;
  timeout?: number;
  service_token?: string;
  [key: string]: unknown;
}

type ServicesShape = Record<string, ServiceConfig>;

const KNOWN_SERVICES = ["ai_layer", "data_miner"];

const SECRET_FIELDS = new Set(["key", "service_token"]);

function safeParse(raw: string): ServicesShape {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ServicesShape;
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

export function ServicesEditor({ value, onChange }: Props) {
  const { t } = useTranslation();

  const [data, setData] = useState<ServicesShape>(() => safeParse(value));

  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const services = useMemo(() => {
    const present = Object.keys(data);

    const ordered = KNOWN_SERVICES.filter((s) => present.includes(s));

    const extra = present.filter((s) => !KNOWN_SERVICES.includes(s));

    return [...ordered, ...extra];
  }, [data]);

  const [active, setActive] = useState(() => services[0] ?? "");

  const update = (service: string, field: string, fieldValue: unknown) => {
    const next = { ...data, [service]: { ...data[service], [field]: fieldValue } };

    setData(next);

    onChange(JSON.stringify(next));
  };

  if (services.length === 0) {
    return <p className="text-xs text-zinc-500">{t("admin.aiConfig.services.empty")}</p>;
  }

  return (
    <Tabs value={active || services[0]} onValueChange={setActive}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-white/5 p-1">
        {services.map((s) => (
          <TabsTrigger key={s} value={s}>
            {s}
          </TabsTrigger>
        ))}
      </TabsList>
      {services.map((s) => {
        const svc = data[s] ?? {};

        const fields = Object.keys(svc);

        return (
          <TabsContent key={s} value={s} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((field) => {
              const isSecret = SECRET_FIELDS.has(field);

              const revealKey = `${s}.${field}`;

              const isRevealed = revealed.has(revealKey);

              const isNumber = typeof svc[field] === "number";

              return (
                <div key={field} className="space-y-1">
                  <Label className="text-[11px] text-zinc-400">{field}</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type={isNumber ? "number" : isSecret && !isRevealed ? "password" : "text"}
                      value={(svc[field] as string | number | undefined) ?? ""}
                      onChange={(e) =>
                        update(s, field, isNumber ? Number(e.target.value) || 0 : e.target.value)
                      }
                      className="border-white/15 bg-black/40 font-mono text-xs text-white"
                    />
                    {isSecret && (
                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((prev) => {
                            const next = new Set(prev);

                            if (next.has(revealKey)) next.delete(revealKey);
                            else next.add(revealKey);

                            return next;
                          })
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
                        aria-label={
                          isRevealed
                            ? t("admin.aiConfig.hideSecret")
                            : t("admin.aiConfig.showSecret")
                        }
                      >
                        {isRevealed ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
