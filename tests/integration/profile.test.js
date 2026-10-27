const { describe, it, before, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../helpers/db');
const { createLoggedInUser } = require('../helpers/auth');

before(db.connect);
afterEach(db.clear);
after(db.close);

describe('Profile', () => {
  it('returns the logged-in user', async () => {
    const { agent, user } = await createLoggedInUser();
    const res = await agent.get('/api/v1/profile').expect(200);
    assert.equal(res.body.data.user._id, user._id);
  });

  it('updates allowed fields', async () => {
    const { agent } = await createLoggedInUser();
    const res = await agent
      .patch('/api/v1/profile')
      .send({ about: 'I love Node.js', skills: ['node', 'react'] })
      .expect(200);
    assert.deepEqual(res.body.data.user.skills, ['node', 'react']);
  });

  it('refuses to update the email (not an allowed field)', async () => {
    const { agent } = await createLoggedInUser();
    await agent.patch('/api/v1/profile').send({ emailId: 'hacker@example.com' }).expect(400);
  });

  it('changes the password only when the current one is correct', async () => {
    const { agent } = await createLoggedInUser();
    await agent
      .patch('/api/v1/profile/password')
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword1' })
      .expect(401);
    await agent
      .patch('/api/v1/profile/password')
      .send({ currentPassword: 'Password123', newPassword: 'NewPassword1' })
      .expect(200);
  });

  it('logs out by clearing the cookie', async () => {
    const { agent } = await createLoggedInUser();
    await agent.post('/api/v1/auth/logout').expect(200);
    await agent.get('/api/v1/profile').expect(401);
  });
});
