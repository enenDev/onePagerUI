import { cn } from "@/lib/utils";

type PillTab = {
  id: string;
  label: string;
};

type PillTabsProps = {
  tabs: PillTab[];
  value: string;
  onChange: (id: string) => void;
};

export function PillTabs({ tabs, value, onChange }: PillTabsProps) {
  return (
    <div className="flex max-w-full justify-center">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full bg-brand-soft p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium transition-colors",
              value === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-white/50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
