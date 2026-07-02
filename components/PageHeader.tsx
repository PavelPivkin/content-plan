export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="glass-panel premium-border relative z-20 mb-6 flex flex-col gap-4 rounded-xl p-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-neutral md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-neutral/65">{subtitle}</p>
      </div>
      {actions && <div className="relative z-30 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
