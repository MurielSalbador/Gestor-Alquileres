export function SegmentedRadio<T extends string>({
  name,
  value,
  options,
  onChange,
  cols = options.length,
}: {
  name: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="peer sr-only"
          />
          <span className="block cursor-pointer rounded-lg border border-neutral-300 px-2.5 py-2 text-center text-xs font-medium text-neutral-600 transition-colors peer-checked:border-forest peer-checked:bg-forest peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-forest/30">
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}
