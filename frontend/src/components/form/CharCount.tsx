export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {value.length}/{max}
    </span>
  );
}
