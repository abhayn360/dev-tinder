# The Node.js Developer Guide (using DevTinder as the example)

This guide covers the ideas a Node.js / full-stack developer needs to know. Each section explains
**what** the idea is, **why** it matters, and **where it lives in this project**, so you can open
the file and see it in action.

Read it in order the first time. Later, use it as a checklist.

---

## Table of contents

1. [How Node.js actually works](#1-how-nodejs-actually-works)
2. [Modules, npm and package.json](#2-modules-npm-and-packagejson)
3. [Project structure and layered architecture](#3-project-structure-and-layered-architecture)
4. [Configuration and environment variables](#4-configuration-and-environment-variables)
5. [Express: the middleware pipeline](#5-express-the-middleware-pipeline)
6. [REST API design](#6-rest-api-design)
7. [Validation: never trust the client](#7-validation-never-trust-the-client)
8. [Error handling](#8-error-handling)
9. [Databases and MongoDB / Mongoose](#9-databases-and-mongodb--mongoose)
10. [Authentication and authorization](#10-authentication-and-authorization)
11. [Security checklist](#11-security-checklist)
12. [Logging and monitoring](#12-logging-and-monitoring)
13. [Testing](#13-testing)
14. [Code quality: linting, formatting, Git](#14-code-quality-linting-formatting-git)
15. [Running in production: Docker, CI/CD, deployment](#15-running-in-production-docker-cicd-deployment)
16. [Performance and scaling](#16-performance-and-scaling)
17. [Connecting a frontend (the full-stack part)](#17-connecting-a-frontend-the-full-stack-part)
18. [Things this project doesn't cover yet (learn next)](#18-things-this-project-doesnt-cover-yet-learn-next)
19. [Exercises to practise with this project](#19-exercises-to-practise-with-this-project)

---

## 1. How Node.js actually works

**Node.js = the V8 JavaScript engine (from Chrome) + libuv (a C library for async I/O) + built-in modules** (`fs`, `http`, `crypto`, ...).

### The single thread and the event loop

- Your JavaScript runs on **one main thread**.
- Slow work like reading files, database queries and HTTP calls is **handed off** to the OS or to
  libuv's thread pool. Node doesn't wait for it. It keeps serving other requests.
- When that work finishes, its callback or promise result goes into a **queue**. The **event loop**
  picks items off the queue and runs them on the main thread.

That's why one Node process can handle thousands of concurrent requests: most of the time, requests
are just waiting for the database.

```
request → JS runs → await User.find()  ──► (DB works in background)
                         ↓ main thread is FREE to handle other requests
                    DB answers → callback queued → event loop resumes your function
```

### The golden rule: don't block the event loop

CPU-heavy synchronous code freezes the **whole server** for **everyone**:

```js
// ❌ Blocks every user while it runs
const hash = bcrypt.hashSync(password, 10);
JSON.parse(hugeString);
while (Date.now() < end) {}

// ✅ Async versions let other requests run
const hash = await bcrypt.hash(password, 10);
```

For really heavy CPU work (image processing, big reports), use **worker threads** or a background
job queue (see §18).

### Execution order (common interview question)

```js
console.log('1');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('2');
// 1, 2, nextTick, promise, timeout
```

Synchronous code runs first, then `process.nextTick`, then promise microtasks, then timers and I/O
callbacks (macrotasks).

### Callbacks → Promises → async/await

These are three styles for the same thing. Modern code uses **async/await** (this whole project
does). Always `await` promises, or errors will escape as "unhandled rejections".

```js
// Run independent things in PARALLEL, not one after another:
const [users, total] = await Promise.all([User.find(filter), User.countDocuments(filter)]);
```

→ See `getFeed` in [src/services/user.service.js](../src/services/user.service.js).

### Other core concepts to know

| Concept           | One-liner                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| **Streams**       | Process data in chunks (big files, uploads) instead of loading it all into memory      |
| **Buffer**        | Raw binary data (files, network packets)                                               |
| **EventEmitter**  | The pub/sub pattern Node is built on (`server.on('request')`, `process.on('SIGTERM')`) |
| **process**       | Info and control for the running app: `process.env`, `process.exit()`, signals         |
| **cluster / PM2** | Run one Node process per CPU core to use all cores                                     |

---

## 2. Modules, npm and package.json

### CommonJS vs ES Modules

```js
// CommonJS (this project, and still very common)
const express = require('express');
module.exports = { signup };

// ES Modules (the modern standard; add "type": "module" to package.json)
import express from 'express';
export { signup };
```

Both are fine. New projects increasingly use ESM. Learn to read both.

### package.json essentials

- **dependencies**: needed at runtime (`express`, `mongoose`).
- **devDependencies**: needed only to develop or test (`eslint`, `prettier`, `supertest`).
  Production installs skip them (`npm ci --omit=dev` in the [Dockerfile](../Dockerfile)).
- **scripts**: your project's commands (`npm run dev`, `npm test`). Teammates shouldn't have to
  memorise long commands.
- **engines** + [.nvmrc](../.nvmrc): which Node version the project expects.

### Semantic versioning (semver): `MAJOR.MINOR.PATCH`

- `^5.2.1` accepts any `5.x.x` ≥ 5.2.1 (minor and patch updates are safe).
- A **MAJOR** bump means breaking changes. Read the changelog before upgrading.

### package-lock.json: always commit it

It pins the **exact** version of every package, so your laptop, CI and production all install
identical code. Use `npm ci` (not `npm install`) in CI and Docker. It installs exactly what's in the
lockfile.

### Useful npm commands

`npm outdated` · `npm audit` (known vulnerabilities) · `npm ls <pkg>` · `npx <tool>` (run without
installing globally)

> Note: `npm audit` currently reports a moderate issue inside a dev-only tool's dependency tree.
> Always check **whether a vulnerability reaches production code** before panicking or running
> `npm audit fix --force`, which can install breaking versions.

---

## 3. Project structure and layered architecture

Your first version had everything in `app.js`. That works for 4 routes, but it falls apart at 40.
Industry projects split code by **responsibility**:

| Layer          | Job                                                 | Knows about       | File example                                                |
| -------------- | --------------------------------------------------- | ----------------- | ----------------------------------------------------------- |
| **Route**      | Map URL + method → middlewares → controller         | Express           | [auth.routes.js](../src/routes/auth.routes.js)              |
| **Middleware** | Cross-cutting work: auth, validation, logging       | req/res           | [auth.middleware.js](../src/middlewares/auth.middleware.js) |
| **Controller** | Read the request, call a service, send the response | req/res, services | [auth.controller.js](../src/controllers/auth.controller.js) |
| **Service**    | **Business rules.** No `req`/`res`.                 | models            | [request.service.js](../src/services/request.service.js)    |
| **Model**      | Data shape and DB access                            | Mongoose          | [user.model.js](../src/models/user.model.js)                |

**Why bother?**

- **Testability**: services are plain functions, so they're easy to test.
- **Reuse**: the same service can be called from an API route, a cron job or a CLI script.
- **Navigation**: any developer knows where to look for things.

**app.js vs server.js**: [app.js](../src/app.js) _builds_ the app and [server.js](../src/server.js)
_starts_ it. Tests import `app` directly and never open a real port.

**Alternative you'll see:** "feature folders" (`src/modules/auth/{routes,controller,service}.js`).
Same idea, grouped by feature instead of by layer. It's popular in bigger codebases and in NestJS.

---

## 4. Configuration and environment variables

**Rule: anything that changes between environments, or anything secret, goes in environment
variables, never in code.** (This comes from the "12-Factor App", worth reading.)

Your original `database.js` had the MongoDB password hardcoded. If that ever gets pushed to GitHub,
bots scrape it within minutes. Now:

- [.env](../.env) holds real values. It's **git-ignored** and never committed.
- [.env.example](../.env.example) is committed. It documents which variables exist, with fake values.
- [src/config/env.js](../src/config/env.js) **validates** them at startup with zod. If `JWT_SECRET`
  is missing, the app refuses to start with a clear message, instead of failing mysteriously later.
- The rest of the code imports `env` and never reads `process.env` directly.

In production, env vars are set in your hosting dashboard (Render, Railway, AWS, ...) or a secrets
manager. There's no `.env` file on the server.

---

## 5. Express: the middleware pipeline

Express is a **pipeline of functions**. Every request flows through them top to bottom
([app.js](../src/app.js)):

```
helmet → cors → express.json → cookieParser → logger → routes → notFound → errorHandler
```

A middleware is `(req, res, next) => {}`. It can:

- modify `req` (e.g. `requireAuth` sets `req.user`),
- end the request (`res.json(...)`),
- pass control on with `next()`,
- report an error with `throw` or `next(err)`. Express then skips to the error handler.

**Order matters:** `express.json()` must come before routes that read `req.body`, and the error
handler must come **last**.

**Route-level middleware** runs only for specific routes:

```js
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.use(requireAuth); // every route below this line requires login
```

**Express 5 vs 4:** in Express 5 (this project), errors thrown inside `async` handlers are caught
automatically. In Express 4 you needed `try/catch` everywhere or an `asyncHandler` wrapper. You'll
see that pattern in older code and tutorials.

**Alternatives to know about:** Fastify (faster, schema-based), NestJS (structured, Angular-like,
TypeScript), Hono. The concepts carry over to all of them.

---

## 6. REST API design

### Resources + HTTP methods

| Method | Meaning                   | Example             |
| ------ | ------------------------- | ------------------- |
| GET    | Read (never changes data) | `GET /profile`      |
| POST   | Create / action           | `POST /auth/signup` |
| PATCH  | Partial update            | `PATCH /profile`    |
| PUT    | Full replace              | rarely used         |
| DELETE | Delete                    | `DELETE /posts/:id` |

Your first version used `POST /getUser`, which should be `GET`, and `DELETE /deleteUser` with the
id in the body, which should be `DELETE /users/:id`. **The verb belongs in the method, not the URL.**

### Status codes you must know

| Code | When                            | Where in this project                |
| ---- | ------------------------------- | ------------------------------------ |
| 200  | OK                              | most responses                       |
| 201  | Created                         | signup, send request                 |
| 400  | Bad input                       | validation failed                    |
| 401  | Not logged in / bad credentials | missing or invalid token             |
| 403  | Logged in but not allowed       | (e.g. non-admin hitting admin route) |
| 404  | Not found                       | unknown route, missing request       |
| 409  | Conflict                        | email already registered             |
| 429  | Too many requests               | rate limiter                         |
| 500  | Our bug                         | unhandled error                      |
| 503  | Temporarily unavailable         | `/health` when DB is down            |

### Conventions used here

- **Versioning:** `/api/v1/...`. Breaking changes go to `/api/v2` and old clients keep working.
- **Consistent response shape:** `{ success, message, data }` / `{ success: false, error }`, so
  the frontend handles every response the same way. See [utils/response.js](../src/utils/response.js).
- **Pagination:** `?page=2&limit=10`, returning `{ users, pagination: { page, limit, total, totalPages } }`.
  Never return an unbounded list.
- **Health check:** `GET /health` for load balancers and uptime monitors.

**Also learn:** filtering and sorting via query params, cursor-based pagination (better for
infinite scroll), API docs with **OpenAPI/Swagger**, idempotency, and GraphQL as an alternative to REST.

---

## 7. Validation: never trust the client

Anyone can send anything to your API with curl or Postman. The frontend's validation is only for
user experience. **The backend is the real gatekeeper.**

This project validates at two levels:

1. **Request validation** with **zod** ([src/validators/](../src/validators/)), before the
   controller runs. Bad input gets a `400` with field-level details.
2. **Database validation** in the Mongoose schema (`required`, `enum`, `min`, `maxlength`), as the
   last line of defence.

Important tricks used here:

- `z.strictObject` **rejects unknown fields**. Without it, someone could `PATCH /profile` with
  `{"emailId": "...", "isAdmin": true}`. This attack is called **mass assignment**. Your original
  `updateUser` was vulnerable to it.
- `z.coerce.number()`: query params are always strings (`"2"`), so this converts them.
- `.trim().toLowerCase()` **before** checking the email format. A unit test caught this exact bug
  while building the project, which shows why tests matter.

---

## 8. Error handling

**One central place handles all errors**: [error.middleware.js](../src/middlewares/error.middleware.js).

- Throw an [`ApiError`](../src/utils/ApiError.js) anywhere: `throw ApiError.notFound('User not found')`.
- Library errors are translated: Mongoose `ValidationError` → 400, duplicate key `11000` → 409,
  JWT errors → 401, malformed JSON → 400.
- Anything unknown is a **bug** → 500, logged with the full stack. The client gets a generic
  message, because stack traces leak internals.

**Two kinds of errors:**

- **Operational** (expected): bad input, not found, wrong password. Return a 4xx.
- **Programmer** (bugs): undefined variables, etc. Log them, return 500, then fix the code.

**Process-level safety net** ([server.js](../src/server.js)): `unhandledRejection` and
`uncaughtException` log and then **exit**. The app may be in a broken state, so a process manager
(Docker, PM2, Kubernetes) restarts it clean.

---

## 9. Databases and MongoDB / Mongoose

### SQL vs NoSQL: know both

|            | **MongoDB** (NoSQL, document)              | **PostgreSQL / MySQL** (SQL, relational)       |
| ---------- | ------------------------------------------ | ---------------------------------------------- |
| Data       | JSON-like documents                        | Tables, rows, strict schema                    |
| Relations  | References + `populate`, or embedding      | Foreign keys + JOINs                           |
| Good for   | Flexible / evolving data, fast prototyping | Strong consistency, complex relations, reports |
| Node tools | Mongoose                                   | Prisma, Drizzle, Sequelize, Knex               |

Most companies use PostgreSQL. **Learn SQL basics as well**: `SELECT`, `JOIN`, `GROUP BY`, indexes,
transactions.

### Mongoose concepts used in this project

- **Schema and validation**: [user.model.js](../src/models/user.model.js).
- **`timestamps: true`**: adds `createdAt` / `updatedAt` automatically.
- **`select: false`** on `password`: never returned unless you ask with `.select('+password')`.
- **`toJSON` transform**: strips `password` and `__v` from every response.
- **Hooks (middleware)**: `pre('save')` hashes the password. Note that hooks run on `save()` but
  **not** on `findOneAndUpdate()`. That's why profile updates use `user.set()` + `save()`.
- **Instance methods**: `user.comparePassword()`.
- **References + `populate`**: a `ConnectionRequest` stores user ids, and `.populate('fromUserId', fields)`
  fills in user details, like a JOIN. See [connectionRequest.model.js](../src/models/connectionRequest.model.js).
- **Projection**: `.select('firstName lastName ...')` returns only public fields (`PUBLIC_USER_FIELDS`).
- **Indexes**: `unique: true` on email, and a **compound unique index** on `{ fromUserId, toUserId }`.
  Indexes make queries fast and also enforce rules at the DB level, which protects against race conditions.

### Things to learn next

- **Indexes** in depth: without them every query scans the whole collection. Use `.explain()`.
- **Aggregation pipeline** (`$match`, `$group`, `$lookup`) for reports and analytics.
- **Transactions**: when two writes must both succeed or both fail (e.g. a money transfer).
- **The N+1 problem**: querying inside a loop. Fetch in bulk instead, as `getFeed` does.
- **Migrations**: versioned scripts for changing data or schema over time.

---

## 10. Authentication and authorization

- **Authentication (AuthN)**: _who are you?_ (login)
- **Authorization (AuthZ)**: _what are you allowed to do?_ (e.g. only the receiver can accept a request)

### Passwords

- **Never store plain passwords.** Hash them with **bcrypt** (or argon2). Hashing is one-way, and
  bcrypt adds a random **salt** and is deliberately slow, so brute-forcing is expensive.
- Login returns the **same error** for "no such email" and "wrong password", so attackers can't
  discover which emails are registered.

> ⚠️ Users created by your old code have plain-text passwords in the database, so they can't log in
> now. Delete them and sign up again.

### JWT (JSON Web Token)

A signed token: `header.payload.signature`. The server signs `{ sub: userId }` with `JWT_SECRET`.
On each request it **verifies the signature**, so no DB session lookup is needed for the token itself.

- The payload is **readable by anyone** (it's base64, not encrypted). Never put secrets in it.
- Tokens can't easily be revoked before they expire. Real apps use **short-lived access tokens +
  refresh tokens**, or a token blacklist.

### Where to store the token: cookie vs localStorage

|                                    | httpOnly cookie (used here) | localStorage                      |
| ---------------------------------- | --------------------------- | --------------------------------- |
| Readable by JS (XSS can steal it)? | ❌ No                       | ✅ Yes, risky                     |
| Sent automatically?                | ✅ Yes                      | ❌ You attach the header yourself |
| CSRF risk?                         | Mitigated with `sameSite`   | None                              |

Cookie flags in [auth.controller.js](../src/controllers/auth.controller.js): `httpOnly`, `secure`
(HTTPS only in production) and `sameSite: 'lax'`.

The middleware **also accepts `Authorization: Bearer <token>`** for mobile apps and Postman.

### Authorization example

In `reviewRequest` ([request.service.js](../src/services/request.service.js)) the query includes
`toUserId: loggedInUserId`, so you can only accept requests **sent to you**. The test
`Alice can NOT accept her own request` proves it. Always check ownership. Bugs here, where a user
reaches another user's data by changing an id, are called **IDOR**, and they're one of the most
common real-world vulnerabilities.

**Learn next:** role-based access (`role: 'admin'` + an `authorize('admin')` middleware), OAuth
("Login with Google/GitHub" using Passport.js or Auth.js), refresh tokens, email verification,
password reset flows.

---

## 11. Security checklist

Applied in this project:

- [x] **helmet**: secure HTTP headers
- [x] **CORS**: only your frontend origin may call the API with credentials
- [x] **Rate limiting** on login/signup: stops brute force (returns `429`)
- [x] **Body size limit** `10kb`: stops huge-payload attacks
- [x] **Input validation + unknown fields rejected**: stops mass assignment and **NoSQL injection**
      (e.g. `{"emailId": {"$ne": null}}` is rejected because emailId must be a string)
- [x] **Passwords hashed**, never returned, redacted from logs
- [x] **Secrets in env vars**, `.env` git-ignored
- [x] **Generic error messages** in production (no stack traces)
- [x] **Docker runs as a non-root user**

Learn the **OWASP Top 10** (search it): it's the industry-standard list of web vulnerabilities.
Also: XSS, CSRF, SQL injection, SSRF, and keeping dependencies updated (`npm audit`, Dependabot).

---

## 12. Logging and monitoring

- `console.log` is fine while learning. Real apps use a **structured logger**. This project uses
  **pino** ([config/logger.js](../src/config/logger.js)).
- **Log levels**: `fatal > error > warn > info > debug > trace`. Production usually runs at `info`.
- **Structured (JSON) logs** in production can be searched in tools like Datadog, Grafana Loki or
  CloudWatch: "show all 500s for user X in the last hour".
- **Request logging** (`pino-http`) records method, URL, status and response time automatically.
- **Never log** passwords, tokens or cookies (see `redact`). Your old code logged the whole `req`,
  cookies included.

**Monitoring** (learn later): error tracking (**Sentry**), metrics (Prometheus/Grafana), uptime
checks hitting `/health`, and alerting.

---

## 13. Testing

### The testing pyramid

- **Unit tests** (many, fast): one function in isolation → [tests/unit/](../tests/unit/)
- **Integration tests** (some): real HTTP requests + a real DB → [tests/integration/](../tests/integration/)
- **E2E tests** (few): a real browser clicking through frontend + backend (Playwright, Cypress)

### Tools used here

- **`node:test`**: Node's built-in test runner. Nothing to install.
- **supertest**: sends HTTP requests to `app` without starting a server.
- **mongodb-memory-server**: a throwaway MongoDB per test file, so tests **never touch your real data**.
- `request.agent(app)` keeps cookies between requests, like a logged-in browser.
  See [tests/helpers/auth.js](../tests/helpers/auth.js).

**Jest** and **Vitest** are the other popular runners you'll see in job posts. The syntax is
almost the same (`describe`, `it`, `expect`). Fun fact: this project tried Jest first, but Jest's
sandbox breaks the MongoDB 7 driver's connection handshake. Picking tools that fit your stack is
part of the job.

**Good habits:**

- Test **behaviour**, not implementation: "duplicate email → 409".
- Test the **unhappy paths**: bad input, no auth, someone else's data.
- Each test is **independent**: the DB is cleared after each one.
- Run tests in CI on every push.

---

## 14. Code quality: linting, formatting, Git

- **ESLint** ([eslint.config.js](../eslint.config.js)) catches bugs: unused variables, `==`
  instead of `===`, stray `console.log`. Run `npm run lint`.
- **Prettier** ([.prettierrc](../.prettierrc)) formats the code automatically, so the team never
  argues about style. Run `npm run format`. Install the VS Code extensions and enable "format on save".
- **EditorConfig** ([.editorconfig](../.editorconfig)) keeps indentation and line endings consistent
  across editors.
- **Husky + lint-staged** (learn next) run lint and format automatically before each commit.

### Git workflow used in companies

1. `main` is always deployable.
2. Create a branch per feature: `git checkout -b feat/user-photos`
3. Make small commits with clear messages. **Conventional Commits** is common:
   `feat: add photo upload`, `fix: handle expired token`, `docs: update README`
4. Push → open a **Pull Request** → CI runs → a teammate reviews → merge.

---

## 15. Running in production: Docker, CI/CD, deployment

### Docker

- [Dockerfile](../Dockerfile): packages the app into an image that runs the same everywhere.
  Notice: a small `alpine` base image, `package*.json` copied first for **layer caching**,
  `npm ci --omit=dev`, and running as the `node` user, not root.
- [docker-compose.yml](../docker-compose.yml): runs the API + MongoDB together with one command.
- [.dockerignore](../.dockerignore): keeps `node_modules`, `.env` and tests out of the image.

### CI/CD

[.github/workflows/ci.yml](../.github/workflows/ci.yml): on every push or PR, GitHub installs
dependencies and runs lint, format check and tests. A red ❌ blocks broken code from being merged.
**CD** (continuous deployment) then automatically deploys `main` when CI passes.

### Production must-haves

- **Graceful shutdown** ([server.js](../src/server.js)): on `SIGTERM`, stop accepting requests,
  finish in-flight ones, close the DB, exit. Deploys then never cut users off mid-request.
- **Health check endpoint**: the platform restarts the container if it fails.
- **`trust proxy`**: behind a load balancer, needed for correct IPs and secure cookies.
- **HTTPS everywhere**, usually handled by the platform or Nginx.
- **Process manager**: Docker/Kubernetes restart policies or **PM2** on a plain VM.

**Where to deploy (easy → advanced):** Render / Railway / Fly.io → AWS EC2 + Nginx + PM2 → AWS
ECS / Kubernetes. Use **MongoDB Atlas** (what you're using now) for the database.

---

## 16. Performance and scaling

In rough order of what matters most:

1. **Database indexes**: the number one cause of slow APIs is a missing index.
2. **Don't fetch what you don't need**: projection (`.select`), pagination, `.lean()` for
   read-only queries (returns plain objects instead of heavy Mongoose documents).
3. **Run independent awaits in parallel** with `Promise.all`.
4. **Caching** with **Redis** for hot data (feeds, sessions, rate-limit counters across servers).
5. **Compression** (`compression` middleware, or let Nginx/CDN do it).
6. **Horizontal scaling**: run many instances behind a load balancer. This works because the API is
   **stateless**: the JWT holds the identity and nothing lives in server memory.
7. **Offload heavy work** to background jobs (see §18).

Measure before optimising: use `autocannon` for load testing and `clinic.js` / `--inspect` for profiling.

---

## 17. Connecting a frontend (the full-stack part)

The React app in [frontend/](../frontend/) is connected to this API. Read
[frontend/README.md](../frontend/README.md) for how it works. The core idea is short:

```js
// Frontend (React) with axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // ⭐ sends the httpOnly cookie. Without it, every call is 401.
});

const { data } = await api.post('/auth/login', { emailId, password });
const feed = await api.get('/user/feed', { params: { page: 1, limit: 10 } });
```

With `fetch`: `fetch(url, { credentials: 'include' })`.

**Why CORS?** Browsers block JavaScript on `localhost:5173` from reading responses from
`localhost:3000` (a different origin) unless the server allows it. In [app.js](../src/app.js):
`cors({ origin: env.CORS_ORIGIN, credentials: true })`. Note that with credentials, the origin
**can't** be `*`.

**Production setup options:**

- Same domain (`app.com` serves the frontend, `app.com/api` the backend): no CORS issues. This is the simplest.
- Different domains (`app.com` + `api.app.com`): set `CORS_ORIGIN`, and you may need
  `sameSite: 'none'` + `secure: true` on the cookie.

**In development** this project skips CORS entirely: the Vite dev server **proxies** `/api` to
`localhost:3000` (see [frontend/vite.config.js](../frontend/vite.config.js)), so the browser sees one origin.

**What the frontend uses:** React Router (pages + route guards), **TanStack Query** (server data and
caching, used instead of Redux), axios with an interceptor that logs the user out on any 401,
Tailwind CSS, and Vitest + Testing Library.

---

## 18. Things this project doesn't cover yet (learn next)

| Topic                      | What / why                                                  | Tools                         |
| -------------------------- | ----------------------------------------------------------- | ----------------------------- |
| **TypeScript**             | Types catch bugs before runtime. Expected in most jobs now. | `tsc`, `tsx`                  |
| **Real-time**              | Chat between connected devs, live notifications             | Socket.IO, WebSockets         |
| **File uploads**           | Profile photos                                              | multer → AWS S3 / Cloudinary  |
| **Emails**                 | Welcome email, password reset                               | Nodemailer, Resend, SES       |
| **Background jobs**        | Send emails or process images without slowing the request   | BullMQ + Redis                |
| **Cron jobs**              | "Daily digest of pending requests"                          | node-cron                     |
| **Caching**                | Speed up hot reads                                          | Redis                         |
| **Payments**               | Premium membership; learn **webhooks**                      | Stripe, Razorpay              |
| **API docs**               | Interactive docs for frontend devs                          | Swagger / OpenAPI             |
| **SQL + ORM**              | Most companies use Postgres                                 | PostgreSQL + Prisma / Drizzle |
| **Auth providers**         | Login with Google/GitHub                                    | Passport.js, Auth.js, Clerk   |
| **Microservices / queues** | Splitting big systems apart                                 | RabbitMQ, Kafka               |
| **System design**          | Load balancers, caching, DB scaling, CAP theorem            | for interviews and seniority  |

---

## 19. Exercises to practise with this project

Do these in order. Each one teaches something new. Write a test for each!

1. **Easy:** add `GET /api/v1/user/:userId` to view another user's public profile (validate the id, 404 if missing).
2. **Easy:** add `DELETE /api/v1/profile` to delete your account (also delete their connection requests).
3. **Medium:** add a `role` field and an `authorize('admin')` middleware. Admins can list all users.
4. **Medium:** add `?skills=node,react` filtering to the feed.
5. **Medium:** upload a profile photo with multer (save locally first, then try Cloudinary or S3).
6. **Medium:** add Swagger docs with `swagger-ui-express`.
7. **Hard:** add **refresh tokens** (15-minute access token + 7-day refresh token).
8. **Hard:** add **real-time chat** between connected users with Socket.IO, saving messages in a `Message` model.
9. **Hard:** send a welcome email in a **background job** (BullMQ + Redis via docker-compose).
10. **Full-stack:** extend the frontend for every backend exercise above (see the practice ideas in
    [frontend/README.md](../frontend/README.md)).
11. **Stretch:** convert the project to **TypeScript**.
12. **Stretch:** deploy it: Render or Railway for the API, Vercel for the frontend, Atlas for the DB.

Good luck, and keep building! 🚀
