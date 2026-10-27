// Spins up a throwaway in-memory MongoDB so tests never touch real data.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function clear() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function close() {
  await mongoose.disconnect();
  await mongod.stop();
}

module.exports = { connect, clear, close };
