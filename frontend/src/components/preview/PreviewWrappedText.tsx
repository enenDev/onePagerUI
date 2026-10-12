import { cn } from "@/lib/utils";

const WORD_JOINER = "\u2060";

/**
 * Preview/track copy wraps on spaces only. Word joiners stop "-" and other
 * characters from becoming break points. A token wider than the column still
 * breaks, via overflow-wrap, so the text does not overflow.
 */
function keepTokenIntact(token: string) {
  return Array.from(token).join(WORD_JOINER);
}

export function PreviewWrappedText({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h3" | "span";
}) {
  const value = text || "—";
  const parts = value.split(/(\s+)/);

  return (
    <Tag className={cn("min-w-0 whitespace-pre-line", className)}>
      {parts.map((part, index) => {
        if (part === "") return null;
        if (/^\s+$/.test(part)) return part;
        return (
          <span
            key={index}
            className="inline-block max-w-full align-top [overflow-wrap:break-word]"
          >
            {keepTokenIntact(part)}
          </span>
        );
      })}
    </Tag>
  );
}
