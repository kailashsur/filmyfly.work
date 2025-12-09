# Architecture & Project Structure

High-level structure

- `src/` — TypeScript source code
  - `app.ts` — Express app entry point
  - `controllers/` — request handlers
  - `routes/` — route definitions (wired into `app.ts`)
  - `middleware/` — Express middleware (auth, sessions, error handling)
  - `config/` — database and firebase config
  - `lib/prisma.ts` — Prisma client wrapper
  - `views/` — EJS templates used for server-rendered pages

- `public/` — static assets (css, images, JS, sitemap.xml)
- `prisma/` — Prisma schema and migrations
- `generated/prisma/` — generated Prisma client types and helpers
- `scripts/` — helpful scripts for seeding/importing data

Key components

- Routing: `src/routes/*` declares public and admin routes. Admin endpoints are prefixed with `/admin` and are protected by `verifyAdminToken` middleware.
- Controllers: Each controller returns EJS views or performs admin tasks like creating/editing movies and settings.
- Database: Prisma ORM; schema in `prisma/schema.prisma` and migrations in `prisma/migrations/`.
- Sessions: uses `express-session` and `cookie-parser` for admin session handling.

Deployment notes

- Build the project with `npm run build` and run `npm start` to serve the compiled `dist/` files.
- Ensure environment variables are present on the host (especially `DATABASE_URL` and `SESSION_SECRET`).
