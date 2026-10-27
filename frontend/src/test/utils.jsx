import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Renders a component with everything the app normally provides (router + query cache).
export function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

// Builds an error shaped like the ones axios throws for our backend.
export function apiError(status, message, details) {
  const error = new Error(message);
  error.response = { status, data: { success: false, error: { message, details } } };
  return error;
}
