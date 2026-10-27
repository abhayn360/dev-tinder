// Unit tests: test one small piece in isolation. No server, no database.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { signupSchema } = require('../../src/validators/auth.validator');

const valid = { firstName: 'Abhay', emailId: 'ABHAY@Example.com ', password: 'Password123' };

describe('signupSchema', () => {
  it('accepts valid input and normalises the email', () => {
    const result = signupSchema.parse({ body: valid });
    assert.equal(result.body.emailId, 'abhay@example.com');
  });

  it('rejects a weak password', () => {
    const result = signupSchema.safeParse({ body: { ...valid, password: 'short' } });
    assert.equal(result.success, false);
  });

  it('rejects unknown fields (mass assignment protection)', () => {
    const result = signupSchema.safeParse({ body: { ...valid, isAdmin: true } });
    assert.equal(result.success, false);
  });
});
