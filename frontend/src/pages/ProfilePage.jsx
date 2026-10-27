import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { changePassword, updateProfile } from '../api/profile';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import UserCard from '../components/UserCard';
import { useCurrentUser } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';

// Form inputs are always strings; the API wants proper types.
// Turn the form into the payload the backend expects.
function toPayload(form) {
  const payload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    about: form.about.trim(),
    skills: form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
  if (form.age !== '') payload.age = Number(form.age);
  if (form.gender) payload.gender = form.gender;
  if (form.photoUrl.trim()) payload.photoUrl = form.photoUrl.trim();
  return payload;
}

export default function ProfilePage() {
  const { data: user } = useCurrentUser(); // ProtectedRoute guarantees a user here
  return (
    <div className="space-y-10">
      <EditProfileSection user={user} />
      <ChangePasswordSection />
    </div>
  );
}

function EditProfileSection({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    age: user.age?.toString() ?? '',
    gender: user.gender ?? '',
    photoUrl: user.photoUrl ?? '',
    about: user.about ?? '',
    skills: user.skills?.join(', ') ?? '',
  });

  const save = useMutation({
    mutationFn: updateProfile,
    // The server returns the updated user, so put it straight into the cache.
    // Navbar and everything else using the user re-renders instantly.
    onSuccess: (updatedUser) => queryClient.setQueryData(queryKeys.me, updatedUser),
  });
  const fieldErrors = getFieldErrors(save.error);

  const handleChange = (e) => {
    save.reset(); // clear old success / error messages while editing
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate(toPayload(form));
  };

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <Alert>{save.isError && getErrorMessage(save.error)}</Alert>
        <Alert type="success">{save.isSuccess && 'Profile saved!'}</Alert>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="First name" htmlFor="firstName" error={fieldErrors.firstName}>
            <input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
          <FormField label="Last name" htmlFor="lastName" error={fieldErrors.lastName}>
            <input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
          <FormField label="Age" htmlFor="age" error={fieldErrors.age}>
            <input
              id="age"
              name="age"
              type="number"
              min="18"
              value={form.age}
              onChange={handleChange}
              className={inputClass}
            />
          </FormField>
          <FormField label="Gender" htmlFor="gender" error={fieldErrors.gender}>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
        </div>

        <FormField label="Photo URL" htmlFor="photoUrl" error={fieldErrors.photoUrl}>
          <input
            id="photoUrl"
            name="photoUrl"
            type="url"
            value={form.photoUrl}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="About"
          htmlFor="about"
          error={fieldErrors.about}
          hint={`${form.about.length}/500`}
        >
          <textarea
            id="about"
            name="about"
            rows={3}
            maxLength={500}
            value={form.about}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Skills"
          htmlFor="skills"
          error={fieldErrors.skills}
          hint="Comma separated, e.g. node, react, mongodb"
        >
          <input
            id="skills"
            name="skills"
            value={form.skills}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>

        <Button type="submit" loading={save.isPending}>
          Save profile
        </Button>
      </form>

      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Live preview
        </h2>
        <UserCard user={{ ...user, ...toPayload(form) }} />
      </div>
    </section>
  );
}

function ChangePasswordSection() {
  const emptyForm = { currentPassword: '', newPassword: '' };
  const [form, setForm] = useState(emptyForm);
  const change = useMutation({ mutationFn: changePassword, onSuccess: () => setForm(emptyForm) });
  const fieldErrors = getFieldErrors(change.error);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <section className="max-w-md border-t border-slate-200 pt-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change.mutate(form);
        }}
        className="space-y-4"
        noValidate
      >
        <h2 className="text-xl font-bold">Change password</h2>
        <Alert>{change.isError && getErrorMessage(change.error)}</Alert>
        <Alert type="success">{change.isSuccess && 'Password changed!'}</Alert>

        <FormField
          label="Current password"
          htmlFor="currentPassword"
          error={fieldErrors.currentPassword}
        >
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>
        <FormField label="New password" htmlFor="newPassword" error={fieldErrors.newPassword}>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            className={inputClass}
          />
        </FormField>
        <Button type="submit" variant="secondary" loading={change.isPending}>
          Update password
        </Button>
      </form>
    </section>
  );
}
