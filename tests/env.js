// Runs before every test file, BEFORE the app is loaded.
// dotenv never overrides variables that are already set, so these win over .env.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://placeholder'; // real URI comes from the in-memory server
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
