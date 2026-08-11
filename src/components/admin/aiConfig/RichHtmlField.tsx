import { Suspense, lazy, useEffect, useState } from "react";

const RichHtmlEditor = lazy(() =>
  import("@/components/admin/aiConfig/RichHtmlEditor").then((m) => ({ default: m.RichHtmlEditor })),
);

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}

export function RichHtmlField({ value, onChange, minHeight = 260 }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-full rounded-md border border-white/10 bg-black/40 p-3 text-sm text-zinc-500"
        style={{ minHeight }}
      >
        {value
          ? value
              .replace(/<[^>]+>/g, " ")
              .trim()
              .slice(0, 400)
          : ""}
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div
          className="w-full animate-pulse rounded-md border border-white/10 bg-white/5"
          style={{ minHeight }}
        />
      }
    >
      <RichHtmlEditor value={value} onChange={onChange} minHeight={minHeight} />
    </Suspense>
  );
}
