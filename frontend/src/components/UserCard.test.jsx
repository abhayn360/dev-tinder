import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UserCard from './UserCard';

describe('UserCard', () => {
  it('shows the name, details and skills', () => {
    render(
      <UserCard
        user={{
          firstName: 'Ada',
          lastName: 'Lovelace',
          age: 28,
          about: 'First programmer',
          skills: ['math', 'node'],
        }}
      />,
    );

    // Query the way a user sees the page: by role and visible text.
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText('First programmer')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Skills' })).toHaveTextContent('mathnode');
  });

  it('renders action buttons passed as children', () => {
    render(
      <UserCard user={{ firstName: 'Ada' }}>
        <button>Interested</button>
      </UserCard>,
    );
    expect(screen.getByRole('button', { name: 'Interested' })).toBeInTheDocument();
  });
});
