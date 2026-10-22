import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useAuth } from '@/state/AuthContext';
import { useToast } from '@/state/ToastContext';
import { validateEmail } from '@/utils/validation';
import { friendlyMessage } from '@/utils/errors';

/**
 * The first screen of NutriCart — there is no public grocery homepage before
 * authentication. Login routes to Profile Setup when the account has no person
 * yet, and straight to Overview when it does.
 */
export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Password is required',
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back to NutriCart');
      navigate('/overview', { replace: true });
    } catch (error) {
      const message = friendlyMessage(error);
      setErrors({ password: message });
      toast.error('Could not sign you in', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to shop smart and stay on track with your nutrition goals."
      aside={
        <div className="rounded-2xl border border-sage-400/30 bg-forest-900/40 p-4 text-xs leading-relaxed text-cream-200">
          Shopping for more than one person? One NutriCart account holds a profile for every member of the family.
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name.123@gmail.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
          }}
        />

        <TextInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
          }}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-500 transition hover:bg-cream-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-3">
          <Link to="/help?topic=account" className="text-xs font-medium text-forest-700 hover:underline">
            Forgot password?
          </Link>
          <span className="text-xs text-ink-500">Minimum 8 characters</span>
        </div>

        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Login
        </Button>

        <p className="text-center text-xs text-ink-500">
          New to NutriCart?{' '}
          <Link to="/register" className="font-semibold text-forest-700 hover:underline">
            Create Account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
