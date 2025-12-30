# Contributing

Thank you for contributing! A short guide to help you get started.

1. Fork the repository and create a feature branch.
2. Run tests (if present) and ensure linting passes.
3. Keep changes small and focused; include a short description in your PR.
4. If your change affects the database schema, add a migration with Prisma and include migration notes.

Seeding data

```powershell
npm run seed:categories
npm run seed:settings
```

Importing movies

```powershell
npm run import:movies
```

Contact

If you need help, add an issue describing the problem and include relevant logs or screenshots.
