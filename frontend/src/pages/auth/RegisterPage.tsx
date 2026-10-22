import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useAuth } from '@/state/AuthContext';
import { useToast } from '@/state/ToastContext';
import { useAppData } from '@/state/hooks';
import { validateConfirmPassword, validateEmail, validateFullName, validatePassword } from '@/utils/validation';
import { friendlyMessage } from '@/utils/errors';

/** Registration always continues into Profile Setup — never into Overview. */
export function RegisterPage() {
  const { register } = useAuth();
  const { refresh } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      fullName: validateFullName(values.fullName),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      await refresh();
      toast.success('Account created', 'Tell us who you are shopping for.');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      const message = friendlyMessage(error);
      setErrors((current) => ({
        ...current,
        email: message.toLowerCase().includes('email') ? message : current.email,
      }));
      toast.error('Could not create the account', message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordToggle = (visible: boolean, toggle: () => void, label: string) => (
    <button
      type="button"
      onClick={toggle}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-cream-200"
      aria-label={label}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="One account holds every person you shop for, plus your pantry, orders and nutrition history."
      aside={
        <div className="rounded-2xl border border-sage-400/30 bg-forest-900/40 p-4 text-xs leading-relaxed text-cream-200">
          Passwords are hashed before they are stored — and never kept in plain text.
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <TextInput
          label="Full name"
          autoComplete="name"
          placeholder="Ragavi Kannan"
          leadingIcon={<User className="h-4 w-4" />}
          value={values.fullName}
          error={errors.fullName}
          onChange={(event) => set({ fullName: event.target.value })}
        />
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name.123@gmail.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={values.email}
          error={errors.email}
          hint="Gmail addresses with dots and numbers work fine."
          onChange={(event) => set({ email: event.target.value })}
        />
        <TextInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={values.password}
          error={errors.password}
          hint="Minimum 8 characters with at least one letter and one number."
          trailing={passwordToggle(showPassword, () => setShowPassword((current) => !current), 'Show password')}
          onChange={(event) => set({ password: event.target.value })}
        />
        <TextInput
          label="Confirm password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={values.confirmPassword}
          error={errors.confirmPassword}
          trailing={passwordToggle(showConfirm, () => setShowConfirm((current) => !current), 'Show confirm password')}
          onChange={(event) => set({ confirmPassword: event.target.value })}
        />

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Create Account
        </Button>

        <p className="text-center text-xs text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-forest-700 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
