import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import { useSignup } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../lib/errors';
import { AuthCard } from './LoginPage';

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', emailId: '', password: '' });
  const signup = useSignup();
  const fieldErrors = getFieldErrors(signup.error);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const { lastName, ...rest } = form;
    // Don't send empty optional fields
    signup.mutate(lastName.trim() ? form : rest);
  };

  return (
    <AuthCard title="Create your account" subtitle="Join DevTinder and meet other developers.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert>{signup.isError && getErrorMessage(signup.error)}</Alert>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" htmlFor="firstName" error={fieldErrors.firstName}>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
          <FormField label="Last name" htmlFor="lastName" error={fieldErrors.lastName}>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="emailId" error={fieldErrors.emailId}>
          <input
            id="emailId"
            name="emailId"
            type="email"
            autoComplete="email"
            value={form.emailId}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
          hint="At least 8 characters, with a letter and a number."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>

        <Button type="submit" loading={signup.isPending} className="w-full">
          Sign up
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-rose-500 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
