# Prisma & Database

This project uses Prisma as the ORM. Prisma schema is in `prisma/schema.prisma` and migrations live in `prisma/migrations/`.

Common commands (run from project root):

```powershell
# Generate Prisma client
npm run prisma:generate

# Apply migrations (development)
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Push schema without migrations
npm run prisma:push
```

Notes
- The project includes `generated/prisma/` — auto-generated TypeScript types and helpers for the Prisma client.
- Check `prisma/migrations/` for applied migration SQL files.
