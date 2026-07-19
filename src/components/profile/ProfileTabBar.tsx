import { Clock, Heart, User as UserIcon, ListPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", icon: UserIcon },
  { id: "favorites", icon: Heart },
  { id: "watchlists", icon: ListPlus },
  { id: "history", icon: Clock },
] as const;

interface ProfileTabBarProps {
  active: string;
  onChange: (tab: string) => void;
}

export function ProfileTabBar({ active, onChange }: ProfileTabBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 flex gap-1 overflow-x-auto border-b border-gray-800">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "text-white" : "text-gray-400 hover:text-gray-200",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t(`profile.tabs.${tab.id}`)}</span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-netflix-red"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
