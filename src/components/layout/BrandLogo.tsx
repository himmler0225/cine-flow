import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const BRAND_NAME = "Cine-Flow";

/** Icon: khối phim bo tròn đỏ + lỗ phim + nút play trắng */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-hidden className={cn("w-auto shrink-0", className)}>
      <defs>
        <linearGradient id="cf-brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5222D" />
          <stop offset="1" stopColor="#9B0710" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#cf-brand-g)" />
      <g fill="#000" opacity="0.28">
        <rect x="7.5" y="9" width="4" height="6" rx="1.4" />
        <rect x="7.5" y="21" width="4" height="6" rx="1.4" />
        <rect x="7.5" y="33" width="4" height="6" rx="1.4" />
      </g>
      <path d="M19 14.5 37 24 19 33.5 Z" fill="#fff" />
    </svg>
  );
}

type BrandLogoProps = {
  className?: string;
  /** Chiều cao icon, vd h-7 / h-9 / h-12 */
  imgClassName?: string;
  /** Cỡ chữ wordmark, vd text-xl / text-3xl */
  textClassName?: string;
  /** Bọc trong Link về trang chủ (mặc định true) */
  linked?: boolean;
  /** Nhãn accessibility */
  alt?: string;
};

export function BrandLogo({
  className,
  imgClassName = "h-8 sm:h-9",
  textClassName = "text-lg sm:text-xl",
  linked = true,
  alt = BRAND_NAME,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <BrandMark className={imgClassName} />
      <span
        className={cn(
          "truncate font-extrabold uppercase leading-none tracking-tight text-white",
          textClassName,
        )}
      >
        Cine
        <span className="text-netflix-red">Flow</span>
      </span>
    </span>
  );

  if (!linked) return content;

  return (
    <Link to="/" className="min-w-0 shrink" aria-label={alt}>
      {content}
    </Link>
  );
}

export { BRAND_NAME };
