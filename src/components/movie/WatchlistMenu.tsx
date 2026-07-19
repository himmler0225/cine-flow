import { useState } from "react";
import { ListPlus, Check, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useAuthStore } from "@/store/authStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { movieActionButtonVariants } from "@/components/movie/movieActionButton";

interface WatchlistMenuProps {
  slug: string;
  movieName: string;
}

export function WatchlistMenu({ slug, movieName }: WatchlistMenuProps) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const lists = useWatchlistStore((s) => s.lists);
  const addToList = useWatchlistStore((s) => s.addToList);
  const removeFromList = useWatchlistStore((s) => s.removeFromList);
  const isInList = useWatchlistStore((s) => s.isInList);
  const createList = useWatchlistStore((s) => s.createList);
  const [newListName, setNewListName] = useState("");

  const inAny = lists.some((l) => isInList(l.id, slug));

  const handleCreate = () => {
    const name = newListName.trim();
    if (!name) return;
    createList(name);
    setNewListName("");
    toast.success(t("toast.listCreated"));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="w-full md:w-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={movieActionButtonVariants({
              intent: inAny ? "solid" : "secondary",
              className: open ? "ring-2 ring-white/20" : undefined,
            })}
          >
            <ListPlus className="h-4 w-4" />
            {t("movie.watchlistBtn")}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={10}
          collisionPadding={16}
          className="z-[200] w-72 overflow-hidden rounded-xl border border-white/10 bg-netflix-dark p-0 text-white shadow-2xl"
        >
          <p className="border-b border-white/10 px-3 py-2.5 text-xs text-netflix-muted">
            {t("movie.addMovieTo", { name: movieName })}
          </p>
          <ul className="max-h-56 overflow-y-auto py-1">
            {lists.map((list) => {
              const active = isInList(list.id, slug);
              return (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (active) {
                        removeFromList(list.id, slug);
                        toast.success(t("toast.removedFromList", { name: list.name }));
                      } else {
                        addToList(list.id, slug);
                        toast.success(t("toast.addedToList", { name: list.name }));
                      }
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10 active:bg-white/15"
                  >
                    <span>{list.name}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-netflix-red" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/10 p-2.5">
            <div className="flex gap-1.5">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                placeholder={t("movie.newListNamePlaceholder")}
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 transition-colors focus:border-netflix-red focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-md bg-netflix-red p-1.5 text-white transition-colors hover:bg-netflix-red-hover active:scale-95"
                aria-label={t("movie.createList")}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
