import { useState } from 'react';
import { Link } from 'react-router';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import { useLogin } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../lib/errors';

export default function LoginPage() {
  const [form, setForm] = useState({ emailId: '', password: '' });
  const login = useLogin();
  const fieldErrors = getFieldErrors(login.error);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    login.mutate(form); // on success, GuestRoute redirects automatically
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to find developers to connect with.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Alert>{login.isError && getErrorMessage(login.error)}</Alert>

        <FormField label="Email" htmlFor="emailId" error={fieldErrors.emailId}>
          <input
            id="emailId"
            name="emailId"
            type="email"
            autoComplete="email"
            value={form.emailId}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={fieldErrors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            className={inputClass}
            required
          />
        </FormField>

        <Button type="submit" loading={login.isPending} className="w-full">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-rose-500 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
      {children}
    </div>
  );
}
