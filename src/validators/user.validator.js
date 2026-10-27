const { z } = require('zod');

// Query strings are always strings, so z.coerce turns "2" into 2.
const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

module.exports = { paginationSchema };
