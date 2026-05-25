export function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="glass-panel premium-border rounded-xl p-5">{children}</div>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="label-text font-semibold text-neutral/80">{children}</span>;
}

export function TagList({ value }: { value: string }) {
  const tags = value.split(",").map((x) => x.trim()).filter(Boolean);
  if (!tags.length) return <span className="text-neutral/40">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function MultiFormatSelect({ selected, onChange, options }: { selected: string; onChange: (value: string) => void; options: string[] }) {
  const current = new Set(selected.split(",").map((x) => x.trim()).filter(Boolean));
  function toggle(option: string) {
    const next = new Set(current);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(Array.from(next).join(", "));
  }

  return (
    <div className="filter flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`btn btn-sm rounded-full ${current.has(option) ? "btn-primary" : "btn-outline"}`}
          onClick={() => toggle(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
