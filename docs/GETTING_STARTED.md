# Getting Started

Prerequisites
- Node.js (>= 18 recommended)
- npm (or `pnpm`/`yarn` if you prefer)
- PostgreSQL (or another DB supported by Prisma; connection configured via `DATABASE_URL`)

Quick setup

1. Install dependencies

```powershell
cd "c:\Users\Kailash\Desktop\filmyfly\New folder"
npm install
```

2. Configure environment

- Copy environment variables from a sample (create a `.env` at project root). At minimum set:
  - `DATABASE_URL` — your Postgres connection string
  - `SESSION_SECRET` — secret for sessions
  - Firebase credentials if using Firebase features (see `README_FIREBASE_SETUP.md`)

3. Generate Prisma client (postinstall runs this, but you can run manually):

```powershell
npm run prisma:generate
```

4. Run database migrations (development)

```powershell
npm run prisma:migrate
```

5. Seed initial data (categories, settings)

```powershell
npm run seed:categories
npm run seed:settings
```

6. Start in development

```powershell
npm run dev
```

Alternative (TypeScript runner):

```powershell
npm run dev:ts-node
```

Useful scripts

- `npm run build` — compile TypeScript into `dist/`.
- `npm start` — run compiled app from `dist/`.
- `npm run import:movies` — import movies from `scripts/import-movies.ts`.

Notes
- Static files (e.g., `sitemap.xml`) live in `public/` and are served directly.
- Admin pages require authentication; see `src/middleware/auth.middleware.ts` for implementation.
