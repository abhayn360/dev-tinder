# DevTinder Frontend

React app for the DevTinder API. Start the backend first (see the [root README](../README.md)), then:

```bash
npm install
npm run dev      # http://localhost:5173
```

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Dev server with hot reload         |
| `npm run build`   | Production build into `dist/`      |
| `npm run preview` | Serve the production build locally |
| `npm test`        | Run component tests (Vitest)       |
| `npm run lint`    | Lint with oxlint                   |

## Tech stack and why

| Tool                         | Job                                                                  |
| ---------------------------- | -------------------------------------------------------------------- |
| **Vite**                     | Dev server + bundler. Very fast, the current standard for React apps |
| **React 19**                 | UI as components                                                     |
| **React Router**             | Pages / URLs without full page reloads                               |
| **TanStack Query**           | Fetching, caching and syncing **server data**                        |
| **axios**                    | HTTP client, with one configured instance for the whole app          |
| **Tailwind CSS**             | Styling with utility classes, right in the JSX                       |
| **Vitest + Testing Library** | Component tests that interact with the UI like a user would          |

## Folder structure

```
src/
├── main.jsx            # Entry: providers (QueryClient, Router)
├── router.jsx          # All routes in one place
├── api/                # One function per backend endpoint (the ONLY place that calls axios)
├── lib/
│   ├── api.js          # axios instance + 401 interceptor
│   ├── queryClient.js  # TanStack Query defaults
│   ├── queryKeys.js    # Cache keys
│   └── errors.js       # Turn backend errors into messages / field errors
├── hooks/useAuth.js    # useCurrentUser, useLogin, useSignup, useLogout
├── components/         # Reusable UI: Navbar, UserCard, Button, FormField, route guards
├── pages/              # One component per route
└── test/               # Test setup + helpers
```

Data flows **page → hook / useQuery → api/ function → axios → backend**. Components never build
URLs or call axios themselves, so if an endpoint changes, you change one file.

## Key ideas

### 1. Connecting to the backend: the dev proxy

[vite.config.js](vite.config.js) forwards every `/api/*` request to `http://localhost:3000`. The
browser only ever talks to `localhost:5173`, so frontend and backend look like the **same origin**:

- No CORS problems.
- The backend's `httpOnly` cookie is stored and sent automatically.

In production, set `VITE_API_URL` (see [.env.example](.env.example)) to the real API URL, or serve
both from the same domain. `VITE_*` variables are compiled into the public bundle, so **never put
secrets in them**.

### 2. Authentication on the frontend

- The JWT lives in an **httpOnly cookie**. JavaScript _can't_ read it, which protects it from XSS.
  So how do we know who's logged in? We ask the server: `useCurrentUser()` calls `GET /profile`.
  A `401` means "not logged in" (`null`), not an error.
- **Route guards** ([components/](src/components/)): `ProtectedRoute` sends logged-out users to
  `/login` and remembers where they were going. `GuestRoute` sends logged-in users away from login/signup.
- After login, `useLogin` puts the user into the cache. `GuestRoute` notices and redirects. No
  manual `navigate()` is needed.
- **Session expiry**: the axios interceptor in [lib/api.js](src/lib/api.js) catches any `401` and
  marks the user as logged out, so every protected page reacts at once.

> Frontend route guards are only for **user experience**. The backend is what actually protects
> data. Anyone can open DevTools and change the frontend.

### 3. Server state with TanStack Query

Data from the server isn't "yours". It can change at any time, so it needs caching, refetching and
loading/error states. TanStack Query handles all of that:

```js
// READ: loading / error / data for free, cached under a key
const feed = useQuery({ queryKey: ['feed'], queryFn: () => getFeed({ limit: 10 }) });

// WRITE: then tell the cache what changed
const swipe = useMutation({
  mutationFn: ({ status, userId }) => sendRequest(status, userId),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }), // refetch the feed
});
```

Two ways to update the cache after a write:

- `invalidateQueries`: "this is stale, refetch it" (Feed, Requests pages)
- `setQueryData`: "here's the new value, use it" (Profile page: the server returns the updated user)

The Navbar's request badge and the Requests page use the **same key**, so they share one fetch and
update together. This is why apps like this rarely need Redux any more: **server state** lives in
TanStack Query, and the little **UI state** left (form inputs) lives in `useState`.

### 4. Forms and errors

- Controlled inputs: the value lives in `useState`, and `onChange` updates it.
- `e.preventDefault()` stops the browser's default full-page form submit.
- The backend validates everything. [lib/errors.js](src/lib/errors.js) turns its `details` into
  `{ field: message }`, so errors appear **under the right input**.
- Form values are always strings, so `toPayload()` in ProfilePage converts them (`age` → number,
  `skills` → array) and leaves out empty optional fields.

### 5. Accessibility basics (also makes testing easier)

Every input has a `<label htmlFor>`, alerts use `role="alert"`, the spinner uses `role="status"`,
and real `<button>`s and `<a>`s are used. Tests find elements the same way screen readers do:
`getByLabelText('Email')`, `getByRole('button', { name: 'Log in' })`.

### 6. Testing

- [UserCard.test.jsx](src/components/UserCard.test.jsx): render a component and check what the user sees.
- [LoginPage.test.jsx](src/pages/LoginPage.test.jsx): **mock the API module** with `vi.mock`, then
  type and click with `user-event`, like a real user.
- [errors.test.js](src/lib/errors.test.js): plain unit tests for pure functions.

## Practice ideas

1. Add a "Load more" button to the feed using `pagination.page` (or `useInfiniteQuery`).
2. Use **optimistic updates**: remove the card instantly and roll back if the request fails.
3. Lazy-load pages with `React.lazy` to make the first load smaller (code splitting).
4. Add toast notifications (e.g. `sonner`) instead of inline success messages.
5. Replace the hand-written forms with **React Hook Form + zod**, the same validation library as the backend.
6. Add swipe gestures to the feed card (`framer-motion`).
7. Add a chat page once the backend has Socket.IO (see the root guide's exercises).
8. Convert to TypeScript.
