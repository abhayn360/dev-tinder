# DevTinder

A small "Tinder for developers" app. Users sign up, edit their profile, browse a feed of other
developers, send connection requests, and accept or reject them.

- **Backend** (this folder): REST API with **Node.js, Express 5 and MongoDB**
- **Frontend** ([frontend/](frontend/)): **React, React Router, TanStack Query and Tailwind**

The project is small on purpose. It's a learning project that follows the same practices used in production codebases.
👉 **Read [docs/NODE_GUIDE.md](docs/NODE_GUIDE.md)** (backend + full-stack concepts) and
[frontend/README.md](frontend/README.md) (how the React app is built).

## Quick start

You need two terminals, one for each app:

```bash
# Terminal 1: backend → http://localhost:3000
nvm use                 # uses the Node version in .nvmrc (22)
npm install
cp .env.example .env    # then fill in MONGO_URI and JWT_SECRET
npm run dev             # starts with auto-restart on file changes

# Terminal 2: frontend → http://localhost:5173  (open this in the browser)
cd frontend
npm install
npm run dev
```

Check the API is alive: `curl http://localhost:3000/health`

Or run the API and a local MongoDB with Docker: `docker compose up --build`

## Scripts

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Start in watch mode (restarts on save)    |
| `npm start`             | Start for production                      |
| `npm test`              | Run all tests (uses an in-memory MongoDB) |
| `npm run test:watch`    | Re-run tests on save                      |
| `npm run test:coverage` | Tests + coverage report                   |
| `npm run lint`          | Find code problems with ESLint            |
| `npm run format`        | Auto-format all files with Prettier       |

## Project structure

```
src/
├── server.js            # Entry point: connect DB, start server, graceful shutdown
├── app.js               # Express app: middleware pipeline + routes (no listen → testable)
├── config/              # env validation, logger, database connection
├── routes/              # URL → middleware chain → controller
├── middlewares/         # auth, validation, error handling
├── validators/          # zod schemas describing valid input
├── controllers/         # HTTP layer: read req, call service, send res
├── services/            # Business logic (no req/res, easy to test)
├── models/              # Mongoose schemas
└── utils/               # ApiError, response helpers
tests/
├── unit/                # small pieces in isolation
├── integration/         # real HTTP requests against an in-memory DB
└── helpers/
```

Request flow: `route → [rate limit] → [auth] → [validate] → controller → service → model → DB`.
Any error that's thrown goes to `middlewares/error.middleware.js`.

## API (all under `/api/v1`)

| Method | Path                                  | Auth | Description                          |
| ------ | ------------------------------------- | ---- | ------------------------------------ |
| POST   | `/auth/signup`                        |      | Create account (sets cookie)         |
| POST   | `/auth/login`                         |      | Log in (sets cookie, returns token)  |
| POST   | `/auth/logout`                        |      | Clear cookie                         |
| GET    | `/profile`                            | ✅   | My profile                           |
| PATCH  | `/profile`                            | ✅   | Update my profile                    |
| PATCH  | `/profile/password`                   | ✅   | Change password                      |
| POST   | `/requests/send/:status/:toUserId`    | ✅   | `status` = `interested` \| `ignored` |
| POST   | `/requests/review/:status/:requestId` | ✅   | `status` = `accepted` \| `rejected`  |
| GET    | `/user/requests/received`             | ✅   | Pending requests sent to me          |
| GET    | `/user/connections`                   | ✅   | My accepted connections              |
| GET    | `/user/feed?page=1&limit=10`          | ✅   | Developers I haven't interacted with |

Try them from VS Code with the REST Client extension: open [requests.http](requests.http).

**Response shape**

```json
{ "success": true,  "message": "OK", "data": { ... } }
{ "success": false, "error": { "message": "Validation failed", "details": [ ... ] } }
```
