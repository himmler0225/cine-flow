import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const equalHeightChildClass = "min-h-11 [&:is(button,a)]:inline-flex [&:is(button,a)]:items-center";

interface EqualButtonRowProps {
  children: ReactNode;
  className?: string;
}

/** Các nút cùng hàng: width theo nội dung, height đồng đều. */
export function EqualButtonRow({ children, className }: EqualButtonRowProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <div className={cn("flex flex-wrap items-stretch gap-2", className)}>
      {items.map((child, index) =>
        isValidElement<{ className?: string }>(child)
          ? cloneElement(child, {
              key: child.key ?? index,
              className: cn(equalHeightChildClass, child.props.className),
            })
          : child,
      )}
    </div>
  );
}
