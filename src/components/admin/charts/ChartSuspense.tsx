import { Suspense, type ReactNode } from "react";
import { SectionLoader } from "@/components/admin/Section";

export function ChartSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SectionLoader />}>{children}</Suspense>;
}
