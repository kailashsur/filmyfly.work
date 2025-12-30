# Complete Database Export - Single File Method

## Method 1: Using Supabase Dashboard (EASIEST) ⭐

This is the **simplest and most reliable** way to export everything:

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Log in with your account

2. **Select Your Project**
   - Find your FilmyFly project
   - Click to open it

3. **Navigate to Database Backups**
   - Click on "Database" in the left sidebar
   - Click on "Backups" tab

4. **Download Backup**
   - You'll see existing backups (Supabase creates them automatically)
   - Click "Download" on the latest backup
   - OR click "Create Backup" to make a fresh one, then download

5. **Save the File**
   - Save to: `d:\kailash\old_filmyfly\backups\`
   - File will be: `database-backup.sql.gz` (compressed SQL dump)

**This file contains EVERYTHING:**
- ✅ All tables (users, categories, movies, trending_movies, settings, static_pages)
- ✅ All data in all tables
- ✅ Database schema
- ✅ Relationships and constraints
- ✅ Ready to restore anytime

---

## Method 2: Using pg_dump Command (If you have PostgreSQL tools)

### Windows PowerShell:

```powershell
# Navigate to project
cd d:\kailash\old_filmyfly

# Run the backup script I created
.\scripts\backup-database-sql.ps1
```

**This will create:**
- File: `backups\database-backup-2024-12-24-HH-MM-SS.sql.gz`
- Contains: Complete database dump (all tables + all data)
- Size: Compressed, typically 10-100 MB

### Requirements:
- PostgreSQL client tools must be installed
- Download from: https://www.postgresql.org/download/windows/

---

## Method 3: Using pgAdmin (Visual Tool)

If you have pgAdmin installed:

1. **Open pgAdmin**
2. **Connect to your Supabase database**
   - Right-click "Servers" → Create → Server
   - Get connection details from your `.env` file (DATABASE_URL)
3. **Right-click your database**
4. **Select "Backup..."**
5. **Choose options:**
   - Format: Custom or Tar
   - Filename: `d:\kailash\old_filmyfly\backups\database-backup.backup`
   - Include: Data + Schema
6. **Click "Backup"**

---

## Method 4: Direct SQL Dump (Manual Command)

If you know your database credentials:

```powershell
# Set your password (get from .env file)
$env:PGPASSWORD = "your_database_password"

# Run pg_dump (replace with your actual connection details)
pg_dump -h your-project.supabase.co `
        -p 5432 `
        -U postgres `
        -d postgres `
        --no-owner `
        --no-acl `
        --clean `
        --if-exists `
        --file="backups\complete-database-backup.sql"

# Compress the file
gzip backups\complete-database-backup.sql
```

**Result:** `backups\complete-database-backup.sql.gz`

---

## Quick Comparison

| Method | Difficulty | Time | File Size | Recommended |
|--------|-----------|------|-----------|-------------|
| **Supabase Dashboard** | ⭐ Easy | 2 min | Small (compressed) | ✅ YES |
| **pg_dump Script** | ⭐⭐ Medium | 5 min | Small (compressed) | ✅ YES |
| **pgAdmin** | ⭐⭐ Medium | 5 min | Medium | If you have it |
| **Manual Command** | ⭐⭐⭐ Hard | 10 min | Small (compressed) | Only if needed |

---

## After Export: Verify Your Backup

### Check the file:

```powershell
# Navigate to backups folder
cd d:\kailash\old_filmyfly\backups

# List files
dir

# Check file size (should be > 1 MB)
```

**Good signs:**
- ✅ File size is > 1 MB (or > 100 KB for small databases)
- ✅ File extension is `.sql` or `.sql.gz` or `.backup`
- ✅ File is not 0 bytes

**Bad signs:**
- ❌ File is 0 bytes
- ❌ File is very small (< 1 KB)
- ❌ Error messages during export

---

## What's Inside the Backup File?

The backup file contains SQL commands like:

```sql
-- Create tables
CREATE TABLE users (...);
CREATE TABLE categories (...);
CREATE TABLE movies (...);

-- Insert data
INSERT INTO users VALUES (1, 'admin', 'admin@example.com', ...);
INSERT INTO categories VALUES (1, 'Action', 'action', ...);
INSERT INTO movies VALUES (1, 'Movie Title', 'movie-title', ...);

-- And so on for all tables and all data
```

---

## How to Restore This Backup Later

When you need to restore (after migration or if something goes wrong):

### Using psql:

```powershell
# If compressed (.gz)
gunzip -c backups\database-backup.sql.gz | psql -h your-host -U your-user -d your-database

# If not compressed (.sql)
psql -h your-host -U your-user -d your-database -f backups\database-backup.sql
```

### Using Supabase Dashboard:

1. Go to Database → Backups
2. Click "Restore" on your backup
3. Confirm restoration

---

## Recommended: Do Both!

For maximum safety:

1. ✅ **Download from Supabase Dashboard** (primary backup)
2. ✅ **Run pg_dump script** (secondary backup)
3. ✅ **Copy both files to cloud storage** (Google Drive, Dropbox)

---

## Need Help Getting Connection Details?

Your database connection info is in `.env` file:

```
DATABASE_URL=postgresql://user:password@host:port/database
```

**Example:**
```
postgresql://postgres:your_password@db.abc123xyz.supabase.co:5432/postgres
```

**Parse it:**
- **User:** postgres
- **Password:** your_password
- **Host:** db.abc123xyz.supabase.co
- **Port:** 5432
- **Database:** postgres

---

## Summary: Quick Steps

**Fastest method (2 minutes):**

1. Go to https://app.supabase.com
2. Select your project
3. Database → Backups
4. Download latest backup
5. Save to `d:\kailash\old_filmyfly\backups\`
6. ✅ Done!

**You now have a complete backup of all tables and all data in a single file!**

---

**Created:** 2024-12-24  
**For:** FilmyFly Database Backup
