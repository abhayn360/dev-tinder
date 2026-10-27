import { describe, expect, it } from 'vitest';
import { apiError } from '../test/utils';
import { getErrorMessage, getFieldErrors } from './errors';

describe('getErrorMessage', () => {
  it('returns the backend error message', () => {
    expect(getErrorMessage(apiError(409, 'Email is already registered'))).toBe(
      'Email is already registered',
    );
  });

  it('explains network errors (no response at all)', () => {
    expect(getErrorMessage(new Error('Network Error'))).toMatch(/cannot reach the server/i);
  });
});

describe('getFieldErrors', () => {
  it('maps details to { field: message }, keeping the first message per field', () => {
    const error = apiError(400, 'Validation failed', [
      { field: 'password', message: 'Too short' },
      { field: 'password', message: 'Needs a number' },
      { field: 'emailId', message: 'Invalid email' },
    ]);
    expect(getFieldErrors(error)).toEqual({ password: 'Too short', emailId: 'Invalid email' });
  });

  it('returns an empty object when there is no error', () => {
    expect(getFieldErrors(null)).toEqual({});
  });
});
