import { useAuthStore } from "@/store/authStore";
import { resolveUserDisplay } from "@/lib/userDisplay";
import { colorFor } from "@/components/profile/profileUtils";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
} as const;

type Props = {
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
};

export function UserAvatar({ size = "sm", className, ring = false }: Props) {
  const user = useAuthStore((s) => s.user);

  const profile = useAuthStore((s) => s.profile);

  const { displayName, avatarUrl, initial } = resolveUserDisplay(user, profile);

  const gradient = colorFor(displayName);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-bold text-white",
        SIZES[size],
        gradient,
        ring && "ring-2 ring-white/10",
        className,
      )}
      aria-hidden={!displayName}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </div>
  );
}
