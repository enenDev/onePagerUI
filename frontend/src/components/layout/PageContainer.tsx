import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared horizontal inset for header content + page body across the app. */
export const PAGE_INSET_CLASS = "px-6 lg:px-8";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
};

export function PageContainer({
  children,
  className,
  as: Tag = "div",
}: PageContainerProps) {
  return (
    <Tag className={cn("w-full", PAGE_INSET_CLASS, className)}>{children}</Tag>
  );
}
