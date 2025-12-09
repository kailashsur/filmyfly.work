# Routes

This file lists the main routes defined by the server and a short description. Routes are registered in `src/routes/*`.

Public routes (in `src/routes/index.routes.ts`)

- `GET /robots.txt` — serve robots rules (`controllers/index.controller.js`).
- `GET /` — home page (`getHomePage`).
- `GET /about` — about page.
- `GET /page-how-to-download-movie` — how-to-download page.
- `GET /site-1` and `GET /search` — search page / results.
- `GET /page-cat/:id/:slug` — category page.
- `GET /site-:slug` — public static pages (privacy, contact, etc.).
- `GET /:slug` — single movie page (catch-all movie route).

Admin routes (in `src/routes/admin.routes.ts`)

- `GET /admin/login` — admin login page (redirects if already authenticated).
- `POST /admin/login` — admin login POST.
- `POST /admin/logout` — logout endpoint.
- Protected routes (require `verifyAdminToken`):
  - `GET /admin` — dashboard
  - `GET /admin/system-check` — system diagnostics
  - `GET /admin/settings` — view settings
  - `POST /admin/settings` — update settings

- Static pages management
  - `GET /admin/static-pages` — list
  - `GET /admin/static-pages/add` — add form
  - `POST /admin/static-pages/add` — create
  - `GET /admin/static-pages/edit/:id` — edit form
  - `POST /admin/static-pages/edit/:id` — update
  - `POST /admin/static-pages/delete/:id` — delete

- Logs management
  - `GET /admin/logs` — logs UI
  - `GET /admin/logs/data` — logs JSON data
  - `POST /admin/logs/clear` — clear logs
  - `GET /admin/logs/download` — download logs

Admin movie management (in `src/routes/movie.routes.ts`)

- `GET /admin/movies` — movie listing (pagination)
- `GET /admin/movies/add` — add movie form
- `POST /admin/movies/add` — add movie
- `GET /admin/movies/edit/:id` — edit form
- `POST /admin/movies/edit/:id` — update movie
- `POST /admin/movies/delete/:id` — delete movie
- `GET /admin/movies/bulk-add` — bulk add form
- `POST /admin/movies/bulk-add` — bulk add processing
- `POST /admin/movies/trending/add/:id` — add to trending
- `POST /admin/movies/trending/remove/:id` — remove from trending
- `GET /admin/movies/by-category` — filter/list by category

Notes
- Route ordering matters: index routes include catch-all `/:slug` so SEO and more-specific routes must be declared before it.
- Authentication for admin routes is implemented in `src/middleware/auth.middleware.ts`.
