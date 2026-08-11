import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function AuthField({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  trailing,
  id,
  autoComplete,
  label,
}: {
  icon: ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  trailing?: ReactNode;
  id?: string;
  autoComplete?: string;
  label?: string;
}) {
  const fieldId = id ?? placeholder.replace(/\s+/g, "-").toLowerCase();

  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-1">
      {label ? (
        <Label htmlFor={fieldId} className="sr-only">
          {label}
        </Label>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-black/40 px-3 py-1 focus-within:border-netflix-red",
          error ? "border-red-500" : "border-border",
        )}
      >
        <span className="text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
        <Input
          id={fieldId}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-label={label ?? placeholder}
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthPasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}

export function AuthCheckboxField({
  id,
  checked,
  onCheckedChange,
  label,
  error,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5 border-border data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
        />
        <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
