// Structured logger. In production logs are JSON (easy for tools like
// Datadog / CloudWatch / Loki to search). In development they are pretty-printed.
const pino = require('pino');
const env = require('./env');

const logger = pino({
  level: env.isTest ? 'silent' : env.LOG_LEVEL,
  // Never log secrets, even by accident.
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password'],
  transport: env.isProduction || env.isTest ? undefined : { target: 'pino-pretty' },
});

module.exports = logger;
