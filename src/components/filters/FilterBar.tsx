import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenres, useCountries } from "@/hooks/useGenres";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MovieFilters = {
  category?: string;
  country?: string;
  year?: string;
  sort_lang?: string;
  sort_field?: string;
  sort_type?: string;
};

type Props = {
  value: MovieFilters;
  onChange: (next: MovieFilters) => void;
  hide?: Array<keyof MovieFilters>;
};

const ALL = "__all__";

export function FilterBar({ value, onChange, hide = [] }: Props) {
  const { t } = useTranslation();
  const { data: genres } = useGenres();
  const { data: countries } = useCountries();

  const sortLangs = useMemo(
    () => [
      { value: "vietsub", label: t("filters.vietsub") },
      { value: "thuyet-minh", label: t("filters.dubbed") },
      { value: "long-tieng", label: t("filters.voiceOver") },
    ],
    [t],
  );

  const sortFields = useMemo(
    () => [
      { value: "modified.time", label: t("filters.sortUpdated") },
      { value: "_id", label: t("filters.sortNew") },
      { value: "year", label: t("filters.sortYear") },
    ],
    [t],
  );

  const sortTypes = useMemo(
    () => [
      { value: "desc", label: t("filters.sortDesc") },
      { value: "asc", label: t("filters.sortAsc") },
    ],
    [t],
  );

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: now - 1969 }, (_, i) => String(now - i));
  }, []);

  const set = <K extends keyof MovieFilters>(key: K, v: string) =>
    onChange({ ...value, [key]: v === ALL ? undefined : v });

  const hasAny =
    !!value.category ||
    !!value.country ||
    !!value.year ||
    !!value.sort_lang ||
    !!value.sort_field ||
    !!value.sort_type;

  const shouldShow = (k: keyof MovieFilters) => !hide.includes(k);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {shouldShow("category") && (
          <FilterSelect
            label={t("filters.genre")}
            value={value.category ?? ALL}
            onValueChange={(v) => set("category", v)}
            placeholder={t("filters.allGenres")}
            options={(genres ?? []).map((g) => ({ value: g.slug, label: g.name }))}
          />
        )}
        {shouldShow("country") && (
          <FilterSelect
            label={t("filters.country")}
            value={value.country ?? ALL}
            onValueChange={(v) => set("country", v)}
            placeholder={t("filters.allCountries")}
            options={(countries ?? []).map((c) => ({ value: c.slug, label: c.name }))}
          />
        )}
        {shouldShow("year") && (
          <FilterSelect
            label={t("filters.year")}
            value={value.year ?? ALL}
            onValueChange={(v) => set("year", v)}
            placeholder={t("filters.allYears")}
            options={years.map((y) => ({ value: y, label: y }))}
          />
        )}
        <FilterSelect
          label={t("filters.language")}
          value={value.sort_lang ?? ALL}
          onValueChange={(v) => set("sort_lang", v)}
          placeholder={t("filters.all")}
          options={sortLangs}
        />
        <FilterSelect
          label={t("filters.sort")}
          value={value.sort_field ?? ALL}
          onValueChange={(v) => set("sort_field", v)}
          placeholder={t("filters.default")}
          options={sortFields}
        />
        <FilterSelect
          label={t("filters.status")}
          value={value.sort_type ?? ALL}
          onValueChange={(v) => set("sort_type", v)}
          placeholder={t("filters.default")}
          options={sortTypes}
        />
      </div>
      {hasAny && (
        <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onChange({})}
            className="group h-8 gap-1.5 rounded-full px-3 text-xs font-semibold text-netflix-red hover:bg-netflix-red/10 hover:text-netflix-red"
          >
            <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
            {t("filters.clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  const active = value !== ALL;

  return (
    <div className="min-w-0">
      <label
        className={cn(
          "mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider",
          active ? "text-white" : "text-netflix-muted/90",
        )}
      >
        {label}
        {active && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-netflix-red" />}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "h-10 w-full rounded-full border px-4 text-sm transition-all",
            "focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red/50",
            "data-[state=open]:border-netflix-red/60",
            active
              ? "border-netflix-red/50 bg-netflix-red/10 text-white hover:border-netflix-red"
              : "border-white/10 bg-white/[0.05] text-netflix-text hover:border-white/30 hover:bg-white/[0.08] hover:text-white",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-netflix-black/95 text-white backdrop-blur-md">
          <SelectItem value={ALL} className="text-netflix-muted focus:bg-white/10 focus:text-white">
            {placeholder}
          </SelectItem>
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="focus:bg-white/10 focus:text-white data-[state=checked]:text-netflix-red"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
