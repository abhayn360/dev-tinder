// Integration tests: send real HTTP requests to the app with a real (in-memory) DB.
const { describe, it, before, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');

before(db.connect);
afterEach(db.clear);
after(db.close);

const newUser = { firstName: 'Abhay', emailId: 'abhay@example.com', password: 'Password123' };

describe('POST /api/v1/auth/signup', () => {
  it('creates a user, sets an httpOnly cookie and never returns the password', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(newUser).expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.emailId, 'abhay@example.com');
    assert.equal(res.body.data.user.password, undefined);
    assert.match(res.headers['set-cookie'][0], /token=.*HttpOnly/);
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/v1/auth/signup').send(newUser).expect(201);
    const res = await request(app).post('/api/v1/auth/signup').send(newUser).expect(409);
    assert.equal(res.body.error.message, 'Email is already registered');
  });

  it('returns 400 with field details for invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ firstName: 'A', emailId: 'not-an-email', password: '123' })
      .expect(400);
    const fields = res.body.error.details.map((d) => d.field);
    for (const field of ['firstName', 'emailId', 'password']) {
      assert.ok(fields.includes(field), `expected an error for ${field}`);
    }
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => request(app).post('/api/v1/auth/signup').send(newUser));

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailId: newUser.emailId, password: newUser.password })
      .expect(200);
    assert.ok(res.body.data.token);
  });

  it('returns 401 for a wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({ emailId: newUser.emailId, password: 'WrongPass1' })
      .expect(401);
  });
});

describe('Protected routes', () => {
  it('returns 401 without a token', async () => {
    await request(app).get('/api/v1/profile').expect(401);
  });

  it('accepts a Bearer token (for mobile apps / Postman)', async () => {
    await request(app).post('/api/v1/auth/signup').send(newUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ emailId: newUser.emailId, password: newUser.password });

    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${login.body.data.token}`)
      .expect(200);
  });

  it('returns 401 for a tampered token', async () => {
    await request(app)
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer not.a.real.token')
      .expect(401);
  });
});

describe('Unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/api/v1/nope').expect(404);
    assert.equal(res.body.success, false);
  });
});
