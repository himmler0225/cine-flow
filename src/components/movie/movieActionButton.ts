import { cva, type VariantProps } from "class-variance-authority";

export const movieActionButtonVariants = cva(
  "inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-netflix-red focus-visible:ring-offset-2 focus-visible:ring-offset-netflix-black active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 md:w-auto",
  {
    variants: {
      intent: {
        primary:
          "bg-netflix-red text-white shadow-lg shadow-netflix-red/20 hover:bg-netflix-red-hover hover:shadow-netflix-red/30",
        secondary: "bg-white/15 text-white hover:bg-white/25",
        solid: "bg-white text-black hover:bg-white/90",
      },
    },
    defaultVariants: {
      intent: "secondary",
    },
  },
);

export type MovieActionButtonIntent = NonNullable<
  VariantProps<typeof movieActionButtonVariants>["intent"]
>;
