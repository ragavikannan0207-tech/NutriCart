import { useMemo, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useDismissable } from '@/hooks';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
  align?: 'left' | 'right';
  /** Renders the button content without the default label lookup. */
  renderValue?: (option: DropdownOption<T> | undefined) => ReactNode;
  disabled?: boolean;
}

/**
 * The NutriCart custom dropdown — used instead of the browser select everywhere
 * so the control matches the design system. Click outside or Escape closes it and
 * it is fully keyboard accessible (Enter/Space to open, Escape to close).
 */
export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select',
  size = 'md',
  className,
  align = 'left',
  renderValue,
  disabled,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white text-left transition',
          'border-cream-300 hover:border-forest-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/25',
          size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3.5 text-sm',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {label ? <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</span> : null}
          <span className="truncate font-medium text-ink-800">
            {renderValue ? renderValue(selected) : (selected?.label ?? placeholder)}
          </span>
        </span>
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-ink-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="listbox"
          className={clsx(
            'absolute z-50 mt-1.5 max-h-72 w-full min-w-52 overflow-auto rounded-2xl border border-cream-300 bg-white p-1.5 shadow-lift animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  'flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition',
                  isSelected ? 'bg-forest-50 text-forest-800' : 'text-ink-700 hover:bg-cream-100',
                  option.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {option.icon ? <span className="mt-0.5 shrink-0">{option.icon}</span> : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block text-xs text-ink-500">{option.description}</span> : null}
                </span>
                {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" /> : null}
              </button>
            );
          })}
          {options.length === 0 ? <p className="px-3 py-3 text-xs text-ink-500">No options available</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Helper that turns plain strings into dropdown options. */
export function toOptions(values: readonly string[]): DropdownOption<string>[] {
  return values.map((value) => ({ value, label: value }));
}
