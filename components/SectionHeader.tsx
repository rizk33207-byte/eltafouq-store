interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="space-y-2">
        {badge ? (
          <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/12 px-3 py-1 text-xs font-semibold text-sky-300">
            {badge}
          </span>
        ) : null}
        <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
        {subtitle ? <p className="max-w-2xl text-ink-soft">{subtitle}</p> : null}
      </div>
    </div>
  );
}
