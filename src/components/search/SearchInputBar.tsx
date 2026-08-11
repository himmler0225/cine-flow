import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchModalStore } from "@/components/search/store/searchModalStore";

type Props = {
  isFetching: boolean;
  onClose: () => void;
};

export function SearchInputBar({ isFetching, onClose }: Props) {
  const { t } = useTranslation();

  const q = useSearchModalStore((s) => s.q);

  const setQ = useSearchModalStore((s) => s.setQ);

  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
      <Search
        className={cn(
          "h-5 w-5 text-netflix-muted transition-colors",
          isFetching && "animate-pulse text-netflix-red",
        )}
      />
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search.placeholder")}
        className="flex-1 bg-transparent text-base text-white placeholder:text-netflix-muted focus:outline-none"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          className="rounded-full p-1 text-netflix-muted hover:bg-white/10 hover:text-white"
          aria-label={t("search.clear")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded border border-white/10 px-2 py-0.5 text-[11px] font-medium text-netflix-muted hover:bg-white/10 hover:text-white"
      >
        Close
      </button>
    </div>
  );
}
