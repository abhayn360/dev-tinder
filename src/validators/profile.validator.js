const { z } = require('zod');
const { password } = require('./common');

// Only these fields may be edited. emailId and password are deliberately
// NOT here, which protects against "mass assignment" attacks.
const updateProfileSchema = z.object({
  body: z
    .strictObject({
      firstName: z.string().trim().min(2).max(50),
      lastName: z.string().trim().max(50),
      age: z.number().int().min(18).max(120),
      gender: z.enum(['male', 'female', 'other']),
      photoUrl: z.url(),
      about: z.string().max(500),
      skills: z.array(z.string().trim().min(1).max(30)).max(10),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update'),
});

const changePasswordSchema = z.object({
  body: z.strictObject({
    currentPassword: z.string().min(1),
    newPassword: password,
  }),
});

module.exports = { updateProfileSchema, changePasswordSchema };
