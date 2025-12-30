# Database Import Instructions

## ✅ SQL File Ready!

**File:** `backup/import-data.sql`  
**Size:** 2.66 MB  
**Records:** 1,038 movies + categories  

---

## How to Import

### Option 1: Using psql (Command Line)

```powershell
# Set password
$env:PGPASSWORD="root"

# Import the SQL file
psql -U postgres -h localhost -d filmyfly -f backup\import-data.sql
```

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on `filmyfly` database
4. Select **Query Tool**
5. Click **Open File** icon
6. Select `backup\import-data.sql`
7. Click **Execute** (F5)

### Option 3: Using DBeaver / Other GUI Tools

1. Open your database tool
2. Connect to `filmyfly` database
3. Open SQL editor
4. Load `backup\import-data.sql`
5. Execute the script

---

## What Gets Imported

- **Categories:** Automatically extracted from movies
- **Movies:** 1,038 movies with all fields:
  - title, slug, description
  - thumbnail, genre, languages
  - duration, releaseYear, cast
  - sizes, downloadUrl, screenshot
  - keywords, categoryId

---

## After Import

### Verify the import:

```sql
-- Count movies
SELECT COUNT(*) FROM movies;

-- Count categories
SELECT COUNT(*) FROM categories;

-- Check a sample movie
SELECT * FROM movies LIMIT 5;
```

### Start the server:

```bash
npm run dev
```

### Test the API:

```bash
# Homepage data
curl http://localhost:3000/api/home

# Single movie
curl http://localhost:3000/api/movies/some-slug
```

---

## Troubleshooting

### Error: "database does not exist"

Create the database first:
```sql
CREATE DATABASE filmyfly;
```

### Error: "table does not exist"

Run Prisma migrations first:
```bash
npx prisma db push
```

### Error: "duplicate key value"

The database already has data. To start fresh:
```sql
-- Clear all data
TRUNCATE movies, categories, trending_movies, settings, static_pages, users CASCADE;
```

Then run the import again.

---

## File Location

```
d:\kailash\old_filmyfly\backup\import-data.sql
```

You can now manually import this file using any PostgreSQL client!

---

**Created:** 2024-12-28  
**Total Records:** 1,038 movies
