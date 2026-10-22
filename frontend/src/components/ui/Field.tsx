import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

const fieldBase =
  'w-full rounded-xl border bg-white px-3.5 text-sm text-ink-800 shadow-inset transition placeholder:text-ink-500/60 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-cream-100';

const stateClasses = (hasError?: boolean) =>
  hasError
    ? 'border-clay-400 focus:border-clay-500 focus:ring-clay-400/30'
    : 'border-cream-300 focus:border-forest-500 focus:ring-forest-500/20';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/** Label + control + hint/error wrapper used by every form in NutriCart. */
export function Field({ label, hint, error, required, children, className, htmlFor }: FieldProps) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-ink-600">
          {label}
          {required ? <span className="ml-0.5 text-clay-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-clay-500" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  wrapperClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hint, error, leadingIcon, trailing, className, wrapperClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName} htmlFor={inputId}>
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">{leadingIcon}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={clsx(fieldBase, stateClasses(Boolean(error)), 'h-10', leadingIcon && 'pl-9', trailing && 'pr-10', className)}
          {...rest}
        />
        {trailing ? <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span> : null}
      </div>
    </Field>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, className, wrapperClassName, id, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field label={label} hint={hint} error={error} required={required} className={wrapperClassName} htmlFor={inputId}>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={clsx(fieldBase, stateClasses(Boolean(error)), 'min-h-24 py-2.5 leading-relaxed', className)}
        {...rest}
      />
    </Field>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={clsx('flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 bg-white p-3 transition hover:border-forest-300', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-cream-300 text-forest-700 focus:ring-forest-500/30"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-ink-500">{description}</span> : null}
      </span>
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-cream-300 bg-white p-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/40',
          checked ? 'bg-forest-700' : 'bg-cream-300',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'left-4.5' : 'left-0.5',
          )}
          style={{ left: checked ? '1.125rem' : '0.125rem' }}
        />
      </button>
    </div>
  );
}
