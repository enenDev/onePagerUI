/** Filled circle uses Clear Filters background. The mark uses Apply Filters blue. */
export function InfoMark() {
  return (
    <svg viewBox="0 0 16 16" className="block size-3 shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="8" className="fill-brand-soft" />
      <circle cx="8" cy="4.9" r="1.05" className="fill-primary" />
      <rect
        x="7.05"
        y="7"
        width="1.9"
        height="4.7"
        rx="0.95"
        className="fill-primary"
      />
    </svg>
  );
}
