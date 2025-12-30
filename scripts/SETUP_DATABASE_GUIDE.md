# Local Database Setup Script

## Prerequisites

Before running this script, make sure:

1. **PostgreSQL is installed and running**
   - Download from: https://www.postgresql.org/download/windows/
   - Or check if it's running: `Get-Service postgresql*`

2. **PostgreSQL credentials match your .env**
   ```
   DATABASE_URL="postgresql://postgres:root@localhost:5432/filmyfly?schema=public"
   ```
   - Username: `postgres`
   - Password: `root`
   - Host: `localhost`
   - Port: `5432`
   - Database: `filmyfly`

3. **Backup file exists**
   - File: `backup/movies.json`
   - Size: ~2.8 MB

---

## What This Script Does

1. ✅ **Creates database** `filmyfly` (if not exists)
2. ✅ **Runs Prisma migrations** (creates all tables)
3. ✅ **Imports data** from `backup/movies.json`:
   - Users
   - Categories
   - Movies
   - Trending Movies
   - Settings
   - Static Pages
4. ✅ **Resets sequences** (auto-increment IDs)

---

## How to Run

### Method 1: Using npm (Recommended)

```bash
npm run setup-db
```

or

```bash
npm run setup:local
```

### Method 2: Direct execution

```bash
npx tsx scripts/setup-local-database.ts
```

---

## Expected Output

```
═══════════════════════════════════════════════════════
🚀 FilmyFly Local Database Setup
═══════════════════════════════════════════════════════

📍 Database URL: postgresql://postgres:****@localhost:5432/filmyfly?schema=public

📦 Step 1: Creating database...
   Database name: filmyfly
   ✅ Database 'filmyfly' created successfully!

🔄 Step 2: Running Prisma migrations...
   Pushing schema to database...
   ✅ Schema migrated successfully!
   Generating Prisma client...
   ✅ Prisma client generated!

📂 Step 3: Loading backup data...
   ✅ Backup file loaded: d:\kailash\old_filmyfly\backup\movies.json

💾 Step 4: Importing data...
   Importing 1 users...
   ✅ Imported 1 users
   Importing 10 categories...
   ✅ Imported 10 categories
   Importing 500 movies...
   ✅ Imported 500 movies
   Importing 10 trending movies...
   ✅ Imported 10 trending movies
   Importing 8 settings...
   ✅ Imported 8 settings
   Importing 5 static pages...
   ✅ Imported 5 static pages

   📊 Total records imported: 534

🔧 Step 5: Resetting database sequences...
   ✅ Reset sequence for users
   ✅ Reset sequence for categories
   ✅ Reset sequence for movies
   ✅ Reset sequence for trending_movies
   ✅ Reset sequence for settings
   ✅ Reset sequence for static_pages

═══════════════════════════════════════════════════════
✅ DATABASE SETUP COMPLETE!
═══════════════════════════════════════════════════════

📋 Summary:
   • Users: 1
   • Categories: 10
   • Movies: 500
   • Trending Movies: 10
   • Settings: 8
   • Static Pages: 5

💡 Next steps:
   1. Start the server: npm run dev
   2. Visit: http://localhost:3000
   3. Check API: http://localhost:3000/api/home

✨ Setup completed successfully!
```

---

## Troubleshooting

### Error: "DATABASE_URL not found"

**Solution:** Make sure `.env` file exists with:
```
DATABASE_URL="postgresql://postgres:root@localhost:5432/filmyfly?schema=public"
```

### Error: "Backup file not found"

**Solution:** Make sure `backup/movies.json` exists in the project root.

### Error: "Connection refused" or "ECONNREFUSED"

**Solution:** PostgreSQL is not running. Start it:

**Windows:**
```powershell
# Check if running
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-16  # or your version
```

**Or use pgAdmin** to start PostgreSQL.

### Error: "Database already exists"

**Solution:** The script will skip database creation and continue. This is normal.

To start fresh:
```sql
-- Connect to postgres database
psql -U postgres -h localhost

-- Drop and recreate
DROP DATABASE filmyfly;
CREATE DATABASE filmyfly;
```

### Error: "password authentication failed"

**Solution:** Update your DATABASE_URL with correct password:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/filmyfly?schema=public"
```

### Error: "Unique constraint violation"

**Solution:** Database already has data. Drop and recreate:
```bash
# Drop database
psql -U postgres -h localhost -c "DROP DATABASE filmyfly;"

# Run setup again
npm run setup-db
```

---

## Manual Setup (Alternative)

If the script doesn't work, you can set up manually:

### 1. Create Database

```sql
psql -U postgres -h localhost
CREATE DATABASE filmyfly;
\q
```

### 2. Run Migrations

```bash
npx prisma db push
npx prisma generate
```

### 3. Import Data Manually

Use Prisma Studio:
```bash
npx prisma studio
```

Then manually add records from `backup/movies.json`.

---

## Verifying Setup

After running the script:

### 1. Check Database

```bash
psql -U postgres -h localhost -d filmyfly
```

```sql
-- List tables
\dt

-- Count records
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM users;
```

### 2. Test API

```bash
# Start server
npm run dev

# Test API (in another terminal)
curl http://localhost:3000/api/home
curl http://localhost:3000/api/movies
```

### 3. Check Admin Panel

Visit: http://localhost:3000/admin/login

---

## What Gets Imported

From `backup/movies.json`:

| Table | Description | Count |
|-------|-------------|-------|
| **users** | Admin users | ~1-5 |
| **categories** | Movie categories | ~10-20 |
| **movies** | All movies | ~100-1000+ |
| **trending_movies** | Trending movie links | ~10-50 |
| **settings** | Site settings | ~8-10 |
| **static_pages** | Static pages | ~5-10 |

---

## Next Steps After Setup

1. ✅ **Start development server**
   ```bash
   npm run dev
   ```

2. ✅ **Test the API**
   ```bash
   curl http://localhost:3000/api/home
   ```

3. ✅ **Access admin panel**
   - URL: http://localhost:3000/admin/login
   - Use Firebase authentication

4. ✅ **Build Astro frontend**
   - Now you have a working local backend
   - Can develop Astro frontend against local API

---

**Created:** 2024-12-28  
**For:** FilmyFly Local Development Setup
