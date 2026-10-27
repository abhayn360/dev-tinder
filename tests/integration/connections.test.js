const { describe, it, before, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../helpers/db');
const { createLoggedInUser } = require('../helpers/auth');

before(db.connect);
afterEach(db.clear);
after(db.close);

describe('Connection flow', () => {
  it('send -> receive -> accept -> both see the connection', async () => {
    const alice = await createLoggedInUser();
    const bob = await createLoggedInUser();

    // Alice is interested in Bob
    const sent = await alice.agent
      .post(`/api/v1/requests/send/interested/${bob.user._id}`)
      .expect(201);
    const requestId = sent.body.data.request._id;

    // Bob sees it in his received requests
    const received = await bob.agent.get('/api/v1/user/requests/received').expect(200);
    assert.equal(received.body.data.requests.length, 1);
    assert.equal(received.body.data.requests[0].fromUserId.firstName, alice.user.firstName);

    // Alice can NOT accept her own request (authorization)
    await alice.agent.post(`/api/v1/requests/review/accepted/${requestId}`).expect(404);

    // Bob accepts
    await bob.agent.post(`/api/v1/requests/review/accepted/${requestId}`).expect(200);

    const aliceConnections = await alice.agent.get('/api/v1/user/connections').expect(200);
    assert.equal(aliceConnections.body.data.connections[0]._id, bob.user._id);
    const bobConnections = await bob.agent.get('/api/v1/user/connections').expect(200);
    assert.equal(bobConnections.body.data.connections[0]._id, alice.user._id);
  });

  it('rejects duplicate requests in either direction', async () => {
    const alice = await createLoggedInUser();
    const bob = await createLoggedInUser();
    await alice.agent.post(`/api/v1/requests/send/interested/${bob.user._id}`).expect(201);
    await bob.agent.post(`/api/v1/requests/send/interested/${alice.user._id}`).expect(409);
  });

  it('rejects invalid status and self-requests', async () => {
    const alice = await createLoggedInUser();
    await alice.agent.post(`/api/v1/requests/send/accepted/${alice.user._id}`).expect(400);
    await alice.agent.post(`/api/v1/requests/send/interested/${alice.user._id}`).expect(400);
  });
});

describe('Feed', () => {
  it('hides yourself and people you already interacted with, and paginates', async () => {
    const me = await createLoggedInUser();
    const ignored = await createLoggedInUser();
    await createLoggedInUser();
    await createLoggedInUser();

    await me.agent.post(`/api/v1/requests/send/ignored/${ignored.user._id}`).expect(201);

    const res = await me.agent.get('/api/v1/user/feed?page=1&limit=1').expect(200);
    assert.equal(res.body.data.users.length, 1);
    assert.deepEqual(res.body.data.pagination, { page: 1, limit: 1, total: 2, totalPages: 2 });
    // Public fields only
    assert.equal(res.body.data.users[0].emailId, undefined);
  });
});
