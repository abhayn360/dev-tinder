import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth';
import { apiError, renderWithProviders } from '../test/utils';
import LoginPage from './LoginPage';

// Replace the real API module with fakes: component tests shouldn't need a backend.
vi.mock('../api/auth');

describe('LoginPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('sends the email and password to the API', async () => {
    authApi.login.mockResolvedValue({ _id: '1', firstName: 'Ada' });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(authApi.login).toHaveBeenCalledWith(
      { emailId: 'ada@example.com', password: 'Password123' },
      expect.anything(), // TanStack Query passes a context object as the 2nd argument
    );
  });

  it('shows the error message from the server', async () => {
    authApi.login.mockRejectedValue(apiError(401, 'Invalid email or password'));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
