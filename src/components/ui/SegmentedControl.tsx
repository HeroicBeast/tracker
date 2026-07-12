import clsx from 'clsx';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-surface-hover border border-line gap-1 w-full sm:w-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'h-9 px-4 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-initial',
            value === opt.value ? 'bg-accent-solid text-white' : 'text-ink-soft hover:text-ink'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
