import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AdminSelectOption<T extends string> {
  value: T;
  label: string;
}

interface AdminSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: AdminSelectOption<T>[];
  className?: string;
}

export function AdminSelect<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: AdminSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
      <SelectTrigger
        className={cn(
          "h-8 w-auto min-w-[9rem] border-white/10 bg-white/5 px-2.5 text-xs text-white shadow-none hover:bg-white/10",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-zinc-900 text-white">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-xs text-zinc-200 focus:bg-white/10 focus:text-white"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
