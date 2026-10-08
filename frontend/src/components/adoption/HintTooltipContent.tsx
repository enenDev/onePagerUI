import { TooltipContent } from "@/components/ui/tooltip";

/** Drop the blank edges of a multiline string and the indent on each line. */
function hintLines(hint: string): string[] {
  const lines = hint.split("\n").map((line) => line.trim());
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start] === "") start += 1;
  while (end > start && lines[end - 1] === "") end -= 1;
  return lines.slice(start, end);
}

/**
 * Dashboard "i" hints. A real line break in the hint string is a new line.
 * text-wrap turns off the shared tooltip's text-balance, which drops breaks.
 */
export function HintTooltipContent({ hint }: { hint: string }) {
  return (
    <TooltipContent className="max-w-64 text-left text-wrap">
      {hintLines(hint).map((line, index) => (
        <span key={index} className="block">
          {line || "\u00a0"}
        </span>
      ))}
    </TooltipContent>
  );
}
