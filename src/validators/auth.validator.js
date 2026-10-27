const { z } = require('zod');
const { email, password } = require('./common');

// z.strictObject rejects unknown fields, so nobody can sneak in extra data.
const signupSchema = z.object({
  body: z.strictObject({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().max(50).optional(),
    emailId: email,
    password,
  }),
});

const loginSchema = z.object({
  body: z.strictObject({
    emailId: email,
    password: z.string().min(1, 'Password is required'),
  }),
});

module.exports = { signupSchema, loginSchema };
