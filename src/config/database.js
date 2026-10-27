const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

// Connection string comes from the environment, NEVER hardcoded in source.
async function connectDB(uri = env.MONGO_URI) {
  const conn = await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

module.exports = { connectDB, disconnectDB };
