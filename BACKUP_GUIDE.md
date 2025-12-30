# Database Backup Guide for FilmyFly

## ⚠️ Important: Read Before Starting Migration

Before migrating to Go Gin + Astro, you **MUST** backup your database. This guide provides multiple backup methods.

---

## Quick Start (Recommended)

### Option 1: Using Supabase Dashboard (Easiest)

If you're using Supabase, the easiest way is through their dashboard:

1. **Go to Supabase Dashboard:** https://app.supabase.com
2. **Select your project**
3. **Navigate to:** Database → Backups
4. **Click:** "Create Backup" or download existing backup
5. **Download the backup file**

**Pros:**
- ✅ No command-line tools needed
- ✅ One-click backup
- ✅ Managed by Supabase

---

### Option 2: Using pg_dump (Most Reliable)

This creates a complete SQL dump that can be restored to any PostgreSQL database.

#### Windows (PowerShell):

```powershell
# Run the backup script
.\scripts\backup-database-sql.ps1
```

#### Linux/Mac (Bash):

```bash
# Make script executable
chmod +x scripts/backup-database-sql.sh

# Run the backup
./scripts/backup-database-sql.sh
```

**Requirements:**
- PostgreSQL client tools must be installed
- `.env` file must contain valid `DATABASE_URL`

**Output:**
- File: `backups/database-backup-YYYY-MM-DD-HH-MM-SS.sql.gz`
- Compressed SQL dump ready for restore

---

### Option 3: Using Prisma Studio (Visual)

Export data table by table using Prisma Studio:

```bash
# Start Prisma Studio
npx prisma studio

# This will open a browser at http://localhost:5555
# You can view and export data from each table
```

**Steps:**
1. Open Prisma Studio
2. Click on each table (users, movies, categories, etc.)
3. Select all rows
4. Export to CSV or JSON
5. Save files to `backups/` folder

**Pros:**
- ✅ Visual interface
- ✅ No coding required
- ✅ Can export specific tables

**Cons:**
- ❌ Manual process for each table
- ❌ Need to export 6 tables separately

---

### Option 4: Manual SQL Export via psql

If you have `psql` installed:

```bash
# Set your database connection details
$env:PGPASSWORD="your_password"

# Export entire database
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM users) TO 'backups/users.csv' CSV HEADER"
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM categories) TO 'backups/categories.csv' CSV HEADER"
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM movies) TO 'backups/movies.csv' CSV HEADER"
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM trending_movies) TO 'backups/trending_movies.csv' CSV HEADER"
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM settings) TO 'backups/settings.csv' CSV HEADER"
psql -h your_host -U your_user -d your_database -c "\copy (SELECT * FROM static_pages) TO 'backups/static_pages.csv' CSV HEADER"
```

---

## Backup Checklist

Before proceeding with migration, ensure you have:

- [ ] **Database backup created** (SQL dump or Supabase backup)
- [ ] **Backup file downloaded** and saved locally
- [ ] **Backup verified** (check file size is reasonable)
- [ ] **Backup copied to cloud storage** (Google Drive, Dropbox, etc.)
- [ ] **Backup tested** (optional: restore to test database)
- [ ] **Multiple backup copies** (local + cloud + external drive)

---

## What to Backup

Your database contains these tables:

| Table | Description | Approx. Records |
|-------|-------------|-----------------|
| **users** | Admin users | ~1-5 |
| **categories** | Movie categories | ~10-20 |
| **movies** | All movies | ~100-10,000+ |
| **trending_movies** | Trending movie links | ~10-50 |
| **settings** | Site settings | ~8-10 |
| **static_pages** | Static pages (Privacy, Contact, etc.) | ~5-10 |

**Total estimated size:** 10 MB - 500 MB (depending on number of movies)

---

## Installing PostgreSQL Client Tools (if needed)

### Windows:

**Option A: Official Installer**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Select "Command Line Tools" during installation
4. Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**Option B: Chocolatey**
```powershell
choco install postgresql
```

### Linux (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

### Mac:

```bash
brew install postgresql
```

---

## Verifying Your Backup

After creating a backup, verify it:

### Check file exists:
```powershell
# Windows
dir backups\

# Linux/Mac
ls -lh backups/
```

### Check file size:
- SQL dump: Should be 1 MB - 100 MB (compressed)
- JSON backup: Should be 5 MB - 500 MB
- If file is 0 bytes or very small (< 1 KB), backup failed!

### Test restore (optional but recommended):

```bash
# Create a test database
createdb filmyfly_test

# Restore backup to test database
gunzip -c backups/database-backup-2024-12-24.sql.gz | psql -d filmyfly_test

# Verify tables exist
psql -d filmyfly_test -c "\dt"

# Drop test database
dropdb filmyfly_test
```

---

## Troubleshooting

### "Cannot connect to database"

**Check your DATABASE_URL:**
1. Open `.env` file (you may need to ask for access)
2. Verify `DATABASE_URL` is correct
3. Test connection: `psql $DATABASE_URL`

### "pg_dump: command not found"

**Install PostgreSQL client tools** (see section above)

### "Permission denied"

**Linux/Mac:**
```bash
chmod +x scripts/backup-database-sql.sh
```

### "PGPASSWORD not set"

The script should handle this automatically. If not, set manually:
```bash
export PGPASSWORD="your_password"
```

---

## After Backup: Next Steps

Once you have a verified backup:

1. ✅ **Store backup safely** (multiple locations)
2. ✅ **Document backup location** (write it down!)
3. ✅ **Proceed with migration planning**
4. ✅ **Keep backup until migration is complete and verified**

---

## Emergency Restore

If something goes wrong during migration:

### Restore from SQL dump:

```bash
# Decompress and restore
gunzip -c backups/database-backup-YYYY-MM-DD.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

### Restore from Supabase backup:

1. Go to Supabase Dashboard
2. Database → Backups
3. Select backup
4. Click "Restore"

---

## Support

If you encounter issues:

1. **Check the error message** carefully
2. **Verify DATABASE_URL** is correct in `.env`
3. **Ensure PostgreSQL client tools** are installed
4. **Try Supabase Dashboard backup** as alternative
5. **Contact Supabase support** if using their service

---

## Summary

**Recommended backup method:**
1. **Primary:** Use Supabase Dashboard backup (easiest)
2. **Secondary:** Run `backup-database-sql.ps1` for local SQL dump
3. **Verify:** Check backup file exists and has reasonable size
4. **Store:** Copy to multiple locations (local + cloud)

**Then you're ready to proceed with migration!** 🚀

---

**Created:** 2024-12-24  
**For:** FilmyFly Migration to Go Gin + Astro
