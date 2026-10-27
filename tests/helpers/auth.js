const request = require('supertest');
const app = require('../../src/app');

let counter = 0;

// Creates a user and returns a supertest "agent" that keeps the auth cookie,
// like a logged-in browser.
async function createLoggedInUser(overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    firstName: `User${counter}`,
    emailId: `user${counter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await agent.post('/api/v1/auth/signup').send(body).expect(201);
  return { agent, user: res.body.data.user };
}

module.exports = { createLoggedInUser };
