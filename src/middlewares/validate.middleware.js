const ApiError = require('../utils/ApiError');

// Generic validation middleware. Pass it a zod schema shaped like
// { body?, params?, query? }. Never trust anything that comes from the client.
//
// The cleaned, typed values go to req.validated (in Express 5 req.query is read-only).
function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join('.'), // drop the leading "body"/"params"/"query"
        message: issue.message,
      }));
      throw ApiError.badRequest('Validation failed', details);
    }

    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
